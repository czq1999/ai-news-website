import fs from 'fs';
import os from 'os';
import path from 'path';

import { fetchNewsApi, fetchRssSource } from '@/lib/server/fetcher';
import { RawArticle } from '@/types/article';

// Export for tests if needed, but they should move to lib/server
export { fetchNewsApi, fetchRssSource };

if (require.main === module) {
  (async () => {
    const sources = JSON.parse(fs.readFileSync('./config/sources.json', 'utf8'));
    const allRaw: RawArticle[] = [];

    for (const feed of sources.rss) {
      const articles = await fetchRssSource(feed.url, feed.name);
      allRaw.push(...articles);
      console.log(`  ${feed.name}: ${articles.length} articles`);
    }

    const newsApiKey = process.env.NEWS_API_KEY;
    if (newsApiKey) {
      const { query, language, pageSize } = sources.newsapi;
      const newsApiArticles = await fetchNewsApi(
        query,
        language,
        Math.min(pageSize, 10),
        newsApiKey
      );
      allRaw.push(...newsApiArticles);
      console.log(`  NewsAPI: ${newsApiArticles.length} articles`);
    }

    const outputPath = process.argv[2] || path.join(os.tmpdir(), 'raw-articles.json');
    fs.writeFileSync(outputPath, JSON.stringify(allRaw, null, 2));
    console.log(`Total raw: ${allRaw.length}, written to ${outputPath}`);
  })();
}
