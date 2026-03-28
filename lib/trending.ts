import trendingData from '@/data/trending.json';
import type { TrendingData, TrendingDay } from '@/types/trending';

const data = trendingData as TrendingData;

export function getTrendingData(): TrendingData {
  return data;
}

export function getLatestTrendingDay(): TrendingDay | null {
  return data.days[0] ?? null;
}

export function getTrendingDayByDate(date: string): TrendingDay | null {
  return data.days.find(d => d.date === date) ?? null;
}
