import React, { useEffect } from 'react';
import { WebLinkActivity } from '@interactive-presentations/shared';

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

interface WebLinkProps {
  activity: WebLinkActivity;
}

export const WebLink: React.FC<WebLinkProps> = ({ activity }) => {
  useEffect(() => {
    // Handle redirect mode
    if (activity.displayMode === 'redirect') {
      window.location.href = activity.url;
    }

    // Handle new-tab mode on mount
    if (activity.displayMode === 'new-tab') {
      window.open(activity.url, '_blank', 'noopener,noreferrer');
    }
  }, [activity.url, activity.displayMode]);

  // For redirect mode, show loading while redirecting
  if (activity.displayMode === 'redirect') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={stMathBackground}>
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold">Redirecting...</h2>
          <p className="mt-2">{activity.title}</p>
        </div>
      </div>
    );
  }

  // For new-tab mode, show instructions
  if (activity.displayMode === 'new-tab') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={stMathBackground}>
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="mb-6">
            <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
              External Activity
            </span>
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-4">{activity.title}</h2>

          {activity.description && (
            <p className="text-gray-600 mb-6">{activity.description}</p>
          )}

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 font-medium">
              A new tab should have opened with the activity.
            </p>
            <p className="text-blue-600 text-sm mt-2">
              If it didn't open, click the button below.
            </p>
          </div>

          <a
            href={activity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-white py-3 px-8 rounded-lg font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
            style={{
              backgroundColor: stMathOrange,
              boxShadow: '0 4px 14px rgba(247, 148, 29, 0.4)',
            }}
          >
            Open Activity
          </a>

          <p className="mt-6 text-sm text-gray-500">
            Return to this tab when you're done with the activity.
          </p>
        </div>
      </div>
    );
  }

  // Default: iframe mode
  const iframeHeight = activity.iframeHeight || '80vh';
  const isFullScreen = (activity as any).fullScreen === true;

  // Full-screen iframe mode (for ST Math games, etc.)
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 bg-black">
        <iframe
          src={activity.url}
          title={activity.title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-white shadow-md p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded uppercase tracking-wide mb-2">
                Interactive Activity
              </span>
              <h2 className="text-xl font-bold text-gray-800">{activity.title}</h2>
              {activity.description && (
                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
              )}
            </div>
            <a
              href={activity.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in new tab
            </a>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto h-full">
          <iframe
            src={activity.url}
            title={activity.title}
            className="w-full rounded-lg shadow-lg border-2 border-gray-200"
            style={{ height: iframeHeight }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      </div>
    </div>
  );
};
