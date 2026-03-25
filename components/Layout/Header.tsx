// components/Layout/Header.tsx
export default function Header() {
  return (
    <header className="border-b border-[#21262d] bg-[#0d1117]">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">
        <span className="text-[#58a6ff] font-bold text-lg tracking-tight">⚡ AI Daily</span>
        <span className="text-gray-600 text-sm">· AI 资讯聚合</span>
      </div>
    </header>
  );
}
