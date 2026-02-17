import React, { useState, useEffect } from 'react';
import { QuizActivity } from '@interactive-presentations/shared';
import { useSocket } from '../../contexts/SocketContext';

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
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
        <div className="mb-6 flex items-center justify-between">
          <span className="inline-block bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
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
                    : isSelected
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        showCorrect
                          ? 'border-green-500 bg-green-500'
                          : showIncorrect
                          ? 'border-red-500 bg-red-500'
                          : isSelected
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-gray-300 bg-white'
                      }`}
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

        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selectedOption === null}
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Submit Answer
          </button>
        ) : (
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
