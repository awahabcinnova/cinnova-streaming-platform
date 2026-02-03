import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy load pages to reduce initial bundle size
const Home = lazy(() => import('./pages/Home'));
const Watch = lazy(() => import('./pages/Watch'));
const Upload = lazy(() => import('./pages/Upload'));
const Live = lazy(() => import('./pages/Live'));
const Login = lazy(() => import('./pages/Login'));
const Channel = lazy(() => import('./pages/Channel'));
const History = lazy(() => import('./pages/History'));
const LikedVideos = lazy(() => import('./pages/LikedVideos'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const NotFound = lazy(() => import('./pages/NotFound'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAuthLoading } = useAuth();
  if (isAuthLoading) {
    return <PageLoader />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const PageLoader = () => (
  <div className="flex items-center justify-center h-[calc(100vh-64px)] w-full bg-white">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="watch/:id" element={<Watch />} />
              <Route path="user/:id" element={<UserProfile />} />
              <Route path="results" element={<SearchResults />} />
              <Route path="history" element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } />
              <Route path="liked" element={
                <ProtectedRoute>
                  <LikedVideos />
                </ProtectedRoute>
              } />
              <Route path="upload" element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              } />
              <Route path="live" element={
                <ProtectedRoute>
                  <Live />
                </ProtectedRoute>
              } />
              <Route path="channel" element={
                <ProtectedRoute>
                  <Channel />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
