import iconv from 'iconv-lite';
import type { Article } from '@/types/article';

const SUSPICIOUS_FRAGMENTS = [
  '鍒氬垰',
  '鍙戝竷',
  '鎽樿',
  '鏆傛棤',
  '闃呰',
  '鍘熸枃',
  '鍒嗙被',
  '鏍囬',
  '淇冮攢',
  '浼樻儬',
  '鐮旂┒',
  '琛屼笟',
  '澶фā鍨',
];

export function normalizeChineseText(value: string): string {
  if (!value || !SUSPICIOUS_FRAGMENTS.some(fragment => value.includes(fragment))) {
    return value;
  }

  try {
    const repaired = iconv.decode(iconv.encode(value, 'gb18030'), 'utf8').trim();
    return repaired || value;
  } catch {
    return value;
  }
}

export function normalizeArticle(article: Article): Article {
  return {
    ...article,
    title_zh: normalizeChineseText(article.title_zh),
    summary_zh: normalizeChineseText(article.summary_zh),
  };
}
