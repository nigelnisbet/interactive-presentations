import React, { useState } from 'react';
import { PollActivity, PollResults } from '@interactive-presentations/shared';
import { useSocket } from '../../contexts/SocketContext';

interface PollProps {
  activity: PollActivity;
  results: PollResults | null;
}

export const Poll: React.FC<PollProps> = ({ activity, results }) => {
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const { submitResponse } = useSocket();

  const handleOptionClick = (index: number) => {
    if (submitted) return;

    if (activity.allowMultiple) {
      setSelectedOptions((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setSelectedOptions([index]);
    }
  };

  const handleSubmit = async () => {
    if (selectedOptions.length === 0) return;

    try {
      const answer = activity.allowMultiple ? selectedOptions : selectedOptions[0];
      await submitResponse(activity.activityId || '', answer);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting poll response:', error);
    }
  };

  const showResults = results && (activity.showResults === 'live' || submitted);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
        <div className="mb-6">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
            Poll
          </span>
        </div>

        <h2 className="text-3xl font-bold text-gray-800 mb-6">{activity.question}</h2>

        {!submitted && (
          <p className="text-gray-600 mb-6">
            {activity.allowMultiple
              ? 'Select all that apply'
              : 'Select one option'}
          </p>
        )}

        <div className="space-y-3 mb-8">
          {activity.options.map((option, index) => {
            const isSelected = selectedOptions.includes(index);
            const percentage = results
              ? Math.round((results.responses[index] / Math.max(results.totalResponses, 1)) * 100)
              : 0;

            return (
              <button
                key={index}
                onClick={() => handleOptionClick(index)}
                disabled={submitted}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all relative overflow-hidden ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {showResults && (
                  <div
                    className="absolute inset-0 bg-blue-100 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                )}

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium text-gray-800">{option}</span>
                  </div>

                  {showResults && (
                    <span className="font-bold text-blue-600">{percentage}%</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selectedOptions.length === 0}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Submit Answer
          </button>
        ) : (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-green-50 text-green-700 px-6 py-3 rounded-lg">
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">Response Submitted!</span>
            </div>
            {results && (
              <p className="mt-4 text-gray-600">
                {results.totalResponses} {results.totalResponses === 1 ? 'response' : 'responses'} received
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
