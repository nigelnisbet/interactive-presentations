/**
 * Background Service Worker for Interactive Presentations Extension
 * Uses Firebase Realtime Database instead of Socket.IO
 */

import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue,
  off,
  Unsubscribe,
} from 'firebase/database';

console.log('[Interactive Presentations] Background service worker started');

// Firebase configuration - same project as trillionaire
const firebaseConfig = {
  apiKey: "AIzaSyALHOftrFMc8iELsW5BRzT6fUz_qofRSuw",
  authDomain: "class-session-games.firebaseapp.com",
  databaseURL: "https://class-session-games-default-rtdb.firebaseio.com",
  projectId: "class-session-games",
  storageBucket: "class-session-games.firebasestorage.app",
  messagingSenderId: "528175934275",
  appId: "1:528175934275:web:1c10fb554988405f639df6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Session state (in-memory, restored from storage on wake)
let currentSessionCode: string | null = null;
let currentSessionId: string | null = null;
let currentQRCode: string | null = null;
let currentPresentationId: string | null = null;
let activities: any[] = [];
let participantCount = 0;
let unsubscribeParticipants: Unsubscribe | null = null;

// Restore session state from storage on service worker start
async function restoreSessionState() {
  try {
    const stored = await chrome.storage.local.get(['sessionState']);
    if (stored.sessionState) {
      const state = stored.sessionState;
      currentSessionCode = state.sessionCode;
      currentSessionId = state.sessionId;
      currentQRCode = state.qrCode;
      currentPresentationId = state.presentationId;
      activities = state.activities || [];
      participantCount = state.participantCount || 0;

      console.log('[Interactive Presentations] Session state restored:', currentSessionCode);

      // Re-setup participant listener if we have an active session
      if (currentSessionCode) {
        setupParticipantListener(currentSessionCode);
        startKeepAlive();
      }
    }
  } catch (error) {
    console.error('[Interactive Presentations] Error restoring session state:', error);
  }
}

// Save session state to storage
async function saveSessionState() {
  try {
    await chrome.storage.local.set({
      sessionState: {
        sessionCode: currentSessionCode,
        sessionId: currentSessionId,
        qrCode: currentQRCode,
        presentationId: currentPresentationId,
        activities,
        participantCount,
      }
    });
    console.log('[Interactive Presentations] Session state saved');
  } catch (error) {
    console.error('[Interactive Presentations] Error saving session state:', error);
  }
}

// Clear session state from storage
async function clearSessionState() {
  try {
    await chrome.storage.local.remove(['sessionState']);
    console.log('[Interactive Presentations] Session state cleared');
  } catch (error) {
    console.error('[Interactive Presentations] Error clearing session state:', error);
  }
}

// Restore state immediately on load
restoreSessionState();

// Keep-alive alarm to prevent service worker from sleeping during active sessions
const KEEP_ALIVE_ALARM = 'keep-alive';

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === KEEP_ALIVE_ALARM) {
    console.log('[Interactive Presentations] Keep-alive ping');
    // Just accessing storage keeps the service worker alive
    chrome.storage.local.get(['sessionState']).then((result) => {
      if (result.sessionState?.sessionCode) {
        // Session is active, keep the alarm going
        console.log('[Interactive Presentations] Session still active:', result.sessionState.sessionCode);
      } else {
        // No active session, stop the alarm
        chrome.alarms.clear(KEEP_ALIVE_ALARM);
        console.log('[Interactive Presentations] No active session, stopping keep-alive');
      }
    });
  }
});

// Start keep-alive alarm when session is active
function startKeepAlive() {
  chrome.alarms.create(KEEP_ALIVE_ALARM, {
    periodInMinutes: 0.4 // Every 24 seconds (under the 30 second limit)
  });
  console.log('[Interactive Presentations] Keep-alive alarm started');
}

// Stop keep-alive alarm
function stopKeepAlive() {
  chrome.alarms.clear(KEEP_ALIVE_ALARM);
  console.log('[Interactive Presentations] Keep-alive alarm stopped');
}

// Generate 6-character session code (avoiding confusing characters)
function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Interactive Presentations] Message received:', message.type);

  if (message.type === 'INJECT_REVEAL_LISTENER') {
    // Inject script into main world to access Reveal.js
    if (sender.tab?.id) {
      injectRevealListener(sender.tab.id).then(() => {
        sendResponse({ status: 'ok' });
      }).catch((error) => {
        console.error('[Interactive Presentations] Injection failed:', error);
        sendResponse({ status: 'error', error: error.message });
      });
      return true; // Keep channel open for async response
    }
  }

  if (message.type === 'REVEAL_READY' || message.type === 'REVEAL_SLIDE_CHANGED') {
    handleSlideChange(message.data);
    sendResponse({ status: 'ok' });
  }

  if (message.type === 'CREATE_SESSION') {
    createSession(message.presentationId).then((result) => {
      sendResponse(result);
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'END_SESSION') {
    endSession();
    sendResponse({ status: 'ok' });
  }

  if (message.type === 'GET_SESSION_INFO') {
    // First ensure state is restored, then respond
    restoreSessionState().then(() => {
      // Check Firebase connection
      const connectedRef = ref(database, '.info/connected');
      get(connectedRef).then((snapshot) => {
        sendResponse({
          sessionId: currentSessionId,
          sessionCode: currentSessionCode,
          qrCode: currentQRCode,
          participantCount,
          connected: snapshot.val() === true,
        });
      }).catch(() => {
        sendResponse({
          sessionId: currentSessionId,
          sessionCode: currentSessionCode,
          qrCode: currentQRCode,
          participantCount,
          connected: false,
        });
      });
    });
    return true; // Keep channel open for async response
  }

  return true;
});

async function injectRevealListener(tabId: number) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN', // This runs in the page's context, not isolated
      func: () => {
        // This code runs in the page's main world and has access to Reveal.js
        (function() {
          console.log('[Interactive Presentations] Injected into main world');

          function setupRevealListener() {
            if (typeof (window as any).Reveal === 'undefined') {
              console.log('[Interactive Presentations] Reveal.js not found, will retry...');
              return false;
            }

            console.log('[Interactive Presentations] Reveal.js detected!');

            const Reveal = (window as any).Reveal;

            // Listen for slide changes
            Reveal.on('slidechanged', (event: any) => {
              const slideData = {
                indexh: event.indexh,
                indexv: event.indexv,
                timestamp: Date.now()
              };

              console.log('[Interactive Presentations] Slide changed:', slideData);

              // Send message to content script via postMessage
              window.postMessage({
                type: 'REVEAL_SLIDE_CHANGED',
                data: slideData
              }, '*');
            });

            // Send initial slide on ready
            Reveal.on('ready', (event: any) => {
              const slideData = {
                indexh: event.indexh,
                indexv: event.indexv,
                timestamp: Date.now()
              };

              console.log('[Interactive Presentations] Reveal ready:', slideData);

              window.postMessage({
                type: 'REVEAL_READY',
                data: slideData
              }, '*');
            });

            return true;
          }

          // Try to setup immediately
          if (!setupRevealListener()) {
            // If not available, wait for page load
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', () => {
                setTimeout(setupRevealListener, 1000);
              });
            } else {
              // Page already loaded, retry after delay
              setTimeout(setupRevealListener, 1000);
            }
          }
        })();
      }
    });
    console.log('[Interactive Presentations] Script injected successfully');
  } catch (error) {
    console.error('[Interactive Presentations] Failed to inject script:', error);
    throw error;
  }
}

async function createSession(presentationId: string) {
  try {
    console.log('[Interactive Presentations] Creating session for:', presentationId);

    // Generate unique session code
    let code = generateSessionCode();
    let attempts = 0;

    // Make sure code is unique
    while (attempts < 10) {
      const existingSession = await get(ref(database, `sessions/${code}`));
      if (!existingSession.exists()) break;
      code = generateSessionCode();
      attempts++;
    }

    if (attempts >= 10) {
      return { success: false, error: 'Failed to generate unique session code' };
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const extensionId = chrome.runtime.id;

    // Load activities for this presentation from Firebase
    const activitiesSnapshot = await get(ref(database, `presentations/${presentationId}/activities`));
    activities = activitiesSnapshot.exists() ? activitiesSnapshot.val() : [];

    // If no activities in Firebase, try loading from bundled config
    if (activities.length === 0) {
      console.log('[Interactive Presentations] No activities in Firebase, checking bundled config');
      // Activities might be stored in a different structure
      const configSnapshot = await get(ref(database, `presentations/${presentationId}/config`));
      if (configSnapshot.exists()) {
        const config = configSnapshot.val();
        activities = config.activities || [];
      }
    }

    console.log('[Interactive Presentations] Loaded activities:', activities.length);

    // Create session in Firebase
    await set(ref(database, `sessions/${code}`), {
      id: sessionId,
      presentationId,
      presenterId: extensionId,
      status: 'active',
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      currentSlide: { indexh: 0, indexv: 0, timestamp: Date.now() },
      currentActivity: null,
      activities: activities // Store activities with session for attendee access
    });

    currentSessionCode = code;
    currentSessionId = sessionId;
    currentPresentationId = presentationId;

    // Generate QR code URL (using a public QR code API)
    const attendeeAppUrl = 'https://presentations.stmath.com'; // Production URL
    const joinUrl = `${attendeeAppUrl}/join/${code}`;
    currentQRCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}`;

    // Setup participant count listener
    setupParticipantListener(code);

    // Save session state to storage for persistence
    await saveSessionState();

    // Start keep-alive to maintain connection
    startKeepAlive();

    console.log('[Interactive Presentations] Session created:', { code, sessionId });

    return {
      success: true,
      sessionId,
      sessionCode: code,
      qrCode: currentQRCode,
    };

  } catch (error) {
    console.error('[Interactive Presentations] Error creating session:', error);
    return { success: false, error: (error as Error).message };
  }
}

function setupParticipantListener(sessionCode: string) {
  // Clean up previous listener
  if (unsubscribeParticipants) {
    unsubscribeParticipants();
  }

  const participantsRef = ref(database, `sessions/${sessionCode}/participants`);
  unsubscribeParticipants = onValue(participantsRef, (snapshot) => {
    const participants = snapshot.val();
    participantCount = participants
      ? Object.keys(participants).filter(id => participants[id]?.isActive).length
      : 0;

    console.log('[Interactive Presentations] Participant count updated:', participantCount);

    // Save updated count to storage
    saveSessionState();

    // Notify popup if open
    chrome.runtime.sendMessage({
      type: 'SESSION_STATS_UPDATE',
      data: { participantCount },
    }).catch(() => {
      // Popup might not be open, ignore error
    });
  });
}

async function handleSlideChange(slideData: { indexh: number; indexv: number; timestamp: number }) {
  // Ensure state is restored before handling
  if (!currentSessionCode) {
    await restoreSessionState();
  }

  if (!currentSessionCode) {
    console.log('[Interactive Presentations] No active session, ignoring slide change');
    return;
  }

  console.log('[Interactive Presentations] Handling slide change:', slideData);

  try {
    // Update current slide in Firebase
    await update(ref(database, `sessions/${currentSessionCode}`), {
      currentSlide: slideData
    });

    // Find activity at this slide position
    const activity = activities.find((a: any) =>
      a.slidePosition.indexh === slideData.indexh &&
      a.slidePosition.indexv === slideData.indexv
    );

    if (activity) {
      console.log('[Interactive Presentations] Activity found at slide:', activity);

      // Set current activity (this triggers listeners in attendee apps)
      await set(ref(database, `sessions/${currentSessionCode}/currentActivity`), {
        ...activity.config,
        activityId: activity.activityId
      });
    } else {
      console.log('[Interactive Presentations] No activity at this slide');

      // Clear current activity
      await set(ref(database, `sessions/${currentSessionCode}/currentActivity`), null);
    }

  } catch (error) {
    console.error('[Interactive Presentations] Error handling slide change:', error);
  }
}

async function endSession() {
  console.log('[Interactive Presentations] Ending session');

  if (currentSessionCode) {
    try {
      // Update session status in Firebase
      await update(ref(database, `sessions/${currentSessionCode}`), {
        status: 'ended'
      });
    } catch (error) {
      console.error('[Interactive Presentations] Error ending session:', error);
    }
  }

  // Clean up listener
  if (unsubscribeParticipants) {
    unsubscribeParticipants();
    unsubscribeParticipants = null;
  }

  // Reset state
  currentSessionCode = null;
  currentSessionId = null;
  currentQRCode = null;
  currentPresentationId = null;
  activities = [];
  participantCount = 0;

  // Clear persisted state
  await clearSessionState();

  // Stop keep-alive
  stopKeepAlive();
}

export {};
