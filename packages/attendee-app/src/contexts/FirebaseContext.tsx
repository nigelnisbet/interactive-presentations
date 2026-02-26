/**
 * FirebaseContext - Replaces SocketContext with Firebase Realtime Database
 *
 * This provides the same interface as the old SocketContext but uses
 * Firebase Realtime Database instead of Socket.IO for real-time sync.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue,
  runTransaction,
  onDisconnect,
  Unsubscribe,
} from 'firebase/database';
import {
  AttendeeJoinedPayload,
  SessionState,
  ActivityDefinition,
  ActivityResults,
  PollActivity,
  QuizActivity,
} from '@interactive-presentations/shared';

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

interface FirebaseContextType {
  connected: boolean;
  joinSession: (sessionCode: string, name?: string) => Promise<AttendeeJoinedPayload>;
  submitResponse: (activityId: string, answer: any) => Promise<void>;
  currentActivity: ActivityDefinition | null;
  currentResults: ActivityResults | null;
  error: string | null;
  participantCount: number;
  leaveSession: () => void;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [currentActivity, setCurrentActivity] = useState<ActivityDefinition | null>(null);
  const [currentResults, setCurrentResults] = useState<ActivityResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [unsubscribes, setUnsubscribes] = useState<Unsubscribe[]>([]);

  // Monitor Firebase connection status
  useEffect(() => {
    const connectedRef = ref(database, '.info/connected');
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const isConnected = snapshot.val() === true;
      console.log('Firebase connection status:', isConnected ? 'connected' : 'disconnected');
      setConnected(isConnected);

      if (isConnected) {
        setError(null);
        // Auto-rejoin session if we were disconnected
        const savedSessionCode = sessionStorage.getItem('currentSessionCode');
        const savedParticipantId = sessionStorage.getItem('participantId');
        if (savedSessionCode && savedParticipantId && !sessionCode) {
          console.log('Auto-rejoining session:', savedSessionCode);
          setSessionCode(savedSessionCode);
          setParticipantId(savedParticipantId);
        }
      } else if (sessionCode) {
        setError('Connection lost. Reconnecting...');
      }
    });

    return () => unsubscribe();
  }, [sessionCode]);

  // Setup listeners when session is joined
  useEffect(() => {
    if (!sessionCode) return;

    const listeners: Unsubscribe[] = [];

    // Listen to session status
    const sessionStatusRef = ref(database, `sessions/${sessionCode}/status`);
    const statusUnsub = onValue(sessionStatusRef, (snapshot) => {
      const status = snapshot.val();
      console.log('Session status:', status);
      if (status === 'ended') {
        setError('Session has ended');
        sessionStorage.removeItem('currentSessionCode');
        sessionStorage.removeItem('attendeeName');
        sessionStorage.removeItem('participantId');
      }
    });
    listeners.push(statusUnsub);

    // Listen to current activity
    const activityRef = ref(database, `sessions/${sessionCode}/currentActivity`);
    const activityUnsub = onValue(activityRef, (snapshot) => {
      const activity = snapshot.val();
      console.log('Current activity:', activity);
      setCurrentActivity(activity);
      // Reset results when activity changes
      if (activity) {
        setCurrentResults(null);
      }
    });
    listeners.push(activityUnsub);

    // Listen to participant count
    const participantsRef = ref(database, `sessions/${sessionCode}/participants`);
    const participantsUnsub = onValue(participantsRef, (snapshot) => {
      const participants = snapshot.val();
      const count = participants ? Object.keys(participants).filter(
        id => participants[id]?.isActive
      ).length : 0;
      console.log('Participant count:', count);
      setParticipantCount(count);
    });
    listeners.push(participantsUnsub);

    setUnsubscribes(listeners);

    return () => {
      listeners.forEach(unsub => unsub());
    };
  }, [sessionCode]);

  // Listen to aggregated results for current activity
  useEffect(() => {
    if (!sessionCode || !currentActivity?.activityId) return;

    const resultsRef = ref(database, `sessions/${sessionCode}/aggregatedResults/${currentActivity.activityId}`);
    const unsubscribe = onValue(resultsRef, (snapshot) => {
      const results = snapshot.val();
      if (results) {
        console.log('Results updated:', results);
        // Enrich results with activity info for display
        const enrichedResults = {
          ...results,
          activityId: currentActivity.activityId,
          question: (currentActivity as PollActivity | QuizActivity).question,
          options: (currentActivity as PollActivity | QuizActivity).options,
        };
        setCurrentResults(enrichedResults);
      }
    });

    return () => unsubscribe();
  }, [sessionCode, currentActivity?.activityId]);

  const joinSession = useCallback(async (
    code: string,
    name?: string
  ): Promise<AttendeeJoinedPayload> => {
    try {
      console.log('Attempting to join session:', code);

      // Verify session exists
      const sessionRef = ref(database, `sessions/${code}`);
      const sessionSnapshot = await get(sessionRef);

      if (!sessionSnapshot.exists()) {
        throw new Error('Invalid session code');
      }

      const session = sessionSnapshot.val();
      console.log('Session found:', session);

      if (session.status === 'ended') {
        throw new Error('Session has ended');
      }

      // Generate participant ID
      const newParticipantId = `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Register as participant
      const participantRef = ref(database, `sessions/${code}/participants/${newParticipantId}`);
      await set(participantRef, {
        name: name || null,
        joinedAt: Date.now(),
        isActive: true
      });

      // Setup onDisconnect to mark as inactive
      const isActiveRef = ref(database, `sessions/${code}/participants/${newParticipantId}/isActive`);
      onDisconnect(isActiveRef).set(false);

      // Save session info for auto-reconnection
      setSessionCode(code);
      setParticipantId(newParticipantId);
      sessionStorage.setItem('currentSessionCode', code);
      sessionStorage.setItem('participantId', newParticipantId);
      if (name) {
        sessionStorage.setItem('attendeeName', name);
      }

      // Set current activity if there is one
      if (session.currentActivity) {
        setCurrentActivity(session.currentActivity);
      }

      setError(null);

      // Return payload matching old Socket interface
      const response: AttendeeJoinedPayload = {
        sessionId: session.id,
        currentState: {
          session: {
            id: session.id,
            code: code,
            presentationId: session.presentationId,
            currentSlide: session.currentSlide || { indexh: 0, indexv: 0, timestamp: Date.now() },
            status: session.status,
            participantCount: session.participants ? Object.keys(session.participants).length : 0,
            createdAt: new Date(session.createdAt).toISOString(),
            currentActivity: session.currentActivity || undefined,
          },
          currentSlide: session.currentSlide || { indexh: 0, indexv: 0, timestamp: Date.now() },
          activeActivity: session.currentActivity || undefined,
        } as SessionState,
      };

      console.log('Successfully joined session:', response);
      return response;

    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error('Error joining session:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, []);

  const submitResponse = useCallback(async (activityId: string, answer: any): Promise<void> => {
    if (!sessionCode || !participantId) {
      throw new Error('Not in a session');
    }

    console.log('Submitting response:', { activityId, answer });

    const responseRef = ref(database, `sessions/${sessionCode}/responses/${activityId}/${participantId}`);

    // Check for duplicate response
    const existingResponse = await get(responseRef);
    if (existingResponse.exists()) {
      throw new Error('Already responded to this activity');
    }

    // Submit response
    await set(responseRef, {
      answer,
      submittedAt: Date.now()
    });

    // Update aggregated results using transaction
    await updateAggregatedResults(sessionCode, activityId, answer);

    console.log('Response submitted successfully');
  }, [sessionCode, participantId]);

  const updateAggregatedResults = async (code: string, activityId: string, answer: any) => {
    const aggregatedRef = ref(database, `sessions/${code}/aggregatedResults/${activityId}`);

    await runTransaction(aggregatedRef, (current) => {
      if (!current) {
        // Initialize with the answer
        return {
          responses: incrementResponseArray([], answer),
          totalResponses: 1,
          lastUpdated: Date.now()
        };
      }

      return {
        ...current,
        responses: incrementResponseArray(current.responses || [], answer),
        totalResponses: (current.totalResponses || 0) + 1,
        lastUpdated: Date.now()
      };
    });
  };

  const incrementResponseArray = (responses: number[], answer: any): number[] => {
    const result = [...responses];
    if (Array.isArray(answer)) {
      // Multiple selection
      answer.forEach((idx: number) => {
        while (result.length <= idx) result.push(0);
        result[idx]++;
      });
    } else if (typeof answer === 'number') {
      // Single selection
      while (result.length <= answer) result.push(0);
      result[answer]++;
    }
    return result;
  };

  const leaveSession = useCallback(() => {
    if (sessionCode && participantId) {
      // Mark as inactive
      const participantRef = ref(database, `sessions/${sessionCode}/participants/${participantId}`);
      update(participantRef, { isActive: false });
    }

    // Cleanup listeners
    unsubscribes.forEach(unsub => unsub());
    setUnsubscribes([]);

    setSessionCode(null);
    setParticipantId(null);
    setCurrentActivity(null);
    setCurrentResults(null);
    sessionStorage.removeItem('currentSessionCode');
    sessionStorage.removeItem('attendeeName');
    sessionStorage.removeItem('participantId');
  }, [sessionCode, participantId, unsubscribes]);

  return (
    <FirebaseContext.Provider
      value={{
        connected,
        joinSession,
        submitResponse,
        currentActivity,
        currentResults,
        error,
        participantCount,
        leaveSession,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

// Backward compatibility - export useSocket as alias to useFirebase
export const useSocket = useFirebase;

// Also export the Provider with backward compatible name
export const SocketProvider = FirebaseProvider;
