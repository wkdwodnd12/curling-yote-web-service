import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Login from './Page/Login';
import SignUp from './Page/SignUp';
import Management from './Page/Management';
import Apply from './Page/Apply';
import MyPage from './Page/MyPage';
import './index.css';
import { supabase } from './lib/supabaseClient';

const RequireAdmin = ({ children }) => {
  const [status, setStatus] = useState('loading');
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setStatus('denied');
        return;
      }
      const res = await fetch(`${API_BASE}/api/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = await res.json();
      if (res.ok && profileData.profile?.role === 'admin') {
        setStatus('ok');
      } else {
        setStatus('denied');
      }
    };
    check();
  }, [API_BASE]);

  if (status === 'loading') return null;
  if (status === 'denied') return <Navigate to="/login" replace />;
  return children;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/SignUp" element={<SignUp />} />
        <Route path="/MyPage" element={<MyPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <Management />
            </RequireAdmin>
          }
        />
        <Route path="/apply" element={<Apply />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
