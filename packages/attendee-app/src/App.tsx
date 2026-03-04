import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { JoinSession } from './pages/JoinSession';
import { WaitingScreen } from './pages/WaitingScreen';
import { PresenterDashboard } from './pages/PresenterDashboard';
import { ActivityBuilder } from './pages/ActivityBuilder';
import { Poll } from './components/activities/Poll';
import { Quiz } from './components/activities/Quiz';
import { WebLink } from './components/activities/WebLink';
import { TextResponse } from './components/activities/TextResponse';
import { ReviewGame } from './components/activities/ReviewGame';
import { SocketProvider, useSocket } from './contexts/FirebaseContext';

const ActivityRouter: React.FC = () => {
  const { sessionEnded, sessionCode } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to join page when session ends or disconnects (for attendee pages only)
  useEffect(() => {
    const isAttendeePage = location.pathname === '/waiting';
    if (isAttendeePage && (sessionEnded || !sessionCode)) {
      console.log('Session ended or disconnected, redirecting to join page');
      navigate('/join', { replace: true });
    }
  }, [sessionEnded, sessionCode, navigate, location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/join" replace />} />
      <Route path="/join" element={<JoinSession />} />
      <Route path="/join/:code" element={<JoinSession />} />
      <Route path="/waiting" element={<WaitingContent />} />
      <Route path="/presenter/:code" element={<PresenterDashboard />} />
      <Route path="/builder" element={<ActivityBuilder />} />
      <Route path="*" element={<Navigate to="/join" replace />} />
    </Routes>
  );
};

const WaitingContent: React.FC = () => {
  const { currentActivity, currentResults } = useSocket();

  // If there's an active activity, show it instead of waiting screen
  if (currentActivity) {
    switch (currentActivity.type) {
      case 'poll':
        return <Poll activity={currentActivity as any} results={currentResults as any} />;
      case 'quiz':
        return <Quiz activity={currentActivity as any} />;
      case 'web-link':
        return <WebLink activity={currentActivity as any} />;
      case 'text-response':
        return <TextResponse activity={currentActivity as any} />;
      case 'review-game':
        return <ReviewGame activity={currentActivity as any} />;
      default:
        return <WaitingScreen />;
    }
  }

  return <WaitingScreen />;
};

const App: React.FC = () => {
  return (
    <SocketProvider>
      <BrowserRouter>
        <ActivityRouter />
      </BrowserRouter>
    </SocketProvider>
  );
};

export default App;
