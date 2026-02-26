import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { JoinSession } from './pages/JoinSession';
import { WaitingScreen } from './pages/WaitingScreen';
import { PresenterDashboard } from './pages/PresenterDashboard';
import { ActivityBuilder } from './pages/ActivityBuilder';
import { Poll } from './components/activities/Poll';
import { Quiz } from './components/activities/Quiz';
import { WebLink } from './components/activities/WebLink';
import { SocketProvider, useSocket } from './contexts/FirebaseContext';

const ActivityRouter: React.FC = () => {
  const { currentActivity } = useSocket();
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
