import { separateContent } from '../../server/thino/tags.js';

export function formatCardTime(timestamp: string): string {
  const match = timestamp.match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/);
  if (!match) return timestamp;
  return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}`;
}

export function formatRelativeTime(timestamp: string): string {
  const match = timestamp.match(
    /^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/,
  );
  if (!match) return timestamp;

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6]),
  );

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24 && now.getDate() === date.getDate()) {
    return `${diffHour} 小时前`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  ) {
    return `昨天 ${match[4]}:${match[5]}`;
  }

  if (now.getFullYear() === date.getFullYear()) {
    return `${Number(match[2])} 月 ${Number(match[3])} 日`;
  }

  return `${match[1]}/${match[2]}/${match[3]}`;
}

const TAG_THEMES: Record<string, string> = {
  欢迎: 'theme-yellow',
  工作: 'theme-blue',
  紧急: 'theme-blue',
  生活: 'theme-green',
  读书: 'theme-white',
  灵感: 'theme-purple',
  测试: 'theme-gray',
};

export function getCardTheme(tags: string[], _thinoType: string): string {
  for (const tag of tags) {
    if (TAG_THEMES[tag]) return TAG_THEMES[tag];
  }
  return 'theme-white';
}

export function getNoteDisplay(note: { content: string; thinoType: string }) {
  const { body, tags } = separateContent(note.content);
  return {
    body,
    tags,
    theme: getCardTheme(tags, note.thinoType),
  };
}
