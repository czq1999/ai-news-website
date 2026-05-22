import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { z } from 'zod';

import { deduplicateBlogs } from '@/lib/server/blog-fetcher';
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

// NOTE: This is a stub. anysearch is an MCP tool that can only be invoked
// from within a Claude Code session, not from a standalone script.
// Actual blog search integration requires manual triggering via MCP in Claude Code.
export async function searchBlogs(query: string): Promise<RawBlog[]> {
  console.log(`  Searching: "${query}"`);
  return [];
}

export async function fetchAndSaveBlogs(): Promise<void> {
  const sourcesPath = path.join(process.cwd(), 'config/sources.json');
  const dataPath = path.join(process.cwd(), 'data/blogs.json');

  if (!existsSync(sourcesPath)) {
    console.error(`Sources config not found at ${sourcesPath}`);
    return;
  }

  const sources = JSON.parse(readFileSync(sourcesPath, 'utf8'));
  const queries = parseBlogTopics(sources);

  if (queries.length === 0) {
    console.log('No blog topics configured. Skipping.');
    return;
  }

  console.log(`Fetching blogs for ${queries.length} topics...`);
  const allRaw: RawBlog[] = [];

  for (const query of queries) {
    try {
      const blogs = await searchBlogs(query);
      allRaw.push(...blogs);
      console.log(`  "${query}": ${blogs.length} results`);
    } catch (err) {
      console.error(`  "${query}" failed:`, err);
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
      existing = JSON.parse(readFileSync(dataPath, 'utf8'));
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
  const merged = mergeBlogs(existing, translated);

  const validated = merged.filter((b) => {
    const res = BlogSchema.safeParse(b);
    if (!res.success) {
      console.warn(`Invalid blog ${b.id}, dropping:`, res.error.format());
      return false;
    }
    return true;
  });

  writeFileSync(dataPath, JSON.stringify(validated, null, 2));
  console.log(`  Total blogs: ${validated.length}`);
}

if (require.main === module) {
  fetchAndSaveBlogs().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
