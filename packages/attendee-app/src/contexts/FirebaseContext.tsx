/**
 * FirebaseContext - Replaces SocketContext with Firebase Realtime Database
 *
 * This provides the same interface as the old SocketContext but uses
 * Firebase Realtime Database instead of Socket.IO for real-time sync.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
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
  ReviewGamePhase,
  ReviewGameLeaderboardEntry,
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

interface ReviewGameState {
  gamePhase: ReviewGamePhase;
  currentQuestionIndex: number;
  questionStartTime: number;
  responseCount?: number;  // Number of responses for current question
  questionResults?: {
    responses: number[];  // Count of responses for each option
    totalResponses: number;
    correctCount: number;
  };
}

interface FirebaseContextType {
  connected: boolean;
  sessionEnded: boolean;
  sessionCode: string | null;
  joinSession: (sessionCode: string, name?: string) => Promise<AttendeeJoinedPayload>;
  submitResponse: (activityId: string, answer: any) => Promise<void>;
  currentActivity: ActivityDefinition | null;
  currentResults: ActivityResults | null;
  error: string | null;
  participantCount: number;
  leaveSession: () => void;
  // Review game methods
  participantId: string | null;
  participantName: string | null;
  joinReviewGame?: (activityId: string, name: string) => Promise<void>;
  submitReviewGameAnswer?: (activityId: string, questionId: string, answer: number, answerTime: number) => Promise<{ isCorrect: boolean; points: number } | null>;
  getReviewGameState?: (activityId: string, callback: (state: ReviewGameState | null, leaderboard: ReviewGameLeaderboardEntry[] | null, reviewGameParticipantCount?: number) => void) => Unsubscribe;
  // Presenter controls for review game
  startReviewGame?: (activityId: string) => Promise<void>;
  revealAnswer?: (activityId: string) => Promise<void>;
  nextQuestion?: (activityId: string, totalQuestions: number) => Promise<void>;
  endReviewGame?: (activityId: string) => Promise<void>;
  // Generic activity update for presenter controls
  updateActivity?: (activityId: string, updates: Partial<ActivityResults>) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState<string | null>(
    sessionStorage.getItem('attendeeName')
  );
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
      // Handle both 'ended' status and complete session deletion (null)
      if (status === 'ended' || status === null) {
        setError('Session has ended');
        setSessionEnded(true);
        setConnected(false);
        setCurrentActivity(null);
        setCurrentResults(null);
        setParticipantCount(0);
        setSessionCode(null);
        setParticipantId(null);
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

  // Listen to aggregated results for current activity (debounced for large sessions)
  const pendingResultsRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_MS = 500; // Update UI at most every 500ms during high-traffic periods

  useEffect(() => {
    if (!sessionCode || !currentActivity?.activityId) return;

    const resultsRef = ref(database, `sessions/${sessionCode}/aggregatedResults/${currentActivity.activityId}`);
    const unsubscribe = onValue(resultsRef, (snapshot) => {
      const results = snapshot.val();
      if (results) {
        // Store the latest results
        pendingResultsRef.current = results;

        // If no timer is running, update immediately and start debounce
        if (!debounceTimerRef.current) {
          const enrichedResults = {
            ...results,
            activityId: currentActivity.activityId,
            question: (currentActivity as PollActivity | QuizActivity).question,
            options: (currentActivity as PollActivity | QuizActivity).options,
          };
          setCurrentResults(enrichedResults);

          // Start debounce timer for subsequent rapid updates
          debounceTimerRef.current = setTimeout(() => {
            // Apply any pending results that came in during debounce period
            if (pendingResultsRef.current) {
              const latestResults = {
                ...pendingResultsRef.current,
                activityId: currentActivity.activityId,
                question: (currentActivity as PollActivity | QuizActivity).question,
                options: (currentActivity as PollActivity | QuizActivity).options,
              };
              setCurrentResults(latestResults);
            }
            debounceTimerRef.current = null;
          }, DEBOUNCE_MS);
        }
        // If timer is running, pendingResultsRef will be processed when it fires
      }
    });

    return () => {
      unsubscribe();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
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
      setSessionEnded(false);

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

    // Check if this is a submit-sample activity (allows multiple submissions)
    const isSubmitSample = answer && typeof answer === 'object' && 'imageUrl' in answer && 'version' in answer;

    // Check if this is a collaborative-tap-game tap (allows multiple taps)
    const isTapGame = answer && typeof answer === 'object' && 'action' in answer && answer.action === 'tap';

    // Check for duplicate response (but allow submit-sample and tap-game to submit multiple times)
    if (!isSubmitSample && !isTapGame) {
      const existingResponse = await get(responseRef);
      if (existingResponse.exists()) {
        throw new Error('Already responded to this activity');
      }
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

    // Get current activity to check its configuration
    const activityRef = ref(database, `sessions/${code}/currentActivity`);
    const activitySnapshot = await get(activityRef);
    const activity = activitySnapshot.val();

    await runTransaction(aggregatedRef, (current) => {
      // Check if this is a collaborative-tap-game activity
      if (answer && typeof answer === 'object' && 'action' in answer && answer.action === 'tap') {
        // Initialize if first tap
        if (!current) {
          return {
            activityId,
            title: activity?.title || 'Collaborative Tap Game',
            currentMode: 'linear',
            currentTotal: 0,
            isActive: false,
            isWinner: false,
            tapCount: 0,
          };
        }

        // Only process taps if game is active
        if (!current.isActive) {
          return current; // No change if game not active
        }

        // Update tap game state
        const currentMode = current.currentMode || 'linear';
        const linearIncrement = activity?.linearIncrement || 1000000;
        const winCondition = activity?.winCondition || 1000000000000;

        let newTotal = current.currentTotal || 0;

        // Calculate new total based on mode
        if (currentMode === 'linear') {
          newTotal += linearIncrement;
        } else if (currentMode === 'exponential') {
          newTotal = newTotal === 0 ? 1 : newTotal * 2;
        }

        // Check win condition
        const isWinner = newTotal >= winCondition;

        return {
          ...current,
          currentTotal: newTotal,
          isWinner: isWinner || current.isWinner, // Once won, stay won
          isActive: isWinner ? false : current.isActive, // Stop if won
          tapCount: (current.tapCount || 0) + 1,
        };
      }

      // Check if this is a submit-sample activity (answer has imageUrl property)
      if (answer && typeof answer === 'object' && 'imageUrl' in answer) {
        // For submit-sample activities, store submissions as an array
        const submissions = current?.submissions || [];
        const newSubmission: any = {
          participantId: participantId || 'unknown',
          imageUrl: answer.imageUrl,
          timestamp: answer.timestamp || new Date().toISOString(),
          version: answer.version || 1,
        };

        // Only include participantName if it exists (Firebase doesn't allow undefined)
        if (participantName) {
          newSubmission.participantName = participantName;
        }

        // Check if this participant already has a submission
        const existingIndex = submissions.findIndex((s: any) => s.participantId === participantId);
        let updatedSubmissions;
        let isNewSubmission;

        if (existingIndex >= 0) {
          // Update existing submission
          updatedSubmissions = [...submissions];
          updatedSubmissions[existingIndex] = newSubmission;
          isNewSubmission = false;
        } else {
          // Add new submission
          updatedSubmissions = [...submissions, newSubmission];
          isNewSubmission = true;
        }

        return {
          submissions: updatedSubmissions,
          totalSubmissions: isNewSubmission ? (current?.totalSubmissions || 0) + 1 : (current?.totalSubmissions || 0),
          lastUpdated: Date.now()
        };
      }

      // For poll/quiz activities, use the original logic
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

  // ============ Review Game Methods ============

  const joinReviewGame = useCallback(async (activityId: string, name: string) => {
    if (!sessionCode || !participantId) {
      console.error('joinReviewGame failed: Not in a session', { sessionCode, participantId });
      throw new Error('Not in a session');
    }

    console.log('joinReviewGame called:', { sessionCode, participantId, activityId, name });

    try {
      const participantRef = ref(database, `sessions/${sessionCode}/reviewGameParticipants/${activityId}/${participantId}`);
      await set(participantRef, {
        name,
        totalPoints: 0,
        correctCount: 0,
      });
      console.log('Participant data written to Firebase');

      // Update session storage
      sessionStorage.setItem('attendeeName', name);
      setParticipantName(name);

      // Update leaderboard immediately so participant shows up
      // Do this in a separate try-catch so it doesn't block the join
      try {
        await updateReviewGameLeaderboard(sessionCode, activityId);
        console.log('joinReviewGame completed, leaderboard updated');
      } catch (leaderboardError) {
        console.warn('Leaderboard update failed (non-fatal):', leaderboardError);
      }
    } catch (error) {
      console.error('joinReviewGame failed:', error);
      throw error;
    }
  }, [sessionCode, participantId]);

  const submitReviewGameAnswer = useCallback(async (
    activityId: string,
    questionId: string,
    answer: number,
    answerTime: number
  ): Promise<{ isCorrect: boolean; points: number } | null> => {
    if (!sessionCode || !participantId) {
      throw new Error('Not in a session');
    }

    // Get the current activity to check correct answer
    const activity = currentActivity as any;
    if (!activity || activity.type !== 'review-game') {
      throw new Error('No active review game');
    }

    const question = activity.questions?.find((q: any) => q.id === questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    const isCorrect = answer === question.correctAnswer;

    // Calculate points using Kahoot-style decay
    const timeLimit = question.timeLimit || activity.defaultTimeLimit || 20;
    const maxPoints = activity.maxPoints || 1000;
    const minPoints = activity.minPoints || 100;

    let points = 0;
    if (isCorrect) {
      const answerTimeSec = answerTime / 1000;
      if (answerTimeSec >= timeLimit) {
        points = minPoints;
      } else {
        const timeRatio = answerTimeSec / timeLimit;
        const pointRange = maxPoints - minPoints;
        points = Math.round(maxPoints - (pointRange * timeRatio));
      }
    }

    // Store response
    const responseRef = ref(database, `sessions/${sessionCode}/reviewGameResponses/${activityId}/${questionId}/${participantId}`);
    await set(responseRef, {
      answer,
      answerTime,
      submittedAt: Date.now(),
      isCorrect,
      points,
    });

    // Update participant totals
    const participantRef = ref(database, `sessions/${sessionCode}/reviewGameParticipants/${activityId}/${participantId}`);
    await runTransaction(participantRef, (current) => {
      if (!current) return current;
      return {
        ...current,
        totalPoints: (current.totalPoints || 0) + points,
        correctCount: (current.correctCount || 0) + (isCorrect ? 1 : 0),
      };
    });

    return { isCorrect, points };
  }, [sessionCode, participantId, currentActivity]);

  const getReviewGameState = useCallback((
    activityId: string,
    callback: (state: ReviewGameState | null, leaderboard: ReviewGameLeaderboardEntry[] | null, reviewGameParticipantCount?: number) => void
  ): Unsubscribe => {
    if (!sessionCode) {
      return () => {};
    }

    const stateRef = ref(database, `sessions/${sessionCode}/reviewGameState/${activityId}`);
    const leaderboardRef = ref(database, `sessions/${sessionCode}/reviewGameLeaderboard/${activityId}`);
    const participantsRef = ref(database, `sessions/${sessionCode}/reviewGameParticipants/${activityId}`);
    const responsesRef = ref(database, `sessions/${sessionCode}/reviewGameResponses/${activityId}`);

    let currentState: ReviewGameState | null = null;
    let currentLeaderboard: ReviewGameLeaderboardEntry[] | null = null;
    let reviewGameParticipantCount = 0;
    let allResponses: Record<string, any> = {};

    const emitCallback = () => {
      // Calculate response count and statistics for current question
      let stateWithResponseCount = currentState;
      if (currentState && currentActivity?.type === 'review-game') {
        const activity = currentActivity as any;
        const questionId = activity.questions?.[currentState.currentQuestionIndex]?.id;
        const currentQuestion = activity.questions?.[currentState.currentQuestionIndex];
        const questionResponsesData = questionId && allResponses[questionId] ? allResponses[questionId] : {};
        const questionResponses = Object.keys(questionResponsesData).length;

        // Aggregate responses by option
        const responses: number[] = currentQuestion?.options ? Array(currentQuestion.options.length).fill(0) : [];
        let correctCount = 0;

        Object.values(questionResponsesData).forEach((response: any) => {
          if (typeof response.answer === 'number' && response.answer >= 0 && response.answer < responses.length) {
            responses[response.answer]++;
            if (response.isCorrect) {
              correctCount++;
            }
          }
        });

        stateWithResponseCount = {
          ...currentState,
          responseCount: questionResponses,
          questionResults: {
            responses,
            totalResponses: questionResponses,
            correctCount,
          },
        };
      }
      callback(stateWithResponseCount, currentLeaderboard, reviewGameParticipantCount);
    };

    const stateUnsub = onValue(stateRef, (snapshot) => {
      currentState = snapshot.val();
      emitCallback();
    });

    const leaderboardUnsub = onValue(leaderboardRef, (snapshot) => {
      const data = snapshot.val();
      currentLeaderboard = data ? (Array.isArray(data) ? data : Object.values(data)) : null;
      emitCallback();
    });

    const participantsUnsub = onValue(participantsRef, (snapshot) => {
      const data = snapshot.val();
      reviewGameParticipantCount = data ? Object.keys(data).length : 0;
      emitCallback();
    });

    const responsesUnsub = onValue(responsesRef, (snapshot) => {
      allResponses = snapshot.val() || {};
      emitCallback();
    });

    return () => {
      stateUnsub();
      leaderboardUnsub();
      participantsUnsub();
      responsesUnsub();
    };
  }, [sessionCode, currentActivity]);

  // Presenter control methods
  const startReviewGame = useCallback(async (activityId: string) => {
    if (!sessionCode) return;

    const stateRef = ref(database, `sessions/${sessionCode}/reviewGameState/${activityId}`);
    await set(stateRef, {
      gamePhase: 'question',
      currentQuestionIndex: 0,
      questionStartTime: Date.now(),
    });
  }, [sessionCode]);

  const revealAnswer = useCallback(async (activityId: string) => {
    if (!sessionCode) return;

    // Update game phase to reveal
    const stateRef = ref(database, `sessions/${sessionCode}/reviewGameState/${activityId}`);
    await update(stateRef, { gamePhase: 'reveal' });

    // Update leaderboard
    await updateReviewGameLeaderboard(sessionCode, activityId);
  }, [sessionCode]);

  const nextQuestion = useCallback(async (activityId: string, totalQuestions: number) => {
    if (!sessionCode) return;

    const stateRef = ref(database, `sessions/${sessionCode}/reviewGameState/${activityId}`);
    const stateSnapshot = await get(stateRef);
    const currentState = stateSnapshot.val();

    const nextIndex = (currentState?.currentQuestionIndex || 0) + 1;

    if (nextIndex >= totalQuestions) {
      // Game finished
      await update(stateRef, { gamePhase: 'finished' });
    } else {
      // Move to next question
      await update(stateRef, {
        gamePhase: 'question',
        currentQuestionIndex: nextIndex,
        questionStartTime: Date.now(),
      });
    }
  }, [sessionCode]);

  const endReviewGame = useCallback(async (activityId: string) => {
    if (!sessionCode) return;

    const stateRef = ref(database, `sessions/${sessionCode}/reviewGameState/${activityId}`);
    await update(stateRef, { gamePhase: 'finished' });

    // Final leaderboard update
    await updateReviewGameLeaderboard(sessionCode, activityId);
  }, [sessionCode]);

  const updateReviewGameLeaderboard = async (code: string, activityId: string) => {
    // Get all participants
    const participantsRef = ref(database, `sessions/${code}/reviewGameParticipants/${activityId}`);
    const participantsSnapshot = await get(participantsRef);
    const participants = participantsSnapshot.val();

    if (!participants) return;

    // Get current leaderboard for previous ranks
    const leaderboardRef = ref(database, `sessions/${code}/reviewGameLeaderboard/${activityId}`);
    const prevLeaderboardSnapshot = await get(leaderboardRef);
    const prevLeaderboard = prevLeaderboardSnapshot.val() || [];
    const prevRanks = new Map<string, number>();
    if (Array.isArray(prevLeaderboard)) {
      prevLeaderboard.forEach((entry: any) => {
        if (entry?.participantId) {
          prevRanks.set(entry.participantId, entry.rank);
        }
      });
    }

    // Build and sort leaderboard
    // Note: Firebase doesn't allow undefined values, so only include previousRank if it exists
    const entries: ReviewGameLeaderboardEntry[] = Object.entries(participants).map(([pid, data]: [string, any]) => {
      const entry: ReviewGameLeaderboardEntry = {
        participantId: pid,
        name: data.name || 'Anonymous',
        totalPoints: data.totalPoints || 0,
        correctCount: data.correctCount || 0,
        rank: 0,
      };
      const prevRank = prevRanks.get(pid);
      if (prevRank !== undefined) {
        entry.previousRank = prevRank;
      }
      return entry;
    });

    entries.sort((a, b) => b.totalPoints - a.totalPoints);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    await set(leaderboardRef, entries);
  };

  const updateActivity = useCallback(async (activityId: string, updates: Partial<ActivityResults>): Promise<void> => {
    if (!sessionCode) {
      throw new Error('Not in a session');
    }

    const aggregatedRef = ref(database, `sessions/${sessionCode}/aggregatedResults/${activityId}`);
    await update(aggregatedRef, updates);
  }, [sessionCode]);

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
        sessionEnded,
        sessionCode,
        joinSession,
        submitResponse,
        currentActivity,
        currentResults,
        error,
        participantCount,
        leaveSession,
        // Review game
        participantId,
        participantName,
        joinReviewGame,
        submitReviewGameAnswer,
        getReviewGameState,
        startReviewGame,
        revealAnswer,
        nextQuestion,
        endReviewGame,
        updateActivity,
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
