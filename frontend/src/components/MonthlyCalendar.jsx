import { useMemo, useState } from 'react';

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

const clampMonth = (value, min, max) => Math.min(Math.max(value, min), max);

const parseMonth = (value) => {
  const [year, month] = value.split('-').map(Number);
  return { year, month };
};

const monthToValue = ({ year, month }) => year * 12 + (month - 1);

const valueToMonth = (value) => {
  const year = Math.floor(value / 12);
  const month = (value % 12) + 1;
  return { year, month };
};

const formatMonthTitle = ({ year, month }) => `${year}년 ${month}월`;

const formatDateKey = ({ year, month, day }) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const buildCalendarMatrix = ({ year, month }) => {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const totalDays = lastDay.getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < startOffset; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= totalDays; day += 1) {
    cells.push({ year, month, day });
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
};

const groupEventsByDate = (events) =>
  events.reduce((acc, event) => {
    acc[event.date] = acc[event.date] ? [...acc[event.date], event] : [event];
    return acc;
  }, {});

const MonthlyCalendar = ({ title, range, events, compact = false }) => {
  const startMonth = parseMonth(range.start);
  const endMonth = parseMonth(range.end);
  const startValue = monthToValue(startMonth);
  const endValue = monthToValue(endMonth);
  const [currentValue, setCurrentValue] = useState(startValue);

  const current = useMemo(() => valueToMonth(currentValue), [currentValue]);
  const matrix = useMemo(() => buildCalendarMatrix(current), [current]);
  const eventMap = useMemo(() => groupEventsByDate(events), [events]);

  const handlePrev = () => {
    setCurrentValue((prev) => clampMonth(prev - 1, startValue, endValue));
  };

  const handleNext = () => {
    setCurrentValue((prev) => clampMonth(prev + 1, startValue, endValue));
  };

  return (
    <section className="rounded-2xl border border-blue-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4 bg-blue-50/40">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentValue === startValue}
          className="h-9 w-9 rounded-md border border-blue-100 text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ←
        </button>
        <div className="text-center">
          <div className="text-sm text-blue-600">{title}</div>
          <div className="text-xl font-bold text-gray-900">
            {formatMonthTitle(current)}
          </div>
        </div>
        <button
          type="button"
          onClick={handleNext}
          disabled={currentValue === endValue}
          className="h-9 w-9 rounded-md border border-blue-100 text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-blue-100 bg-blue-50/50 text-xs font-semibold">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className={`px-3 py-2 text-center ${
              day === '토'
                ? 'text-blue-600'
                : day === '일'
                  ? 'text-red-600'
                  : 'text-emerald-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {matrix.map((cell, idx) => {
          if (!cell) {
            return (
              <div
                key={`empty-${idx}`}
                className={`border-b border-r border-blue-50 bg-blue-50/30 ${
                  compact ? 'h-28' : 'h-28'
                }`}
              />
            );
          }

          const dateKey = formatDateKey(cell);
          const dayEvents = eventMap[dateKey] || [];
          const visibleEvents = dayEvents.slice(0, 3);
          const hiddenCount = dayEvents.length - visibleEvents.length;

          return (
            <div
              key={dateKey}
              className={`border-b border-r border-blue-50 px-2 py-2 text-xs overflow-hidden ${
                compact ? 'h-28' : 'h-28'
              }`}
            >
              <div className="text-[11px] font-semibold text-gray-700">
                {cell.day}
              </div>
              <div className={`space-y-1 ${compact ? 'mt-1' : 'mt-2'}`}>
                {visibleEvents.map((event, eventIdx) => (
                  <div
                    key={`${dateKey}-${eventIdx}`}
                    className={`truncate rounded-md text-center font-semibold text-gray-800 ${
                      compact ? 'text-[10px] px-2 py-0.5' : 'text-[11px] px-2 py-1'
                    }`}
                    style={{ backgroundColor: event.color }}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {hiddenCount > 0 && (
                  <div className="text-[10px] text-gray-500 text-center">
                    +{hiddenCount} 더보기
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default MonthlyCalendar;
