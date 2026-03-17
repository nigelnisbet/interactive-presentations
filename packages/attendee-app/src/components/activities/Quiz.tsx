import React, { useState, useEffect, useRef } from 'react';
import { QuizActivity } from '@interactive-presentations/shared';
import { useSocket } from '../../contexts/FirebaseContext';

// ST Math brand colors
const stMathBlue = '#0077c8';
const stMathBlueDark = '#005a9e';
const stMathOrange = '#f7941d';

// Neural network SVG pattern - seamlessly tiling with organic interior
const neuralPatternSvg = `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='rgba(255,255,255,0.15)' stroke-width='0.75'%3E%3Ccircle cx='0' cy='0' r='2.5'/%3E%3Ccircle cx='0' cy='100' r='2'/%3E%3Ccircle cx='0' cy='200' r='2.5'/%3E%3Ccircle cx='100' cy='0' r='2'/%3E%3Ccircle cx='100' cy='200' r='2'/%3E%3Ccircle cx='200' cy='0' r='2.5'/%3E%3Ccircle cx='200' cy='100' r='2'/%3E%3Ccircle cx='200' cy='200' r='2.5'/%3E%3Ccircle cx='35' cy='28' r='2'/%3E%3Ccircle cx='78' cy='52' r='3'/%3E%3Ccircle cx='142' cy='35' r='2'/%3E%3Ccircle cx='168' cy='72' r='2.5'/%3E%3Ccircle cx='55' cy='95' r='2'/%3E%3Ccircle cx='118' cy='88' r='2.5'/%3E%3Ccircle cx='28' cy='145' r='2.5'/%3E%3Ccircle cx='85' cy='138' r='2'/%3E%3Ccircle cx='155' cy='125' r='3'/%3E%3Ccircle cx='62' cy='172' r='2'/%3E%3Ccircle cx='130' cy='165' r='2.5'/%3E%3Ccircle cx='175' cy='158' r='2'/%3E%3Cline x1='0' y1='0' x2='35' y2='28'/%3E%3Cline x1='0' y1='0' x2='100' y2='0'/%3E%3Cline x1='100' y1='0' x2='35' y2='28'/%3E%3Cline x1='100' y1='0' x2='142' y2='35'/%3E%3Cline x1='100' y1='0' x2='200' y2='0'/%3E%3Cline x1='200' y1='0' x2='142' y2='35'/%3E%3Cline x1='35' y1='28' x2='78' y2='52'/%3E%3Cline x1='78' y1='52' x2='142' y2='35'/%3E%3Cline x1='142' y1='35' x2='168' y2='72'/%3E%3Cline x1='78' y1='52' x2='55' y2='95'/%3E%3Cline x1='78' y1='52' x2='118' y2='88'/%3E%3Cline x1='168' y1='72' x2='118' y2='88'/%3E%3Cline x1='168' y1='72' x2='200' y2='100'/%3E%3Cline x1='0' y1='100' x2='35' y2='28'/%3E%3Cline x1='0' y1='100' x2='55' y2='95'/%3E%3Cline x1='55' y1='95' x2='118' y2='88'/%3E%3Cline x1='118' y1='88' x2='200' y2='100'/%3E%3Cline x1='0' y1='100' x2='28' y2='145'/%3E%3Cline x1='55' y1='95' x2='28' y2='145'/%3E%3Cline x1='55' y1='95' x2='85' y2='138'/%3E%3Cline x1='118' y1='88' x2='155' y2='125'/%3E%3Cline x1='200' y1='100' x2='155' y2='125'/%3E%3Cline x1='28' y1='145' x2='85' y2='138'/%3E%3Cline x1='85' y1='138' x2='155' y2='125'/%3E%3Cline x1='155' y1='125' x2='175' y2='158'/%3E%3Cline x1='28' y1='145' x2='0' y2='200'/%3E%3Cline x1='28' y1='145' x2='62' y2='172'/%3E%3Cline x1='85' y1='138' x2='62' y2='172'/%3E%3Cline x1='85' y1='138' x2='130' y2='165'/%3E%3Cline x1='155' y1='125' x2='130' y2='165'/%3E%3Cline x1='175' y1='158' x2='200' y2='200'/%3E%3Cline x1='0' y1='200' x2='62' y2='172'/%3E%3Cline x1='62' y1='172' x2='100' y2='200'/%3E%3Cline x1='100' y1='200' x2='130' y2='165'/%3E%3Cline x1='130' y1='165' x2='175' y2='158'/%3E%3Cline x1='175' y1='158' x2='130' y2='165'/%3E%3Cline x1='200' y1='200' x2='130' y2='165'/%3E%3C/g%3E%3C/svg%3E")`;

interface QuizProps {
  activity: QuizActivity;
}

export const Quiz: React.FC<QuizProps> = ({ activity }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ isCorrect?: boolean; points?: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    activity.timeLimit ? activity.timeLimit : null
  );
  const { submitResponse } = useSocket();
  const lastActivityIdRef = useRef<string | undefined>(activity.activityId);

  // Check if this is display-only mode (visual prompt, no interaction)
  const isDisplayOnly = (activity as any).displayMode === 'display-only';

  // Reset state ONLY when activityId actually changes (new question)
  useEffect(() => {
    if (lastActivityIdRef.current !== activity.activityId) {
      console.log('New quiz question detected, resetting state');
      lastActivityIdRef.current = activity.activityId;
      setSelectedOption(null);
      setSubmitted(false);
      setResult(null);
      setTimeLeft(activity.timeLimit ? activity.timeLimit : null);
    }
  }, [activity.activityId, activity.timeLimit]);

  useEffect(() => {
    if (!activity.timeLimit || submitted) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          // Auto-submit if time runs out
          if (!submitted && selectedOption !== null) {
            handleSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activity.timeLimit, submitted, selectedOption]);

  const handleSubmit = async () => {
    if (selectedOption === null) return;

    try {
      setSubmitted(true);
      await submitResponse(activity.activityId || '', selectedOption);

      // The server will send back isCorrect and points
      // For now, we'll show a confirmation
      const isCorrect = selectedOption === activity.correctAnswer;
      setResult({ isCorrect });
    } catch (error) {
      console.error('Error submitting quiz answer:', error);
      setSubmitted(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        <div className="mb-6 flex items-center justify-between">
          <span
            className="inline-block text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide"
            style={{ backgroundColor: '#e0f2fe', color: stMathBlue }}
          >
            Quiz
          </span>
          {timeLeft !== null && !submitted && (
            <div
              className={`text-2xl font-bold ${
                timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-gray-700'
              }`}
            >
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        <h2 className="text-3xl font-bold text-gray-800 mb-6">{activity.question}</h2>

        {!submitted && (
          <p className="text-gray-600 mb-6">
            Select the correct answer {timeLeft !== null && `(${formatTime(timeLeft)} remaining)`}
          </p>
        )}

        <div className="space-y-3 mb-8">
          {activity.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const showCorrect = submitted && index === activity.correctAnswer;
            const showIncorrect = submitted && isSelected && index !== activity.correctAnswer;

            return (
              <button
                key={index}
                onClick={() => !submitted && setSelectedOption(index)}
                disabled={submitted}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  showCorrect
                    ? 'border-green-500 bg-green-50'
                    : showIncorrect
                    ? 'border-red-500 bg-red-50'
                    : ''
                } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                style={
                  !showCorrect && !showIncorrect
                    ? {
                        borderColor: isSelected ? stMathBlue : '#e5e7eb',
                        backgroundColor: isSelected ? '#e0f2fe' : 'white',
                      }
                    : undefined
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        showCorrect
                          ? 'border-green-500 bg-green-500'
                          : showIncorrect
                          ? 'border-red-500 bg-red-500'
                          : ''
                      }`}
                      style={
                        !showCorrect && !showIncorrect
                          ? {
                              borderColor: isSelected ? stMathBlue : '#d1d5db',
                              backgroundColor: isSelected ? stMathBlue : 'white',
                            }
                          : undefined
                      }
                    >
                      {(showCorrect || (isSelected && !showIncorrect)) && (
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
                      {showIncorrect && (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium text-gray-800">{option}</span>
                  </div>

                  {showCorrect && (
                    <span className="text-green-600 font-semibold">Correct!</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {isDisplayOnly && (
          <p className="text-center text-gray-600 italic">
            Discussion prompt - share your thoughts verbally
          </p>
        )}

        {!isDisplayOnly && !submitted && (
          <button
            onClick={handleSubmit}
            disabled={selectedOption === null}
            className="w-full text-white py-3 px-6 rounded-lg font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            style={{
              backgroundColor: selectedOption === null ? undefined : stMathOrange,
              boxShadow: selectedOption === null ? undefined : '0 4px 14px rgba(247, 148, 29, 0.4)',
            }}
          >
            Lock In Answer
          </button>
        )}

        {!isDisplayOnly && submitted && (
          <div className="text-center">
            {result?.isCorrect ? (
              <div className="inline-flex items-center space-x-2 bg-green-50 text-green-700 px-6 py-3 rounded-lg">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-xl">Correct!</span>
              </div>
            ) : (
              <div className="inline-flex items-center space-x-2 bg-red-50 text-red-700 px-6 py-3 rounded-lg">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-xl">Not quite</span>
              </div>
            )}
            {result?.points !== undefined && (
              <p className="mt-4 text-2xl font-bold text-purple-600">
                +{result.points} points
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
