import React, { useEffect, useState } from 'react';
import { ReviewGameLeaderboardEntry } from '@interactive-presentations/shared';

interface ReviewGamePodiumProps {
  leaderboard: ReviewGameLeaderboardEntry[];
  showConfetti?: boolean;
  isFinal?: boolean;
}

export const ReviewGamePodium: React.FC<ReviewGamePodiumProps> = ({
  leaderboard,
  showConfetti = false,
  isFinal = false,
}) => {
  const [confettiPieces, setConfettiPieces] = useState<Array<{
    id: number;
    left: number;
    color: string;
    delay: number;
    duration: number;
  }>>([]);

  useEffect(() => {
    if (showConfetti) {
      const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96e6a1', '#dda0dd'];
      const pieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
      }));
      setConfettiPieces(pieces);
    }
  }, [showConfetti]);

  const top3 = leaderboard.slice(0, 3);
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  const getRankChange = (entry: ReviewGameLeaderboardEntry) => {
    if (entry.previousRank === undefined) return null;
    const change = entry.previousRank - entry.rank;
    if (change > 0) return { direction: 'up', amount: change };
    if (change < 0) return { direction: 'down', amount: Math.abs(change) };
    return null;
  };

  return (
    <div style={styles.container}>
      {showConfetti && (
        <div style={styles.confettiContainer}>
          {confettiPieces.map((piece) => (
            <div
              key={piece.id}
              style={{
                ...styles.confetti,
                left: `${piece.left}%`,
                backgroundColor: piece.color,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      <h2 style={styles.title}>{isFinal ? 'Final Results!' : 'Leaderboard'}</h2>

      <div style={styles.podiumContainer}>
        {/* Third place (left - shortest) */}
        {third && (
          <div style={styles.podiumSpot}>
            <div style={styles.playerCard}>
              <div style={{ ...styles.avatar, backgroundColor: '#cd7f32' }}>
                {third.name.charAt(0).toUpperCase()}
              </div>
              <div style={styles.playerName}>{third.name}</div>
              <div style={styles.playerPoints}>{third.totalPoints.toLocaleString()} pts</div>
              {getRankChange(third) && (
                <div style={{
                  ...styles.rankChange,
                  color: getRankChange(third)?.direction === 'up' ? '#10b981' : '#ef4444',
                }}>
                  {getRankChange(third)?.direction === 'up' ? '↑' : '↓'}
                  {getRankChange(third)?.amount}
                </div>
              )}
            </div>
            <div style={{ ...styles.podium, ...styles.podiumThird }}>
              <span style={styles.podiumRank}>3</span>
            </div>
          </div>
        )}

        {/* Second place (middle - medium) */}
        {second && (
          <div style={styles.podiumSpot}>
            <div style={styles.playerCard}>
              <div style={{ ...styles.avatar, backgroundColor: '#c0c0c0' }}>
                {second.name.charAt(0).toUpperCase()}
              </div>
              <div style={styles.playerName}>{second.name}</div>
              <div style={styles.playerPoints}>{second.totalPoints.toLocaleString()} pts</div>
              {getRankChange(second) && (
                <div style={{
                  ...styles.rankChange,
                  color: getRankChange(second)?.direction === 'up' ? '#10b981' : '#ef4444',
                }}>
                  {getRankChange(second)?.direction === 'up' ? '↑' : '↓'}
                  {getRankChange(second)?.amount}
                </div>
              )}
            </div>
            <div style={{ ...styles.podium, ...styles.podiumSecond }}>
              <span style={styles.podiumRank}>2</span>
            </div>
          </div>
        )}

        {/* First place (right - tallest) */}
        {first && (
          <div style={styles.podiumSpot}>
            <div style={styles.playerCard}>
              <div style={styles.crown}>👑</div>
              <div style={{ ...styles.avatar, backgroundColor: '#ffd700' }}>
                {first.name.charAt(0).toUpperCase()}
              </div>
              <div style={styles.playerName}>{first.name}</div>
              <div style={styles.playerPoints}>{first.totalPoints.toLocaleString()} pts</div>
              {getRankChange(first) && (
                <div style={{
                  ...styles.rankChange,
                  color: getRankChange(first)?.direction === 'up' ? '#10b981' : '#ef4444',
                }}>
                  {getRankChange(first)?.direction === 'up' ? '↑' : '↓'}
                  {getRankChange(first)?.amount}
                </div>
              )}
            </div>
            <div style={{ ...styles.podium, ...styles.podiumFirst }}>
              <span style={styles.podiumRank}>1</span>
            </div>
          </div>
        )}
      </div>

      {/* Rest of leaderboard */}
      {leaderboard.length > 3 && (
        <div style={styles.restOfLeaderboard}>
          {leaderboard.slice(3, 10).map((entry) => (
            <div key={entry.participantId} style={styles.leaderboardRow}>
              <span style={styles.leaderboardRank}>#{entry.rank}</span>
              <span style={styles.leaderboardName}>{entry.name}</span>
              <span style={styles.leaderboardPoints}>{entry.totalPoints.toLocaleString()}</span>
              {getRankChange(entry) && (
                <span style={{
                  ...styles.smallRankChange,
                  color: getRankChange(entry)?.direction === 'up' ? '#10b981' : '#ef4444',
                }}>
                  {getRankChange(entry)?.direction === 'up' ? '↑' : '↓'}
                  {getRankChange(entry)?.amount}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    top: '-10px',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    animation: 'confettiFall 3s ease-in-out forwards',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '32px',
    textAlign: 'center',
  },
  podiumContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '32px',
  },
  podiumSpot: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  playerCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '8px',
    position: 'relative',
  },
  crown: {
    fontSize: '32px',
    marginBottom: '-8px',
    animation: 'bounce 1s ease-in-out infinite',
  },
  avatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: '700',
    color: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    marginBottom: '8px',
  },
  playerName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    maxWidth: '100px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'center',
  },
  playerPoints: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
  },
  rankChange: {
    fontSize: '14px',
    fontWeight: '700',
    marginTop: '4px',
  },
  podium: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: '12px',
    borderRadius: '8px 8px 0 0',
    width: '100px',
  },
  podiumFirst: {
    height: '160px',
    background: 'linear-gradient(180deg, #ffd700 0%, #b8860b 100%)',
  },
  podiumSecond: {
    height: '110px',
    background: 'linear-gradient(180deg, #c0c0c0 0%, #808080 100%)',
  },
  podiumThird: {
    height: '70px',
    background: 'linear-gradient(180deg, #cd7f32 0%, #8b4513 100%)',
  },
  podiumRank: {
    fontSize: '32px',
    fontWeight: '900',
    color: 'rgba(255,255,255,0.8)',
  },
  restOfLeaderboard: {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  leaderboardRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: '8px',
    gap: '12px',
  },
  leaderboardRank: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#6b7280',
    width: '32px',
  },
  leaderboardName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  leaderboardPoints: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
  },
  smallRankChange: {
    fontSize: '12px',
    fontWeight: '700',
    marginLeft: '4px',
  },
};

// Add keyframe animations via style tag
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes confettiFall {
    0% {
      transform: translateY(0) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(100vh) rotate(720deg);
      opacity: 0;
    }
  }

  @keyframes podiumRise {
    0% {
      height: 0;
    }
    100% {
      height: var(--podium-height);
    }
  }

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-8px);
    }
  }
`;
if (!document.head.querySelector('#review-game-podium-styles')) {
  styleSheet.id = 'review-game-podium-styles';
  document.head.appendChild(styleSheet);
}

export default ReviewGamePodium;
