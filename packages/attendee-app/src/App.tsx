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
import { SubmitSample } from './components/activities/SubmitSample';
import { CollaborativeTapGame } from './components/activities/CollaborativeTapGame';
import { SessionCodeBadge } from './components/SessionCodeBadge';
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
  const { currentActivity, currentResults, sessionCode } = useSocket();

  // If there's an active activity, show it instead of waiting screen
  if (currentActivity) {
    // Use activityId as key to force remounting when switching between activities
    // This ensures component state (like selected answers) is reset between activities
    const activityKey = currentActivity.activityId || `${currentActivity.type}-${Date.now()}`;

    let activityComponent;
    switch (currentActivity.type) {
      case 'poll':
        activityComponent = <Poll key={activityKey} activity={currentActivity as any} results={currentResults as any} />;
        break;
      case 'quiz':
        activityComponent = <Quiz key={activityKey} activity={currentActivity as any} />;
        break;
      case 'web-link':
        activityComponent = <WebLink key={activityKey} activity={currentActivity as any} />;
        break;
      case 'text-response':
        activityComponent = <TextResponse key={activityKey} activity={currentActivity as any} />;
        break;
      case 'review-game':
        activityComponent = <ReviewGame key={activityKey} activity={currentActivity as any} />;
        break;
      case 'submit-sample':
        activityComponent = <SubmitSample key={activityKey} activity={currentActivity as any} />;
        break;
      case 'collaborative-tap-game':
        activityComponent = <CollaborativeTapGame key={activityKey} activity={currentActivity as any} results={currentResults as any} />;
        break;
      default:
        return <WaitingScreen />;
    }

    return (
      <>
        {sessionCode && <SessionCodeBadge code={sessionCode} />}
        {activityComponent}
      </>
    );
  }

  return (
    <>
      {sessionCode && <SessionCodeBadge code={sessionCode} />}
      <WaitingScreen />
    </>
  );
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
