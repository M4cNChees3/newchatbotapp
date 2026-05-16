import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { ChatPage } from './pages/ChatPage';
import { KnowledgeBasePanel } from './components/KnowledgeBasePanel';
import { TutorialPanel } from './components/TutorialPanel';
import { MetricsPanel } from './components/MetricsPanel';
import { Loader2 } from 'lucide-react';
import React from 'react';

function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const {
    user,
    loading,
    isAdmin,
  } = useAuth();

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (adminOnly && !isAdmin) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminPage />
              </ProtectedRoute>
            } />

            <Route path="/" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/chat" replace />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="tutorial" element={<TutorialPanel />} />
              <Route path="metrics" element={
                 <div className="h-full bg-white">
                   <MetricsPanel />
                 </div>
              } />
            </Route>
          </Routes>
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;