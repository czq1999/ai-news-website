import { parseBlogTranslationResults } from '@/lib/server/translator';

describe('parseBlogTranslationResults', () => {
  it('parses valid blog translation results', () => {
    const output = `[{"id":"1","title_zh":"标题","summary_zh":"摘要"}]`;
    const results = parseBlogTranslationResults(output);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({ id: '1', title_zh: '标题', summary_zh: '摘要' });
  });

  it('deduplicates by id', () => {
    const output = `[
      {"id":"1","title_zh":"标题一","summary_zh":"摘要一"},
      {"id":"1","title_zh":"重复","summary_zh":"重复"}
    ]`;
    const results = parseBlogTranslationResults(output);
    expect(results).toHaveLength(1);
  });

  it('skips entries with missing fields', () => {
    const output = `[
      {"id":"1","title_zh":"标题","summary_zh":"摘要"},
      {"id":"2","title_zh":"缺少摘要"}
    ]`;
    const results = parseBlogTranslationResults(output);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('1');
  });

  it('throws when no json array is present', () => {
    expect(() => parseBlogTranslationResults('no json here')).toThrow('No JSON array found');
  });

  it('uses non-greedy match for JSON extraction', () => {
    const output = `First: [{"id":"1","title_zh":"标题","summary_zh":"摘要"}] Second: [{"id":"2","title_zh":"二","summary_zh":"二"}]`;
    const results = parseBlogTranslationResults(output);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('1');
  });
});
