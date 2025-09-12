// 공용 날짜 유틸

// Asia/Seoul(KST) 기준 월 범위를 UTC Date로 계산
// 시작: 해당 월 1일 00:00:00.000 KST
// 종료: 해당 월 말일 23:59:59.999 KST (inclusive)
export const getSeoulMonthRange = (month: string) => {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
  if (!m) {
    throw new Error('월은 YYYY-MM 형식으로 입력하세요');
  }
  const year = Number(m[1]);
  const m0 = Number(m[2]) - 1; // 0-based month

  // KST(UTC+9): 00:00 KST = 전일 15:00 UTC
  const start = new Date(Date.UTC(year, m0, 1, -9, 0, 0, 0));
  const nextMonthStart = new Date(Date.UTC(year, m0 + 1, 1, -9, 0, 0, 0));
  const end = new Date(nextMonthStart.getTime() - 1);
  return { start, end };
};
