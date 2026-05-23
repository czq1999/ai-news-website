import { CATEGORIES } from '@/lib/article-categories';
import { getAllArticles, getArticleById, getArticlesByCategory } from '@/lib/articles.server';
import { normalizeArticle, normalizeChineseText } from '@/lib/server/article-normalizer';

jest.mock('@/data/articles.json', () => [
  {
    id: 'test-1',
    title_en: 'Test Article 1',
    title_zh: '测试文章一',
    summary_zh: '测试摘要一',
    category: 'llm',
    source: 'TestSource',
    url: 'https://example.com/1',
    published_at: '2026-03-24T12:00:00Z',
    fetched_at: '2026-03-24T13:00:00Z',
  },
  {
    id: 'test-2',
    title_en: 'Test Article 2',
    title_zh: '测试文章二',
    summary_zh: '测试摘要二',
    category: 'research',
    source: 'TestSource',
    url: 'https://example.com/2',
    published_at: '2026-03-23T10:00:00Z',
    fetched_at: '2026-03-23T11:00:00Z',
  },
]);

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
    expect(result.every((article) => article.category === 'llm')).toBe(true);
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
  it('contains all categories with labels and accents', () => {
    expect(CATEGORIES).toEqual([
      { slug: 'llm', label: '大模型', accent: '#6EE7F7' },
      { slug: 'product', label: 'AI 应用', accent: '#F7C36E' },
      { slug: 'research', label: 'AI 研究', accent: '#A77BF7' },
      { slug: 'industry', label: '产业动态', accent: '#7BF7C0' },
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
