import fs from 'fs';
import path from 'path';

import type { Blog } from '@/types/blog';

const MAX_BLOGS = 200;

export function mergeBlogs(existing: Blog[], incoming: Blog[], pinnedIds?: Set<string>): Blog[] {
  const existingIds = new Set(existing.map((b) => b.id));
  const newOnes = incoming.filter((b) => !existingIds.has(b.id));
  const combined = [...existing, ...newOnes];
  combined.sort((a, b) => {
    const aTime = new Date(b.published_at).getTime() || 0;
    const bTime = new Date(a.published_at).getTime() || 0;
    return aTime - bTime;
  });

  if (pinnedIds && pinnedIds.size > 0) {
    const pinned = combined.filter((b) => pinnedIds.has(b.id)).slice(0, MAX_BLOGS);
    const rest = combined.filter((b) => !pinnedIds.has(b.id));
    return [...pinned, ...rest.slice(0, Math.max(0, MAX_BLOGS - pinned.length))];
  }

  return combined.slice(0, MAX_BLOGS);
}

if (require.main === module) {
  const existingPath = process.argv[2];
  const incomingPath = process.argv[3];
  const existing: Blog[] = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
  const incoming: Blog[] = JSON.parse(fs.readFileSync(incomingPath, 'utf8'));

  let pinnedIds = new Set<string>();
  try {
    const favPath = path.join(__dirname, '..', 'data', 'favorites.json');
    const favData = JSON.parse(fs.readFileSync(favPath, 'utf8')) as { blogs?: string[] };
    if (Array.isArray(favData.blogs)) {
      pinnedIds = new Set(favData.blogs);
    }
  } catch {
    // favorites.json not found — no protection needed
  }

  const merged = mergeBlogs(existing, incoming, pinnedIds);
  fs.writeFileSync(existingPath, JSON.stringify(merged, null, 2));
  console.log(`Merged: ${incoming.length} incoming → ${merged.length} total`);
}
