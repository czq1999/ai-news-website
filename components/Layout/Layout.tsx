// components/Layout/Layout.tsx
import type { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      <Header />
      <div className="max-w-6xl mx-auto px-6 py-6 flex gap-8">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
