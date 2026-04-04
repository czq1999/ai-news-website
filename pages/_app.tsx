import '@/styles/globals.css';

import type { AppProps } from 'next/app';

import { FavoritesProvider } from '@/components/Favorites/FavoritesProvider';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <FavoritesProvider>
      <Component {...pageProps} />
    </FavoritesProvider>
  );
}
