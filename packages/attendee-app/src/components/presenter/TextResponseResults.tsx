import React, { useEffect, useState, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyALHOftrFMc8iELsW5BRzT6fUz_qofRSuw",
  authDomain: "class-session-games.firebaseapp.com",
  databaseURL: "https://class-session-games-default-rtdb.firebaseio.com",
  projectId: "class-session-games",
  storageBucket: "class-session-games.firebasestorage.app",
  messagingSenderId: "528175934275",
  appId: "1:528175934275:web:1c10fb554988405f639df6"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const database = getDatabase(app);

// ST Math brand colors
const stMathBlue = '#0077c8';

interface TextResponseActivity {
  activityId?: string;
  type: 'text-response';
  prompt: string;
  placeholder?: string;
  maxLength?: number;
}

interface TextResponseResultsProps {
  activity: TextResponseActivity;
  sessionCode: string;
}

interface ResponseEntry {
  answer: string;
  submittedAt: number;
  participantId: string;
}

const RESPONSES_PER_PAGE = 50;
const DEBOUNCE_MS = 500;

export const TextResponseResults: React.FC<TextResponseResultsProps> = ({ activity, sessionCode }) => {
  const [responses, setResponses] = useState<ResponseEntry[]>([]);
  const [visibleCount, setVisibleCount] = useState(RESPONSES_PER_PAGE);
  const pendingResponsesRef = useRef<ResponseEntry[] | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!activity.activityId || !sessionCode) return;

    const responsesRef = ref(database, `sessions/${sessionCode}/responses/${activity.activityId}`);
    const unsubscribe = onValue(responsesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entries: ResponseEntry[] = Object.entries(data).map(([participantId, value]: [string, any]) => ({
          participantId,
          answer: value.answer,
          submittedAt: value.submittedAt,
        }));
        // Sort by submission time (newest first)
        entries.sort((a, b) => b.submittedAt - a.submittedAt);

        // Debounce updates for large sessions
        pendingResponsesRef.current = entries;

        if (!debounceTimerRef.current) {
          setResponses(entries);
          debounceTimerRef.current = setTimeout(() => {
            if (pendingResponsesRef.current) {
              setResponses(pendingResponsesRef.current);
            }
            debounceTimerRef.current = null;
          }, DEBOUNCE_MS);
        }
      } else {
        setResponses([]);
      }
    });

    return () => {
      unsubscribe();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [activity.activityId, sessionCode]);

  // Reset visible count when activity changes
  useEffect(() => {
    setVisibleCount(RESPONSES_PER_PAGE);
  }, [activity.activityId]);

  const visibleResponses = responses.slice(0, visibleCount);
  const hasMore = responses.length > visibleCount;

  const loadMore = () => {
    setVisibleCount(prev => prev + RESPONSES_PER_PAGE);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">Responses</h3>
        <span
          className="px-3 py-1 rounded-full text-sm font-semibold"
          style={{ backgroundColor: '#e0f2fe', color: stMathBlue }}
        >
          {responses.length} {responses.length === 1 ? 'response' : 'responses'}
        </span>
      </div>

      {responses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-2">💬</div>
          <p>Waiting for responses...</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {visibleResponses.map((entry) => (
              <div
                key={entry.participantId}
                className="p-4 bg-gray-50 rounded-lg border-l-4"
                style={{ borderLeftColor: stMathBlue }}
              >
                <p className="text-gray-800">{entry.answer}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(entry.submittedAt).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
          {hasMore && (
            <button
              onClick={loadMore}
              className="mt-4 w-full py-2 text-sm font-medium rounded-lg transition-colors"
              style={{ backgroundColor: '#e0f2fe', color: stMathBlue }}
            >
              Load more ({responses.length - visibleCount} remaining)
            </button>
          )}
        </>
      )}
    </div>
  );
};
