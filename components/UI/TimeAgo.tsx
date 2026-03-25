// components/UI/TimeAgo.tsx
export default function TimeAgo({ dateString }: { dateString: string }) {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  let text: string;
  if (diff < 60)             text = '刚刚';
  else if (diff < 3600)      text = `${Math.floor(diff / 60)}分钟前`;
  else if (diff < 86400)     text = `${Math.floor(diff / 3600)}小时前`;
  else                       text = `${Math.floor(diff / 86400)}天前`;

  return <span className="text-xs text-gray-500">{text}</span>;
}
