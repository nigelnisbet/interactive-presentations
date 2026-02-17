import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { JoinSession } from './pages/JoinSession';
import { WaitingScreen } from './pages/WaitingScreen';
import { PresenterDashboard } from './pages/PresenterDashboard';
import { Poll } from './components/activities/Poll';
import { Quiz } from './components/activities/Quiz';
import { WebLink } from './components/activities/WebLink';
import { SocketProvider, useSocket } from './contexts/SocketContext';

const ActivityRouter: React.FC = () => {
  const { currentActivity, currentResults } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    // If an activity becomes active, stay on waiting screen but render activity
    // The activity components will overlay the waiting screen
  }, [currentActivity, navigate]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/join" replace />} />
      <Route path="/join" element={<JoinSession />} />
      <Route path="/join/:code" element={<JoinSession />} />
      <Route path="/waiting" element={<WaitingContent />} />
      <Route path="/presenter/:code" element={<PresenterDashboard />} />
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
        return <Poll activity={currentActivity} results={currentResults as any} />;
      case 'quiz':
        return <Quiz activity={currentActivity} />;
      case 'web-link':
        return <WebLink activity={currentActivity} />;
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
