import React, { useState } from 'react';
import { SubmitSampleResults } from '@interactive-presentations/shared';

// ST Math brand colors
const stMathBlue = '#0077c8';
const stMathOrange = '#f7941d';

interface SubmitSampleResultsProps {
  results: SubmitSampleResults;
}

export const SubmitSampleResultsView: React.FC<SubmitSampleResultsProps> = ({ results }) => {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  if (!results || !results.submissions || results.submissions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⏳</div>
        <p className="text-xl text-gray-600">Waiting for students to submit their work...</p>
        <p className="text-sm text-gray-500 mt-2">
          Submissions will appear here as students complete the activity
        </p>
      </div>
    );
  }

  // Sort submissions by timestamp (newest first)
  const sortedSubmissions = [...results.submissions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold" style={{ color: stMathBlue }}>
          {results.instructions}
        </h2>
        <p className="text-gray-600 mt-2">
          {results.totalSubmissions} {results.totalSubmissions === 1 ? 'submission' : 'submissions'} received
        </p>
      </div>

      {/* Thumbnail Grid */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: stMathBlue }}>
          Student Submissions
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {sortedSubmissions.map((submission, index) => (
            <div
              key={`${submission.participantId}-${submission.timestamp}`}
              className="group relative cursor-pointer"
              onClick={() => setExpandedImage(submission.imageUrl)}
            >
              {/* Thumbnail Card */}
              <div
                className="aspect-square rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow border-2"
                style={{ borderColor: stMathBlue }}
              >
                <img
                  src={submission.imageUrl}
                  alt={`Submission from ${submission.participantName || 'Student'}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              {/* Info Overlay */}
              <div className="mt-2 text-center">
                <p className="text-sm font-semibold text-gray-800">
                  {submission.participantName || `Student ${index + 1}`}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(submission.timestamp).toLocaleTimeString()}
                </p>
                {submission.version > 1 && (
                  <span
                    className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: stMathOrange }}
                  >
                    v{submission.version}
                  </span>
                )}
              </div>

              {/* Hover Badge */}
              <div className="absolute top-2 right-2 bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <svg
                  className="w-5 h-5"
                  style={{ color: stMathBlue }}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded View Modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-6xl max-h-screen">
            {/* Close Button */}
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg
                className="w-10 h-10"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Expanded Image */}
            <img
              src={expandedImage}
              alt="Expanded submission"
              className="max-w-full max-h-screen object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Navigation Hint */}
            <p className="text-center text-white mt-4 text-sm">
              Click anywhere outside the image to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
