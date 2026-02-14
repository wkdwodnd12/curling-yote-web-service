const pad2 = (value) => String(value).padStart(2, '0');

const makeDates = (year, month, days) =>
  days.map((day) => `${year}-${pad2(month)}-${pad2(day)}`);

const makeEvent = (date, title, color) => ({
  date,
  title,
  color
});

const makeEvents = (year, month, days, title, color, suffix = '') =>
  makeDates(year, month, days).map((date) =>
    makeEvent(date, suffix ? `${title} ${suffix}` : title, color)
  );

const A_COLORS = {
  oneday: '#9EBAC8',
  sailpo: '#C5D3C1',
  youth: '#D4D1D6',
  holiday: '#E7D6C4'
};

export const marineSportsFarm = {
  id: 'marine',
  label: '강릉 해양스포츠팜',
  range: { start: '2026-03', end: '2026-12' },
  events: [
    ...makeEvents(2026, 3, [18, 19, 21, 22, 25, 26, 28, 29], '원데이', A_COLORS.oneday),
    ...makeEvents(
      2026,
      4,
      [4, 5, 11, 12, 18, 19, 25, 26],
      '세일포(주말)',
      A_COLORS.sailpo
    ),
    ...makeEvents(
      2026,
      4,
      [2, 4, 5, 8, 9, 11, 12, 15, 16, 18, 19, 22, 23, 25, 26, 29, 30],
      '원데이',
      A_COLORS.oneday
    ),
    ...makeEvents(
      2026,
      5,
      [2, 3, 16, 17, 23, 24, 30, 31],
      '세일포(주말)',
      A_COLORS.sailpo
    ),
    ...makeEvents(
      2026,
      5,
      [2, 3, 13, 14, 16, 17, 20, 21, 23, 24, 27, 28, 30, 31],
      '원데이',
      A_COLORS.oneday
    ),
    ...makeEvents(
      2026,
      6,
      [6, 7, 13, 14, 20, 21, 27, 28],
      '세일포(주말)',
      A_COLORS.sailpo
    ),
    ...makeEvents(
      2026,
      6,
      [3, 4, 6, 7, 10, 11, 13, 14, 17, 18, 20, 21, 24, 25, 27, 28],
      '원데이',
      A_COLORS.oneday
    ),
    ...makeEvents(2026, 6, [20, 21, 27, 28], '유스마린', A_COLORS.youth),
    ...makeEvents(
      2026,
      7,
      [4, 5, 11, 12, 18, 19, 25, 26],
      '세일포(주말)',
      A_COLORS.sailpo
    ),
    ...makeEvents(
      2026,
      7,
      [1, 2, 4, 5, 8, 9, 11, 12, 15, 16, 18, 19, 22, 23, 25, 26, 29, 30],
      '원데이',
      A_COLORS.oneday
    ),
    ...makeEvents(2026, 7, [11, 12, 18, 19, 25, 26], '유스마린', A_COLORS.youth),
    ...makeEvents(
      2026,
      8,
      [1, 2, 15, 16, 22, 23, 29, 30],
      '세일포(주말)',
      A_COLORS.sailpo
    ),
    ...makeEvents(
      2026,
      8,
      [1, 2, 5, 6, 8, 9, 12, 13, 15, 16, 19, 20, 22, 23, 26, 27, 29, 30],
      '원데이',
      A_COLORS.oneday
    ),
    ...makeEvents(2026, 8, [8, 9, 15, 16, 29, 30], '유스마린', A_COLORS.youth),
    ...makeEvents(2026, 9, [5, 6, 12, 13, 19, 20], '세일포(주말)', A_COLORS.sailpo),
    ...makeEvents(
      2026,
      9,
      [2, 3, 5, 6, 9, 10, 12, 13, 16, 17, 19, 20, 23, 30],
      '원데이',
      A_COLORS.oneday
    ),
    ...makeEvents(2026, 9, [5, 6, 12, 13], '유스마린', A_COLORS.youth),
    ...makeEvents(2026, 9, [24, 25, 26, 27], '추석연휴', A_COLORS.holiday),
    ...makeEvents(2026, 10, [3, 4, 10, 11, 24, 25], '세일포(주말)', A_COLORS.sailpo),
    ...makeEvents(
      2026,
      10,
      [1, 3, 4, 7, 8, 10, 11, 14, 15, 24, 25, 28, 29],
      '원데이',
      A_COLORS.oneday
    ),
    ...makeEvents(
      2026,
      11,
      [7, 8, 14, 15, 21, 22, 28, 29],
      '세일포(주말)',
      A_COLORS.sailpo
    ),
    ...makeEvents(
      2026,
      11,
      [1, 4, 7, 8, 11, 14, 15, 18, 21, 22, 28, 29],
      '원데이',
      A_COLORS.oneday
    ),
    ...makeEvents(2026, 12, [2, 3, 5, 6, 9, 10, 12, 13, 19, 20], '원데이', A_COLORS.oneday)
  ]
};

const B_COLORS = {
  student: '#9EBAC8',
  lesson: '#CFE0C1',
  league: '#E2C9D7'
};

export const curlingWin = {
  id: 'curling',
  label: '컬링윈',
  range: { start: '2026-03', end: '2026-11' },
  events: [
    ...makeEvents(
      2026,
      3,
      [21, 28],
      '학생 컬링체험교실',
      B_COLORS.student,
      '13:00~14:00'
    ),
    ...makeEvents(
      2026,
      4,
      [4, 11, 18, 25],
      '학생 컬링체험교실',
      B_COLORS.student,
      '13:00~14:00'
    ),
    ...makeEvents(
      2026,
      5,
      [2, 9, 16, 23, 30],
      '학생 컬링체험교실',
      B_COLORS.student,
      '13:00~14:00'
    ),
    ...makeEvents(
      2026,
      6,
      [13, 20, 27],
      '학생 컬링체험교실',
      B_COLORS.student,
      '13:00~14:00'
    ),
    ...makeEvents(
      2026,
      7,
      [4, 11, 18, 25],
      '학생 컬링체험교실',
      B_COLORS.student,
      '13:00~14:00'
    ),
    ...makeEvents(
      2026,
      8,
      [1, 8],
      '학생 컬링체험교실',
      B_COLORS.student,
      '13:00~14:00'
    ),
    ...makeEvents(
      2026,
      3,
      [17, 19, 24, 26],
      '컬링강습회',
      B_COLORS.lesson,
      '19:00~21:00'
    ),
    ...makeEvents(
      2026,
      4,
      [1, 2, 7, 9, 14, 16, 21, 23, 28, 29],
      '컬링강습회',
      B_COLORS.lesson,
      '19:00~21:00'
    ),
    ...makeEvents(
      2026,
      5,
      [6, 7, 12, 14, 19, 21, 26, 28],
      '컬링강습회',
      B_COLORS.lesson,
      '19:00~21:00'
    ),
    ...makeEvents(
      2026,
      6,
      [2, 4, 9, 11, 16, 18, 23, 25],
      '컬링강습회',
      B_COLORS.lesson,
      '19:00~21:00'
    ),
    ...makeEvents(
      2026,
      7,
      [1, 2, 7, 9, 14, 16, 21, 23, 28, 29],
      '컬링강습회',
      B_COLORS.lesson,
      '19:00~21:00'
    ),
    ...makeEvents(
      2026,
      8,
      [4, 6, 11, 13, 18, 20, 25, 27],
      '컬링강습회',
      B_COLORS.lesson,
      '19:00~21:00'
    ),
    ...makeEvents(
      2026,
      9,
      [1, 3, 8, 10, 15, 17, 22, 23],
      '컬링강습회',
      B_COLORS.lesson,
      '19:00~21:00'
    ),
    ...makeEvents(
      2026,
      10,
      [6, 7, 13, 15],
      '컬링강습회',
      B_COLORS.lesson,
      '19:00~21:00'
    ),
    ...makeEvents(
      2026,
      9,
      [5, 12, 19],
      '동호인 컬링리그',
      B_COLORS.league,
      '토 15:00~18:00'
    ),
    ...makeEvents(
      2026,
      9,
      [6, 13, 20],
      '동호인 컬링리그',
      B_COLORS.league,
      '일 12:00~15:00'
    ),
    ...makeEvents(2026, 9, [24, 25, 26, 27], '추석연휴', A_COLORS.holiday),
    ...makeEvents(
      2026,
      10,
      [10, 17, 24, 31],
      '동호인 컬링리그',
      B_COLORS.league,
      '토 15:00~18:00'
    ),
    ...makeEvents(
      2026,
      10,
      [11, 18, 25],
      '동호인 컬링리그',
      B_COLORS.league,
      '일 12:00~15:00'
    ),
    ...makeEvents(
      2026,
      11,
      [7],
      '동호인 컬링리그',
      B_COLORS.league,
      '토 15:00~18:00'
    ),
    ...makeEvents(
      2026,
      11,
      [1, 8],
      '동호인 컬링리그',
      B_COLORS.league,
      '일 12:00~15:00'
    )
  ]
};
