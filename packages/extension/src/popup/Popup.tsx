import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

interface SessionInfo {
  sessionId: string | null;
  sessionCode: string | null;
  qrCode: string | null;
  participantCount: number;
  connected: boolean;
}

const Popup: React.FC = () => {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    sessionId: null,
    sessionCode: null,
    qrCode: null,
    participantCount: 0,
    connected: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnSlidesPage, setIsOnSlidesPage] = useState(false);

  useEffect(() => {
    // Check if we're on a slides.com page
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab?.url?.includes('slides.com')) {
        setIsOnSlidesPage(true);
      }
    });

    // Get current session info
    chrome.runtime.sendMessage({ type: 'GET_SESSION_INFO' }, (response) => {
      if (response) {
        setSessionInfo(response);
      }
    });

    // Listen for session stats updates
    const handleMessage = (message: any) => {
      if (message.type === 'SESSION_STATS_UPDATE') {
        setSessionInfo((prev) => ({
          ...prev,
          participantCount: message.data.participantCount,
        }));
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const createSession = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current tab URL to extract presentation ID
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tabs[0]?.url || '';

      // Extract presentation ID from URL
      // Format: https://mind.slides.com/d/JpLoPiI/live or https://slides.com/user/presentation-name
      const urlParts = currentUrl.split('/');
      let presentationId = 'default-presentation';

      // Check for /d/ format (mind.slides.com/d/ID/...)
      const dIndex = urlParts.indexOf('d');
      if (dIndex !== -1 && dIndex < urlParts.length - 1) {
        presentationId = urlParts[dIndex + 1];
      } else {
        // Fall back to last non-empty part (excluding fragments)
        const cleanUrl = currentUrl.split('#')[0].split('?')[0];
        const parts = cleanUrl.split('/').filter(p => p);
        presentationId = parts[parts.length - 1] || 'default-presentation';
      }

      chrome.runtime.sendMessage(
        {
          type: 'CREATE_SESSION',
          presentationId,
        },
        (response) => {
          setLoading(false);

          if (response.success) {
            setSessionInfo({
              sessionId: response.sessionId,
              sessionCode: response.sessionCode,
              qrCode: response.qrCode,
              participantCount: 0,
              connected: true,
            });
          } else {
            setError(response.error || 'Failed to create session');
          }
        }
      );
    } catch (err) {
      setLoading(false);
      setError((err as Error).message);
    }
  };

  const endSession = () => {
    chrome.runtime.sendMessage({ type: 'END_SESSION' });
    setSessionInfo({
      sessionId: null,
      sessionCode: null,
      qrCode: null,
      participantCount: 0,
      connected: false,
    });
  };

  if (!isOnSlidesPage) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Interactive Presentations</h2>
        <div style={styles.warning}>
          <p>Please open a slides.com presentation to use this extension.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Interactive Presentations</h2>
        <div style={styles.loading}>Creating session...</div>
      </div>
    );
  }

  if (!sessionInfo.sessionId) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Interactive Presentations</h2>
        <p style={styles.description}>
          Make your presentation interactive! Create a session and share the QR code with your audience.
        </p>
        {error && <div style={styles.error}>{error}</div>}
        <button style={styles.button} onClick={createSession}>
          Create Session
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Session Active</h2>

      <div style={styles.sessionCode}>
        <div style={styles.label}>Session Code</div>
        <div style={styles.code}>{sessionInfo.sessionCode}</div>
      </div>

      {sessionInfo.qrCode && (
        <div style={styles.qrSection}>
          <img src={sessionInfo.qrCode} alt="Session QR Code" style={styles.qrCode} />
        </div>
      )}

      <div style={styles.stats}>
        <div style={styles.statItem}>
          <div style={styles.statValue}>{sessionInfo.participantCount}</div>
          <div style={styles.statLabel}>Participants</div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statusIndicator(true)} />
          <div style={styles.statLabel}>Active</div>
        </div>
      </div>

      <button
        style={styles.dashboardButton}
        onClick={() => window.open(`https://presentations.stmath.com/presenter/${sessionInfo.sessionCode}`, '_blank')}
      >
        Open Presenter Dashboard
      </button>

      <button style={styles.endButton} onClick={endSession}>
        End Session
      </button>

      <div style={styles.footer}>
        <small>Attendees join at: presentations.stmath.com</small>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
  },
  title: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
  },
  description: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.5',
  },
  warning: {
    padding: '12px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#856404',
  },
  loading: {
    padding: '40px 20px',
    textAlign: 'center' as const,
    fontSize: '14px',
    color: '#666',
  },
  error: {
    padding: '12px',
    backgroundColor: '#f8d7da',
    border: '1px solid #dc3545',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#721c24',
    marginBottom: '16px',
  },
  button: {
    width: '100%',
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  dashboardButton: {
    width: '100%',
    padding: '12px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '16px',
    transition: 'background-color 0.2s',
  },
  endButton: {
    width: '100%',
    padding: '10px 24px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
  },
  sessionCode: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
    textAlign: 'center' as const,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  label: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
    fontWeight: 600,
    letterSpacing: '0.5px',
  },
  code: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#007bff',
    fontFamily: 'monospace',
    letterSpacing: '4px',
  },
  qrSection: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
    textAlign: 'center' as const,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  qrCode: {
    width: '200px',
    height: '200px',
  },
  stats: {
    display: 'flex',
    gap: '12px',
    marginBottom: '8px',
  },
  statItem: {
    flex: 1,
    backgroundColor: 'white',
    padding: '12px',
    borderRadius: '8px',
    textAlign: 'center' as const,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#333',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    textTransform: 'uppercase' as const,
  },
  statusIndicator: (connected: boolean) => ({
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: connected ? '#28a745' : '#dc3545',
    margin: '0 auto 8px',
  }),
  footer: {
    marginTop: '16px',
    textAlign: 'center' as const,
    color: '#666',
  },
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
