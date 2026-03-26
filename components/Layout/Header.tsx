// components/Layout/Header.tsx
import Link from 'next/link';

export default function Header() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(9, 9, 16, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid #1A1A2E',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: '17px',
              letterSpacing: '-0.03em',
              color: '#E8E8F0',
              lineHeight: 1,
            }}
          >
            AI&nbsp;
            <span style={{ color: '#6EE7F7' }}>SIGNAL</span>
          </span>
          <span
            style={{
              display: 'inline-block',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: '#7BF7C0',
            }}
            className="pulse-dot"
          />
        </Link>

        {/* Right meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: '#3A3A55',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            AI 资讯聚合
          </span>
        </div>
      </div>
    </header>
  );
}
