export default function TimeAgo({ dateString }: { dateString: string }) {
  const timestamp = new Date(dateString).getTime();

  if (Number.isNaN(timestamp)) {
    return <span className="mono-label">未知时间</span>;
  }

  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  let text = '刚刚';

  if (diffSeconds < 60) {
    text = '刚刚';
  } else if (diffSeconds < 3600) {
    text = `${Math.floor(diffSeconds / 60)}分钟前`;
  } else if (diffSeconds < 86400) {
    text = `${Math.floor(diffSeconds / 3600)}小时前`;
  } else {
    text = `${Math.floor(diffSeconds / 86400)}天前`;
  }

  return <span className="mono-label">{text}</span>;
}
