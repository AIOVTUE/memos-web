import { composeContent, separateContent } from './tags.js';
import type { ThinoNote, ThinoType } from './types.js';

export interface TaskItem {
  text: string;
  checked: boolean;
}

export interface TaskDisplayParts {
  title: string;
  time: string | null;
  fullTitle: string;
}

const TODO_LINE_RE = /^-\s*\[([ xX])\]\s*(.*)$/;
const TASK_TIME_RE = /^(.+?)[（(]([^）)]+)[）)]\s*$/;

export function parseTaskDisplayText(text: string): TaskDisplayParts {
  const trimmed = text.trim();
  const match = trimmed.match(TASK_TIME_RE);
  if (!match) {
    return { title: trimmed, time: null, fullTitle: trimmed };
  }
  const title = match[1].trim();
  const time = match[2].trim();
  return { title, time, fullTitle: `${title}（${time}）` };
}

export function parseTodoItems(body: string): TaskItem[] {
  const items: TaskItem[] = [];
  for (const line of body.split('\n')) {
    const match = line.match(TODO_LINE_RE);
    if (match) {
      items.push({ checked: match[1].toLowerCase() === 'x', text: match[2] });
    } else if (line.trim()) {
      items.push({ checked: false, text: line });
    }
  }
  return items;
}

export function parseDoneItems(body: string): TaskItem[] {
  return body
    .split('\n')
    .filter((l) => l.trim())
    .map((text) => ({ text, checked: true }));
}

export function itemsToTodoText(items: TaskItem[]): string {
  return items
    .map((item) => `- [${item.checked ? 'x' : ' '}] ${item.text}`)
    .join('\n');
}

export function itemsToDoneText(items: TaskItem[]): string {
  return items.map((item) => item.text).join('\n');
}

export function contentToTodoText(content: string): string {
  const { body, tags } = separateContent(content);
  const lines = body.split('\n').filter((l) => l.trim());
  const todoLines = lines.map((line) => {
    const match = line.match(TODO_LINE_RE);
    if (match) return line;
    return `- [ ] ${line}`;
  });
  return composeContent(todoLines.join('\n'), tags);
}

export function toggleTaskCheckbox(note: ThinoNote, itemIndex: number): ThinoNote {
  if (note.thinoType !== 'TASK-TODO') return note;
  const { body, tags } = separateContent(note.content);
  const items = parseTodoItems(body);
  if (itemIndex < 0 || itemIndex >= items.length) return note;

  items[itemIndex].checked = !items[itemIndex].checked;

  if (items.every((i) => i.checked)) {
    return {
      ...note,
      thinoType: 'TASK-DONE',
      content: composeContent(itemsToDoneText(items), tags),
    };
  }

  return {
    ...note,
    content: composeContent(itemsToTodoText(items), tags),
  };
}

export function setTaskCompletion(note: ThinoNote): ThinoNote {
  if (note.thinoType !== 'TASK-TODO') return note;
  const { body, tags } = separateContent(note.content);
  const items = parseTodoItems(body).map((i) => ({ ...i, checked: true }));
  return {
    ...note,
    thinoType: 'TASK-DONE',
    content: composeContent(itemsToDoneText(items), tags),
  };
}

export function revertDoneToTodo(note: ThinoNote): ThinoNote {
  if (note.thinoType !== 'TASK-DONE') return note;
  const { body, tags } = separateContent(note.content);
  const items = parseDoneItems(body).map((i) => ({ ...i, checked: true }));
  return {
    ...note,
    thinoType: 'TASK-TODO',
    content: composeContent(itemsToTodoText(items), tags),
  };
}

export function undoTaskDoneItem(note: ThinoNote, itemIndex: number): ThinoNote {
  if (note.thinoType !== 'TASK-DONE') return note;
  const { body, tags } = separateContent(note.content);
  const items = parseDoneItems(body);
  if (itemIndex < 0 || itemIndex >= items.length) return note;

  const todoItems = items.map((item, i) => ({
    text: item.text,
    checked: i !== itemIndex,
  }));

  return {
    ...note,
    thinoType: 'TASK-TODO',
    content: composeContent(itemsToTodoText(todoItems), tags),
  };
}

export function createTodoNote(
  base: Omit<ThinoNote, 'thinoType' | 'content'> & { content: string },
): ThinoNote {
  return {
    ...base,
    thinoType: 'TASK-TODO',
    content: contentToTodoText(base.content),
  };
}

export function isTaskType(type: ThinoType): boolean {
  return type === 'TASK-TODO' || type === 'TASK-DONE';
}
