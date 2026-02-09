import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const MyPage = () => {
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [applications, setApplications] = useState([]);
  const [appError, setAppError] = useState('');
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataJson = await res.json();
      if (res.ok) {
        setProfile({
          name: dataJson.profile?.name || '',
          email: dataJson.profile?.email || ''
        });
      }
    };
    loadProfile();
  }, [API_BASE]);

  const shortcuts = [
    { label: '쿠폰함', value: '2' },
    { label: '신청 내역', value: '3' },
    { label: '공지사항', value: '' }
  ];

  const loadApplications = async () => {
    setAppError('');
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    const res = await fetch(`${API_BASE}/api/applications/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const dataJson = await res.json();
    if (res.ok) {
      setApplications(dataJson || []);
      return;
    }
    setAppError(dataJson.error || '신청 내역을 불러오지 못했습니다.');
  };

  useEffect(() => {
    loadApplications();
  }, [API_BASE]);

  const handleCancel = async (row) => {
    const reason = window.prompt('취소 사유를 입력해주세요. (선택)');
    if (reason === null) return;
    const ok = window.confirm('해당 강습을 취소하겠습니까?');
    if (!ok) return;
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      window.alert('로그인이 필요합니다.');
      return;
    }
    const res = await fetch(`${API_BASE}/api/applications/${row.id}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ cancel_reason: reason || null })
    });
    const dataJson = await res.json();
    if (!res.ok) {
      window.alert(dataJson.error || '취소에 실패했습니다.');
      return;
    }
    setApplications((prev) => prev.filter((item) => item.id !== row.id));
    window.alert('취소되었습니다.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-500 via-blue-600 to-blue-800">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <div className="flex items-center justify-between text-white">
          <Link to="/" className="text-sm font-medium text-white/90 hover:underline">
            ← 홈으로
          </Link>
          <div className="text-lg font-semibold">마이페이지</div>
          <div className="w-16" />
        </div>

        <div className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm backdrop-blur flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 text-white">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-white border border-gray-200 flex items-center justify-center text-blue-600 text-2xl">
              👤
            </div>
            <div>
              <div className="text-lg font-semibold">
                {profile.name || '회원'}
              </div>
              <div className="text-sm text-white/70">{profile.email || '이메일'}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-full border border-white/30 text-sm text-white/90 hover:bg-white/10">
              프로필 관리
            </button>
            <button className="px-4 py-2 rounded-full border border-white/30 text-sm text-white/90 hover:bg-white/10">
              내 스타일
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm backdrop-blur text-white">
          <div className="grid gap-6 sm:grid-cols-3 text-center">
            {shortcuts.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="mx-auto h-10 w-10 rounded-full border border-white/30 flex items-center justify-center text-white/80">
                  {item.label.slice(0, 1)}
                </div>
                <div className="text-sm font-medium text-white/90">{item.label}</div>
                {item.value && <div className="text-sm text-white">{item.value}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/20 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">신청 내역</h2>
            <button className="text-sm text-blue-600 hover:underline">전체 보기</button>
          </div>
          <div className="space-y-4">
            {appError && <div className="text-sm text-red-600">{appError}</div>}
            {!appError && applications.length === 0 && (
              <div className="text-sm text-gray-500">신청 내역이 없습니다.</div>
            )}
            {applications.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {item.sections?.sport} · {item.sections?.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-700">
                    {item.status === 'CANCELLED' ? '취소됨' : '신청 완료'}
                  </div>
                  {item.status !== 'CANCELLED' && (
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => handleCancel(item)}
                    >
                      신청 취소
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
