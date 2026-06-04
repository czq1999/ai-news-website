import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

const FAVORITES_PATH = path.join(process.cwd(), 'data', 'favorites.json');
const MAX_IDS = 2000;
const MAX_ID_LEN = 256;

interface FavoritesData {
  articles: string[];
  blogs: string[];
}

function readFavorites(): FavoritesData {
  try {
    const raw = fs.readFileSync(FAVORITES_PATH, 'utf8');
    const parsed = JSON.parse(raw) as FavoritesData;
    return {
      articles: Array.isArray(parsed.articles)
        ? parsed.articles.filter((id): id is string => typeof id === 'string')
        : [],
      blogs: Array.isArray(parsed.blogs)
        ? parsed.blogs.filter((id): id is string => typeof id === 'string')
        : [],
    };
  } catch {
    return { articles: [], blogs: [] };
  }
}

function writeFavorites(data: FavoritesData) {
  const tmp = `${FAVORITES_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n');
  fs.renameSync(tmp, FAVORITES_PATH);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json(readFavorites());
    return;
  }

  if (req.method === 'POST') {
    const body = req.body as { type?: string; ids?: unknown };
    if (!body || (body.type !== 'article' && body.type !== 'blog') || !Array.isArray(body.ids)) {
      res.status(400).json({ error: 'Invalid body' });
      return;
    }

    const ids = (body.ids as unknown[])
      .filter((id): id is string => typeof id === 'string' && id.length <= MAX_ID_LEN)
      .slice(0, MAX_IDS);

    try {
      const current = readFavorites();
      if (body.type === 'article') {
        current.articles = ids;
      } else {
        current.blogs = ids;
      }
      writeFavorites(current);
      res.status(200).json(current);
    } catch {
      res.status(500).json({ error: 'Write failed' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
