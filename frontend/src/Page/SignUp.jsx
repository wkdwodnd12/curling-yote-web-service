import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const SignUp = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const name = form.get('name')?.toString().trim();
    const email = form.get('email')?.toString().trim();
    const phone = form.get('phone')?.toString().trim();
    const password = form.get('password')?.toString();
    const confirm = form.get('confirm')?.toString();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigits = phone?.replace(/\D/g, '') || '';

    if (!name || !email || !phone || !password || !confirm) {
      setError('이름, 이메일, 전화번호, 비밀번호를 모두 입력해주세요.');
      return;
    }
    if (!emailPattern.test(email)) {
      setError('이메일 형식이 올바르지 않습니다.');
      return;
    }
    if (!/^01\d{8,9}$/.test(phoneDigits)) {
      setError('전화번호 형식이 올바르지 않습니다.');
      return;
    }
    if (password.length < 8) {
      setError('비밀번호는 8자리 이상이어야 합니다.');
      return;
    }
    if (password !== confirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone: phoneDigits }
        }
      });
      if (signUpError) throw new Error(signUpError.message);

      const token = data.session?.access_token;
      if (token) {
        await fetch(`${API_BASE}/api/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ name, phone: phoneDigits })
        });
        window.alert('회원가입이 완료되었습니다.');
        navigate('/');
        return;
      }

      window.alert('회원가입이 완료되었습니다. 이메일 인증 후 로그인해주세요.');
      navigate('/login');
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
        <h1 className="text-xl font-semibold text-blue-700 text-center mb-4">회원가입</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input
              name="name"
              type="text"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="홍길동"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              name="email"
              type="email"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
            <input
              name="phone"
              type="tel"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="01012345678"
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                let formatted = digits;
                if (digits.length <= 3) {
                  formatted = digits;
                } else if (digits.length <= 7) {
                  formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
                } else {
                  formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
                }
                e.target.value = formatted;
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              name="password"
              type="password"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-gray-400">비밀번호는 8자리 이상 입력해주세요.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
            <input
              name="confirm"
              type="password"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold shadow-lg shadow-blue-900/30 transition ${
              loading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-gray-600">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-blue-700 hover:underline">
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
