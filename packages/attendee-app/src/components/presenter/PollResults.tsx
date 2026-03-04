import React from 'react';
import { PollActivity, PollResults as PollResultsType } from '@interactive-presentations/shared';

// ST Math brand colors
const stMathBlue = '#0077c8';

interface PollResultsProps {
  activity: PollActivity;
  results: PollResultsType | null;
}

export const PollResults: React.FC<PollResultsProps> = ({ activity, results }) => {
  const totalVotes = results?.totalResponses || 0;
  const responses = results?.responses || [];

  // Calculate percentages
  const optionStats = activity.options.map((option, index) => {
    const count = (responses as number[])[index] || 0;
    const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
    return { option, count, percentage };
  });

  // Find max for highlighting
  const maxCount = Math.max(...optionStats.map(s => s.count), 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">Poll Results</h3>
        <div className="text-right">
          <div className="text-3xl font-bold" style={{ color: stMathBlue }}>{totalVotes}</div>
          <div className="text-sm text-gray-500">Total Votes</div>
        </div>
      </div>

      {totalVotes === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">📊</div>
          <p className="text-gray-600">Waiting for responses...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {optionStats.map((stat, index) => {
            const isLeading = stat.count === maxCount && maxCount > 0;
            return (
              <div key={index} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium" style={{ color: isLeading ? stMathBlue : '#374151' }}>
                    {stat.option}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{stat.count} votes</span>
                    <span className="text-lg font-bold" style={{ color: isLeading ? stMathBlue : '#1f2937' }}>
                      {stat.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${stat.percentage}%`,
                      background: isLeading
                        ? `linear-gradient(to right, ${stMathBlue}, #005a9e)`
                        : 'linear-gradient(to right, #9ca3af, #6b7280)',
                    }}
                  >
                    {stat.count > 0 && (
                      <div className="flex items-center justify-end h-full px-3 text-white font-semibold text-sm">
                        {stat.count}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Real-time indicator */}
      {totalVotes > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live updates enabled</span>
        </div>
      )}
    </div>
  );
};
