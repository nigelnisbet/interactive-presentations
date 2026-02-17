import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  AttendeeEvents,
  SessionEvents,
  AttendeeJoinPayload,
  AttendeeJoinedPayload,
  SubmitResponsePayload,
  ActivityDefinition,
  ActivityResults,
} from '@interactive-presentations/shared';

const SERVER_URL = 'http://localhost:3000';

interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  joinSession: (sessionCode: string, name?: string) => Promise<AttendeeJoinedPayload>;
  submitResponse: (activityId: string, answer: any) => Promise<void>;
  currentActivity: ActivityDefinition | null;
  currentResults: ActivityResults | null;
  error: string | null;
  participantCount: number;
}

export const useSocket = (): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<ActivityDefinition | null>(null);
  const [currentResults, setCurrentResults] = useState<ActivityResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    const socketInstance = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });

    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
      setError(null);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    socketInstance.on(SessionEvents.SLIDE_CHANGED, (payload) => {
      console.log('Slide changed:', payload);
      if (!payload.hasActivity) {
        setCurrentActivity(null);
        setCurrentResults(null);
      }
    });

    socketInstance.on(SessionEvents.ACTIVITY_STARTED, (payload) => {
      console.log('Activity started:', payload);
      setCurrentActivity(payload.activity);
      setCurrentResults(null);
    });

    socketInstance.on(SessionEvents.ACTIVITY_ENDED, (payload) => {
      console.log('Activity ended:', payload);
      setCurrentActivity(null);
    });

    socketInstance.on(SessionEvents.RESULTS_UPDATED, (payload) => {
      console.log('Results updated:', payload);
      setCurrentResults(payload.results);
    });

    socketInstance.on(SessionEvents.ENDED, (payload) => {
      console.log('Session ended:', payload);
      setError(payload.message);
      socketInstance.disconnect();
    });

    socketInstance.on(SessionEvents.PARTICIPANT_COUNT, (payload) => {
      setParticipantCount(payload.count);
    });

    socketInstance.on('error:invalid-session', (payload) => {
      setError(payload.error);
    });

    socketInstance.on('error', (payload) => {
      console.error('Socket error:', payload);
      setError(payload.error || 'An error occurred');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinSession = useCallback(
    (sessionCode: string, name?: string): Promise<AttendeeJoinedPayload> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not initialized'));
          return;
        }

        socket.connect();

        const payload: AttendeeJoinPayload = {
          sessionCode,
          name,
        };

        socket.emit(AttendeeEvents.JOIN, payload);

        socket.once(AttendeeEvents.JOINED, (response: AttendeeJoinedPayload) => {
          console.log('Joined session:', response);
          resolve(response);
        });

        socket.once('error:invalid-session', (response) => {
          reject(new Error(response.error));
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);
      });
    },
    [socket]
  );

  const submitResponse = useCallback(
    (activityId: string, answer: any): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not initialized'));
          return;
        }

        const payload: SubmitResponsePayload = {
          activityId,
          answer,
        };

        socket.emit(AttendeeEvents.SUBMIT_RESPONSE, payload);

        socket.once(AttendeeEvents.RESPONSE_ACKNOWLEDGED, () => {
          console.log('Response acknowledged');
          resolve();
        });

        socket.once('error', (response) => {
          reject(new Error(response.error));
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          reject(new Error('Response timeout'));
        }, 5000);
      });
    },
    [socket]
  );

  return {
    socket,
    connected,
    joinSession,
    submitResponse,
    currentActivity,
    currentResults,
    error,
    participantCount,
  };
};
