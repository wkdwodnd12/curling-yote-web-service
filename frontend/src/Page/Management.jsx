import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  uploadSectionImage,
  validateImageFile,
  removeSectionImageByUrl,
  removeSectionImageByPath
} from '../lib/sectionImages';
import { uploadPopupImage, removePopupImageByUrl, validatePopupImage } from '../lib/popupImages';
import { supabase } from '../lib/supabaseClient';

const sidebarItems = [
  { key: 'dashboard', label: '대시보드' },
  { key: 'sections', label: '강습/회차 관리' },
  { key: 'applications', label: '신청자 관리' },
  { key: 'notice', label: '팝업/공지' },
  { key: 'home', label: '홈 화면으로' },
  { key: 'logout', label: '로그아웃' }
];

const statusBadge = (status) => {
  const base = 'inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-xs font-semibold rounded-full border';
  switch (status) {
    case 'CONFIRMED':
      return `${base} bg-green-50 text-green-700 border-green-200`;
    case 'CANCELLED':
      return `${base} bg-red-50 text-red-700 border-red-200`;
    case 'APPLIED':
      return `${base} bg-blue-50 text-blue-700 border-blue-200`;
    case '마감':
      return `${base} bg-gray-100 text-gray-700 border-gray-200`;
    case '모집중':
      return `${base} bg-blue-50 text-blue-700 border-blue-200`;
    default:
      return `${base} bg-blue-50 text-blue-700 border-blue-200`;
  }
};

const statusLabel = (status) => {
  if (status === 'CANCELLED') return '취소됨';
  if (status === 'APPLIED') return '신청됨';
  return status || '';
};

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}. ${pad(date.getMonth() + 1)}. ${pad(date.getDate())}. ${pad(date.getHours())}시 ${pad(date.getMinutes())}분`;
};

const Management = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [popupEnabled, setPopupEnabled] = useState(false);
  const [applications, setApplications] = useState([]);
  const [appLoading, setAppLoading] = useState(false);
  const [appError, setAppError] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sections, setSections] = useState([]);
  const [sectionForm, setSectionForm] = useState({
    sport: '',
    title: '',
    apply_start_at: '',
    apply_end_at: '',
    capacity: '',
    remaining: '',
    status: '모집중'
  });
  const [sportOptions, setSportOptions] = useState(['컬링', '요트']);
  const [addingSport, setAddingSport] = useState(false);
  const [editingSport, setEditingSport] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [sessionMessage, setSessionMessage] = useState('');
  const [sessionError, setSessionError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [popupSize, setPopupSize] = useState('600x800');
  const [popupStart, setPopupStart] = useState('');
  const [popupEnd, setPopupEnd] = useState('');
  const [popupFile, setPopupFile] = useState(null);
  const [popupPreview, setPopupPreview] = useState('');
  const [popupInputKey, setPopupInputKey] = useState(0);
  const [popupSaving, setPopupSaving] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupError, setPopupError] = useState('');
  const [popups, setPopups] = useState([]);
  const [popupsLoading, setPopupsLoading] = useState(false);
  const [popupsError, setPopupsError] = useState('');
  const [selectedApplicationIds, setSelectedApplicationIds] = useState(new Set());
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

  const getAuthToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || '';
  };

  const dashboardRows = useMemo(() => applications.slice(0, 5), [applications]);

  const sectionRows = useMemo(
    () =>
      [...sections].sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      ),
    [sections]
  );

  const applicationsRows = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, idx) => ({
        time: `2026-01-26 0${Math.floor(idx / 2) + 8}:${(idx % 2) ? '40' : '20'}`,
        name: `신청자${idx + 1}`,
        phone: `010-55${idx}0-12${idx}3`,
        session: idx % 2 === 0 ? '컬링 체험 1회차' : '요트 입문 1회차',
        status: idx % 3 === 0 ? 'CONFIRMED' : idx % 4 === 0 ? 'CANCELLED' : 'APPLIED'
      })),
    []
  );

  const metrics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 6);
    const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const todayCount = applications.filter((a) => {
      const d = new Date(a.created_at);
      return d >= startOfToday;
    }).length;

    const weekCount = applications.filter((a) => {
      const d = new Date(a.created_at);
      return d >= startOfWeek;
    }).length;

    const imminentCount = sections.filter((s) => {
      if (s.status !== '모집중' || !s.apply_end_at) return false;
      const end = new Date(s.apply_end_at);
      return end >= now && end <= twoDaysLater;
    }).length;

    const activeCount = sections.filter((s) => s.status === '모집중').length;

    return [
      { label: '오늘 신청 수', value: String(todayCount) },
      { label: '이번 주 신청 수', value: String(weekCount) },
      { label: '현재 진행중인 강습 수', value: String(activeCount) },
      { label: '마감 임박 회차', value: String(imminentCount) }
    ];
  }, [applications, sections]);

  useEffect(() => {
    const loadSections = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/sections?status=전체`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load sections');
        setSections(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadSections();
  }, [API_BASE]);

  const reloadSections = async () => {
    const res = await fetch(`${API_BASE}/api/sections?status=전체`);
    const data = await res.json();
    if (res.ok) setSections(data);
  };

  const loadApplications = async () => {
    setAppLoading(true);
    setAppError('');
    try {
      const params = new URLSearchParams();
      if (sectionFilter) params.set('section_id', sectionFilter);
      if (query) params.set('q', query);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`${API_BASE}/api/applications?${params.toString()}`, {
        headers: { Authorization: `Bearer ${await getAuthToken()}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load applications');
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      setAppError(err.message);
    } finally {
      setAppLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'applications' && activeTab !== 'dashboard') return;
    loadApplications();
  }, [API_BASE, activeTab, sectionFilter, query, statusFilter]);

  const loadPopups = async () => {
    setPopupsLoading(true);
    setPopupsError('');
    try {
      const res = await fetch(`${API_BASE}/api/popups`, {
        headers: { Authorization: `Bearer ${await getAuthToken()}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '팝업 목록을 불러오지 못했습니다.');
      setPopups(data);
    } catch (err) {
      setPopupsError(err.message);
    } finally {
      setPopupsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'notice') return;
    loadPopups();
  }, [API_BASE, activeTab]);

  useEffect(() => {
    return () => {
      if (popupPreview) {
        URL.revokeObjectURL(popupPreview);
      }
    };
  }, [popupPreview]);

  const handleApplicationDetail = (row) => {
    setSelectedApplication(row);
  };

  const handleApplicationDelete = async (row) => {
    const reason = window.prompt('삭제 사유를 입력해주세요. (선택)');
    if (reason === null) return;
    const ok = window.confirm('해당 신청자를 삭제하시겠습니까?');
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE}/api/applications/${row.id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({ cancel_reason: reason || null })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '삭제에 실패했습니다.');
      setApplications((prev) => prev.filter((item) => item.id !== row.id));
      await loadApplications();
      await reloadSections();
    } catch (err) {
      window.alert(err.message);
    }
  };

  const handlePopupFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (popupPreview) {
      URL.revokeObjectURL(popupPreview);
    }
    const nextPreview = URL.createObjectURL(file);
    setPopupPreview(nextPreview);
    setPopupFile(file);
  };

  const handlePopupClear = () => {
    if (popupPreview) {
      URL.revokeObjectURL(popupPreview);
    }
    setPopupPreview('');
    setPopupFile(null);
    setPopupInputKey((k) => k + 1);
  };

  const handlePopupSave = async () => {
    setPopupMessage('');
    setPopupError('');
    const imageError = validatePopupImage(popupFile);
    if (imageError) {
      setPopupError(imageError);
      return;
    }
    if (!popupStart || !popupEnd) {
      setPopupError('노출 시작일과 종료일을 입력해주세요.');
      return;
    }
    if (popupStart > popupEnd) {
      setPopupError('노출 시작일은 종료일보다 빠르거나 같아야 합니다.');
      return;
    }

    setPopupSaving(true);
    let uploadedUrl = '';
    try {
      const idOrUuid = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      const { publicUrl } = await uploadPopupImage(popupFile, idOrUuid);
      uploadedUrl = publicUrl;
      const res = await fetch(`${API_BASE}/api/popups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({
          image_url: publicUrl,
          size: popupSize,
          start_at: popupStart,
          end_at: popupEnd
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '팝업 저장에 실패했습니다.');
      window.alert('저장되었습니다.');
      setPopupSize('600x800');
      setPopupStart('');
      setPopupEnd('');
      handlePopupClear();
      setPopupMessage('');
      setPopupError('');
      await loadPopups();
    } catch (err) {
      if (uploadedUrl) {
        await removePopupImageByUrl(uploadedUrl);
      }
      setPopupError(err.message);
    } finally {
      setPopupSaving(false);
    }
  };

  const handlePopupToggle = async (row) => {
    try {
      const res = await fetch(`${API_BASE}/api/popups/${row.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({ is_active: !row.is_active })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '상태 변경에 실패했습니다.');
      setPopups((prev) => prev.map((p) => (p.id === row.id ? data : p)));
    } catch (err) {
      window.alert(err.message);
    }
  };

  const handlePopupDelete = async (row) => {
    const ok = window.confirm('해당 팝업을 삭제하시겠습니까?');
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE}/api/popups/${row.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${await getAuthToken()}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '삭제에 실패했습니다.');
      if (row.image_url) {
        await removePopupImageByUrl(row.image_url);
      }
      setPopups((prev) => prev.filter((p) => p.id !== row.id));
    } catch (err) {
      window.alert(err.message);
    }
  };

  const handleExportExcel = () => {
    const selected = applications.filter((row) => selectedApplicationIds.has(row.id));
    if (!selected.length) {
      window.alert('선택된 신청 내역이 없습니다.');
      return;
    }
    const rows = selected.map((row) => ({
      신청시간: row.created_at || '',
      신청자: row.name || '',
      전화번호: row.phone || '',
      종목: row.sections?.sport || '',
      회차명: row.sections?.title || '',
      신청기간: `${row.sections?.apply_start_at ? new Date(row.sections.apply_start_at).toLocaleDateString() : ''} ~ ${row.sections?.apply_end_at ? new Date(row.sections.apply_end_at).toLocaleDateString() : ''}`,
      상태: row.sections?.status || '',
      '참가 인원': row.participants ?? '',
      '요청 사항': row.request_note ?? '',
      메모: row.memo ?? ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');
    XLSX.writeFile(workbook, `applications_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const toggleApplicationSelection = (rowId, checked) => {
    setSelectedApplicationIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(rowId);
      } else {
        next.delete(rowId);
      }
      return next;
    });
  };

  const toggleSelectAll = (list, checked) => {
    setSelectedApplicationIds((prev) => {
      const next = new Set(prev);
      list.forEach((row) => {
        if (checked) {
          next.add(row.id);
        } else {
          next.delete(row.id);
        }
      });
      return next;
    });
  };

  const isAllSelected = (list) =>
    list.length > 0 && list.every((row) => selectedApplicationIds.has(row.id));

  const isApplicationSelected = (rowId) => selectedApplicationIds.has(rowId);

  const renderDashboard = () => (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
            <div className="text-sm text-gray-500">{m.label}</div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">최근 신청</h3>
          <button
            type="button"
            onClick={handleExportExcel}
            className="h-8 px-3 rounded-md border border-gray-200 text-xs text-gray-600 hover:bg-gray-100"
          >
            엑셀 다운로드
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-3 text-left">
                  <label className="inline-flex items-center gap-2 text-xs text-gray-600 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={isAllSelected(dashboardRows)}
                      onChange={(e) => toggleSelectAll(dashboardRows, e.target.checked)}
                    />
                    전체
                  </label>
                </th>
                <th className="px-6 py-3 text-left">신청시간</th>
                <th className="px-6 py-3 text-left">신청자</th>
                <th className="px-6 py-3 text-left">전화번호</th>
                <th className="px-6 py-3 text-left">회차</th>
                <th className="px-6 py-3 text-left">상태</th>
                <th className="px-6 py-3 text-left">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appLoading && (
                <tr>
                  <td className="px-6 py-4 text-gray-500" colSpan={7}>
                    불러오는 중...
                  </td>
                </tr>
              )}
              {appError && (
                <tr>
                  <td className="px-6 py-4 text-red-600" colSpan={7}>
                    {appError}
                  </td>
                </tr>
              )}
              {!appLoading && !appError && dashboardRows.length === 0 && (
                <tr>
                  <td className="px-6 py-4 text-gray-500" colSpan={7}>
                    최근 신청이 없습니다.
                  </td>
                </tr>
              )}
              {!appLoading &&
                !appError &&
                dashboardRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={isApplicationSelected(row.id)}
                        onChange={(e) => toggleApplicationSelection(row.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-6 py-3 text-gray-900">{formatDateTime(row.created_at)}</td>
                    <td className="px-6 py-3 text-gray-900">{row.name}</td>
                    <td className="px-6 py-3 text-gray-700">{row.phone}</td>
                    <td className="px-6 py-3 text-gray-900">
                      {row.sections?.sport} · {row.sections?.title}
                    </td>
                    <td className="px-6 py-3">
                      <span className={statusBadge(row.status || 'APPLIED')}>
                        {statusLabel(row.status || 'APPLIED')}
                      </span>
                    </td>
                  <td className="px-6 py-3">
                    <div className="inline-flex items-center gap-2">
                      <button
                        className="h-9 px-4 whitespace-nowrap rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100"
                        onClick={() => handleApplicationDetail(row)}
                      >
                        상세
                      </button>
                      {row.status !== 'CANCELLED' && (
                        <button
                          className="h-9 px-4 whitespace-nowrap rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleApplicationDelete(row)}
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSections = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">강습/회차 관리</h3>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="xl:col-span-2 space-y-1">
            <label className="text-xs font-medium text-gray-600">종목</label>
            <div className="relative">
              <button
                type="button"
                className="w-full h-10 rounded-md border border-gray-200 px-3 text-left text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                onClick={() => setAddingSport((v) => !v)}
              >
                {sectionForm.sport || '종목 선택'}
              </button>
              {addingSport && (
                <div className="absolute z-10 mt-2 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                  <ul className="max-h-56 overflow-auto">
                    {sportOptions.map((opt) => (
                      <li
                        key={opt}
                        className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSectionForm((s) => ({ ...s, sport: opt }));
                          setAddingSport(false);
                        }}
                      >
                        <span className="text-sm text-gray-800">{opt}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="text-xs text-blue-600 hover:text-blue-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSport(opt);
                              setEditValue(opt);
                            }}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              const ok = window.confirm(`${opt} 종목을 삭제할까요?`);
                              if (!ok) return;
                              setSportOptions((prev) => prev.filter((item) => item !== opt));
                              setSectionForm((s) => (s.sport === opt ? { ...s, sport: '' } : s));
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </li>
                    ))}
                    <li className="border-t border-gray-100 px-3 py-2">
                      <button
                        type="button"
                        className="text-sm text-blue-600 hover:text-blue-700"
                        onClick={() => {
                          const input = window.prompt('추가할 종목을 입력해주세요.');
                          const trimmed = input ? input.trim() : '';
                          if (!trimmed) {
                            window.alert('추가할 종목을 입력해주세요.');
                            return;
                          }
                          if (!sportOptions.includes(trimmed)) {
                            setSportOptions((prev) => [...prev, trimmed]);
                          }
                          setSectionForm((s) => ({ ...s, sport: trimmed }));
                          setAddingSport(false);
                        }}
                      >
                        + 새로 추가하기
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1 xl:col-span-2">
            <label className="text-xs font-medium text-gray-600">회차명</label>
            <input
              className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="회차명"
              value={sectionForm.title}
              onChange={(e) => setSectionForm((s) => ({ ...s, title: e.target.value }))}
            />
          </div>

          <div className="space-y-1 xl:col-span-2">
            <label className="text-xs font-medium text-gray-600">대표 이미지</label>
            <input
              type="file"
              accept="image/*"
              className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm file:mr-3 file:border-0 file:bg-gray-100 file:text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              key={fileInputKey}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const msg = validateImageFile(file);
                if (msg) {
                  window.alert(msg);
                  return;
                }
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
              }}
            />
            {uploading && <div className="text-xs text-gray-500">업로드 중...</div>}
            <div className="flex items-center gap-3">
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="h-12 w-12 rounded-md object-cover border border-gray-200" />
              ) : currentImageUrl ? (
                <img src={currentImageUrl} alt="preview" className="h-12 w-12 rounded-md object-cover border border-gray-200" />
              ) : (
                <div className="h-12 w-12 rounded-md bg-gray-200 border border-gray-300" />
              )}
              <button
                type="button"
                className="text-xs text-gray-600 hover:underline"
                onClick={async () => {
                if (!currentImageUrl) {
                  setImageFile(null);
                  setImagePreview('');
                  setFileInputKey((k) => k + 1);
                  return;
                }
                  const ok = window.confirm('이미지를 제거할까요?');
                  if (!ok) return;
                  try {
                    setUploading(true);
                    await removeSectionImageByUrl(currentImageUrl);
                    const res = await fetch(`${API_BASE}/api/sections/${editingSectionId}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${await getAuthToken()}`
                      },
                      body: JSON.stringify({ image_url: null })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || '이미지 제거 실패');
                    setCurrentImageUrl('');
                    setImageFile(null);
                    setImagePreview('');
                    setFileInputKey((k) => k + 1);
                    await reloadSections();
                  } catch (err) {
                    window.alert(err.message);
                  } finally {
                    setUploading(false);
                  }
                }}
              >
                이미지 제거
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">신청 시작</label>
            <input
              type="date"
              className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={sectionForm.apply_start_at ?? ''}
              onChange={(e) => setSectionForm((s) => ({ ...s, apply_start_at: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">신청 종료</label>
            <input
              type="date"
              className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={sectionForm.apply_end_at ?? ''}
              onChange={(e) => setSectionForm((s) => ({ ...s, apply_end_at: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">정원</label>
            <input
              type="number"
              className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="정원"
              value={sectionForm.capacity ?? ''}
              onChange={(e) => setSectionForm((s) => ({ ...s, capacity: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">잔여</label>
            <input
              type="number"
              className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="잔여 (비우면 정원)"
              value={sectionForm.remaining ?? ''}
              onChange={(e) => setSectionForm((s) => ({ ...s, remaining: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">상태</label>
            <select
              className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={sectionForm.status ?? '모집중'}
              onChange={(e) => setSectionForm((s) => ({ ...s, status: e.target.value }))}
            >
              <option value="모집중">모집중</option>
              <option value="마감">마감</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="h-10 px-4 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
            disabled={saving || uploading}
            onClick={async () => {
              setSessionError('');
              setSessionMessage('');
              try {
                setSaving(true);
                let uploadedUrl = currentImageUrl;
                let uploadedPath = null;
                if (imageFile) {
                  setUploading(true);
                  const { publicUrl, path } = await uploadSectionImage(
                    imageFile,
                    crypto.randomUUID()
                  );
                  uploadedUrl = publicUrl;
                  uploadedPath = path;
                  setUploading(false);
                }

                const payload = {
                  sport: sectionForm.sport,
                  title: sectionForm.title,
                  apply_start_at: sectionForm.apply_start_at,
                  apply_end_at: sectionForm.apply_end_at,
                  capacity: Number(sectionForm.capacity),
                  remaining: sectionForm.remaining ? Number(sectionForm.remaining) : undefined,
                  status: sectionForm.status,
                  image_url: uploadedUrl || null
                };

                const res = await fetch(
                  `${API_BASE}/api/sections${editingSectionId ? `/${editingSectionId}` : ''}`,
                  {
                    method: editingSectionId ? 'PUT' : 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${await getAuthToken()}`
                    },
                    body: JSON.stringify(payload)
                  }
                );
                const data = await res.json();
                if (!res.ok) {
                  if (uploadedPath) await removeSectionImageByPath(uploadedPath);
                  throw new Error(data.error || '저장 실패');
                }

                if (editingSectionId && imageFile && currentImageUrl) {
                  await removeSectionImageByUrl(currentImageUrl);
                }

                setSessionMessage(editingSectionId ? '회차가 수정되었습니다.' : '회차가 등록되었습니다.');
                setSectionForm({
                  sport: '',
                  title: '',
                  apply_start_at: '',
                  apply_end_at: '',
                  capacity: '',
                  remaining: '',
                  status: '모집중'
                });
                setEditingSectionId(null);
                setImageFile(null);
                setImagePreview('');
                setCurrentImageUrl('');
                await reloadSections();
              } catch (err) {
                setSessionError(err.message);
              } finally {
                setSaving(false);
              }
            }}
          >
            {editingSectionId ? '수정 저장' : '회차 추가'}
          </button>
          {sessionMessage && <span className="text-sm text-green-700">{sessionMessage}</span>}
          {sessionError && <span className="text-sm text-red-600">{sessionError}</span>}
        </div>
      </div>
      {editingSport && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
            <div className="text-sm font-semibold text-gray-900">어떻게 수정하시겠어요?</div>
            <input
              className="mt-3 h-10 w-full rounded-md border border-gray-200 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="h-9 px-3 rounded-md border border-gray-200 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  setEditingSport(null);
                  setEditValue('');
                }}
              >
                취소
              </button>
              <button
                className="h-9 px-3 rounded-md bg-blue-600 text-sm text-white hover:bg-blue-700"
                onClick={() => {
                  const trimmed = editValue.trim();
                  if (!trimmed) return;
                  setSportOptions((prev) =>
                    prev.map((item) => (item === editingSport ? trimmed : item))
                  );
                  setSectionForm((s) => (s.sport === editingSport ? { ...s, sport: trimmed } : s));
                  setEditingSport(null);
                  setEditValue('');
                }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-3 text-left">종목</th>
              <th className="px-6 py-3 text-left">회차명</th>
              <th className="px-6 py-3 text-left">신청기간</th>
              <th className="px-6 py-3 text-left">정원/신청/잔여</th>
              <th className="px-6 py-3 text-left">상태</th>
              <th className="px-6 py-3 text-left">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sectionRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-gray-900">
                  <div className="flex items-center gap-3">
                    {row.image_url ? (
                      <img
                        src={row.image_url}
                        alt={row.title}
                        className="h-12 w-12 rounded-md object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-gray-200 border border-gray-300" />
                    )}
                    <span>{row.sport}</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-gray-900">{row.title}</td>
                <td className="px-6 py-3 text-gray-700">
                  {row.apply_start_at ? new Date(row.apply_start_at).toLocaleDateString() : '-'} ~{' '}
                  {row.apply_end_at ? new Date(row.apply_end_at).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-3 text-gray-900">
                  {row.capacity} / {row.capacity - row.remaining} / {row.remaining}
                </td>
                <td className="px-6 py-3 text-gray-900">
                  <div className="flex items-center gap-2">
                    <span>{row.status}</span>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-700"
                      onClick={async () => {
                        const ok = window.confirm('해당 종목을 삭제하겠습니까?');
                        if (!ok) return;
                        try {
                          const res = await fetch(`${API_BASE}/api/sections/${row.id}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${await getAuthToken()}` }
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || '삭제 실패');
                          await reloadSections();
                        } catch (err) {
                          window.alert(err.message);
                        }
                      }}
                    >
                      ×
                    </button>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <button
                    type="button"
                    className="h-8 px-3 rounded-md border border-gray-200 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      setEditingSectionId(row.id);
                      setSectionForm({
                        sport: row.sport || '',
                        title: row.title || '',
                        apply_start_at: row.apply_start_at ? row.apply_start_at.slice(0, 10) : '',
                        apply_end_at: row.apply_end_at ? row.apply_end_at.slice(0, 10) : '',
                        capacity: row.capacity !== null && row.capacity !== undefined ? String(row.capacity) : '',
                        remaining: row.remaining !== null && row.remaining !== undefined ? String(row.remaining) : '',
                        status: row.status || '모집중'
                      });
                      setCurrentImageUrl(row.image_url || '');
                      setImagePreview('');
                      setImageFile(null);
                    }}
                  >
                    수정
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderApplications = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">신청자 관리</h3>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
          >
            <option value="">회차 선택</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sport} · {s.title}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">전체보기</option>
            <option value="APPLIED">신청됨</option>
            <option value="CANCELLED">취소됨</option>
          </select>
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="이름/전화번호 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="space-y-2">
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              type="date"
            />
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              type="date"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700">검색</button>
          <button
            className="px-4 py-2 rounded-md border border-gray-200 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => {
              setSectionFilter('');
              setQuery('');
              setStatusFilter('all');
            }}
          >
            초기화
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-3 text-left">
                  <label className="inline-flex items-center gap-2 text-xs text-gray-600 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={isAllSelected(applications)}
                    onChange={(e) => toggleSelectAll(applications, e.target.checked)}
                  />
                  전체
                </label>
              </th>
              <th className="px-6 py-3 text-left">신청시간</th>
              <th className="px-6 py-3 text-left">신청자</th>
              <th className="px-6 py-3 text-left">전화번호</th>
              <th className="px-6 py-3 text-left">회차</th>
              <th className="px-6 py-3 text-left">상태</th>
              <th className="px-6 py-3 text-left">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {appLoading && (
              <tr>
                <td className="px-6 py-4 text-gray-500" colSpan={7}>
                  불러오는 중...
                </td>
              </tr>
            )}
            {appError && (
              <tr>
                <td className="px-6 py-4 text-red-600" colSpan={7}>
                  {appError}
                </td>
              </tr>
            )}
            {!appLoading && !appError && applications.length === 0 && (
              <tr>
                <td className="px-6 py-4 text-gray-500" colSpan={7}>
                  아직 신청 내역이 없습니다.
                </td>
              </tr>
            )}
            {!appLoading &&
              !appError &&
              applications.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={isApplicationSelected(row.id)}
                      onChange={(e) => toggleApplicationSelection(row.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-6 py-3 text-gray-900">{formatDateTime(row.created_at)}</td>
                  <td className="px-6 py-3 text-gray-900">{row.name}</td>
                  <td className="px-6 py-3 text-gray-700">{row.phone}</td>
                  <td className="px-6 py-3 text-gray-900">
                    {row.sections?.sport} · {row.sections?.title}
                  </td>
                <td className="px-6 py-3">
                  <span className={`${statusBadge(row.status || 'APPLIED')} min-w-[64px]`}>
                    {statusLabel(row.status || 'APPLIED')}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <div className="inline-flex items-center gap-2">
                    <button
                      className="h-9 px-4 whitespace-nowrap rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100"
                      onClick={() => handleApplicationDetail(row)}
                    >
                      상세
                    </button>
                    {row.status !== 'CANCELLED' && (
                      <button
                        className="h-9 px-4 whitespace-nowrap rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleApplicationDelete(row)}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderNotice = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">팝업/공지</h3>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-gray-700">이미지 크기</label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '600 × 800', value: '600x800' },
                { label: '800 × 600', value: '800x600' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPopupSize(opt.value)}
                  className={`h-9 px-3 rounded-md border text-sm ${
                    popupSize === opt.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-700">팝업 이미지</label>
            <input
              key={popupInputKey}
              type="file"
              accept="image/*"
              onChange={handlePopupFileChange}
              className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm file:mr-3 file:border-0 file:bg-gray-100 file:text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {popupFile && (
              <button
                type="button"
                className="text-xs text-gray-600 hover:underline"
                onClick={handlePopupClear}
              >
                이미지 제거
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 md:col-span-2">
            <div className="space-y-2">
              <label className="text-sm text-gray-700">노출 시작일</label>
              <input
                type="date"
                value={popupStart}
                onChange={(e) => setPopupStart(e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-700">노출 종료일</label>
              <input
                type="date"
                value={popupEnd}
                onChange={(e) => setPopupEnd(e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-md text-sm ${
              popupSaving
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            onClick={handlePopupSave}
            disabled={popupSaving}
          >
            {popupSaving ? '저장 중...' : '저장'}
          </button>
          <button className="px-4 py-2 rounded-md border border-gray-200 text-sm text-gray-700 hover:bg-gray-100">
            미리보기
          </button>
          {popupMessage && <span className="text-sm text-green-700">{popupMessage}</span>}
          {popupError && <span className="text-sm text-red-600">{popupError}</span>}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="text-sm text-gray-500 mb-2">미리보기</div>
        <div className="flex justify-center">
          <div
            className="relative rounded-lg border border-dashed border-gray-300 bg-gray-50"
            style={{
              width: popupSize === '800x600' ? 400 : 300,
              height: popupSize === '800x600' ? 300 : 400
            }}
          >
            {popupPreview ? (
              <img
                src={popupPreview}
                alt="팝업 미리보기"
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                이미지를 선택하면 미리보기가 표시됩니다.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <div className="text-sm text-gray-500">등록된 팝업</div>
        {popupsLoading && <div className="text-sm text-gray-500">불러오는 중...</div>}
        {popupsError && <div className="text-sm text-red-600">{popupsError}</div>}
        {!popupsLoading && !popupsError && popups.length === 0 && (
          <div className="text-sm text-gray-500">등록된 팝업이 없습니다.</div>
        )}
        <div className="grid gap-3">
          {popups.map((row) => (
            <div key={row.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-4">
                {row.image_url ? (
                  <img
                    src={row.image_url}
                    alt={`popup-${row.id}`}
                    className="h-14 w-14 rounded-md object-cover border border-gray-200"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-md bg-gray-100 border border-gray-200" />
                )}
                <div className="text-sm text-gray-700 space-y-1">
                  <div>크기: {row.size}</div>
                  <div>
                    기간:{' '}
                    {row.start_at ? new Date(row.start_at).toLocaleDateString() : '-'} ~{' '}
                    {row.end_at ? new Date(row.end_at).toLocaleDateString() : '-'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`h-9 px-3 rounded-md border text-sm ${
                    row.is_active
                      ? 'border-green-200 text-green-700 bg-green-50'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => handlePopupToggle(row)}
                >
                  {row.is_active ? '활성화' : '비활성화'}
                </button>
                <button
                  type="button"
                  className="h-9 px-3 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => handlePopupDelete(row)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'sections':
        return renderSections();
      case 'applications':
        return renderApplications();
      case 'notice':
        return renderNotice();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="w-full md:w-64 bg-white border border-gray-200 rounded-xl shadow-sm p-4">
            <div className="text-xl font-bold text-gray-900 mb-4">관리</div>
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    if (item.key === 'home') {
                      navigate('/');
                      return;
                    }
                    if (item.key === 'logout') {
                      localStorage.removeItem('isAdmin');
                      navigate('/login');
                      return;
                    }
                    setActiveTab(item.key);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                    activeTab === item.key
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1 space-y-6">
            <header>
              <h1 className="text-2xl font-bold text-gray-900">관리자 관리</h1>
              <p className="text-sm text-gray-600 mt-1">강습 운영 및 신청 관리를 할 수 있습니다.</p>
            </header>

            {renderContent()}
          </main>
        </div>
      </div>
      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">신청 상세</h2>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setSelectedApplication(null)}
              >
                ×
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <div>
                <span className="text-gray-500">신청시간</span>: {selectedApplication.created_at || ''}
              </div>
              <div>
                <span className="text-gray-500">신청자</span>: {selectedApplication.name || ''}
              </div>
              <div>
                <span className="text-gray-500">전화번호</span>: {selectedApplication.phone || ''}
              </div>
              <div>
                <span className="text-gray-500">종목</span>: {selectedApplication.sections?.sport || ''}
              </div>
              <div>
                <span className="text-gray-500">회차명</span>: {selectedApplication.sections?.title || ''}
              </div>
              <div>
                <span className="text-gray-500">신청기간</span>:{' '}
                {selectedApplication.sections?.apply_start_at
                  ? new Date(selectedApplication.sections.apply_start_at).toLocaleDateString()
                  : ''}{' '}
                ~{' '}
                {selectedApplication.sections?.apply_end_at
                  ? new Date(selectedApplication.sections.apply_end_at).toLocaleDateString()
                  : ''}
              </div>
              <div>
                <span className="text-gray-500">상태</span>: {statusLabel(selectedApplication.status)}
              </div>
              {selectedApplication.status === 'CANCELLED' && (
                <>
                  <div>
                    <span className="text-gray-500">취소시간</span>:{' '}
                    {selectedApplication.cancelled_at
                      ? formatDateTime(selectedApplication.cancelled_at)
                      : ''}
                  </div>
                  <div>
                    <span className="text-gray-500">취소사유</span>: {selectedApplication.cancel_reason || ''}
                  </div>
                </>
              )}
              <div>
                <span className="text-gray-500">참가 인원</span>: {selectedApplication.participants ?? ''}
              </div>
              <div>
                <span className="text-gray-500">요청 사항</span>: {selectedApplication.request_note ?? ''}
              </div>
              <div>
                <span className="text-gray-500">메모</span>: {selectedApplication.memo ?? ''}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                className="h-9 px-4 rounded-md border border-gray-200 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setSelectedApplication(null)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Management;
