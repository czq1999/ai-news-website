import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const toggleMenu = useCallback(() => setMenuOpen(prev => !prev), []);

  useEffect(() => {
    router.events.on('routeChangeStart', closeMenu);
    return () => router.events.off('routeChangeStart', closeMenu);
  }, [router.events, closeMenu]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) {
        closeMenu();
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [closeMenu]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeMenu]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <div className="site-shell">
      <Header onToggleMenu={toggleMenu} menuOpen={menuOpen} />

      <div
        className={`sidebar-overlay${menuOpen ? ' open' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <div className="layout-container">
        <Sidebar menuOpen={menuOpen} onClose={closeMenu} />
        <main className="layout-main">{children}</main>
      </div>
    </div>
  );
}
