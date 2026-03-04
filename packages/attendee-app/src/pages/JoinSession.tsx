import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../contexts/FirebaseContext';

// ST Math brand colors
const stMathBlue = '#0077c8';
const stMathBlueDark = '#005a9e';
const stMathOrange = '#f7941d';

// Neural network SVG pattern - seamlessly tiling with organic interior
// Edge nodes fixed for tiling, interior nodes irregular for organic feel
const neuralPatternSvg = `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='rgba(255,255,255,0.15)' stroke-width='0.75'%3E%3Ccircle cx='0' cy='0' r='2.5'/%3E%3Ccircle cx='0' cy='100' r='2'/%3E%3Ccircle cx='0' cy='200' r='2.5'/%3E%3Ccircle cx='100' cy='0' r='2'/%3E%3Ccircle cx='100' cy='200' r='2'/%3E%3Ccircle cx='200' cy='0' r='2.5'/%3E%3Ccircle cx='200' cy='100' r='2'/%3E%3Ccircle cx='200' cy='200' r='2.5'/%3E%3Ccircle cx='35' cy='28' r='2'/%3E%3Ccircle cx='78' cy='52' r='3'/%3E%3Ccircle cx='142' cy='35' r='2'/%3E%3Ccircle cx='168' cy='72' r='2.5'/%3E%3Ccircle cx='55' cy='95' r='2'/%3E%3Ccircle cx='118' cy='88' r='2.5'/%3E%3Ccircle cx='28' cy='145' r='2.5'/%3E%3Ccircle cx='85' cy='138' r='2'/%3E%3Ccircle cx='155' cy='125' r='3'/%3E%3Ccircle cx='62' cy='172' r='2'/%3E%3Ccircle cx='130' cy='165' r='2.5'/%3E%3Ccircle cx='175' cy='158' r='2'/%3E%3Cline x1='0' y1='0' x2='35' y2='28'/%3E%3Cline x1='0' y1='0' x2='100' y2='0'/%3E%3Cline x1='100' y1='0' x2='35' y2='28'/%3E%3Cline x1='100' y1='0' x2='142' y2='35'/%3E%3Cline x1='100' y1='0' x2='200' y2='0'/%3E%3Cline x1='200' y1='0' x2='142' y2='35'/%3E%3Cline x1='35' y1='28' x2='78' y2='52'/%3E%3Cline x1='78' y1='52' x2='142' y2='35'/%3E%3Cline x1='142' y1='35' x2='168' y2='72'/%3E%3Cline x1='78' y1='52' x2='55' y2='95'/%3E%3Cline x1='78' y1='52' x2='118' y2='88'/%3E%3Cline x1='168' y1='72' x2='118' y2='88'/%3E%3Cline x1='168' y1='72' x2='200' y2='100'/%3E%3Cline x1='0' y1='100' x2='35' y2='28'/%3E%3Cline x1='0' y1='100' x2='55' y2='95'/%3E%3Cline x1='55' y1='95' x2='118' y2='88'/%3E%3Cline x1='118' y1='88' x2='200' y2='100'/%3E%3Cline x1='0' y1='100' x2='28' y2='145'/%3E%3Cline x1='55' y1='95' x2='28' y2='145'/%3E%3Cline x1='55' y1='95' x2='85' y2='138'/%3E%3Cline x1='118' y1='88' x2='155' y2='125'/%3E%3Cline x1='200' y1='100' x2='155' y2='125'/%3E%3Cline x1='28' y1='145' x2='85' y2='138'/%3E%3Cline x1='85' y1='138' x2='155' y2='125'/%3E%3Cline x1='155' y1='125' x2='175' y2='158'/%3E%3Cline x1='28' y1='145' x2='0' y2='200'/%3E%3Cline x1='28' y1='145' x2='62' y2='172'/%3E%3Cline x1='85' y1='138' x2='62' y2='172'/%3E%3Cline x1='85' y1='138' x2='130' y2='165'/%3E%3Cline x1='155' y1='125' x2='130' y2='165'/%3E%3Cline x1='175' y1='158' x2='200' y2='200'/%3E%3Cline x1='0' y1='200' x2='62' y2='172'/%3E%3Cline x1='62' y1='172' x2='100' y2='200'/%3E%3Cline x1='100' y1='200' x2='130' y2='165'/%3E%3Cline x1='130' y1='165' x2='175' y2='158'/%3E%3Cline x1='175' y1='158' x2='130' y2='165'/%3E%3Cline x1='200' y1='200' x2='130' y2='165'/%3E%3C/g%3E%3C/svg%3E")`;

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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: stMathBlue,
        backgroundImage: `${neuralPatternSvg}, linear-gradient(135deg, ${stMathBlue} 0%, ${stMathBlueDark} 100%)`,
        backgroundSize: '200px 200px, 100% 100%',
      }}
    >
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
            className="w-full text-white py-3 px-6 rounded-lg font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            style={{
              backgroundColor: loading || !sessionCode.trim() ? undefined : stMathOrange,
              boxShadow: loading || !sessionCode.trim() ? undefined : '0 4px 14px rgba(247, 148, 29, 0.4)',
            }}
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
