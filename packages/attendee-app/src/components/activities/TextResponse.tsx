import React, { useState } from 'react';
import { useSocket } from '../../contexts/FirebaseContext';

// ST Math brand colors
const stMathBlue = '#0077c8';
const stMathBlueDark = '#005a9e';
const stMathOrange = '#f7941d';

// Neural network SVG pattern - seamlessly tiling with organic interior
const neuralPatternSvg = `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='rgba(255,255,255,0.15)' stroke-width='0.75'%3E%3Ccircle cx='0' cy='0' r='2.5'/%3E%3Ccircle cx='0' cy='100' r='2'/%3E%3Ccircle cx='0' cy='200' r='2.5'/%3E%3Ccircle cx='100' cy='0' r='2'/%3E%3Ccircle cx='100' cy='200' r='2'/%3E%3Ccircle cx='200' cy='0' r='2.5'/%3E%3Ccircle cx='200' cy='100' r='2'/%3E%3Ccircle cx='200' cy='200' r='2.5'/%3E%3Ccircle cx='35' cy='28' r='2'/%3E%3Ccircle cx='78' cy='52' r='3'/%3E%3Ccircle cx='142' cy='35' r='2'/%3E%3Ccircle cx='168' cy='72' r='2.5'/%3E%3Ccircle cx='55' cy='95' r='2'/%3E%3Ccircle cx='118' cy='88' r='2.5'/%3E%3Ccircle cx='28' cy='145' r='2.5'/%3E%3Ccircle cx='85' cy='138' r='2'/%3E%3Ccircle cx='155' cy='125' r='3'/%3E%3Ccircle cx='62' cy='172' r='2'/%3E%3Ccircle cx='130' cy='165' r='2.5'/%3E%3Ccircle cx='175' cy='158' r='2'/%3E%3Cline x1='0' y1='0' x2='35' y2='28'/%3E%3Cline x1='0' y1='0' x2='100' y2='0'/%3E%3Cline x1='100' y1='0' x2='35' y2='28'/%3E%3Cline x1='100' y1='0' x2='142' y2='35'/%3E%3Cline x1='100' y1='0' x2='200' y2='0'/%3E%3Cline x1='200' y1='0' x2='142' y2='35'/%3E%3Cline x1='35' y1='28' x2='78' y2='52'/%3E%3Cline x1='78' y1='52' x2='142' y2='35'/%3E%3Cline x1='142' y1='35' x2='168' y2='72'/%3E%3Cline x1='78' y1='52' x2='55' y2='95'/%3E%3Cline x1='78' y1='52' x2='118' y2='88'/%3E%3Cline x1='168' y1='72' x2='118' y2='88'/%3E%3Cline x1='168' y1='72' x2='200' y2='100'/%3E%3Cline x1='0' y1='100' x2='35' y2='28'/%3E%3Cline x1='0' y1='100' x2='55' y2='95'/%3E%3Cline x1='55' y1='95' x2='118' y2='88'/%3E%3Cline x1='118' y1='88' x2='200' y2='100'/%3E%3Cline x1='0' y1='100' x2='28' y2='145'/%3E%3Cline x1='55' y1='95' x2='28' y2='145'/%3E%3Cline x1='55' y1='95' x2='85' y2='138'/%3E%3Cline x1='118' y1='88' x2='155' y2='125'/%3E%3Cline x1='200' y1='100' x2='155' y2='125'/%3E%3Cline x1='28' y1='145' x2='85' y2='138'/%3E%3Cline x1='85' y1='138' x2='155' y2='125'/%3E%3Cline x1='155' y1='125' x2='175' y2='158'/%3E%3Cline x1='28' y1='145' x2='0' y2='200'/%3E%3Cline x1='28' y1='145' x2='62' y2='172'/%3E%3Cline x1='85' y1='138' x2='62' y2='172'/%3E%3Cline x1='85' y1='138' x2='130' y2='165'/%3E%3Cline x1='155' y1='125' x2='130' y2='165'/%3E%3Cline x1='175' y1='158' x2='200' y2='200'/%3E%3Cline x1='0' y1='200' x2='62' y2='172'/%3E%3Cline x1='62' y1='172' x2='100' y2='200'/%3E%3Cline x1='100' y1='200' x2='130' y2='165'/%3E%3Cline x1='130' y1='165' x2='175' y2='158'/%3E%3Cline x1='175' y1='158' x2='130' y2='165'/%3E%3Cline x1='200' y1='200' x2='130' y2='165'/%3E%3C/g%3E%3C/svg%3E")`;

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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: stMathBlue,
        backgroundImage: `${neuralPatternSvg}, linear-gradient(135deg, ${stMathBlue} 0%, ${stMathBlueDark} 100%)`,
        backgroundSize: '200px 200px, 100% 100%',
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
        <div className="mb-6">
          <span
            className="inline-block text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide"
            style={{ backgroundColor: '#e0f2fe', color: stMathBlue }}
          >
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
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:outline-none resize-none text-lg"
                rows={5}
                maxLength={maxLength}
                style={{ outline: 'none' }}
                onFocus={(e) => e.target.style.borderColor = stMathBlue}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {response.length} / {maxLength}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!response.trim()}
              className="w-full text-white py-3 px-6 rounded-lg font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              style={{
                backgroundColor: !response.trim() ? undefined : stMathOrange,
                boxShadow: !response.trim() ? undefined : '0 4px 14px rgba(247, 148, 29, 0.4)',
              }}
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
