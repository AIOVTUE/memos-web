import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { separateContent } from '../../server/thino/tags.js';
import {
  parseDoneItems,
  parseTodoItems,
  revertDoneToTodo,
  setTaskCompletion,
  toggleTaskCheckbox,
  undoTaskDoneItem,
} from '../../server/thino/task.js';
import type { ThinoNote } from '../types.js';
import { formatCardTime, formatRelativeTime, getNoteDisplay } from '../utils/noteDisplay.js';
import { MarkdownContent } from './MarkdownContent.js';
import { TodoItemList } from './TodoItemList.js';

const LIST_COLLAPSE_LINES = 3;
const LIST_COLLAPSE_ITEMS = 3;
const LIST_COLLAPSE_CHARS = 200;

function isLongListContent(
  note: ThinoNote,
  body: string,
  todoCount: number,
  doneCount: number,
): boolean {
  if (note.thinoType === 'TASK-TODO') {
    return todoCount > LIST_COLLAPSE_ITEMS || body.length > LIST_COLLAPSE_CHARS;
  }
  if (note.thinoType === 'TASK-DONE') {
    return doneCount > LIST_COLLAPSE_ITEMS || body.length > LIST_COLLAPSE_CHARS;
  }
  const text = body.trim();
  if (!text) return false;
  const lines = text.split('\n').filter((line) => line.trim());
  return lines.length > LIST_COLLAPSE_LINES || text.length > LIST_COLLAPSE_CHARS;
}

interface Props {
  note: ThinoNote;
  view: 'grid' | 'list';
  onPreview: (note: ThinoNote) => void;
  onUpdate: (note: ThinoNote) => void;
  onEdit: (note: ThinoNote) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

export function NoteCard({
  note,
  view,
  onPreview,
  onUpdate,
  onEdit,
  onDelete,
  onTogglePin,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const display = getNoteDisplay(note);
  const isTodo = note.thinoType === 'TASK-TODO';
  const isDone = note.thinoType === 'TASK-DONE';
  const isList = view === 'list';
  const rawBody = separateContent(note.content).body;

  const todoItems = isTodo ? parseTodoItems(rawBody) : [];
  const doneItems = isDone ? parseDoneItems(rawBody) : [];
  const isLong = isList && isLongListContent(note, display.body, todoItems.length, doneItems.length);
  const isCollapsed = isLong && !expanded;

  useEffect(() => {
    setExpanded(false);
  }, [view, note.id]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpen]);

  const updateDropdownPos = useCallback(() => {
    const btn = menuBtnRef.current;
    const dropdown = dropdownRef.current;
    if (!btn || !dropdown) return;

    const gap = 4;
    const margin = 8;
    const btnRect = btn.getBoundingClientRect();
    const { width, height } = dropdown.getBoundingClientRect();

    let left = btnRect.right - width;
    let top = btnRect.bottom + gap;

    if (left < margin) left = margin;
    if (left + width > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - margin - width);
    }

    if (top + height > window.innerHeight - margin) {
      top = btnRect.top - gap - height;
    }
    if (top < margin) top = margin;

    setDropdownPos({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!menuOpen) {
      setDropdownPos(null);
      return;
    }

    updateDropdownPos();
    window.addEventListener('resize', updateDropdownPos);
    window.addEventListener('scroll', updateDropdownPos, true);
    return () => {
      window.removeEventListener('resize', updateDropdownPos);
      window.removeEventListener('scroll', updateDropdownPos, true);
    };
  }, [menuOpen, updateDropdownPos]);

  const menu = (
    <div className="memo-card__menu" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        ref={menuBtnRef}
        className="memo-card__menu-btn"
        aria-label="更多操作"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
      >
        ···
      </button>
      {menuOpen && (
        <div
          ref={dropdownRef}
          className="memo-card__dropdown is-floating"
          style={{
            visibility: dropdownPos ? 'visible' : 'hidden',
            top: dropdownPos?.top ?? 0,
            left: dropdownPos?.left ?? 0,
          }}
        >
          <button
            type="button"
            onClick={() => {
              onPreview(note);
              setMenuOpen(false);
            }}
          >
            预览
          </button>
          <button
            type="button"
            onClick={() => {
              onEdit(note);
              setMenuOpen(false);
            }}
          >
            编辑
          </button>
          <button
            type="button"
            onClick={() => {
              onTogglePin(note.id);
              setMenuOpen(false);
            }}
          >
            {note.pinned ? '取消置顶' : '置顶'}
          </button>
          {isTodo && (
            <button
              type="button"
              onClick={() => {
                onUpdate(setTaskCompletion(note));
                setMenuOpen(false);
              }}
            >
              标记已完成
            </button>
          )}
          {isDone && (
            <button
              type="button"
              onClick={() => {
                onUpdate(revertDoneToTodo(note));
                setMenuOpen(false);
              }}
            >
              标记为待办
            </button>
          )}
          <button
            type="button"
            className="danger"
            onClick={() => {
              onDelete(note.id);
              setMenuOpen(false);
            }}
          >
            删除
          </button>
        </div>
      )}
    </div>
  );

  const body = (
      <div className="memo-card__body">
        {isTodo && (
          <TodoItemList
            items={todoItems}
            collapsed={isCollapsed}
            collapseLimit={LIST_COLLAPSE_ITEMS}
            stopCardClick
            onToggle={(index) => onUpdate(toggleTaskCheckbox(note, index))}
          />
        )}

        {isDone && (
          <TodoItemList
            items={doneItems}
            collapsed={isCollapsed}
            collapseLimit={LIST_COLLAPSE_ITEMS}
            stopCardClick
            onToggle={(index) => onUpdate(undoTaskDoneItem(note, index))}
          />
        )}

        {!isTodo && !isDone && display.body.trim() && (
          <MarkdownContent content={display.body} className="md-content--card" />
        )}
      </div>
  );

  const footer = (showTime: boolean) => (
    <footer className="memo-card__footer">
      <div className="memo-card__footer-left">
        {display.tags.length > 0 && (
          <div className="memo-card__tags">
            {display.tags.map((tag) => (
              <span key={tag} className="memo-card__tag">
                # {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="memo-card__footer-center">
        {isLong && (
          <button
            type="button"
            className="memo-card__expand"
            aria-label={expanded ? '收起' : '展开'}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
          >
            <span className="memo-card__expand-arrows" aria-hidden="true">
              <svg
                className={expanded ? 'is-up' : ''}
                width="18"
                height="12"
                viewBox="0 0 18 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 8 9 12 16 8" />
                <path d="M2 5 9 9 16 5" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <div className="memo-card__footer-right">
        {showTime && (
          <time className="memo-card__time">{formatRelativeTime(note.timestamp)}</time>
        )}
      </div>
    </footer>
  );

  return (
    <article
      className={`memo-card ${display.theme}${note.pinned ? ' is-pinned' : ''}${view === 'list' ? ' memo-card--list' : ' memo-card--grid'}${isCollapsed ? ' is-collapsed' : ''}${menuOpen ? ' is-menu-open' : ''}`}
      onClick={() => onPreview(note)}
    >
      {isList ? (
        <>
          <div className="memo-card__header">
            <div className="memo-card__header-left">
              {note.pinned && (
                <span className="memo-card__star memo-card__star--inline" title="已置顶">
                  ★
                </span>
              )}
              <time className="memo-card__time">{formatCardTime(note.timestamp)}</time>
            </div>
            {menu}
          </div>
          {body}
          {(display.tags.length > 0 || isLong) && footer(false)}
        </>
      ) : (
        <>
          {note.pinned && (
            <span className="memo-card__star" title="已置顶">
              ★
            </span>
          )}
          {menu}
          {body}
          {footer(true)}
        </>
      )}
    </article>
  );
}
