import { CATEGORIES } from '@/lib/article-categories';
import { getAllArticles, getArticleById, getArticlesByCategory } from '@/lib/articles.server';
import { normalizeArticle, normalizeChineseText } from '@/lib/server/article-normalizer';

describe('getAllArticles', () => {
  it('returns articles sorted by published_at descending', () => {
    const result = getAllArticles();
    expect(result.length).toBeGreaterThan(0);

    for (let index = 1; index < result.length; index += 1) {
      expect(new Date(result[index - 1].published_at).getTime()).toBeGreaterThanOrEqual(
        new Date(result[index].published_at).getTime()
      );
    }
  });
});

describe('getArticlesByCategory', () => {
  it('filters articles by category', () => {
    const result = getArticlesByCategory('llm');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(article => article.category === 'llm')).toBe(true);
  });

  it('returns empty array for unknown category', () => {
    expect(getArticlesByCategory('unknown' as never)).toHaveLength(0);
  });
});

describe('getArticleById', () => {
  it('returns the article with matching id', () => {
    const firstArticle = getAllArticles()[0];
    expect(getArticleById(firstArticle.id)?.id).toBe(firstArticle.id);
  });

  it('returns undefined for missing id', () => {
    expect(getArticleById('nope')).toBeUndefined();
  });
});

describe('CATEGORIES', () => {
  it('contains all four categories with labels', () => {
    expect(CATEGORIES).toEqual([
      { slug: 'llm', label: '大模型' },
      { slug: 'product', label: '产品' },
      { slug: 'research', label: '研究' },
      { slug: 'industry', label: '行业' },
    ]);
  });
});

describe('normalizeChineseText', () => {
  it('keeps normal text unchanged', () => {
    expect(normalizeChineseText('正常中文内容')).toBe('正常中文内容');
  });

  it('normalizes article payload without changing stable fields', () => {
    const normalized = normalizeArticle({
      id: '1',
      title_en: 'English title',
      title_zh: '正常标题',
      summary_zh: '正常摘要',
      category: 'llm',
      source: 'Source',
      url: 'https://example.com/1',
      published_at: '2026-03-24T10:00:00Z',
      fetched_at: '2026-03-24T11:00:00Z',
    });

    expect(normalized).toMatchObject({
      id: '1',
      title_zh: '正常标题',
      summary_zh: '正常摘要',
      category: 'llm',
    });
  });
});
