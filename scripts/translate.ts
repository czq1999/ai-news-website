import { readFileSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import type { Article, RawArticle, Category } from '@/types/article';

interface TranslationResult {
  id: string;
  title_zh: string;
  summary_zh: string;
  category: Category;
}

interface DeepSeekResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

const VALID_CATEGORIES: Category[] = ['llm', 'product', 'research', 'industry'];
const BATCH_SIZE = 15;

export function buildTranslationPrompt(articles: RawArticle[]): string {
  return `You are a professional AI news translator and editor.

Given the following English AI news article titles, for each article:
1. Translate the title to natural, accurate Chinese
2. Write a 200-300 character Chinese summary suitable for a tech news audience
3. Assign ONE category from: llm (large language models/AI models), product (product launches/updates/tools), research (academic papers/technical research), industry (business/investment/company news)

Respond with ONLY a valid JSON array. No markdown, no explanation, just the JSON array.
Each object must have exactly these fields: id, title_zh, summary_zh, category

Articles:
${JSON.stringify(articles.map(a => ({ id: a.id, title: a.title_en, source: a.source })), null, 2)}`;
}

export function parseTranslationResults(output: string): TranslationResult[] {
  const jsonMatch = output.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`No JSON array found in output: ${output.slice(0, 200)}`);
  }

  const raw: unknown = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(raw)) {
    throw new Error('Expected JSON array from model output');
  }

  const seenIds = new Set<string>();

  return raw.flatMap((item, index) => {
    if (typeof item !== 'object' || item === null) {
      return [];
    }

    const entry = item as Record<string, unknown>;
    const id = typeof entry.id === 'string' ? entry.id.trim() : '';
    const titleZh = typeof entry.title_zh === 'string' ? entry.title_zh.trim() : '';
    const summaryZh = typeof entry.summary_zh === 'string' ? entry.summary_zh.trim() : '';
    const category = entry.category;

    if (!id || !titleZh || !summaryZh) {
      console.warn(`Skipping invalid translation item at index ${index}: missing required fields`);
      return [];
    }

    if (!VALID_CATEGORIES.includes(category as Category)) {
      console.warn(`Skipping invalid translation item for ${id}: unknown category`);
      return [];
    }

    if (seenIds.has(id)) {
      console.warn(`Skipping duplicate translation item for ${id}`);
      return [];
    }

    seenIds.add(id);
    return [
      {
        id,
        title_zh: titleZh,
        summary_zh: summaryZh,
        category: category as Category,
      },
    ];
  });
}

async function translateBatch(batch: RawArticle[], apiKey: string): Promise<TranslationResult[]> {
  const prompt = buildTranslationPrompt(batch);

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
    throw new Error(`DeepSeek API error: ${response.status} ${response.statusText} - ${errText}`);
  }

  const data = (await response.json()) as DeepSeekResponse;
  const output = data.choices?.[0]?.message?.content;

  if (!output) {
    throw new Error('DeepSeek API response did not include choices[0].message.content');
  }

  return parseTranslationResults(output);
}

export async function translateArticles(rawArticles: RawArticle[]): Promise<Article[]> {
  if (rawArticles.length === 0) return [];

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('DEEPSEEK_API_KEY not set');
    return [];
  }

  const batches: RawArticle[][] = [];
  for (let i = 0; i < rawArticles.length; i += BATCH_SIZE) {
    batches.push(rawArticles.slice(i, i + BATCH_SIZE));
  }
  console.log(`  Processing ${batches.length} batch(es) of up to ${BATCH_SIZE} articles...`);

  const allTranslations: TranslationResult[] = [];
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`  Batch ${i + 1}/${batches.length}: ${batch.length} articles`);
    try {
      const results = await translateBatch(batch, apiKey);
      allTranslations.push(...results);
    } catch (err) {
      console.error(`  Batch ${i + 1} failed:`, err);
    }
  }

  const translationMap = new Map(allTranslations.map(t => [t.id, t]));

  const translated = rawArticles
    .map(raw => {
      const t = translationMap.get(raw.id);
      if (!t) return null;
      return {
        ...raw,
        title_zh: t.title_zh,
        summary_zh: t.summary_zh,
        category: t.category,
      } as Article;
    })
    .filter((a): a is Article => a !== null);

  if (translated.length < rawArticles.length) {
    console.warn(
      `Warning: ${rawArticles.length - translated.length} articles missing from translation result`
    );
  }

  return translated;
}

if (require.main === module) {
  (async () => {
    try {
      const inputPath = process.argv[2] || path.join(os.tmpdir(), 'raw-articles.json');
      const outputPath = process.argv[3] || path.join(os.tmpdir(), 'translated-articles.json');
      const rawArticles: RawArticle[] = JSON.parse(readFileSync(inputPath, 'utf8'));
      console.log(`Translating ${rawArticles.length} articles...`);
      const translated = await translateArticles(rawArticles);
      writeFileSync(outputPath, JSON.stringify(translated, null, 2));
      console.log(`Translated: ${translated.length}, written to ${outputPath}`);
      if (translated.length < rawArticles.length) {
        console.warn(`Warning: ${rawArticles.length - translated.length} articles failed to translate`);
      }
    } catch (err) {
      console.error('Fatal error:', err);
      process.exit(1);
    }
  })();
}
