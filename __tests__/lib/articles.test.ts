// __tests__/lib/articles.test.ts
import { getAllArticles, getArticlesByCategory, getArticleById, CATEGORIES } from '@/lib/articles';
import type { Article } from '@/types/article';

const mockArticles: Article[] = [
  {
    id: 'abc123',
    title_en: 'OpenAI releases GPT-5',
    title_zh: 'OpenAI 发布 GPT-5',
    summary_zh: '摘要内容',
    category: 'llm',
    source: 'TechCrunch',
    url: 'https://example.com/1',
    published_at: '2026-03-24T10:00:00Z',
    fetched_at: '2026-03-24T11:00:00Z',
  },
  {
    id: 'def456',
    title_en: 'Google launches Gemini 2',
    title_zh: 'Google 发布 Gemini 2',
    summary_zh: '摘要内容2',
    category: 'product',
    source: 'The Verge',
    url: 'https://example.com/2',
    published_at: '2026-03-24T08:00:00Z',
    fetched_at: '2026-03-24T11:00:00Z',
  },
];

jest.mock('@/data/articles.json', () => [
  {
    id: 'abc123',
    title_en: 'OpenAI releases GPT-5',
    title_zh: 'OpenAI 发布 GPT-5',
    summary_zh: '摘要内容',
    category: 'llm',
    source: 'TechCrunch',
    url: 'https://example.com/1',
    published_at: '2026-03-24T10:00:00Z',
    fetched_at: '2026-03-24T11:00:00Z',
  },
  {
    id: 'def456',
    title_en: 'Google launches Gemini 2',
    title_zh: 'Google 发布 Gemini 2',
    summary_zh: '摘要内容2',
    category: 'product',
    source: 'The Verge',
    url: 'https://example.com/2',
    published_at: '2026-03-24T08:00:00Z',
    fetched_at: '2026-03-24T11:00:00Z',
  },
], { virtual: true });

describe('getAllArticles', () => {
  it('returns all articles sorted by published_at descending', () => {
    const result = getAllArticles();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('abc123');
  });
});

describe('getArticlesByCategory', () => {
  it('filters articles by category', () => {
    const result = getArticlesByCategory('llm');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('abc123');
  });

  it('returns empty array for unknown category', () => {
    expect(getArticlesByCategory('unknown' as any)).toHaveLength(0);
  });
});

describe('getArticleById', () => {
  it('returns the article with matching id', () => {
    expect(getArticleById('abc123')?.title_en).toBe('OpenAI releases GPT-5');
  });

  it('returns undefined for missing id', () => {
    expect(getArticleById('nope')).toBeUndefined();
  });
});

describe('CATEGORIES', () => {
  it('contains all four categories with labels', () => {
    expect(CATEGORIES.map(c => c.slug)).toEqual(['llm', 'product', 'research', 'industry']);
  });
});
