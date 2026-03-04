import React, { useState } from 'react';
import { PollActivity, PollResults } from '@interactive-presentations/shared';
import { useSocket } from '../../contexts/FirebaseContext';

// ST Math brand colors
const stMathBlue = '#0077c8';
const stMathBlueDark = '#005a9e';
const stMathOrange = '#f7941d';

// Neural network SVG pattern - seamlessly tiling with organic interior
const neuralPatternSvg = `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='rgba(255,255,255,0.15)' stroke-width='0.75'%3E%3Ccircle cx='0' cy='0' r='2.5'/%3E%3Ccircle cx='0' cy='100' r='2'/%3E%3Ccircle cx='0' cy='200' r='2.5'/%3E%3Ccircle cx='100' cy='0' r='2'/%3E%3Ccircle cx='100' cy='200' r='2'/%3E%3Ccircle cx='200' cy='0' r='2.5'/%3E%3Ccircle cx='200' cy='100' r='2'/%3E%3Ccircle cx='200' cy='200' r='2.5'/%3E%3Ccircle cx='35' cy='28' r='2'/%3E%3Ccircle cx='78' cy='52' r='3'/%3E%3Ccircle cx='142' cy='35' r='2'/%3E%3Ccircle cx='168' cy='72' r='2.5'/%3E%3Ccircle cx='55' cy='95' r='2'/%3E%3Ccircle cx='118' cy='88' r='2.5'/%3E%3Ccircle cx='28' cy='145' r='2.5'/%3E%3Ccircle cx='85' cy='138' r='2'/%3E%3Ccircle cx='155' cy='125' r='3'/%3E%3Ccircle cx='62' cy='172' r='2'/%3E%3Ccircle cx='130' cy='165' r='2.5'/%3E%3Ccircle cx='175' cy='158' r='2'/%3E%3Cline x1='0' y1='0' x2='35' y2='28'/%3E%3Cline x1='0' y1='0' x2='100' y2='0'/%3E%3Cline x1='100' y1='0' x2='35' y2='28'/%3E%3Cline x1='100' y1='0' x2='142' y2='35'/%3E%3Cline x1='100' y1='0' x2='200' y2='0'/%3E%3Cline x1='200' y1='0' x2='142' y2='35'/%3E%3Cline x1='35' y1='28' x2='78' y2='52'/%3E%3Cline x1='78' y1='52' x2='142' y2='35'/%3E%3Cline x1='142' y1='35' x2='168' y2='72'/%3E%3Cline x1='78' y1='52' x2='55' y2='95'/%3E%3Cline x1='78' y1='52' x2='118' y2='88'/%3E%3Cline x1='168' y1='72' x2='118' y2='88'/%3E%3Cline x1='168' y1='72' x2='200' y2='100'/%3E%3Cline x1='0' y1='100' x2='35' y2='28'/%3E%3Cline x1='0' y1='100' x2='55' y2='95'/%3E%3Cline x1='55' y1='95' x2='118' y2='88'/%3E%3Cline x1='118' y1='88' x2='200' y2='100'/%3E%3Cline x1='0' y1='100' x2='28' y2='145'/%3E%3Cline x1='55' y1='95' x2='28' y2='145'/%3E%3Cline x1='55' y1='95' x2='85' y2='138'/%3E%3Cline x1='118' y1='88' x2='155' y2='125'/%3E%3Cline x1='200' y1='100' x2='155' y2='125'/%3E%3Cline x1='28' y1='145' x2='85' y2='138'/%3E%3Cline x1='85' y1='138' x2='155' y2='125'/%3E%3Cline x1='155' y1='125' x2='175' y2='158'/%3E%3Cline x1='28' y1='145' x2='0' y2='200'/%3E%3Cline x1='28' y1='145' x2='62' y2='172'/%3E%3Cline x1='85' y1='138' x2='62' y2='172'/%3E%3Cline x1='85' y1='138' x2='130' y2='165'/%3E%3Cline x1='155' y1='125' x2='130' y2='165'/%3E%3Cline x1='175' y1='158' x2='200' y2='200'/%3E%3Cline x1='0' y1='200' x2='62' y2='172'/%3E%3Cline x1='62' y1='172' x2='100' y2='200'/%3E%3Cline x1='100' y1='200' x2='130' y2='165'/%3E%3Cline x1='130' y1='165' x2='175' y2='158'/%3E%3Cline x1='175' y1='158' x2='130' y2='165'/%3E%3Cline x1='200' y1='200' x2='130' y2='165'/%3E%3C/g%3E%3C/svg%3E")`;

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
              ? Math.round(((results.responses[index] || 0) / Math.max(results.totalResponses, 1)) * 100)
              : 0;

            return (
              <button
                key={index}
                onClick={() => handleOptionClick(index)}
                disabled={submitted}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all relative overflow-hidden ${
                  submitted ? 'cursor-default' : 'cursor-pointer'
                }`}
                style={{
                  borderColor: isSelected ? stMathBlue : '#e5e7eb',
                  backgroundColor: isSelected ? '#e0f2fe' : 'white',
                }}
              >
                {showResults && (
                  <div
                    className="absolute inset-0 transition-all duration-500"
                    style={{ width: `${percentage}%`, backgroundColor: '#e0f2fe' }}
                  />
                )}

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: isSelected ? stMathBlue : '#d1d5db',
                        backgroundColor: isSelected ? stMathBlue : 'white',
                      }}
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
                    <span className="font-bold" style={{ color: stMathBlue }}>{percentage}%</span>
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
            className="w-full text-white py-3 px-6 rounded-lg font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            style={{
              backgroundColor: selectedOptions.length === 0 ? undefined : stMathOrange,
              boxShadow: selectedOptions.length === 0 ? undefined : '0 4px 14px rgba(247, 148, 29, 0.4)',
            }}
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
