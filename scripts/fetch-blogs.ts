import { existsSync, readFileSync, renameSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { z } from 'zod';

import { buildBlogFromSearchResult, deduplicateBlogs } from '@/lib/server/blog-fetcher';
import { translateBlogs } from '@/lib/server/blog-translator';
import { mergeBlogs } from '@/scripts/merge-blogs';
import { Blog, BlogSchema, RawBlog } from '@/types/blog';

const BlogTopicSchema = z.object({
  query: z.string().min(1),
});

const SourcesConfigSchema = z.object({
  blogTopics: z.array(BlogTopicSchema).optional(),
});

export function parseBlogTopics(raw: unknown): string[] {
  const result = SourcesConfigSchema.safeParse(raw);
  if (!result.success || !result.data.blogTopics) {
    return [];
  }
  return result.data.blogTopics.map((t) => t.query);
}

const ANYSEARCH_API = 'https://api.anysearch.com/mcp';
const MAX_RESULTS_PER_QUERY = 10;

function loadAnySearchApiKey(): string {
  if (process.env.ANYSEARCH_API_KEY) return process.env.ANYSEARCH_API_KEY;

  const skillEnvPath = path.join(os.homedir(), '.claude/skills/anysearch/.env');
  if (existsSync(skillEnvPath)) {
    const content = readFileSync(skillEnvPath, 'utf-8');
    const match = content.match(/ANYSEARCH_API_KEY=(.+)/);
    if (match) return match[1].trim();
  }

  return '';
}

interface AnySearchResultItem {
  title: string;
  url: string;
  date?: string;
}

function parseSearchResultsMarkdown(markdown: string): AnySearchResultItem[] {
  const results: AnySearchResultItem[] = [];
  const sections = markdown.split(/### \d+\.\s+/);

  for (const section of sections) {
    if (!section.trim()) continue;

    const lines = section.split('\n');
    const title = lines[0].trim();
    if (!title) continue;

    let url = '';
    let date: string | undefined;

    for (const line of lines) {
      const urlMatch = line.match(/\*\*URL\*\*:\s*(.+)/);
      if (urlMatch) {
        url = urlMatch[1].trim();
      }
      const dateMatch = line.match(/^date:\s*(.+)/i);
      if (dateMatch) {
        date = dateMatch[1].trim();
      }
    }

    if (url && title) {
      results.push({ title, url, date });
    }
  }

  return results;
}

async function callAnySearchAPI(
  toolName: string,
  args: Record<string, unknown>,
  apiKey: string
): Promise<string> {
  const response = await fetch(ANYSEARCH_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: toolName, arguments: args },
    }),
  });

  if (!response.ok) {
    throw new Error(`AnySearch API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  if (json.error) {
    throw new Error(json.error.message || JSON.stringify(json.error));
  }

  const content = json.result?.content;
  if (Array.isArray(content)) {
    const textItem = content.find((c: { type: string }) => c.type === 'text');
    if (textItem) return textItem.text;
  }

  return JSON.stringify(json.result || json);
}

export async function searchBlogs(query: string): Promise<RawBlog[]> {
  console.log(`  Searching: "${query}"`);

  const apiKey = loadAnySearchApiKey();
  if (!apiKey) {
    console.warn('  ANYSEARCH_API_KEY not configured. Set it in ~/.claude/skills/anysearch/.env');
    return [];
  }

  try {
    const markdown = await callAnySearchAPI(
      'search',
      {
        query,
        max_results: MAX_RESULTS_PER_QUERY,
        freshness: 'week',
      },
      apiKey
    );

    const items = parseSearchResultsMarkdown(markdown);
    return items
      .map((item) => {
        let hostname = 'Unknown';
        try {
          hostname = new URL(item.url).hostname.replace(/^www\./, '');
        } catch {
          return null;
        }
        return buildBlogFromSearchResult({
          title: item.title,
          url: item.url,
          source: hostname,
          date: item.date,
        });
      })
      .filter((b): b is RawBlog => b !== null);
  } catch (err) {
    console.error(`  Search "${query}" failed:`, err);
    return [];
  }
}

export async function fetchAndSaveBlogs(): Promise<void> {
  const sourcesPath = path.join(process.cwd(), 'config/sources.json');
  const dataPath = path.join(process.cwd(), 'data/blogs.json');

  if (!existsSync(sourcesPath)) {
    console.error(`Sources config not found at ${sourcesPath}`);
    return;
  }

  let sources: unknown;
  try {
    sources = JSON.parse(readFileSync(sourcesPath, 'utf8'));
  } catch (err) {
    console.error(`Failed to parse sources.json:`, err);
    return;
  }
  const queries = parseBlogTopics(sources);

  if (queries.length === 0) {
    console.log('No blog topics configured. Skipping.');
    return;
  }

  const apiKey = loadAnySearchApiKey();
  if (!apiKey) {
    console.warn('ANYSEARCH_API_KEY not configured. Set it in ~/.claude/skills/anysearch/.env');
    return;
  }

  console.log(`Fetching blogs for ${queries.length} topics...`);
  const allRaw: RawBlog[] = [];

  // Batch queries into groups of 5 (batch_search limit)
  const BATCH_SIZE = 5;
  for (let i = 0; i < queries.length; i += BATCH_SIZE) {
    const batch = queries.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(queries.length / BATCH_SIZE);

    console.log(`  Batch ${batchNum}/${totalBatches}: ${batch.map((q) => `"${q}"`).join(', ')}`);
    try {
      const queryObjects = batch.map((query) => ({
        query,
        max_results: MAX_RESULTS_PER_QUERY,
        freshness: 'week',
      }));

      const markdown = await callAnySearchAPI('batch_search', { queries: queryObjects }, apiKey);

      const items = parseSearchResultsMarkdown(markdown);
      for (const item of items) {
        let hostname = 'Unknown';
        try {
          hostname = new URL(item.url).hostname.replace(/^www\./, '');
        } catch {
          continue;
        }
        const blog = buildBlogFromSearchResult({
          title: item.title,
          url: item.url,
          source: hostname,
          date: item.date,
        });
        if (blog) allRaw.push(blog);
      }

      console.log(`  Batch ${batchNum}: ${allRaw.length} total results so far`);
    } catch (err) {
      console.error(`  Batch ${batchNum} failed:`, err);
    }
  }

  const deduplicated = deduplicateBlogs(allRaw);
  console.log(`\nTotal unique blogs: ${deduplicated.length}`);

  if (deduplicated.length === 0) {
    console.log('No new blogs found. Skipping translation.');
    return;
  }

  let existing: Blog[] = [];
  if (existsSync(dataPath)) {
    try {
      const raw: unknown = JSON.parse(readFileSync(dataPath, 'utf8'));
      if (!Array.isArray(raw)) {
        console.warn('blogs.json is not an array, starting fresh.');
      } else {
        existing = raw
          .map((item) => {
            const result = BlogSchema.safeParse(item);
            if (!result.success) {
              console.warn('Skipping invalid blog in existing data:', result.error.format());
              return null;
            }
            return result.data;
          })
          .filter((b): b is Blog => b !== null);
      }
    } catch {
      console.log('Could not parse existing blogs.json, starting fresh.');
    }
  }

  const existingIds = new Set(existing.map((b) => b.id));
  const newBlogs = deduplicated.filter((b) => !existingIds.has(b.id));
  console.log(`New blogs to translate: ${newBlogs.length}`);

  if (newBlogs.length === 0) {
    console.log('No new blogs. Skipping translation.');
    return;
  }

  console.log('\nTranslating blogs...');
  const translated = await translateBlogs(newBlogs);
  console.log(`  Translated: ${translated.length}/${newBlogs.length}`);

  if (translated.length === 0) {
    console.error('Translation failed: no blogs were translated. Exiting.');
    return;
  }

  console.log('\nMerging blogs...');
  let pinnedBlogIds = new Set<string>();
  try {
    const favPath = path.join(process.cwd(), 'data/favorites.json');
    const favData = JSON.parse(readFileSync(favPath, 'utf8')) as { blogs?: string[] };
    if (Array.isArray(favData.blogs)) pinnedBlogIds = new Set(favData.blogs);
  } catch {
    // favorites.json absent — no pinned protection needed
  }
  const merged = mergeBlogs(existing, translated, pinnedBlogIds);

  const validated = merged.filter((b) => {
    const res = BlogSchema.safeParse(b);
    if (!res.success) {
      console.warn(`Invalid blog ${b.id}, dropping:`, res.error.format());
      return false;
    }
    return true;
  });

  const tmpPath = `${dataPath}.tmp`;
  writeFileSync(tmpPath, JSON.stringify(validated, null, 2));
  renameSync(tmpPath, dataPath);
  console.log(`  Total blogs: ${validated.length}`);
}

if (require.main === module) {
  fetchAndSaveBlogs().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
