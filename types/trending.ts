export interface TrendingProject {
  rank: number;
  name: string;
  url: string;
  description_en: string;
  description_zh: string;
  language: string;
  stars_total: number;
  stars_today: number;
}

export interface TrendingDay {
  date: string; // YYYY-MM-DD
  summary_zh: string;
  projects: TrendingProject[];
}

export interface TrendingData {
  days: TrendingDay[];
}
