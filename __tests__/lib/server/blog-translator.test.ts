import { parseBlogTranslationResults } from '@/lib/server/translator';

describe('parseBlogTranslationResults', () => {
  it('parses valid blog translation results', () => {
    const output = `[{"id":"1","title_zh":"标题","summary_zh":"摘要","topic":"ai"}]`;
    const results = parseBlogTranslationResults(output);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({ id: '1', title_zh: '标题', summary_zh: '摘要', topic: 'ai' });
  });

  it('deduplicates by id', () => {
    const output = `[
      {"id":"1","title_zh":"标题一","summary_zh":"摘要一","topic":"ai"},
      {"id":"1","title_zh":"重复","summary_zh":"重复","topic":"ops"}
    ]`;
    const results = parseBlogTranslationResults(output);
    expect(results).toHaveLength(1);
  });

  it('skips entries with missing fields', () => {
    const output = `[
      {"id":"1","title_zh":"标题","summary_zh":"摘要","topic":"ai"},
      {"id":"2","title_zh":"缺少摘要"}
    ]`;
    const results = parseBlogTranslationResults(output);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('1');
  });

  it('skips entries with invalid topic', () => {
    const output = `[
      {"id":"1","title_zh":"标题","summary_zh":"摘要","topic":"ai"},
      {"id":"2","title_zh":"标题","summary_zh":"摘要","topic":"invalid"}
    ]`;
    const results = parseBlogTranslationResults(output);
    expect(results).toHaveLength(1);
    expect(results[0].topic).toBe('ai');
  });

  it('defaults topic to other when omitted', () => {
    const output = `[{"id":"1","title_zh":"标题","summary_zh":"摘要"}]`;
    const results = parseBlogTranslationResults(output);
    expect(results).toHaveLength(1);
    expect(results[0].topic).toBe('other');
  });

  it('throws when no json array is present', () => {
    expect(() => parseBlogTranslationResults('no json here')).toThrow('No JSON array found');
  });

  it('extracts first complete JSON array and ignores subsequent ones', () => {
    const output = `First: [{"id":"1","title_zh":"标题","summary_zh":"摘要","topic":"ai"}] Second: [{"id":"2","title_zh":"二","summary_zh":"二","topic":"ops"}]`;
    const results = parseBlogTranslationResults(output);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('1');
  });

  it('handles brackets inside JSON string values', () => {
    const output = `[{"id":"1","title_zh":"标题","summary_zh":"参考 [RFC 7231] 文档","topic":"security"}]`;
    const results = parseBlogTranslationResults(output);
    expect(results).toHaveLength(1);
    expect(results[0].summary_zh).toBe('参考 [RFC 7231] 文档');
    expect(results[0].topic).toBe('security');
  });
});
