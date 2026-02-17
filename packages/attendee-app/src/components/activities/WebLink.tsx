import React, { useEffect } from 'react';
import { WebLinkActivity } from '@interactive-presentations/shared';

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
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center p-4">
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
            className="inline-block bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
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
