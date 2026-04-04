import type { TrendingData } from '@/types/trending';

const mockData: TrendingData = {
  days: [
    {
      date: '2026-03-27',
      summary_zh: '今日热点以 AI 推理框架为主。',
      projects: [
        {
          rank: 1,
          name: 'owner/repo',
          url: 'https://github.com/owner/repo',
          description_en: 'A great repo',
          description_zh: '一个很棒的仓库',
          language: 'Python',
          stars_total: 1000,
          stars_today: 100,
        },
      ],
    },
    {
      date: '2026-03-26',
      summary_zh: '昨日热点总结。',
      projects: [],
    },
  ],
};

jest.mock('@/data/trending.json', () => mockData, { virtual: true });

import { getLatestTrendingDay, getTrendingData, getTrendingDayByDate } from '@/lib/trending';

describe('getTrendingData', () => {
  it('returns all days', () => {
    const data = getTrendingData();
    expect(data.days).toHaveLength(2);
  });
});

describe('getLatestTrendingDay', () => {
  it('returns the first day', () => {
    const day = getLatestTrendingDay();
    expect(day?.date).toBe('2026-03-27');
  });
});

describe('getTrendingDayByDate', () => {
  it('returns matching day', () => {
    const day = getTrendingDayByDate('2026-03-26');
    expect(day?.date).toBe('2026-03-26');
  });

  it('returns null for unknown date', () => {
    expect(getTrendingDayByDate('2020-01-01')).toBeNull();
  });
});
