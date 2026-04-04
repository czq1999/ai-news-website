import { readFileSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';

import { translateArticles } from '@/lib/server/translator';
import { RawArticle } from '@/types/article';

export { translateArticles };

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
    } catch (err) {
      console.error('Fatal error:', err);
      process.exit(1);
    }
  })();
}
