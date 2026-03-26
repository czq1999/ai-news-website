// components/UI/TimeAgo.tsx
export default function TimeAgo({ dateString }: { dateString: string }) {
  const timestamp = new Date(dateString).getTime();
  if (isNaN(timestamp)) {
    return (
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#3A3A55' }}>
        —
      </span>
    );
  }
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  let text: string;
  if (diff < 60)         text = '刚刚';
  else if (diff < 3600)  text = `${Math.floor(diff / 60)}m`;
  else if (diff < 86400) text = `${Math.floor(diff / 3600)}h`;
  else                   text = `${Math.floor(diff / 86400)}d`;

  return (
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#3A3A55' }}>
      {text}
    </span>
  );
}
