import { CATEGORIES, getAllArticles, getArticleById, getArticlesByCategory, normalizeChineseText } from '@/lib/articles';

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
  it('repairs garbled Chinese text', () => {
    expect(normalizeChineseText('鍒氬垰')).toBe('刚刚');
    expect(normalizeChineseText('鎽樿鍐呭')).toBe('摘要内容');
  });

  it('keeps normal text unchanged', () => {
    expect(normalizeChineseText('正常中文内容')).toBe('正常中文内容');
  });
});
