import type { SeparatedContent } from './types.js';

const TAG_LINE_RE = /^#([\w\u4e00-\u9fff-]+)$/;

export function tagNameFromLine(line: string): string | null {
  const trimmed = line.trim();
  const match = trimmed.match(TAG_LINE_RE);
  return match ? match[1] : null;
}

export function parseTags(text: string): string[] {
  const tags: string[] = [];
  for (const line of text.split('\n')) {
    const tag = tagNameFromLine(line);
    if (tag && !tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

export function separateContent(text: string): SeparatedContent {
  const lines = text.split('\n');
  const bodyLines: string[] = [];
  const tags: string[] = [];

  for (const line of lines) {
    const tag = tagNameFromLine(line);
    if (tag) {
      if (!tags.includes(tag)) tags.push(tag);
    } else {
      bodyLines.push(line);
    }
  }

  while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1] === '') {
    bodyLines.pop();
  }

  return { body: bodyLines.join('\n'), tags };
}

export function composeContent(body: string, tags: string[]): string {
  const trimmedBody = body.replace(/\n+$/, '');
  const tagLines = tags.map((t) => `#${t}`);
  if (tagLines.length === 0) return trimmedBody;
  if (!trimmedBody) return tagLines.join('\n');
  return `${trimmedBody}\n${tagLines.join('\n')}`;
}
