import React, { useState, useEffect } from 'react';
import {
  ReviewGameActivity,
  ReviewGamePhase,
  ReviewGameLeaderboardEntry,
} from '@interactive-presentations/shared';
import { useSocket } from '../../contexts/FirebaseContext';

interface ReviewGameResultsProps {
  activity: ReviewGameActivity;
}

interface GameState {
  gamePhase: ReviewGamePhase;
  currentQuestionIndex: number;
  questionStartTime: number;
  responseCount?: number;
}

export const ReviewGameResults: React.FC<ReviewGameResultsProps> = ({ activity }) => {
  const {
    startReviewGame,
    revealAnswer,
    nextQuestion,
    endReviewGame,
    getReviewGameState,
  } = useSocket();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [leaderboard, setLeaderboard] = useState<ReviewGameLeaderboardEntry[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [reviewGameParticipantCount, setReviewGameParticipantCount] = useState(0);

  // Subscribe to game state
  useEffect(() => {
    if (!activity.activityId || !getReviewGameState) return;

    const unsubscribe = getReviewGameState(activity.activityId, (state, lb, participantCount) => {
      setGameState(state);
      setLeaderboard(lb || []);
      setReviewGameParticipantCount(participantCount || 0);
    });

    return () => unsubscribe();
  }, [activity.activityId, getReviewGameState]);

  // Countdown timer
  useEffect(() => {
    if (gameState?.gamePhase !== 'question') {
      setTimeLeft(null);
      return;
    }

    const currentQuestion = activity.questions[gameState.currentQuestionIndex];
    const timeLimit = currentQuestion?.timeLimit || activity.defaultTimeLimit;
    const startTime = gameState.questionStartTime;

    const updateTimer = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, timeLimit - elapsed);
      setTimeLeft(Math.ceil(remaining));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [gameState?.gamePhase, gameState?.questionStartTime, gameState?.currentQuestionIndex, activity]);

  const currentQuestion = gameState
    ? activity.questions[gameState.currentQuestionIndex]
    : null;

  const handleStartGame = async () => {
    if (startReviewGame && activity.activityId) {
      await startReviewGame(activity.activityId);
    }
  };

  const handleRevealAnswer = async () => {
    if (revealAnswer && activity.activityId) {
      await revealAnswer(activity.activityId);
    }
  };

  const handleNextQuestion = async () => {
    if (nextQuestion && activity.activityId) {
      await nextQuestion(activity.activityId, activity.questions.length);
    }
  };

  const handleEndGame = async () => {
    if (endReviewGame && activity.activityId) {
      await endReviewGame(activity.activityId);
    }
  };

  // Waiting phase - show start button
  if (!gameState || gameState.gamePhase === 'waiting') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>{activity.title}</h2>
          <div style={styles.stats}>
            <span>{activity.questions.length} questions</span>
            <span>•</span>
            <span>{reviewGameParticipantCount} participants ready</span>
          </div>
        </div>

        <div style={styles.waitingContent}>
          <div style={styles.gameIcon}>🎮</div>
          <h3 style={styles.waitingTitle}>Review Game Ready</h3>
          <p style={styles.waitingSubtitle}>
            Participants are waiting for you to start the game
          </p>

          <div style={styles.questionPreview}>
            <h4 style={styles.previewTitle}>Questions Preview:</h4>
            {activity.questions.slice(0, 3).map((q, i) => (
              <div key={q.id} style={styles.previewQuestion}>
                <span style={styles.previewNumber}>{i + 1}.</span>
                <span>{q.question}</span>
              </div>
            ))}
            {activity.questions.length > 3 && (
              <div style={styles.moreQuestions}>
                +{activity.questions.length - 3} more questions
              </div>
            )}
          </div>

          <button onClick={handleStartGame} style={styles.startButton}>
            Start Game
          </button>
        </div>
      </div>
    );
  }

  // Question phase
  if (gameState.gamePhase === 'question' && currentQuestion) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.questionBadge}>
              Question {gameState.currentQuestionIndex + 1} / {activity.questions.length}
            </span>
            <h2 style={styles.questionTitle}>{currentQuestion.question}</h2>
          </div>
          <div style={styles.headerRight}>
            {timeLeft !== null && (
              <div style={{
                ...styles.timer,
                backgroundColor: timeLeft <= 5 ? '#ef4444' : '#f59e0b',
              }}>
                {timeLeft}s
              </div>
            )}
          </div>
        </div>

        <div style={styles.optionsDisplay}>
          {currentQuestion.options.map((option, index) => (
            <div key={index} style={styles.optionBox}>
              <span style={styles.optionLetter}>
                {String.fromCharCode(65 + index)}
              </span>
              <span style={styles.optionText}>{option}</span>
            </div>
          ))}
        </div>

        <div style={styles.responseTracker}>
          <div style={styles.responseCount}>
            <span style={styles.responseNumber}>{gameState?.responseCount || 0}</span>
            <span style={styles.responseLabel}>/ {reviewGameParticipantCount} answered</span>
          </div>
        </div>

        <div style={styles.controls}>
          <button onClick={handleRevealAnswer} style={styles.revealButton}>
            Reveal Answer
          </button>
          <button onClick={handleEndGame} style={styles.endButton}>
            End Game Early
          </button>
        </div>
      </div>
    );
  }

  // Reveal phase
  if (gameState.gamePhase === 'reveal' && currentQuestion) {
    const isLastQuestion = gameState.currentQuestionIndex === activity.questions.length - 1;

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.questionBadge}>
            Question {gameState.currentQuestionIndex + 1} / {activity.questions.length}
          </span>
          <h2 style={styles.questionTitle}>{currentQuestion.question}</h2>
        </div>

        <div style={styles.revealOptions}>
          {currentQuestion.options.map((option, index) => {
            const isCorrect = index === currentQuestion.correctAnswer;
            return (
              <div
                key={index}
                style={{
                  ...styles.revealOption,
                  ...(isCorrect ? styles.correctOption : {}),
                }}
              >
                <span style={styles.optionLetter}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span style={styles.optionText}>{option}</span>
                {isCorrect && <span style={styles.correctBadge}>✓ Correct</span>}
              </div>
            );
          })}
        </div>

        <div style={styles.leaderboardSection}>
          <h3 style={styles.leaderboardTitle}>Current Standings</h3>
          <div style={styles.leaderboardList}>
            {leaderboard.slice(0, 10).map((entry, index) => (
              <div
                key={entry.participantId}
                style={{
                  ...styles.leaderboardRow,
                  backgroundColor: index < 3 ? getPodiumColor(index) : 'transparent',
                }}
              >
                <span style={styles.rank}>#{entry.rank}</span>
                <span style={styles.playerName}>{entry.name}</span>
                <span style={styles.points}>{entry.totalPoints.toLocaleString()} pts</span>
                <span style={styles.correct}>{entry.correctCount}/{gameState.currentQuestionIndex + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.controls}>
          <button
            onClick={isLastQuestion ? handleEndGame : handleNextQuestion}
            style={styles.nextButton}
          >
            {isLastQuestion ? 'Show Final Results' : 'Next Question'}
          </button>
        </div>
      </div>
    );
  }

  // Finished phase
  if (gameState.gamePhase === 'finished') {
    const winner = leaderboard[0];

    return (
      <div style={styles.container}>
        <div style={styles.finishedHeader}>
          <h2 style={styles.finishedTitle}>Game Over!</h2>
          <p style={styles.finishedSubtitle}>{activity.title}</p>
        </div>

        {winner && (
          <div style={styles.winnerSection}>
            <div style={styles.crown}>👑</div>
            <h3 style={styles.winnerName}>{winner.name}</h3>
            <p style={styles.winnerStats}>
              {winner.totalPoints.toLocaleString()} points • {winner.correctCount}/{activity.questions.length} correct
            </p>
          </div>
        )}

        <div style={styles.finalLeaderboard}>
          <h3 style={styles.leaderboardTitle}>Final Standings</h3>
          <div style={styles.leaderboardList}>
            {leaderboard.map((entry, index) => (
              <div
                key={entry.participantId}
                style={{
                  ...styles.leaderboardRow,
                  backgroundColor: index < 3 ? getPodiumColor(index) : 'transparent',
                }}
              >
                <span style={styles.rank}>#{entry.rank}</span>
                <span style={styles.playerName}>{entry.name}</span>
                <span style={styles.points}>{entry.totalPoints.toLocaleString()} pts</span>
                <span style={styles.correct}>{entry.correctCount}/{activity.questions.length}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.controls}>
          <button onClick={handleStartGame} style={styles.restartButton}>
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <p>Loading game state...</p>
    </div>
  );
};

const getPodiumColor = (index: number): string => {
  switch (index) {
    case 0: return 'rgba(255, 215, 0, 0.2)'; // Gold
    case 1: return 'rgba(192, 192, 192, 0.2)'; // Silver
    case 2: return 'rgba(205, 127, 50, 0.2)'; // Bronze
    default: return 'transparent';
  }
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
  },
  stats: {
    display: 'flex',
    gap: '8px',
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '8px',
  },
  waitingContent: {
    textAlign: 'center',
    padding: '48px 24px',
    backgroundColor: '#f9fafb',
    borderRadius: '16px',
  },
  gameIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  waitingTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  waitingSubtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: '0 0 24px 0',
  },
  questionPreview: {
    textAlign: 'left',
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  previewTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    margin: '0 0 12px 0',
  },
  previewQuestion: {
    display: 'flex',
    gap: '8px',
    fontSize: '14px',
    color: '#374151',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  previewNumber: {
    fontWeight: '600',
    color: '#9ca3af',
  },
  moreQuestions: {
    fontSize: '13px',
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: '8px',
  },
  startButton: {
    padding: '16px 48px',
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  questionBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    borderRadius: '16px',
    marginBottom: '8px',
  },
  questionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
    lineHeight: 1.4,
  },
  timer: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '8px',
    minWidth: '70px',
    textAlign: 'center',
  },
  optionsDisplay: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '24px',
  },
  optionBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  optionLetter: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#4b5563',
  },
  optionText: {
    fontSize: '16px',
    color: '#1f2937',
  },
  responseTracker: {
    textAlign: 'center',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  responseCount: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: '4px',
  },
  responseNumber: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#1f2937',
  },
  responseLabel: {
    fontSize: '16px',
    color: '#6b7280',
  },
  controls: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  revealButton: {
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  endButton: {
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  revealOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '24px',
  },
  revealOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  correctOption: {
    backgroundColor: '#dcfce7',
    borderColor: '#10b981',
  },
  correctBadge: {
    marginLeft: 'auto',
    fontSize: '14px',
    fontWeight: '600',
    color: '#166534',
  },
  leaderboardSection: {
    marginBottom: '24px',
  },
  leaderboardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 16px 0',
  },
  leaderboardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  leaderboardRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: '8px',
    gap: '16px',
  },
  rank: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#6b7280',
    width: '40px',
  },
  playerName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
  },
  points: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    width: '100px',
    textAlign: 'right',
  },
  correct: {
    fontSize: '12px',
    color: '#6b7280',
    width: '50px',
    textAlign: 'right',
  },
  nextButton: {
    padding: '14px 48px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  finishedHeader: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  finishedTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  finishedSubtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
  winnerSection: {
    textAlign: 'center',
    padding: '32px',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: '16px',
    marginBottom: '32px',
  },
  crown: {
    fontSize: '64px',
    marginBottom: '8px',
  },
  winnerName: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  winnerStats: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
  finalLeaderboard: {
    marginBottom: '32px',
  },
  restartButton: {
    padding: '14px 48px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};

export default ReviewGameResults;
