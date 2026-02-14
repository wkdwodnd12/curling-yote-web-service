import { useState } from 'react';
import { Link } from 'react-router-dom';
import MonthlyCalendar from '../components/MonthlyCalendar';
import { marineSportsFarm, curlingWin } from '../data/calendarData';

const TABS = [
  { id: 'marine', label: '해양스포츠팜', data: marineSportsFarm },
  { id: 'curling', label: '컬링윈', data: curlingWin }
];

const Schedule = () => {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const active = TABS.find((tab) => tab.id === activeTab)?.data || TABS[0].data;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-sky-500/10 via-blue-600/10 to-blue-800/10 text-gray-900"
      style={{
        fontFamily: "'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"
      }}
    >
      <header className="bg-transparent text-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-center relative">
          <Link to="/home" className="absolute left-6 top-1/2 -translate-y-1/2">
            <div className="text-sm font-semibold text-blue-700 hover:text-blue-800">
              Wev Service
            </div>
          </Link>
          <div className="text-sm text-gray-500 max-w-[55%] text-center">
            월 단위로 프로그램을 확인할 수 있습니다.
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-2xl border border-blue-100 bg-white shadow-sm p-4">
            <div className="text-sm font-semibold text-gray-700">캘린더 선택</div>
            <div className="mt-3 space-y-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-blue-50/60 text-gray-700 hover:bg-blue-100/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </aside>

          <MonthlyCalendar
            key={active.id}
            title={active.label}
            range={active.range}
            events={active.events}
            compact
          />
        </div>
      </main>
    </div>
  );
};

export default Schedule;
