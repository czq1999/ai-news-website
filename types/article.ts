export type Category = 'llm' | 'product' | 'research' | 'industry' | 'safety';

export interface Article {
  id: string;
  title_en: string;
  title_zh: string;
  summary_zh: string;
  category: Category;
  source: string;
  url: string;
  published_at: string;
  fetched_at: string;
}

export interface RawArticle {
  id: string;
  title_en: string;
  source: string;
  url: string;
  published_at: string;
  fetched_at: string;
}
