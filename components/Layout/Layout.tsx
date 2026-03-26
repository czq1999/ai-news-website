// components/Layout/Layout.tsx
import type { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090910', color: '#E8E8F0' }}>
      <Header />
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '32px 24px 64px',
          display: 'flex',
          gap: '32px',
        }}
      >
        <Sidebar />
        <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
      </div>
    </div>
  );
}
