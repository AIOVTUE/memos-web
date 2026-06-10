import type { ThinoNote, ThinoType } from './types.js';

const DATE_HEADER_RE = /^#\s+(\d{4}-\d{2}-\d{2})\s*$/;
const THINO_HEADER_RE =
  /^\[!thino\]\s+(\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2})\s+%%\s*(.*?)\s*%%\s*$/;
const ID_RE = /\[id::([^\]]+)\]/;
const TYPE_RE = /\[thinoType::([^\]]+)\]/;
const PINNED_RE = /\[pinned::true\]/;

function stripQuotePrefix(line: string): string {
  if (line.startsWith('>')) {
    return line.length > 1 && line[1] === ' ' ? line.slice(2) : line.slice(1);
  }
  return line;
}

function parseHeader(line: string): {
  timestamp: string;
  id: string;
  thinoType: ThinoType;
  pinned: boolean;
} | null {
  const stripped = stripQuotePrefix(line);
  const match = stripped.match(THINO_HEADER_RE);
  if (!match) return null;

  const meta = match[2];
  const idMatch = meta.match(ID_RE);
  const typeMatch = meta.match(TYPE_RE);
  if (!idMatch || !typeMatch) return null;

  const thinoType = typeMatch[1] as ThinoType;
  if (!['JOURNAL', 'TASK-TODO', 'TASK-DONE'].includes(thinoType)) return null;

  return {
    timestamp: match[1],
    id: idMatch[1],
    thinoType,
    pinned: PINNED_RE.test(meta),
  };
}

export function parseThinoFile(content: string): ThinoNote[] {
  const notes: ThinoNote[] = [];
  const lines = content.split('\n');
  let currentDate = '';
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trimEnd();

    const dateMatch = line.match(DATE_HEADER_RE);
    if (dateMatch) {
      currentDate = dateMatch[1];
      i++;
      continue;
    }

    const header = parseHeader(line);
    if (header && currentDate) {
      const bodyLines: string[] = [];
      i++;

      while (i < lines.length) {
        const next = lines[i].trimEnd();
        if (next.match(DATE_HEADER_RE)) break;
        if (parseHeader(next)) break;
        if (next.startsWith('>')) {
          bodyLines.push(stripQuotePrefix(next));
        } else if (next === '') {
          bodyLines.push('');
        } else {
          break;
        }
        i++;
      }

      while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1] === '') {
        bodyLines.pop();
      }

      notes.push({
        id: header.id,
        date: currentDate,
        timestamp: header.timestamp,
        thinoType: header.thinoType,
        pinned: header.pinned,
        content: bodyLines.join('\n'),
      });
      continue;
    }

    i++;
  }

  return notes;
}

function formatBodyLines(content: string): string[] {
  if (!content) return ['>'];
  return content.split('\n').map((line) => (line === '' ? '>' : `> ${line}`));
}

function formatHeader(note: ThinoNote): string {
  const meta = [`[id::${note.id}]`, `[thinoType::${note.thinoType}]`];
  if (note.pinned) meta.push('[pinned::true]');
  return `> [!thino] ${note.timestamp} %% ${meta.join(' ')} %%`;
}

export function serializeThinoFile(notes: ThinoNote[]): string {
  const byDate = new Map<string, ThinoNote[]>();

  for (const note of notes) {
    const list = byDate.get(note.date) ?? [];
    list.push(note);
    byDate.set(note.date, list);
  }

  const sortedDates = [...byDate.keys()].sort((a, b) => b.localeCompare(a));
  const blocks: string[] = [];

  for (const date of sortedDates) {
    const dateNotes = byDate.get(date)!;
    dateNotes.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    blocks.push(`# ${date}`, '');

    for (const note of dateNotes) {
      blocks.push(formatHeader(note));
      blocks.push(...formatBodyLines(note.content));
      blocks.push('');
    }
  }

  return blocks.join('\n').replace(/\n+$/, '') + '\n';
}

export function generateId(): string {
  const hex = crypto.randomUUID().replace(/-/g, '').slice(0, 15);
  return `a${hex}`;
}

export function formatTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatDateKey(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
