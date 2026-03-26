import { parseTranslationResults } from '@/scripts/translate';

describe('parseTranslationResults', () => {
  it('keeps only valid unique translation entries', () => {
    const results = parseTranslationResults(`[
      {"id":"1","title_zh":"标题一","summary_zh":"摘要一","category":"llm"},
      {"id":"1","title_zh":"重复","summary_zh":"重复","category":"llm"},
      {"id":"2","title_zh":"","summary_zh":"摘要二","category":"product"},
      {"id":"3","title_zh":"标题三","summary_zh":"摘要三","category":"unknown"},
      {"id":"4","title_zh":"标题四","summary_zh":"摘要四","category":"research"}
    ]`);

    expect(results).toEqual([
      { id: '1', title_zh: '标题一', summary_zh: '摘要一', category: 'llm' },
      { id: '4', title_zh: '标题四', summary_zh: '摘要四', category: 'research' },
    ]);
  });

  it('throws when no json array is present', () => {
    expect(() => parseTranslationResults('not json')).toThrow('No JSON array found');
  });
});
