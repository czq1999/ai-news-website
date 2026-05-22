import { buildBlogTranslationPrompt, parseBlogTranslationResults } from '@/lib/server/translator';
import { RawBlog } from '@/types/blog';
import { Blog, BlogSchema } from '@/types/blog';

const BATCH_SIZE = 15;

async function translateBlogBatch(batch: RawBlog[], apiKey: string, retries = 2): Promise<Blog[]> {
  const prompt = buildBlogTranslationPrompt(batch);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 8192,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(
          `DeepSeek API error: ${response.status} ${response.statusText} - ${errText}`
        );
      }

      const data = await response.json();
      const output = data.choices?.[0]?.message?.content;

      if (!output) {
        throw new Error('DeepSeek API response did not include choices[0].message.content');
      }

      const translations = parseBlogTranslationResults(output);
      const translationMap = new Map(translations.map((t) => [t.id, t]));

      return batch
        .map((raw) => {
          const t = translationMap.get(raw.id);
          if (!t) return null;
          const combined = {
            ...raw,
            title_zh: t.title_zh,
            summary_zh: t.summary_zh,
          };
          const result = BlogSchema.safeParse(combined);
          if (!result.success) {
            console.warn(`Invalid merged blog for ${raw.id}:`, result.error.format());
            return null;
          }
          return result.data;
        })
        .filter((b): b is Blog => b !== null);
    } catch (err) {
      console.error(`  Attempt ${attempt + 1} failed:`, err);
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  throw new Error('translateBlogBatch: all retries exhausted');
}

export async function translateBlogs(rawBlogs: RawBlog[]): Promise<Blog[]> {
  if (rawBlogs.length === 0) return [];

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('DEEPSEEK_API_KEY not set');
    return [];
  }

  const batches: RawBlog[][] = [];
  for (let i = 0; i < rawBlogs.length; i += BATCH_SIZE) {
    batches.push(rawBlogs.slice(i, i + BATCH_SIZE));
  }
  console.log(`  Processing ${batches.length} batch(es) of up to ${BATCH_SIZE} blogs...`);

  const allTranslated: Blog[] = [];
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`  Batch ${i + 1}/${batches.length}: ${batch.length} blogs`);
    try {
      const results = await translateBlogBatch(batch, apiKey);
      allTranslated.push(...results);
    } catch (err) {
      console.error(`  Batch ${i + 1} failed after retries:`, err);
    }
  }

  return allTranslated;
}
