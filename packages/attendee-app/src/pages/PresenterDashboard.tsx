import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { PollResults } from '../components/presenter/PollResults';
import { QuizResults } from '../components/presenter/QuizResults';

export const PresenterDashboard: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { socket, joinSession, currentActivity, currentResults, error, participantCount, connected } = useSocket();
  const [joining, setJoining] = useState(true);

  useEffect(() => {
    if (!code) {
      navigate('/join');
      return;
    }

    // Wait for socket to be initialized before joining
    if (!socket) {
      return;
    }

    // Join session as presenter observer
    joinSession(code, 'Presenter')
      .then(() => {
        setJoining(false);
      })
      .catch((err) => {
        console.error('Failed to join session:', err);
        setJoining(false);
      });
  }, [code, socket, joinSession, navigate]);

  if (joining) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold">Connecting to session...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/join')}
            className="bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700"
          >
            Back to Join
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Presenter Dashboard</h1>
              <p className="text-purple-100 mt-1">Session: {code}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{participantCount}</div>
                <div className="text-sm text-purple-100">Participants</div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-sm">{connected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!currentActivity ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Active Activity</h2>
            <p className="text-gray-600">
              Navigate to a slide with an activity to see results here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Activity Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide mb-2">
                    {currentActivity.type}
                  </span>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {currentActivity.type === 'poll' && currentActivity.question}
                    {currentActivity.type === 'quiz' && currentActivity.question}
                    {currentActivity.type === 'web-link' && currentActivity.title}
                  </h2>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Activity ID</div>
                  <div className="text-lg font-mono text-gray-800">{currentActivity.id}</div>
                </div>
              </div>
            </div>

            {/* Activity-Specific Results */}
            {currentActivity.type === 'poll' && (
              <PollResults activity={currentActivity} results={currentResults} />
            )}
            {currentActivity.type === 'quiz' && (
              <QuizResults activity={currentActivity} results={currentResults} />
            )}
            {currentActivity.type === 'web-link' && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-5xl mb-4">🔗</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">External Activity</h3>
                <p className="text-gray-600 mb-4">{currentActivity.description}</p>
                <a
                  href={currentActivity.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Open Activity
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
