import fs from 'fs';
import path from 'path';

import type { Article } from '@/types/article';

const MAX_ARTICLES = 500;

export function mergeArticles(
  existing: Article[],
  incoming: Article[],
  pinnedIds?: Set<string>
): Article[] {
  const existingIds = new Set(existing.map((a) => a.id));
  const newOnes = incoming.filter((a) => !existingIds.has(a.id));
  const combined = [...existing, ...newOnes];
  combined.sort((a, b) => {
    const aTime = new Date(b.published_at).getTime() || 0;
    const bTime = new Date(a.published_at).getTime() || 0;
    return aTime - bTime;
  });

  if (pinnedIds && pinnedIds.size > 0) {
    const pinned = combined.filter((a) => pinnedIds.has(a.id)).slice(0, MAX_ARTICLES);
    const rest = combined.filter((a) => !pinnedIds.has(a.id));
    return [...pinned, ...rest.slice(0, Math.max(0, MAX_ARTICLES - pinned.length))];
  }

  return combined.slice(0, MAX_ARTICLES);
}

if (require.main === module) {
  const existingPath = process.argv[2];
  const incomingPath = process.argv[3];
  const existing: Article[] = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
  const incoming: Article[] = JSON.parse(fs.readFileSync(incomingPath, 'utf8'));

  let pinnedIds = new Set<string>();
  try {
    const favPath = path.join(__dirname, '..', 'data', 'favorites.json');
    const favData = JSON.parse(fs.readFileSync(favPath, 'utf8')) as { articles?: string[] };
    if (Array.isArray(favData.articles)) {
      pinnedIds = new Set(favData.articles);
    }
  } catch {
    // favorites.json not found — no protection needed
  }

  const merged = mergeArticles(existing, incoming, pinnedIds);
  fs.writeFileSync(existingPath, JSON.stringify(merged, null, 2));
  console.log(`Merged: ${incoming.length} incoming → ${merged.length} total`);
}
