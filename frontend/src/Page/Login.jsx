import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password
      });
      if (signInError) throw new Error(signInError.message);
      const token = data.session?.access_token;
      if (token) {
        const res = await fetch(`${API_BASE}/api/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const profileData = await res.json();
        if (res.ok && profileData.profile?.role === 'admin') {
          localStorage.setItem('isAdmin', '1');
        } else {
          localStorage.removeItem('isAdmin');
        }
      }
      setError('');
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password
      });
      if (signInError) throw new Error(signInError.message);
      const token = data.session?.access_token;
      if (!token) throw new Error('로그인 토큰을 확인할 수 없습니다.');
      const res = await fetch(`${API_BASE}/api/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = await res.json();
      if (res.ok && profileData.profile?.role === 'admin') {
        localStorage.setItem('isAdmin', '1');
        navigate('/admin');
        return;
      }
      setError('관리자 권한이 없습니다.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-sky-500 via-blue-600 to-blue-800 relative">
      <Link to="/" className="absolute top-6 left-6 text-sm font-medium text-white hover:underline">
        ← 홈으로
      </Link>
      <div className="w-full max-w-sm flex items-center justify-center text-white">
        <Link to="/" className="text-2xl font-black drop-shadow-lg">
          Wev Site
        </Link>
      </div>

      <div className="w-full max-w-sm bg-white/90 backdrop-blur rounded-2xl shadow-2xl p-7">
        <h1 className="text-xl font-semibold text-blue-700 text-center mb-4">로그인</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold shadow-lg shadow-blue-900/30 transition ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
            <button
              type="button"
              onClick={handleAdminLogin}
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold shadow-lg shadow-blue-900/30 transition ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              관리자 로그인
            </button>
          </div>
        </form>

        <div className="mt-5 flex items-center justify-center gap-4 text-sm">
          <a className="text-blue-700 hover:underline" href="#">
            비밀번호를 잊으셨나요?
          </a>
          <span className="text-gray-300">|</span>
        </div>
        <div className="mt-4 text-center text-sm text-gray-600">
          혹시 회원이 아니신가요?{' '}
          <Link to="/SignUp" className="text-blue-700 hover:underline">
            회원가입을 진행하세요
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
