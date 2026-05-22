import { parseTranslationResults } from '@/lib/server/translator';

describe('parseTranslationResults', () => {
  it('keeps only valid unique translation entries', () => {
    const results = parseTranslationResults(`[
      {"id":"1","title_zh":"标题一","summary_zh":"摘要一","category":"llm"},
      {"id":"1","title_zh":"重复","summary_zh":"重复","category":"llm"},
      {"id":"2","title_zh":"标题二","summary_zh":"摘要二","category":"product"},
      {"id":"3","title_zh":"标题三","summary_zh":"摘要三","category":"unknown"},
      {"id":"4","title_zh":"标题四","summary_zh":"摘要四","category":"research"}
    ]`);

    expect(results).toEqual([
      { id: '1', title_zh: '标题一', summary_zh: '摘要一', category: 'llm' },
      { id: '2', title_zh: '标题二', summary_zh: '摘要二', category: 'product' },
      { id: '4', title_zh: '标题四', summary_zh: '摘要四', category: 'research' },
    ]);
  });

  it('throws when no json array is present', () => {
    expect(() => parseTranslationResults('not json')).toThrow('No JSON array found');
  });

  it('extracts JSON array from preamble text', () => {
    const results = parseTranslationResults(
      `Here are the results:\n[{"id":"1","title_zh":"标题","summary_zh":"摘要","category":"llm"}]`
    );
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('1');
  });

  it('extracts first complete JSON array and ignores subsequent ones', () => {
    const results = parseTranslationResults(
      `[{"id":"1","title_zh":"标题一","summary_zh":"摘要一","category":"llm"}] some text [{"id":"2","title_zh":"标题二","summary_zh":"摘要二","category":"product"}]`
    );
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('1');
  });

  it('handles brackets inside JSON string values', () => {
    const results = parseTranslationResults(
      `[{"id":"1","title_zh":"标题","summary_zh":"参考 [RFC 7231] 文档","category":"llm"}]`
    );
    expect(results).toHaveLength(1);
    expect(results[0].summary_zh).toBe('参考 [RFC 7231] 文档');
  });

  it('handles nested brackets in strings with preamble', () => {
    const results = parseTranslationResults(
      `Here are the results:\n[{"id":"1","title_zh":"标题","summary_zh":"使用 [技术] 方案","category":"llm"}]`
    );
    expect(results).toHaveLength(1);
    expect(results[0].summary_zh).toBe('使用 [技术] 方案');
  });
});
