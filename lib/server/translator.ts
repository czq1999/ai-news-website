import { z } from 'zod';

import { Article, ArticleSchema, CATEGORIES, RawArticle } from '@/types/article';
import { RawBlog } from '@/types/blog';

const TranslationResultSchema = z.object({
  id: z.string(),
  title_zh: z.string(),
  summary_zh: z.string(),
  category: z.enum(CATEGORIES),
});

type TranslationResult = z.infer<typeof TranslationResultSchema>;

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
${JSON.stringify(
  articles.map((a) => ({ id: a.id, title: a.title_en, source: a.source })),
  null,
  2
)}`;
}

function extractJsonArray(output: string): string | null {
  const start = output.indexOf('[');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < output.length; i++) {
    const ch = output[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === '\\' && inString) {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) return output.slice(start, i + 1);
    }
  }

  return null;
}

export function parseTranslationResults(output: string): TranslationResult[] {
  const jsonStr = extractJsonArray(output);
  if (!jsonStr) {
    throw new Error(`No JSON array found in output: ${output.slice(0, 200)}`);
  }

  const raw: unknown = JSON.parse(jsonStr);
  if (!Array.isArray(raw)) {
    throw new Error('Expected JSON array from model output');
  }

  const seenIds = new Set<string>();

  return raw.flatMap((item, index) => {
    const result = TranslationResultSchema.safeParse(item);
    if (!result.success) {
      console.warn(`Skipping invalid translation item at index ${index}:`, result.error.format());
      return [];
    }

    const entry = result.data;
    if (seenIds.has(entry.id)) {
      console.warn(`Skipping duplicate translation item for ${entry.id}`);
      return [];
    }

    seenIds.add(entry.id);
    return [entry];
  });
}

async function translateBatch(
  batch: RawArticle[],
  apiKey: string,
  retries = 2
): Promise<TranslationResult[]> {
  const prompt = buildTranslationPrompt(batch);

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

      return parseTranslationResults(output);
    } catch (err) {
      console.error(`  Attempt ${attempt + 1} failed:`, err);
      if (attempt === retries) throw err;
      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  throw new Error('translateBatch: all retries exhausted');
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
      console.error(`  Batch ${i + 1} failed after retries:`, err);
    }
  }

  const translationMap = new Map(allTranslations.map((t) => [t.id, t]));

  return rawArticles
    .map((raw) => {
      const t = translationMap.get(raw.id);
      if (!t) return null;
      const combined = {
        ...raw,
        title_zh: t.title_zh,
        summary_zh: t.summary_zh,
        category: t.category,
      };
      const result = ArticleSchema.safeParse(combined);
      if (!result.success) {
        console.warn(`Invalid merged article for ${raw.id}:`, result.error.format());
        return null;
      }
      return result.data;
    })
    .filter((a): a is Article => a !== null);
}

// --- Blog translation ---

const BlogTranslationResultSchema = z.object({
  id: z.string(),
  title_zh: z.string(),
  summary_zh: z.string(),
  topic: z.enum(['ai', 'ops', 'security', 'other']).default('other'),
});

type BlogTranslationResult = z.infer<typeof BlogTranslationResultSchema>;

export function buildBlogTranslationPrompt(blogs: RawBlog[]): string {
  return `You are a professional tech blog translator and editor.

Given the following tech blog titles, for each blog:
1. Translate the title to natural, accurate Chinese
2. Write a 200-300 character Chinese summary suitable for a tech audience
3. Focus on technical depth and practical value in the summary
4. Classify the blog topic into exactly one of: ai, ops, security, other
   - ai: AI, machine learning, LLM, deep learning, NLP, Agent, RAG, fine-tuning, GPT, Transformer
   - ops: Linux, Docker, Kubernetes, DevOps, CI/CD, server administration, monitoring, deployment, container
   - security: CVE, vulnerability, kernel patch, security hardening, penetration, attack, defense, audit
   - other: anything that does not clearly fit the above categories

Respond with ONLY a valid JSON array. No markdown, no explanation, just the JSON array.
Each object must have exactly these fields: id, title_zh, summary_zh, topic

Blogs:
${JSON.stringify(
  blogs.map((b) => ({ id: b.id, title: b.title_en, source: b.source })),
  null,
  2
)}`;
}

export function parseBlogTranslationResults(output: string): BlogTranslationResult[] {
  const jsonStr = extractJsonArray(output);
  if (!jsonStr) {
    throw new Error(`No JSON array found in output: ${output.slice(0, 200)}`);
  }

  const raw: unknown = JSON.parse(jsonStr);
  if (!Array.isArray(raw)) {
    throw new Error('Expected JSON array from model output');
  }

  const seenIds = new Set<string>();

  return raw.flatMap((item, index) => {
    const result = BlogTranslationResultSchema.safeParse(item);
    if (!result.success) {
      console.warn(`Skipping invalid blog translation at index ${index}:`, result.error.format());
      return [];
    }

    const entry = result.data;
    if (seenIds.has(entry.id)) {
      console.warn(`Skipping duplicate blog translation for ${entry.id}`);
      return [];
    }

    seenIds.add(entry.id);
    return [entry];
  });
}
