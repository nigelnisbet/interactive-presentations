import React, { useState } from 'react';
import { CollaborativeTapGameActivity, CollaborativeTapGameResults as CollaborativeTapGameResultsType, TapGameMode } from '@interactive-presentations/shared';
import { useSocket } from '../../contexts/FirebaseContext';

interface CollaborativeTapGameResultsProps {
  activity: CollaborativeTapGameActivity;
  results: CollaborativeTapGameResultsType | null;
}

export const CollaborativeTapGameResults: React.FC<CollaborativeTapGameResultsProps> = ({ activity, results }) => {
  const { updateActivity, participantCount: sessionParticipantCount } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!updateActivity) {
    return <div>Error: updateActivity function not available</div>;
  }

  const handleToggleActive = async () => {
    if (!updateActivity) return;

    try {
      // Initialize results if they don't exist
      if (!results) {
        await updateActivity(activity.activityId || '', {
          activityId: activity.activityId || '',
          title: activity.title,
          currentMode: 'linear',
          currentTotal: 0,
          isActive: true,
          isWinner: false,
          participantCount: 0,
          tapCount: 0,
        });
      } else {
        // Only include collaborative-tap-game fields (no spreading to avoid undefined fields)
        await updateActivity(activity.activityId || '', {
          activityId: results.activityId,
          title: results.title,
          currentMode: results.currentMode,
          currentTotal: results.currentTotal,
          isActive: !results.isActive,
          isWinner: results.isWinner,
          participantCount: results.participantCount,
          tapCount: results.tapCount,
        });
      }
    } catch (error) {
      console.error('Error toggling active state:', error);
    }
  };

  const handleSetMode = async (mode: TapGameMode) => {
    if (!updateActivity) return;

    try {
      // Reset total based on mode: exponential starts at $1, linear at $0
      const resetTotal = mode === 'exponential' ? 1 : 0;

      // Initialize results if they don't exist
      if (!results) {
        await updateActivity(activity.activityId || '', {
          activityId: activity.activityId || '',
          title: activity.title,
          currentMode: mode,
          currentTotal: resetTotal,
          isActive: false,
          isWinner: false,
          participantCount: 0,
          tapCount: 0,
        });
      } else {
        // Reset total when switching modes
        await updateActivity(activity.activityId || '', {
          activityId: results.activityId,
          title: results.title,
          currentMode: mode,
          currentTotal: resetTotal,
          isActive: results.isActive,
          isWinner: false,
          participantCount: results.participantCount,
          tapCount: 0,
        });
      }
    } catch (error) {
      console.error('Error setting mode:', error);
    }
  };


  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString()}`;
  };

  const currentTotal = results?.currentTotal || 0;
  const isActive = results?.isActive || false;
  const isWinner = results?.isWinner || false;
  const currentMode = results?.currentMode || 'linear';
  const tapCount = results?.tapCount || 0;
  // Use session participant count, not game-tracked count
  const participantCount = sessionParticipantCount || 0;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Main Presentation View */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: sidebarOpen ? '350px' : '0',
          right: 0,
          bottom: 0,
          transition: 'left 0.3s ease',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            color: '#fff',
            padding: '80px 40px 40px',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          {/* Title */}
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#FFD700',
              textShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
              textAlign: 'center',
              marginBottom: '30px',
            }}
          >
            {activity.title}
          </div>

          {/* Question */}
          <div
            style={{
              fontSize: '24px',
              color: '#aaa',
              textAlign: 'center',
              marginBottom: '50px',
              maxWidth: '800px',
              lineHeight: '1.4',
            }}
          >
            {activity.question}
          </div>

          {/* Current Total - BIG! */}
          <div
            className={isWinner ? 'winner-pulse' : ''}
            style={{
              fontSize: isWinner ? '180px' : '120px',
              fontWeight: 'bold',
              color: '#FFD700',
              textShadow: '0 0 40px rgba(255, 215, 0, 0.8)',
              textAlign: 'center',
              transition: 'all 0.5s ease',
              marginBottom: '40px',
            }}
          >
            {formatCurrency(currentTotal)}
          </div>

          {/* Winner Celebration */}
          {isWinner && (
            <div
              style={{
                fontSize: '72px',
                textAlign: 'center',
                animation: 'bounce 1s infinite',
              }}
            >
              🎊 WE DID IT! 🎊
            </div>
          )}


          <style>{`
            @keyframes winner-pulse {
              0%, 100% {
                transform: scale(1);
                text-shadow: 0 0 40px rgba(255, 215, 0, 0.8), 0 0 80px rgba(255, 215, 0, 0.5);
              }
              50% {
                transform: scale(1.1);
                text-shadow: 0 0 60px rgba(255, 215, 0, 1), 0 0 120px rgba(255, 215, 0, 0.7), 0 0 180px rgba(255, 215, 0, 0.5);
              }
            }
            .winner-pulse {
              animation: winner-pulse 1s ease-in-out infinite;
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-20px); }
            }
          `}</style>
        </div>
      </div>

      {/* Collapsible Sidebar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: sidebarOpen ? '0' : '-350px',
          bottom: 0,
          width: '350px',
          background: 'linear-gradient(180deg, #0f1419 0%, #1a1f2e 100%)',
          borderRight: '2px solid rgba(255, 215, 0, 0.2)',
          boxShadow: '5px 0 20px rgba(0, 0, 0, 0.5)',
          transition: 'left 0.3s ease',
          overflow: 'auto',
          padding: '20px',
          color: '#fff',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {/* Sidebar Header */}
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', color: '#FFD700', margin: '0 0 10px 0' }}>
            Teacher Controls
          </h2>
        </div>

        {/* Stats - Compact */}
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '15px', marginBottom: '15px', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#aaa' }}>Participants:</span>
            <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{participantCount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#aaa' }}>Total Taps:</span>
            <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{tapCount}</span>
          </div>
        </div>

        {/* Mode Selector */}
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '15px', marginBottom: '15px' }}>
          <div style={{ fontSize: '14px', marginBottom: '10px', color: '#FFD700', fontWeight: 'bold' }}>
            Mode:
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <button
              onClick={() => handleSetMode('linear')}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '13px',
                fontWeight: 'bold',
                border: currentMode === 'linear' ? '2px solid #FFD700' : '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '6px',
                background: currentMode === 'linear' ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
                color: '#FFD700',
                cursor: 'pointer',
              }}
            >
              + $1,000,000
            </button>
            <button
              onClick={() => handleSetMode('exponential')}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '13px',
                fontWeight: 'bold',
                border: currentMode === 'exponential' ? '2px solid #FFD700' : '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '6px',
                background: currentMode === 'exponential' ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
                color: '#FFD700',
                cursor: 'pointer',
              }}
            >
              x2
            </button>
          </div>
        </div>

        {/* Control Buttons */}
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '15px', marginBottom: '15px' }}>
          <button
            onClick={handleToggleActive}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              background: isActive
                ? 'linear-gradient(135deg, #f44336 0%, #da190b 100%)'
                : 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
              color: 'white',
            }}
          >
            {isActive ? '⏸ Stop' : '▶ Start'}
          </button>
        </div>

        {/* Winner Status */}
        {isWinner && (
          <div
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              borderRadius: '8px',
              padding: '15px',
              textAlign: 'center',
              color: '#1a1a2e',
              fontWeight: 'bold',
              fontSize: '16px',
            }}
          >
            🎊 TARGET REACHED! 🎊
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'absolute',
          left: sidebarOpen ? '350px' : '0',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '40px',
          height: '80px',
          background: 'linear-gradient(180deg, #FFD700 0%, #FFA500 100%)',
          border: 'none',
          borderRadius: sidebarOpen ? '0 8px 8px 0' : '8px 0 0 8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          color: '#1a1a2e',
          boxShadow: '2px 0 10px rgba(0, 0, 0, 0.3)',
          transition: 'left 0.3s ease',
          zIndex: 10,
        }}
      >
        {sidebarOpen ? '«' : '»'}
      </button>
    </div>
  );
};
