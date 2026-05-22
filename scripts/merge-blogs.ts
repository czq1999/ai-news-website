import fs from 'fs';

import type { Blog } from '@/types/blog';

const MAX_BLOGS = 200;

export function mergeBlogs(existing: Blog[], incoming: Blog[]): Blog[] {
  const existingIds = new Set(existing.map((b) => b.id));
  const newOnes = incoming.filter((b) => !existingIds.has(b.id));
  const combined = [...existing, ...newOnes];
  combined.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  return combined.slice(0, MAX_BLOGS);
}

if (require.main === module) {
  const existingPath = process.argv[2];
  const incomingPath = process.argv[3];
  const existing: Blog[] = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
  const incoming: Blog[] = JSON.parse(fs.readFileSync(incomingPath, 'utf8'));
  const merged = mergeBlogs(existing, incoming);
  fs.writeFileSync(existingPath, JSON.stringify(merged, null, 2));
  console.log(`Merged: ${incoming.length} incoming → ${merged.length} total`);
}
