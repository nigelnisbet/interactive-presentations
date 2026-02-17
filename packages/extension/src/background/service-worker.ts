import { io, Socket } from 'socket.io-client';
import { PresenterEvents } from '@interactive-presentations/shared';

console.log('[Interactive Presentations] Background service worker started');

let socket: Socket | null = null;
let currentSessionId: string | null = null;
let currentSessionCode: string | null = null;
let currentQRCode: string | null = null;
let participantCount = 0;

const SERVER_URL = 'http://localhost:3000';

// Listen for messages from content script
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
    sendResponse({
      sessionId: currentSessionId,
      sessionCode: currentSessionCode,
      qrCode: currentQRCode,
      participantCount,
      connected: socket?.connected || false,
    });
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
    // Disconnect existing socket if any
    if (socket) {
      socket.disconnect();
    }

    // Connect to server
    socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
    });

    return new Promise((resolve) => {
      if (!socket) {
        resolve({ success: false, error: 'Failed to create socket' });
        return;
      }

      socket.on('connect', () => {
        console.log('[Interactive Presentations] Connected to server');

        // Send presenter connect event
        socket!.emit(PresenterEvents.CONNECT, {
          presentationId,
          extensionVersion: '1.0.0',
        });
      });

      socket.on(PresenterEvents.CONNECTED, (payload) => {
        console.log('[Interactive Presentations] Session created:', payload);

        currentSessionId = payload.sessionId;
        currentSessionCode = payload.sessionCode;
        currentQRCode = payload.qrCodeUrl;

        resolve({
          success: true,
          sessionId: payload.sessionId,
          sessionCode: payload.sessionCode,
          qrCode: payload.qrCodeUrl,
        });
      });

      socket.on(PresenterEvents.SESSION_STATS, (payload) => {
        console.log('[Interactive Presentations] Session stats:', payload);
        participantCount = payload.participantCount;

        // Notify popup if open
        chrome.runtime.sendMessage({
          type: 'SESSION_STATS_UPDATE',
          data: payload,
        }).catch(() => {
          // Popup might not be open, ignore error
        });
      });

      socket.on('error', (error) => {
        console.error('[Interactive Presentations] Socket error:', error);
        resolve({ success: false, error: error.message || 'Unknown error' });
      });

      socket.on('disconnect', () => {
        console.log('[Interactive Presentations] Disconnected from server');
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!currentSessionId) {
          resolve({ success: false, error: 'Connection timeout' });
        }
      }, 10000);
    });
  } catch (error) {
    console.error('[Interactive Presentations] Error creating session:', error);
    return { success: false, error: (error as Error).message };
  }
}

function handleSlideChange(slideData: { indexh: number; indexv: number; timestamp: number }) {
  if (!socket || !socket.connected || !currentSessionId) {
    console.log('[Interactive Presentations] Not connected, ignoring slide change');
    return;
  }

  console.log('[Interactive Presentations] Sending slide change:', slideData);

  socket.emit(PresenterEvents.SLIDE_CHANGE, {
    indexh: slideData.indexh,
    indexv: slideData.indexv,
  });

  socket.once(PresenterEvents.SLIDE_ACKNOWLEDGED, (payload) => {
    console.log('[Interactive Presentations] Slide acknowledged:', payload);
  });
}

function endSession() {
  if (socket && currentSessionId) {
    socket.emit(PresenterEvents.END_SESSION);
    socket.disconnect();
  }

  socket = null;
  currentSessionId = null;
  currentSessionCode = null;
  currentQRCode = null;
  participantCount = 0;
}

export {};
