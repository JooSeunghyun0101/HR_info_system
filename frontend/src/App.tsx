import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuthStore } from './lib/store';

import Login from './pages/Login';
import Home from './pages/Home';
import QnAList from './pages/QnAList';
import ManualList from './pages/ManualList';
import AdminSettings from './pages/AdminSettings';
import SearchPage from './pages/SearchPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="qna" element={<ProtectedRoute><QnAList /></ProtectedRoute>} />
          <Route path="manuals" element={<ProtectedRoute><ManualList /></ProtectedRoute>} />
          <Route path="search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="admin" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
