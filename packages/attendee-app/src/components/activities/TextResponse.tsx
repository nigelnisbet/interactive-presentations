import React, { useState } from 'react';
import { useSocket } from '../../contexts/FirebaseContext';

interface TextResponseActivity {
  activityId?: string;
  type: 'text-response';
  prompt: string;
  placeholder?: string;
  maxLength?: number;
}

interface TextResponseProps {
  activity: TextResponseActivity;
}

export const TextResponse: React.FC<TextResponseProps> = ({ activity }) => {
  const [response, setResponse] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { submitResponse } = useSocket();

  const maxLength = activity.maxLength || 500;
  const placeholder = activity.placeholder || 'Type your response here...';

  const handleSubmit = async () => {
    if (!response.trim()) return;

    try {
      await submitResponse(activity.activityId || '', response.trim());
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting response:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
        <div className="mb-6">
          <span className="inline-block bg-fuchsia-100 text-fuchsia-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
            Open Response
          </span>
        </div>

        <h2 className="text-3xl font-bold text-gray-800 mb-6">{activity.prompt}</h2>

        {!submitted ? (
          <>
            <div className="mb-4">
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value.slice(0, maxLength))}
                placeholder={placeholder}
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-fuchsia-500 focus:outline-none resize-none text-lg"
                rows={5}
                maxLength={maxLength}
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {response.length} / {maxLength}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!response.trim()}
              className="w-full bg-fuchsia-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Submit Response
            </button>
          </>
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
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
              <p className="text-sm text-gray-500 mb-1">Your response:</p>
              <p className="text-gray-700">{response}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
