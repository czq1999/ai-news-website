import fs from 'fs';

import type { Article } from '@/types/article';

const MAX_ARTICLES = 500;

export function mergeArticles(existing: Article[], incoming: Article[]): Article[] {
  const existingIds = new Set(existing.map((a) => a.id));
  const newOnes = incoming.filter((a) => !existingIds.has(a.id));
  const combined = [...existing, ...newOnes];
  combined.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  return combined.slice(0, MAX_ARTICLES);
}

// When run directly: read existing JSON + incoming JSON, write merged back
if (require.main === module) {
  const existingPath = process.argv[2];
  const incomingPath = process.argv[3];
  const existing: Article[] = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
  const incoming: Article[] = JSON.parse(fs.readFileSync(incomingPath, 'utf8'));
  const merged = mergeArticles(existing, incoming);
  fs.writeFileSync(existingPath, JSON.stringify(merged, null, 2));
  console.log(`Merged: ${incoming.length} incoming → ${merged.length} total`);
}
