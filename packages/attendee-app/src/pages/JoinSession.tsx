import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../contexts/FirebaseContext';

export const JoinSession: React.FC = () => {
  const { code } = useParams<{ code?: string }>();
  const [sessionCode, setSessionCode] = useState(code || '');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { joinSession } = useSocket();

  // Auto-join if code is provided in URL
  useEffect(() => {
    if (code && code.trim()) {
      setLoading(true);
      joinSession(code.trim().toUpperCase(), undefined)
        .then(() => {
          navigate('/waiting');
        })
        .catch((err) => {
          setError((err as Error).message);
          setLoading(false);
        });
    }
  }, [code, joinSession, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionCode.trim()) {
      setError('Please enter a session code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await joinSession(sessionCode.trim().toUpperCase(), name.trim() || undefined);
      navigate('/waiting');
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Interactive Presentations
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Enter the session code to join
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="sessionCode" className="block text-sm font-medium text-gray-700 mb-2">
              Session Code
            </label>
            <input
              type="text"
              id="sessionCode"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 text-center text-2xl font-mono font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 uppercase tracking-widest"
              placeholder="ABC123"
              maxLength={6}
              autoComplete="off"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name (Optional)
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter your name"
              maxLength={50}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !sessionCode.trim()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Joining...' : 'Join Session'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Waiting for the presenter to start?</p>
          <p>Make sure you have the correct session code.</p>
        </div>
      </div>
    </div>
  );
};
