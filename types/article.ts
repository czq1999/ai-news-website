export type Category = 'llm' | 'product' | 'research' | 'industry';

export interface Article {
  id: string;           // URL 的 MD5 hash
  title_en: string;     // 原始英文标题
  title_zh: string;     // AI 翻译的中文标题
  summary_zh: string;   // AI 生成的 200-300 字中文摘要
  category: Category;   // 由 Claude 在翻译步骤中自动判断
  source: string;       // 来源名称，如 "TechCrunch"
  url: string;          // 原文链接
  published_at: string; // ISO 8601
  fetched_at: string;   // ISO 8601
}

export interface RawArticle {
  id: string;
  title_en: string;
  source: string;
  url: string;
  published_at: string;
  fetched_at: string;
}
