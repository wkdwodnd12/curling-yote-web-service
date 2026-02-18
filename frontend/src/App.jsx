import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';

export default function LandingPage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [popups, setPopups] = useState([]);
  const [popupChecks, setPopupChecks] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/sections`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load sections');
        setSections(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [API_BASE]);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
      if (data.session?.access_token) {
        const res = await fetch(`${API_BASE}/api/me`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` }
        });
        const profileData = await res.json();
        if (res.ok) {
          setUserName(profileData.profile?.name || profileData.profile?.email || '');
        }
      }
    };
    init();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (!session) {
        setUserName('');
        return;
      }
      fetch(`${API_BASE}/api/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
        .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          if (ok) setUserName(data.profile?.name || data.profile?.email || '');
        })
        .catch(() => {});
    });
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('isAdmin');
    setIsLoggedIn(false);
    window.alert('로그아웃되었습니다.');
    window.location.href = '/home';
  };

  useEffect(() => {
    const loadPopup = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/popups?active=1`);
        const data = await res.json();
        if (!res.ok) return;
        const list = Array.isArray(data) ? data : [];
        if (!list.length) return;
        const now = new Date();
        const filtered = list.filter((candidate) => {
          const startOk = candidate.start_at ? now >= new Date(candidate.start_at) : true;
          const endOk = candidate.end_at ? now <= new Date(candidate.end_at) : true;
          if (!startOk || !endOk) return false;
          const hideKey = `popup_hide_${candidate.id}`;
          const hideUntil = localStorage.getItem(hideKey);
          if (hideUntil && now.getTime() < Number(hideUntil)) return false;
          return true;
        });
        setPopups(filtered);
      } catch (_err) {
        // ignore popup errors on landing
      }
    };
    loadPopup();
  }, [API_BASE]);

  const handlePopupClose = (popupId) => {
    const checked = !!popupChecks[popupId];
    if (checked) {
      const hideKey = `popup_hide_${popupId}`;
      const until = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem(hideKey, String(until));
    }
    setPopups((prev) => prev.filter((item) => item.id !== popupId));
  };

  const sectionCards = useMemo(
    () =>
      [...sections].sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      ),
    [sections]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-500 via-blue-600 to-blue-800 pt-6">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-8 text-white bg-white/10 backdrop-blur border border-white/20 rounded-full shadow-lg shadow-blue-900/20">
        <div className="text-center md:text-left">
          <div className="text-xl font-bold">강릉 해양스포츠 팜</div>
          {isLoggedIn && userName && (
            <div className="mt-1 text-xs text-white/80">{userName}님 반갑습니다</div>
          )}
        </div>
        <nav className="flex flex-wrap justify-center md:justify-end gap-3 text-sm md:text-base flex-1 md:flex-none">
          <button className="px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition">
            수강신청
          </button>
          <Link
            to="/schedule"
            className="px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition"
          >
            전체 일정
          </Link>
          <button className="px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition">
            이용안내
          </button>
          <Link
            to="/mypage"
            className="px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition"
          >
            마이페이지
          </Link>
          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition"
            >
              로그아웃
            </button>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition"
            >
              로그인
            </Link>
          )}
          <Link
            to="/admin"
            className="px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition"
          >
            ☰
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 flex justify-center text-white">
        <div className="text-center max-w-xl">
          <h1 className="text-4xl font-bold leading-tight">
            컬링 · 요트 강습 온라인 신청
          </h1>
          <p className="mt-6 text-white/80">
            분기별로 진행되는 체험 강습을간편하게 신청하세요.
          </p>

          <Link
            to="/apply"
            className="mt-8 inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold bg-white/90 text-blue-700 shadow-lg shadow-blue-900/30 border border-white/40 backdrop-blur hover:bg-white transition"
          >
            신청 가능한 강습 보기
          </Link>
        </div>
      </section>

      {/* Sessions */}
      <section className="bg-gray-50 rounded-t-3xl py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8">신청 가능한 강습</h2>

          <div className="grid grid-cols-1 gap-6">
            {loading && <p className="text-sm text-gray-500">회차를 불러오는 중...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!loading &&
              !error &&
              sectionCards.map((s) => {
                const now = new Date();
                const isClosedByDate = s.apply_end_at ? now > new Date(s.apply_end_at) : false;
                const isFull = s.remaining <= 0;
                const isSoldOut = s.status === '마감' || isClosedByDate || isFull;
                const statusText = isClosedByDate
                  ? '신청기간이 끝났습니다.'
                  : isFull
                    ? '신청인원이 가득찼습니다.'
                    : '모집중';
                return (
                  <div key={s.id} className={`bg-white rounded-xl shadow p-6 md:flex md:items-center md:justify-between md:gap-6 ${isSoldOut ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-4 md:gap-6">
                      {s.image_url ? (
                        <img
                          src={s.image_url}
                          alt={s.title}
                          className="w-24 h-24 rounded-lg object-cover border border-gray-200"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-lg bg-gray-200 border border-gray-300" />
                      )}
                      <div>
                        <h3 className="font-semibold">
                          {s.sport} · {s.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-2">
                          신청기간: {new Date(s.apply_start_at).toLocaleDateString()} ~{' '}
                          {new Date(s.apply_end_at).toLocaleDateString()}
                        </p>
                        <p className="mt-2 text-sm">
                          정원/신청/잔여:{' '}
                          <b>{s.capacity ?? 0}</b> /{' '}
                          <b>{Math.max(0, (s.capacity ?? 0) - (s.remaining ?? 0))}</b> /{' '}
                          <b>{s.remaining ?? 0}</b>
                        </p>
                        <p className="mt-1 text-xs text-gray-500">상태: {statusText}</p>
                      </div>
                    </div>
                    {isSoldOut ? (
                      <button className="mt-4 md:mt-0 w-full md:w-auto px-5 py-2 rounded-lg font-semibold bg-white/60 text-gray-500 border border-gray-200 cursor-not-allowed">
                        마감
                      </button>
                    ) : (
                      <Link
                        to="/apply"
                        className="mt-4 md:mt-0 w-full md:w-auto px-5 py-2 rounded-lg font-semibold bg-white/90 text-blue-700 shadow-md shadow-blue-900/20 border border-gray-200 hover:bg-white transition text-center"
                      >
                        신청하기
                      </Link>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 text-center text-sm text-gray-500">
        © 2026 Wev Service · 문의: 000-0000-0000
      </footer>
      {popups.length > 0 && (
        <div className="fixed top-6 left-6 z-40 flex flex-wrap items-start justify-start gap-4">
            {popups.map((popup) => (
              <div key={popup.id} className="relative rounded-xl bg-white shadow-xl border border-gray-200 overflow-hidden">
                <button
                  className="absolute right-2 top-2 text-white/90 hover:text-white bg-black/40 rounded-full w-6 h-6 flex items-center justify-center"
                  onClick={() => handlePopupClose(popup.id)}
                >
                  ×
                </button>
                <div
                  className="bg-gray-100"
                  style={{
                    width: popup.size === '800x600' ? 400 : 300,
                    height: popup.size === '800x600' ? 300 : 400
                  }}
                >
                  {popup.image_url ? (
                    <img
                      src={popup.image_url}
                      alt="popup"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex items-center justify-end gap-2 px-3 py-2 text-xs text-gray-600 bg-white">
                  <span>하루동안 보지않기</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={!!popupChecks[popup.id]}
                    onChange={(e) =>
                      setPopupChecks((prev) => ({ ...prev, [popup.id]: e.target.checked }))
                    }
                  />
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
