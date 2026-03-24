// scripts/translate.ts
import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import type { Article, RawArticle, Category } from '@/types/article';

interface TranslationResult {
  id: string;
  title_zh: string;
  summary_zh: string;
  category: Category; // 复用已有类型
}

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

export function translateArticles(rawArticles: RawArticle[]): Article[] {
  if (rawArticles.length === 0) return [];

  const prompt = buildTranslationPrompt(rawArticles);
  let output = '';

  try {
    output = execFileSync('claude', ['-p', prompt], {
      encoding: 'utf8',
      timeout: 120_000, // 2 minutes
      env: { ...process.env },
    });
  } catch (err) {
    console.error('claude CLI failed:', err);
    return [];
  }

  let translations: TranslationResult[];
  try {
    // Extract JSON array from output (claude may include extra text)
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array found in output');
    const raw: unknown = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(raw)) throw new Error('Expected JSON array from claude output');
    translations = raw as TranslationResult[];
  } catch (err) {
    console.error('Failed to parse translation output:', err);
    console.error('Raw output:', output);
    return [];
  }

  const translationMap = new Map(translations.map(t => [t.id, t]));

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
    console.warn(`Warning: ${rawArticles.length - translated.length} articles missing from translation result`);
  }

  return translated;
}

// Entry point when run directly
if (require.main === module) {
  try {
    const inputPath = process.argv[2] || path.join(os.tmpdir(), 'raw-articles.json');
    const outputPath = process.argv[3] || path.join(os.tmpdir(), 'translated-articles.json');
    const rawArticles: RawArticle[] = JSON.parse(readFileSync(inputPath, 'utf8'));
    console.log(`Translating ${rawArticles.length} articles...`);
    const translated = translateArticles(rawArticles);
    writeFileSync(outputPath, JSON.stringify(translated, null, 2));
    console.log(`Translated: ${translated.length}, written to ${outputPath}`);
    if (translated.length < rawArticles.length) {
      console.warn(`Warning: ${rawArticles.length - translated.length} articles failed to translate`);
    }
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}
