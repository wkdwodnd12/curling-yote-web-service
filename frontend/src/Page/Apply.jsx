import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Apply = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [requestNote, setRequestNote] = useState('');
  const [memo, setMemo] = useState('');
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/sections`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load sections');
        setSections(data);
        if (data[0]?.id) setSelectedSessionId(String(data[0].id));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [API_BASE]);

  const types = useMemo(() => {
    const set = new Set(sections.map((s) => s.sport).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [sections]);

  const filteredSections = useMemo(() => {
    if (typeFilter === 'all') return sections;
    return sections.filter((s) => s.sport === typeFilter);
  }, [sections, typeFilter]);

  const selectedSection = useMemo(
    () => sections.find((s) => String(s.id) === String(selectedSessionId)),
    [sections, selectedSessionId]
  );
  const isSoldOut = selectedSection ? (selectedSection.status === '마감' || selectedSection.remaining <= 0) : false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedSessionId || !name || !phone) {
      setError('오류코드: E400-REQUIRED | 회차, 이름, 전화번호를 입력해주세요.');
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError('오류코드: E401-AUTH | 로그인이 필요합니다.');
        return;
      }
      const res = await fetch(`${API_BASE}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          section_id: Number(selectedSessionId),
          name,
          phone,
          participants: null,
          request_note: requestNote || null,
          memo: memo || null
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          if (data.error === 'Application not started') {
            throw new Error('오류코드: E409-NOT-STARTED | 아직 신청 기간이 아닙니다.');
          }
          if (data.error === 'Application closed') {
            throw new Error('오류코드: E409-CLOSED | 신청 기간이 종료되었습니다.');
          }
          if (data.error === 'Already applied') {
            throw new Error('오류코드: E409-DUPLICATE | 이미 신청한 전화번호입니다.');
          }
          if (data.error === 'Sold out') {
            throw new Error('오류코드: E409-SOLD-OUT | 마감된 회차입니다.');
          }
          throw new Error(`오류코드: E409-UNKNOWN | ${data.error || '신청이 불가합니다.'}`);
        }
        if (res.status === 400 && data.error === 'Invalid phone format') {
          throw new Error('오류코드: E400-PHONE | 전화번호 형식이 올바르지 않습니다.');
        }
        if (res.status === 404 && data.error === 'Section not found') {
          throw new Error('오류코드: E404-SECTION | 해당 회차를 찾을 수 없습니다.');
        }
        throw new Error(`오류코드: E${res.status}-UNKNOWN | ${data.error || '신청에 실패했습니다.'}`);
      }
      setName('');
      setPhone('');
      setRequestNote('');
      setMemo('');
      window.alert('신청이 완료되었습니다.');
      navigate('/home');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">강습 신청</h1>
          <p className="text-sm text-gray-600">컬링·요트 회차를 선택하고 신청 정보를 입력하세요.</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">회차 선택</h2>
            <div className="space-y-3">
              <label className="block text-sm text-gray-700">종목</label>
              <select
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t === 'all' ? '전체' : t}
                  </option>
                ))}
              </select>
              <label className="block text-sm text-gray-700">회차</label>
              <select
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
              >
                {filteredSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.sport} · {s.title} ({new Date(s.apply_start_at).toLocaleDateString()} ~ {new Date(s.apply_end_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
              {loading && <p className="text-sm text-gray-500">회차를 불러오는 중...</p>}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">신청자 정보</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700">이름</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700">전화번호</label>
                <input
                  value={phone}
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
                    setPhone(formatted);
                  }}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="010-0000-0000"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700">이메일</label>
                <input className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="you@example.com" />
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">추가 정보</h2>
          <div>
            <label className="block text-sm text-gray-700">요청 사항</label>
            <input
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="예: 장비 대여"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700">메모</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
        </section>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm">
            {error && <span className="text-red-600 font-medium">{error}</span>}
            {!error && <span className="text-gray-600">신청 정보를 입력한 뒤 제출하세요.</span>}
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSoldOut}
            className={`px-6 py-3 rounded-lg font-semibold shadow-sm ${
              isSoldOut
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            신청 제출
          </button>
        </div>
      </div>
    </div>
  );
};

export default Apply;
