import * as cheerio from 'cheerio';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import type { TrendingData, TrendingDay, TrendingProject } from '@/types/trending';

interface RawTrendingProject {
  rank: number;
  name: string;
  url: string;
  description_en: string;
  language: string;
  stars_total: number;
  stars_today: number;
}

interface DeepSeekResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export function parseTrendingProjects(html: string): RawTrendingProject[] {
  const $ = cheerio.load(html);
  const projects: RawTrendingProject[] = [];

  $('article.Box-row').each((index, el) => {
    if (index >= 25) return false;

    const href = $(el).find('h2 a').attr('href') ?? '';
    const name = href.replace(/^\//, '').replace(/\s/g, '');
    if (!name) return;

    const url = `https://github.com/${name}`;
    const description_en = $(el).find('p').first().text().trim();
    const language = $(el).find('[itemprop="programmingLanguage"]').text().trim();

    const starsTodayText = $(el).find('.d-inline-block.float-sm-right').text().trim();
    const starsTodayMatch = starsTodayText.replace(/,/g, '').match(/(\d+)/);
    const stars_today = starsTodayMatch ? parseInt(starsTodayMatch[1], 10) : 0;

    const starsText = $(el).find('a[href$="/stargazers"]').text().trim().replace(/,/g, '');
    const stars_total = parseInt(starsText, 10) || 0;

    projects.push({
      rank: index + 1,
      name,
      url,
      description_en,
      language,
      stars_total,
      stars_today,
    });
  });

  return projects;
}

export function mergeTrendingDay(existing: TrendingData, newDay: TrendingDay): TrendingData {
  const filtered = existing.days.filter((d) => d.date !== newDay.date);
  const days = [newDay, ...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  return { days };
}

async function callDeepSeek(prompt: string, apiKey: string, maxTokens: number): Promise<string> {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  });
  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as DeepSeekResponse;
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

async function translateDescriptions(
  projects: RawTrendingProject[],
  apiKey: string
): Promise<Map<string, string>> {
  const items = projects.map((p) => ({ name: p.name, description: p.description_en }));
  const prompt = `Translate these GitHub project descriptions to Chinese. Return ONLY a JSON array. Each object must have exactly "name" and "description_zh" fields.

Projects:
${JSON.stringify(items, null, 2)}`;

  const output = await callDeepSeek(prompt, apiKey, 4096);
  const jsonMatch = output.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return new Map();

  const results = JSON.parse(jsonMatch[0]) as Array<{ name: string; description_zh: string }>;
  return new Map(results.map((r) => [r.name, r.description_zh ?? '']));
}

async function generateSummary(projects: RawTrendingProject[], apiKey: string): Promise<string> {
  const list = projects
    .slice(0, 10)
    .map((p) => `${p.name}: ${p.description_en}`)
    .join('\n');
  const prompt = `Based on today's GitHub Trending projects listed below, write a 100-150 character Chinese summary describing the main themes and highlights. Return ONLY the Chinese summary text.

${list}`;

  const output = await callDeepSeek(prompt, apiKey, 256);
  return output || '今日 GitHub Trending 项目精选。';
}

export async function fetchAndSaveTrending(): Promise<void> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn('  DEEPSEEK_API_KEY not set, skipping trending fetch');
    return;
  }

  const trendingPath = join(process.cwd(), 'data/trending.json');

  console.log('  Fetching github.com/trending...');
  const response = await fetch('https://github.com/trending', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; AI-News-Bot/1.0)',
      Accept: 'text/html',
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub Trending fetch failed: ${response.status}`);
  }
  const html = await response.text();

  const rawProjects = parseTrendingProjects(html);
  console.log(`  Parsed ${rawProjects.length} trending projects`);

  console.log('  Translating descriptions...');
  let descMap = new Map<string, string>();
  try {
    descMap = await translateDescriptions(rawProjects, apiKey);
  } catch (err) {
    console.error('  Description translation failed:', err);
  }

  console.log('  Generating summary...');
  let summary_zh = '今日 GitHub Trending 项目精选。';
  try {
    summary_zh = await generateSummary(rawProjects, apiKey);
  } catch (err) {
    console.error('  Summary generation failed:', err);
  }

  const today = new Date().toISOString().slice(0, 10);
  const projects: TrendingProject[] = rawProjects
    .map((p) => ({ ...p, description_zh: descMap.get(p.name) ?? '' }))
    .sort((a, b) => b.stars_today - a.stars_today)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const newDay: TrendingDay = { date: today, summary_zh, projects };

  const existing: TrendingData = existsSync(trendingPath)
    ? (JSON.parse(readFileSync(trendingPath, 'utf8')) as TrendingData)
    : { days: [] };

  const merged = mergeTrendingDay(existing, newDay);
  writeFileSync(trendingPath, JSON.stringify(merged, null, 2));
  console.log(`  Trending saved: ${projects.length} projects for ${today}`);
}

if (require.main === module) {
  fetchAndSaveTrending().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
