import React, { useState, useEffect, useRef } from 'react';
import { CollaborativeTapGameActivity, CollaborativeTapGameResults } from '@interactive-presentations/shared';
import { useSocket } from '../../contexts/FirebaseContext';

interface CollaborativeTapGameProps {
  activity: CollaborativeTapGameActivity;
  results: CollaborativeTapGameResults | null;
}

export const CollaborativeTapGame: React.FC<CollaborativeTapGameProps> = ({ activity, results }) => {
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const [cooldownProgress, setCooldownProgress] = useState(0);
  const { submitResponse } = useSocket();
  const cooldownTimerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleTap = async () => {
    console.log('[CollaborativeTapGame] handleTap called', {
      isOnCooldown,
      isActive: results?.isActive,
      isWinner: results?.isWinner
    });

    if (isOnCooldown || !results?.isActive || results?.isWinner) {
      console.log('[CollaborativeTapGame] Tap blocked');
      return;
    }

    try {
      console.log('[CollaborativeTapGame] Submitting tap...');
      // Submit a tap event
      await submitResponse(activity.activityId || '', { action: 'tap' });
      console.log('[CollaborativeTapGame] Tap submitted successfully');

      // Start cooldown
      setIsOnCooldown(true);
      setCooldownProgress(0);

      // Animate progress bar
      const startTime = Date.now();
      const duration = activity.cooldownSeconds * 1000;

      progressIntervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        setCooldownProgress(progress);
      }, 16); // ~60fps

      // End cooldown
      cooldownTimerRef.current = window.setTimeout(() => {
        setIsOnCooldown(false);
        setCooldownProgress(0);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }, duration);
    } catch (error) {
      console.error('Error submitting tap:', error);
      setIsOnCooldown(false);
      setCooldownProgress(0);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString()}`;
  };

  const currentTotal = results?.currentTotal || 0;
  const isWinner = results?.isWinner || false;
  const isActive = results?.isActive || false;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: '#fff',
        fontFamily: 'Arial, sans-serif',
        paddingTop: '60px',
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: '26px',
          fontWeight: 'bold',
          color: '#FFD700',
          textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
          textAlign: 'center',
          marginBottom: '20px',
        }}
      >
        {activity.title}
      </div>

      {/* Total Display */}
      <div
        className={isWinner ? 'winner-pulse' : ''}
        style={{
          fontSize: isWinner ? '52px' : '44px',
          fontWeight: 'bold',
          color: '#FFD700',
          textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
          textAlign: 'center',
          padding: '0 20px',
          wordBreak: 'break-all',
          transition: 'all 0.3s ease',
          marginBottom: '30px',
        }}
      >
        {formatCurrency(currentTotal)}
      </div>

      {/* Tap Button */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={handleTap}
          disabled={isOnCooldown || !isActive || isWinner}
          style={{
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: isOnCooldown || !isActive || isWinner
              ? 'linear-gradient(135deg, #888 0%, #666 100%)'
              : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            border: 'none',
            fontWeight: 'bold',
            color: '#1a1a2e',
            fontSize: '48px',
            cursor: isOnCooldown || !isActive || isWinner ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 24px rgba(255, 215, 0, 0.4)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.2s ease',
            transform: isOnCooldown || !isActive || isWinner ? 'scale(0.95)' : 'scale(1)',
          }}
        >
          {isWinner ? '🎉' : 'TAP'}

          {/* Cooldown overlay */}
          {isOnCooldown && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: `${cooldownProgress}%`,
                background: 'rgba(0, 0, 0, 0.5)',
                transition: 'height 0.016s linear',
              }}
            />
          )}
        </button>
      </div>

      {/* Winner celebration */}
      {isWinner && (
        <>
          <div
            style={{
              fontSize: '48px',
              textAlign: 'center',
              marginTop: '20px',
              animation: 'bounce 1s infinite',
            }}
          >
            🎊 WE DID IT! 🎊
          </div>
          <style>{`
            @keyframes winner-pulse {
              0%, 100% {
                transform: scale(1);
                text-shadow: 0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.3);
              }
              50% {
                transform: scale(1.1);
                text-shadow: 0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.5), 0 0 90px rgba(255, 215, 0, 0.3);
              }
            }
            .winner-pulse {
              animation: winner-pulse 1s ease-in-out infinite;
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
          `}</style>
        </>
      )}
    </div>
  );
};
