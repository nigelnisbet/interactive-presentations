import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReviewGameActivity,
  ReviewGamePhase,
  ReviewGameLeaderboardEntry,
  ReviewGameQuestion,
} from '@interactive-presentations/shared';
import { useSocket } from '../../contexts/FirebaseContext';
import { ReviewGamePodium } from './ReviewGamePodium';

// ST Math brand colors
const stMathBlue = '#0077c8';
const stMathBlueDark = '#005a9e';
const stMathOrange = '#f7941d';
const stMathGold = '#eab308';

interface ReviewGameProps {
  activity: ReviewGameActivity;
}

interface GameState {
  gamePhase: ReviewGamePhase;
  currentQuestionIndex: number;
  questionStartTime: number;
}

interface MyResponse {
  questionId: string;
  answer: number;
  isCorrect: boolean;
  pointsEarned: number;
}

export const ReviewGame: React.FC<ReviewGameProps> = ({ activity }) => {
  const { participantId, participantName, submitReviewGameAnswer, joinReviewGame, getReviewGameState } = useSocket();

  // Local state
  const [playerName, setPlayerName] = useState<string>(participantName || '');
  const [hasJoined, setHasJoined] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [leaderboard, setLeaderboard] = useState<ReviewGameLeaderboardEntry[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [myResponses, setMyResponses] = useState<Map<string, MyResponse>>(new Map());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showNameModal, setShowNameModal] = useState(!participantName);
  const lastQuestionIdRef = useRef<string | null>(null);

  // Auto-join if participant already has a name
  useEffect(() => {
    if (participantName && !hasJoined && activity.activityId && joinReviewGame) {
      console.log('Auto-join triggered for:', participantName);
      joinReviewGame(activity.activityId, participantName)
        .then(() => {
          console.log('Auto-join successful');
          setHasJoined(true);
          setPlayerName(participantName);
          setShowNameModal(false);  // Close modal if it was shown
        })
        .catch(err => console.error('Auto-join failed:', err));
    }
  }, [participantName, hasJoined, activity.activityId, joinReviewGame]);

  // Also update showNameModal when participantName changes (handles late-loading state)
  useEffect(() => {
    if (participantName && showNameModal) {
      setShowNameModal(false);
      setPlayerName(participantName);
    }
  }, [participantName]);

  // Get current question
  const currentQuestion: ReviewGameQuestion | null =
    gameState && activity.questions[gameState.currentQuestionIndex]
      ? activity.questions[gameState.currentQuestionIndex]
      : null;

  // Time limit for current question
  const questionTimeLimit = currentQuestion?.timeLimit || activity.defaultTimeLimit;

  // Subscribe to game state updates (always subscribe so we can show waiting screen)
  useEffect(() => {
    if (!activity.activityId) return;

    const unsubscribe = getReviewGameState?.(activity.activityId, (state, lb, _participantCount) => {
      setGameState(state);
      setLeaderboard(lb || []);

      // Reset answer state ONLY when moving to a NEW question
      if (state?.gamePhase === 'question') {
        const qId = activity.questions[state.currentQuestionIndex]?.id;
        if (qId && qId !== lastQuestionIdRef.current) {
          console.log('New review game question detected, resetting state');
          lastQuestionIdRef.current = qId;
          setSelectedAnswer(null);
          setHasSubmitted(false);
        }
      }
    });

    return () => unsubscribe?.();
  }, [activity.activityId, getReviewGameState]);

  // Countdown timer
  useEffect(() => {
    if (gameState?.gamePhase !== 'question' || hasSubmitted) {
      setTimeLeft(null);
      return;
    }

    const startTime = gameState.questionStartTime;
    const updateTimer = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, questionTimeLimit - elapsed);
      setTimeLeft(Math.ceil(remaining));

      if (remaining <= 0 && selectedAnswer !== null && !hasSubmitted) {
        handleSubmitAnswer();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [gameState?.gamePhase, gameState?.questionStartTime, hasSubmitted, questionTimeLimit]);

  // Handle joining the game
  const handleJoinGame = async () => {
    if (!playerName.trim()) return;

    try {
      await joinReviewGame?.(activity.activityId || '', playerName.trim());
      setHasJoined(true);
      setShowNameModal(false);
    } catch (error) {
      console.error('Error joining game:', error);
    }
  };

  // Handle submitting an answer
  const handleSubmitAnswer = useCallback(async () => {
    if (selectedAnswer === null || !currentQuestion || hasSubmitted) return;

    const answerTime = Date.now() - (gameState?.questionStartTime || Date.now());

    try {
      setHasSubmitted(true);
      const result = await submitReviewGameAnswer?.(
        activity.activityId || '',
        currentQuestion.id,
        selectedAnswer,
        answerTime
      );

      if (result) {
        setMyResponses(prev => new Map(prev).set(currentQuestion.id, {
          questionId: currentQuestion.id,
          answer: selectedAnswer,
          isCorrect: result.isCorrect,
          pointsEarned: result.points,
        }));
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setHasSubmitted(false);
    }
  }, [selectedAnswer, currentQuestion, hasSubmitted, gameState?.questionStartTime, activity.activityId, submitReviewGameAnswer]);

  // Get my current response for the current question
  const myCurrentResponse = currentQuestion ? myResponses.get(currentQuestion.id) : null;

  // Format time
  const formatTime = (seconds: number) => {
    return seconds.toString();
  };

  // Find my rank
  const myRank = leaderboard.find(e => e.participantId === participantId);

  // Name prompt modal
  if (showNameModal) {
    return (
      <div style={styles.container}>
        <div style={styles.modal}>
          <div style={styles.modalIcon}>🎮</div>
          <h2 style={styles.modalTitle}>Join the Game!</h2>
          <p style={styles.modalSubtitle}>{activity.title}</p>
          <p style={styles.modalDescription}>
            Enter your name to compete on the leaderboard
          </p>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
            placeholder="Your name"
            style={styles.nameInput}
            autoFocus
            maxLength={20}
          />
          <button
            onClick={handleJoinGame}
            disabled={!playerName.trim()}
            style={{
              ...styles.joinButton,
              opacity: playerName.trim() ? 1 : 0.5,
            }}
          >
            Join Game
          </button>
        </div>
      </div>
    );
  }

  // Waiting phase
  if (!gameState || gameState.gamePhase === 'waiting') {
    return (
      <div style={styles.container}>
        <div style={styles.waitingCard}>
          <div style={styles.waitingIcon}>⏳</div>
          <h2 style={styles.waitingTitle}>{activity.title}</h2>
          <p style={styles.waitingSubtitle}>
            Waiting for the host to start...
          </p>
          <div style={styles.waitingInfo}>
            <span>{activity.questions.length} questions</span>
            <span>•</span>
            <span>{activity.maxPoints} max points each</span>
          </div>
          {playerName && (
            <div style={styles.playerBadge}>
              Playing as: <strong>{playerName}</strong>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Question phase
  if (gameState.gamePhase === 'question' && currentQuestion) {
    return (
      <div style={styles.container}>
        <div style={styles.questionCard}>
          {/* Header */}
          <div style={styles.questionHeader}>
            <span style={styles.questionNumber}>
              Question {gameState.currentQuestionIndex + 1} of {activity.questions.length}
            </span>
            {timeLeft !== null && !hasSubmitted && (
              <div
                style={{
                  ...styles.timer,
                  backgroundColor: timeLeft <= 5 ? '#ef4444' : stMathOrange,
                  animation: timeLeft <= 5 ? 'pulse 0.5s ease-in-out infinite' : 'none',
                }}
              >
                {formatTime(timeLeft)}
              </div>
            )}
          </div>

          {/* Question */}
          <h2 style={styles.questionText}>{currentQuestion.question}</h2>

          {/* Options */}
          {!hasSubmitted ? (
            <>
              <div style={styles.optionsGrid}>
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAnswer(index)}
                    style={{
                      ...styles.optionButton,
                      ...(selectedAnswer === index ? styles.optionSelected : {}),
                    }}
                  >
                    <span style={styles.optionLetter}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span style={styles.optionText}>{option}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                style={{
                  ...styles.submitButton,
                  opacity: selectedAnswer === null ? 0.5 : 1,
                }}
              >
                Lock In Answer
              </button>
            </>
          ) : (
            <div style={styles.submittedState}>
              <div style={styles.submittedBanner}>
                <div style={styles.checkmarkLarge}>✓</div>
                <h2 style={styles.submittedTitle}>Locked In!</h2>
              </div>
              <div style={styles.selectedAnswerDisplay}>
                <p style={styles.yourAnswerLabel}>Your answer:</p>
                <div style={styles.selectedAnswerBox}>
                  <span style={styles.selectedAnswerLetter}>
                    {String.fromCharCode(65 + (selectedAnswer || 0))}
                  </span>
                  <span style={styles.selectedAnswerText}>
                    {currentQuestion.options[selectedAnswer || 0]}
                  </span>
                </div>
              </div>
              <p style={styles.waitingText}>Waiting for other players...</p>
              <div style={styles.waitingDots}>
                <span style={styles.dot}>●</span>
                <span style={{...styles.dot, animationDelay: '0.2s'}}>●</span>
                <span style={{...styles.dot, animationDelay: '0.4s'}}>●</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Reveal phase
  if (gameState.gamePhase === 'reveal' && currentQuestion) {
    const isCorrect = myCurrentResponse?.isCorrect;
    const pointsEarned = myCurrentResponse?.pointsEarned || 0;
    const myAnswer = myCurrentResponse?.answer;

    return (
      <div style={styles.container}>
        <div style={styles.revealCard}>
          {/* Result banner */}
          <div
            style={{
              ...styles.resultBanner,
              backgroundColor: isCorrect ? '#10b981' : '#ef4444',
            }}
          >
            {isCorrect ? (
              <>
                <span style={styles.resultIcon}>🎉</span>
                <span style={styles.resultText}>Correct! +{pointsEarned} points</span>
              </>
            ) : (
              <>
                <span style={styles.resultIcon}>😔</span>
                <span style={styles.resultText}>Not quite...</span>
              </>
            )}
          </div>

          {/* Question & correct answer */}
          <h3 style={styles.revealQuestion}>{currentQuestion.question}</h3>

          <div style={styles.revealOptions}>
            {currentQuestion.options.map((option, index) => {
              const isCorrectAnswer = index === currentQuestion.correctAnswer;
              const wasMyAnswer = index === myAnswer;

              return (
                <div
                  key={index}
                  style={{
                    ...styles.revealOption,
                    ...(isCorrectAnswer ? styles.revealCorrect : {}),
                    ...(wasMyAnswer && !isCorrectAnswer ? styles.revealWrong : {}),
                  }}
                >
                  <span style={styles.optionLetter}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option}</span>
                  {isCorrectAnswer && <span style={styles.correctBadge}>✓ Correct</span>}
                </div>
              );
            })}
          </div>

          {/* Mini leaderboard */}
          <div style={styles.miniLeaderboard}>
            <h4 style={styles.miniLeaderboardTitle}>Current Standings</h4>
            <ReviewGamePodium leaderboard={leaderboard} />
            {myRank && myRank.rank > 3 && (
              <div style={styles.myRankBadge}>
                You are #{myRank.rank} with {myRank.totalPoints.toLocaleString()} points
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Finished phase
  if (gameState.gamePhase === 'finished') {
    const isWinner = myRank?.rank === 1;

    return (
      <div style={styles.container}>
        <div style={styles.finishedCard}>
          <h2 style={styles.finishedTitle}>
            {isWinner ? '🏆 You Won! 🏆' : 'Game Over!'}
          </h2>

          <ReviewGamePodium
            leaderboard={leaderboard}
            showConfetti={isWinner}
            isFinal
          />

          {myRank && (
            <div style={styles.finalStats}>
              <div style={styles.statBox}>
                <span style={styles.statValue}>#{myRank.rank}</span>
                <span style={styles.statLabel}>Final Rank</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statValue}>{myRank.totalPoints.toLocaleString()}</span>
                <span style={styles.statLabel}>Total Points</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statValue}>{myRank.correctCount}/{activity.questions.length}</span>
                <span style={styles.statLabel}>Correct</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div style={styles.container}>
      <div style={styles.waitingCard}>
        <p>Loading game...</p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    background: `linear-gradient(135deg, ${stMathBlue} 0%, ${stMathBlueDark} 100%)`,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '32px',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  modalSubtitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: stMathGold,
    margin: '0 0 16px 0',
  },
  modalDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 24px 0',
  },
  nameInput: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '18px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '16px',
    textAlign: 'center',
    outline: 'none',
  },
  joinButton: {
    width: '100%',
    padding: '14px',
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: stMathOrange,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  waitingCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '48px 32px',
    textAlign: 'center',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  waitingIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  waitingTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  waitingSubtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: '0 0 24px 0',
  },
  waitingInfo: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    fontSize: '14px',
    color: '#9ca3af',
    marginBottom: '24px',
  },
  playerBadge: {
    display: 'inline-block',
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    borderRadius: '20px',
    fontSize: '14px',
    color: '#4b5563',
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  questionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  questionNumber: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '6px 12px',
    borderRadius: '20px',
  },
  timer: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '8px',
    minWidth: '50px',
    textAlign: 'center',
  },
  questionText: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 24px 0',
    lineHeight: 1.4,
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '24px',
  },
  optionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'left',
  },
  optionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: stMathBlue,
  },
  optionLetter: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#4b5563',
    flexShrink: 0,
  },
  optionText: {
    fontSize: '16px',
    color: '#1f2937',
    flex: 1,
  },
  submitButton: {
    width: '100%',
    padding: '16px',
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: stMathOrange,
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  submittedState: {
    textAlign: 'center',
    padding: '24px',
    backgroundColor: '#ecfdf5',
    borderRadius: '12px',
    border: '3px solid #10b981',
  },
  submittedBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  checkmarkLarge: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    color: 'white',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  submittedTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#166534',
    margin: 0,
  },
  selectedAnswerDisplay: {
    marginBottom: '20px',
  },
  yourAnswerLabel: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 8px 0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  selectedAnswerBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '16px 24px',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '2px solid #10b981',
  },
  selectedAnswerLetter: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '700',
    color: 'white',
    flexShrink: 0,
  },
  selectedAnswerText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
  },
  waitingText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 8px 0',
  },
  waitingDots: {
    display: 'flex',
    justifyContent: 'center',
    gap: '6px',
  },
  dot: {
    color: '#10b981',
    fontSize: '12px',
    animation: 'pulse 1s ease-in-out infinite',
  },
  checkmark: {
    width: '64px',
    height: '64px',
    margin: '0 auto 16px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    color: 'white',
    fontSize: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submittedText: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  submittedSubtext: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  revealCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    overflow: 'hidden',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  resultBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '20px',
    color: 'white',
  },
  resultIcon: {
    fontSize: '28px',
  },
  resultText: {
    fontSize: '20px',
    fontWeight: '700',
  },
  revealQuestion: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '20px',
    lineHeight: 1.4,
  },
  revealOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '0 20px 20px',
  },
  revealOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#4b5563',
  },
  revealCorrect: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  revealWrong: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  correctBadge: {
    marginLeft: 'auto',
    fontSize: '12px',
    fontWeight: '600',
    color: '#166534',
  },
  miniLeaderboard: {
    padding: '20px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  },
  miniLeaderboardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 16px 0',
    textAlign: 'center',
  },
  myRankBadge: {
    textAlign: 'center',
    padding: '12px',
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: stMathBlue,
    marginTop: '16px',
  },
  finishedCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  finishedTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    margin: '0 0 24px 0',
  },
  finalStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb',
  },
  statBox: {
    textAlign: 'center',
  },
  statValue: {
    display: 'block',
    fontSize: '28px',
    fontWeight: '700',
    color: stMathBlue,
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
};

// Add pulse animation
const pulseStyle = document.createElement('style');
pulseStyle.textContent = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
`;
if (!document.head.querySelector('#review-game-pulse-styles')) {
  pulseStyle.id = 'review-game-pulse-styles';
  document.head.appendChild(pulseStyle);
}

export default ReviewGame;
