import React from 'react';
import { useSocket } from '../contexts/FirebaseContext';

// ST Math brand colors
const stMathBlue = '#0077c8';
const stMathBlueDark = '#005a9e';

// Neural network SVG pattern - seamlessly tiling with organic interior
// Edge nodes fixed for tiling, interior nodes irregular for organic feel
const neuralPatternSvg = `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='rgba(255,255,255,0.15)' stroke-width='0.75'%3E%3Ccircle cx='0' cy='0' r='2.5'/%3E%3Ccircle cx='0' cy='100' r='2'/%3E%3Ccircle cx='0' cy='200' r='2.5'/%3E%3Ccircle cx='100' cy='0' r='2'/%3E%3Ccircle cx='100' cy='200' r='2'/%3E%3Ccircle cx='200' cy='0' r='2.5'/%3E%3Ccircle cx='200' cy='100' r='2'/%3E%3Ccircle cx='200' cy='200' r='2.5'/%3E%3Ccircle cx='35' cy='28' r='2'/%3E%3Ccircle cx='78' cy='52' r='3'/%3E%3Ccircle cx='142' cy='35' r='2'/%3E%3Ccircle cx='168' cy='72' r='2.5'/%3E%3Ccircle cx='55' cy='95' r='2'/%3E%3Ccircle cx='118' cy='88' r='2.5'/%3E%3Ccircle cx='28' cy='145' r='2.5'/%3E%3Ccircle cx='85' cy='138' r='2'/%3E%3Ccircle cx='155' cy='125' r='3'/%3E%3Ccircle cx='62' cy='172' r='2'/%3E%3Ccircle cx='130' cy='165' r='2.5'/%3E%3Ccircle cx='175' cy='158' r='2'/%3E%3Cline x1='0' y1='0' x2='35' y2='28'/%3E%3Cline x1='0' y1='0' x2='100' y2='0'/%3E%3Cline x1='100' y1='0' x2='35' y2='28'/%3E%3Cline x1='100' y1='0' x2='142' y2='35'/%3E%3Cline x1='100' y1='0' x2='200' y2='0'/%3E%3Cline x1='200' y1='0' x2='142' y2='35'/%3E%3Cline x1='35' y1='28' x2='78' y2='52'/%3E%3Cline x1='78' y1='52' x2='142' y2='35'/%3E%3Cline x1='142' y1='35' x2='168' y2='72'/%3E%3Cline x1='78' y1='52' x2='55' y2='95'/%3E%3Cline x1='78' y1='52' x2='118' y2='88'/%3E%3Cline x1='168' y1='72' x2='118' y2='88'/%3E%3Cline x1='168' y1='72' x2='200' y2='100'/%3E%3Cline x1='0' y1='100' x2='35' y2='28'/%3E%3Cline x1='0' y1='100' x2='55' y2='95'/%3E%3Cline x1='55' y1='95' x2='118' y2='88'/%3E%3Cline x1='118' y1='88' x2='200' y2='100'/%3E%3Cline x1='0' y1='100' x2='28' y2='145'/%3E%3Cline x1='55' y1='95' x2='28' y2='145'/%3E%3Cline x1='55' y1='95' x2='85' y2='138'/%3E%3Cline x1='118' y1='88' x2='155' y2='125'/%3E%3Cline x1='200' y1='100' x2='155' y2='125'/%3E%3Cline x1='28' y1='145' x2='85' y2='138'/%3E%3Cline x1='85' y1='138' x2='155' y2='125'/%3E%3Cline x1='155' y1='125' x2='175' y2='158'/%3E%3Cline x1='28' y1='145' x2='0' y2='200'/%3E%3Cline x1='28' y1='145' x2='62' y2='172'/%3E%3Cline x1='85' y1='138' x2='62' y2='172'/%3E%3Cline x1='85' y1='138' x2='130' y2='165'/%3E%3Cline x1='155' y1='125' x2='130' y2='165'/%3E%3Cline x1='175' y1='158' x2='200' y2='200'/%3E%3Cline x1='0' y1='200' x2='62' y2='172'/%3E%3Cline x1='62' y1='172' x2='100' y2='200'/%3E%3Cline x1='100' y1='200' x2='130' y2='165'/%3E%3Cline x1='130' y1='165' x2='175' y2='158'/%3E%3Cline x1='175' y1='158' x2='130' y2='165'/%3E%3Cline x1='200' y1='200' x2='130' y2='165'/%3E%3C/g%3E%3C/svg%3E")`;

export const WaitingScreen: React.FC = () => {
  const { connected, participantCount, currentActivity } = useSocket();

  // If there's an activity, this screen shouldn't be shown
  // The App component will handle routing to the activity
  if (currentActivity) {
    return null;
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: stMathBlue,
        backgroundImage: `${neuralPatternSvg}, linear-gradient(135deg, ${stMathBlue} 0%, ${stMathBlueDark} 100%)`,
        backgroundSize: '200px 200px, 100% 100%',
      }}
    >
      <div className="text-center max-w-2xl">
        <div className="bg-white rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center shadow-lg">
          <svg
            className="w-16 h-16 animate-pulse"
            style={{ color: stMathBlue }}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-white mb-4">
          Ready When You Are!
        </h1>

        <p className="text-xl text-white/90 mb-8">
          Waiting for the presenter to share an interactive activity...
        </p>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 inline-block">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  connected ? 'bg-green-400' : 'bg-red-400'
                }`}
              />
              <span className="text-white font-medium">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <div className="w-px h-8 bg-white/30" />

            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-white font-medium">
                {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 text-white/70 text-sm">
          <p>When the presenter moves to an interactive slide,</p>
          <p>the activity will appear here automatically.</p>
        </div>
      </div>
    </div>
  );
};
