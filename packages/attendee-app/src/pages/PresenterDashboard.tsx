import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/FirebaseContext';
import { PollResults } from '../components/presenter/PollResults';
import { QuizResults } from '../components/presenter/QuizResults';
import { TextResponseResults } from '../components/presenter/TextResponseResults';
import { ReviewGameResults } from '../components/presenter/ReviewGameResults';
import { SubmitSampleResultsView } from '../components/presenter/SubmitSampleResults';
import { CollaborativeTapGameResults } from '../components/presenter/CollaborativeTapGameResults';

// ST Math brand colors
const stMathBlue = '#0077c8';
const stMathBlueDark = '#005a9e';
const stMathOrange = '#f7941d';

// Neural network SVG pattern - seamlessly tiling with organic interior
const neuralPatternSvg = `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='rgba(255,255,255,0.15)' stroke-width='0.75'%3E%3Ccircle cx='0' cy='0' r='2.5'/%3E%3Ccircle cx='0' cy='100' r='2'/%3E%3Ccircle cx='0' cy='200' r='2.5'/%3E%3Ccircle cx='100' cy='0' r='2'/%3E%3Ccircle cx='100' cy='200' r='2'/%3E%3Ccircle cx='200' cy='0' r='2.5'/%3E%3Ccircle cx='200' cy='100' r='2'/%3E%3Ccircle cx='200' cy='200' r='2.5'/%3E%3Ccircle cx='35' cy='28' r='2'/%3E%3Ccircle cx='78' cy='52' r='3'/%3E%3Ccircle cx='142' cy='35' r='2'/%3E%3Ccircle cx='168' cy='72' r='2.5'/%3E%3Ccircle cx='55' cy='95' r='2'/%3E%3Ccircle cx='118' cy='88' r='2.5'/%3E%3Ccircle cx='28' cy='145' r='2.5'/%3E%3Ccircle cx='85' cy='138' r='2'/%3E%3Ccircle cx='155' cy='125' r='3'/%3E%3Ccircle cx='62' cy='172' r='2'/%3E%3Ccircle cx='130' cy='165' r='2.5'/%3E%3Ccircle cx='175' cy='158' r='2'/%3E%3Cline x1='0' y1='0' x2='35' y2='28'/%3E%3Cline x1='0' y1='0' x2='100' y2='0'/%3E%3Cline x1='100' y1='0' x2='35' y2='28'/%3E%3Cline x1='100' y1='0' x2='142' y2='35'/%3E%3Cline x1='100' y1='0' x2='200' y2='0'/%3E%3Cline x1='200' y1='0' x2='142' y2='35'/%3E%3Cline x1='35' y1='28' x2='78' y2='52'/%3E%3Cline x1='78' y1='52' x2='142' y2='35'/%3E%3Cline x1='142' y1='35' x2='168' y2='72'/%3E%3Cline x1='78' y1='52' x2='55' y2='95'/%3E%3Cline x1='78' y1='52' x2='118' y2='88'/%3E%3Cline x1='168' y1='72' x2='118' y2='88'/%3E%3Cline x1='168' y1='72' x2='200' y2='100'/%3E%3Cline x1='0' y1='100' x2='35' y2='28'/%3E%3Cline x1='0' y1='100' x2='55' y2='95'/%3E%3Cline x1='55' y1='95' x2='118' y2='88'/%3E%3Cline x1='118' y1='88' x2='200' y2='100'/%3E%3Cline x1='0' y1='100' x2='28' y2='145'/%3E%3Cline x1='55' y1='95' x2='28' y2='145'/%3E%3Cline x1='55' y1='95' x2='85' y2='138'/%3E%3Cline x1='118' y1='88' x2='155' y2='125'/%3E%3Cline x1='200' y1='100' x2='155' y2='125'/%3E%3Cline x1='28' y1='145' x2='85' y2='138'/%3E%3Cline x1='85' y1='138' x2='155' y2='125'/%3E%3Cline x1='155' y1='125' x2='175' y2='158'/%3E%3Cline x1='28' y1='145' x2='0' y2='200'/%3E%3Cline x1='28' y1='145' x2='62' y2='172'/%3E%3Cline x1='85' y1='138' x2='62' y2='172'/%3E%3Cline x1='85' y1='138' x2='130' y2='165'/%3E%3Cline x1='155' y1='125' x2='130' y2='165'/%3E%3Cline x1='175' y1='158' x2='200' y2='200'/%3E%3Cline x1='0' y1='200' x2='62' y2='172'/%3E%3Cline x1='62' y1='172' x2='100' y2='200'/%3E%3Cline x1='100' y1='200' x2='130' y2='165'/%3E%3Cline x1='130' y1='165' x2='175' y2='158'/%3E%3Cline x1='175' y1='158' x2='130' y2='165'/%3E%3Cline x1='200' y1='200' x2='130' y2='165'/%3E%3C/g%3E%3C/svg%3E")`;

const stMathBackground = {
  backgroundColor: stMathBlue,
  backgroundImage: `${neuralPatternSvg}, linear-gradient(135deg, ${stMathBlue} 0%, ${stMathBlueDark} 100%)`,
  backgroundSize: '200px 200px, 100% 100%',
};

export const PresenterDashboard: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { joinSession, currentActivity, currentResults, error, participantCount, connected } = useSocket();
  const [joining, setJoining] = useState(true);

  useEffect(() => {
    if (!code) {
      navigate('/join');
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
  }, [code, joinSession, navigate]);

  if (joining) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={stMathBackground}>
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold">Connecting to session...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={stMathBackground}>
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/join')}
            className="text-white py-2 px-6 rounded-lg font-semibold transition-colors"
            style={{ backgroundColor: stMathOrange }}
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
      <div
        className="text-white shadow-lg"
        style={{
          backgroundColor: stMathBlue,
          backgroundImage: `${neuralPatternSvg}, linear-gradient(135deg, ${stMathBlue} 0%, ${stMathBlueDark} 100%)`,
          backgroundSize: '200px 200px, 100% 100%',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Presenter Dashboard</h1>
              <p className="text-white/80 mt-1">Session: {code}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{participantCount}</div>
                <div className="text-sm text-white/80">Participants</div>
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
                  <span
                    className="inline-block text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide mb-2"
                    style={{ backgroundColor: '#e0f2fe', color: stMathBlue }}
                  >
                    {currentActivity.type}
                  </span>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {currentActivity.type === 'poll' && (currentActivity as any).question}
                    {currentActivity.type === 'quiz' && (currentActivity as any).question}
                    {currentActivity.type === 'web-link' && (currentActivity as any).title}
                    {currentActivity.type === 'text-response' && (currentActivity as any).prompt}
                    {currentActivity.type === 'review-game' && (currentActivity as any).title}
                    {currentActivity.type === 'submit-sample' && (currentActivity as any).instructions}
                    {currentActivity.type === 'collaborative-tap-game' && (currentActivity as any).title}
                  </h2>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Activity ID</div>
                  <div className="text-lg font-mono text-gray-800">{currentActivity.activityId}</div>
                </div>
              </div>
            </div>

            {/* Activity-Specific Results */}
            {currentActivity.type === 'poll' && (
              <PollResults activity={currentActivity as any} results={currentResults as any} />
            )}
            {currentActivity.type === 'quiz' && (
              <QuizResults activity={currentActivity as any} results={currentResults as any} />
            )}
            {currentActivity.type === 'web-link' && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-5xl mb-4">🔗</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">External Activity</h3>
                <p className="text-gray-600 mb-4">{(currentActivity as any).description}</p>
                <a
                  href={(currentActivity as any).url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-white py-2 px-6 rounded-lg font-semibold transition-colors"
                  style={{ backgroundColor: stMathOrange, boxShadow: '0 4px 14px rgba(247, 148, 29, 0.4)' }}
                >
                  Open Activity
                </a>
              </div>
            )}
            {currentActivity.type === 'text-response' && code && (
              <TextResponseResults activity={currentActivity as any} sessionCode={code} />
            )}
            {currentActivity.type === 'review-game' && (
              <ReviewGameResults activity={currentActivity as any} />
            )}
            {currentActivity.type === 'submit-sample' && (
              <SubmitSampleResultsView results={currentResults as any} />
            )}
            {currentActivity.type === 'collaborative-tap-game' && (
              <CollaborativeTapGameResults activity={currentActivity as any} results={currentResults as any} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
