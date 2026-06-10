import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createTodoNote, isTaskType } from '../../server/thino/task.js';
import {
  formatDateKey,
  formatTimestamp,
  generateId,
} from '../../server/thino/parser.js';
import { composeContent, separateContent, tagNameFromLine } from '../../server/thino/tags.js';
import type { ThinoNote } from '../types.js';

interface Props {
  editingNote?: ThinoNote | null;
  onSave: (note: ThinoNote) => void | Promise<void>;
  onUpdate: (note: ThinoNote) => void | Promise<void>;
  onCancelEdit: () => void;
}

export interface TopComposerHandle {
  focus: () => void;
  reset: () => void;
}

function getCursorLineIndex(text: string, cursor: number): number {
  return text.slice(0, cursor).split('\n').length - 1;
}

function insertAtCursor(
  textarea: HTMLTextAreaElement,
  before: string,
  after = '',
  cursorOffset?: number,
): string {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const next = value.slice(0, start) + before + value.slice(start, end) + after + value.slice(end);
  const cursor =
    cursorOffset !== undefined
      ? start + cursorOffset
      : start + before.length + (end - start) + after.length;
  requestAnimationFrame(() => {
    textarea.setSelectionRange(cursor, cursor);
    textarea.focus();
  });
  return next;
}

function clearForm(
  setBody: (v: string) => void,
  setTags: (v: string[]) => void,
  setAsTodo: (v: boolean) => void,
) {
  setBody('');
  setTags([]);
  setAsTodo(false);
}

export const TopComposer = forwardRef<TopComposerHandle, Props>(function TopComposer(
  { editingNote = null, onSave, onUpdate, onCancelEdit },
  ref,
) {
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [asTodo, setAsTodo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isEditing = editingNote !== null;

  const reset = () => {
    clearForm(setBody, setTags, setAsTodo);
  };

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    reset,
  }));

  useEffect(() => {
    if (!editingNote) return;
    const { body: noteBody, tags: noteTags } = separateContent(editingNote.content);
    setBody(noteBody);
    setTags(noteTags);
    setAsTodo(isTaskType(editingNote.thinoType));
  }, [editingNote]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [body, tags.length]);

  const handleSubmit = async () => {
    const content = composeContent(body.trim(), tags).trim();
    if (!content || submitting) return;

    setSubmitting(true);
    try {
      if (editingNote) {
        const base = { ...editingNote, content };
        const updated = asTodo ? createTodoNote(base) : { ...base, thinoType: 'JOURNAL' as const };
        await onUpdate(updated);
      } else {
        const now = new Date();
        const base = {
          id: generateId(),
          date: formatDateKey(now),
          timestamp: formatTimestamp(now),
          pinned: false,
          content,
        };
        const note = asTodo ? createTodoNote(base) : { ...base, thinoType: 'JOURNAL' as const };
        await onSave(note);
      }
      reset();
      onCancelEdit();
      textareaRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    onCancelEdit();
    textareaRef.current?.focus();
  };

  const tryConvertTagLine = (): boolean => {
    const textarea = textareaRef.current;
    if (!textarea) return false;

    const lines = body.split('\n');
    const lineIndex = getCursorLineIndex(body, textarea.selectionStart);
    const tag = tagNameFromLine(lines[lineIndex] ?? '');
    if (!tag) return false;

    const newLines = lines.filter((_, index) => index !== lineIndex);
    let newBody = newLines.join('\n');
    if (newBody) newBody += '\n';

    setTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
    setBody(newBody);

    requestAnimationFrame(() => {
      textarea.setSelectionRange(newBody.length, newBody.length);
      textarea.focus();
    });

    return true;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && isEditing) {
      e.preventDefault();
      handleCancel();
      return;
    }

    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleSubmit();
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      if (tryConvertTagLine()) {
        e.preventDefault();
      }
    }
  };

  const handleInsert = (snippet: string, after = '', cursorOffset?: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    setBody(insertAtCursor(textarea, snippet, after, cursorOffset));
  };

  const handleInsertImage = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end).trim();
    const alt = selected || '图片';
    const before = `![${alt}](`;
    const after = ')';
    setBody(insertAtCursor(textarea, before, after, start + before.length));
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((item) => item !== tag));
    textareaRef.current?.focus();
  };

  const canSend = (body.trim().length > 0 || tags.length > 0) && !submitting;

  return (
    <section className="top-composer" aria-label={isEditing ? '编辑 memo' : '新建 memo'}>
      <div className={`top-composer__card${isEditing ? ' is-editing' : ''}`}>
        {isEditing && (
          <div className="top-composer__edit-hint">编辑中</div>
        )}
        <div className={`top-composer__editor${tags.length > 0 ? ' has-tags' : ''}`}>
          <textarea
            ref={textareaRef}
            className="top-composer__input"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={asTodo ? '添加待办，如：吃饭（明天上午八点前）' : '现在的想法是...'}
            rows={1}
          />
          {tags.length > 0 && (
            <div className="top-composer__tags">
              {tags.map((tag) => (
                <span key={tag} className="top-composer__tag">
                  # {tag}
                  <button
                    type="button"
                    className="top-composer__tag-remove"
                    aria-label={`移除标签 ${tag}`}
                    onClick={() => removeTag(tag)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="top-composer__toolbar">
          <div className="top-composer__tools">
            <div className="top-composer__mode">
              <button
                type="button"
                className={`top-composer__mode-btn${!asTodo ? ' active' : ''}`}
                aria-pressed={!asTodo}
                onClick={() => setAsTodo(false)}
              >
                Memo
              </button>
              <button
                type="button"
                className={`top-composer__mode-btn${asTodo ? ' active' : ''}`}
                aria-pressed={asTodo}
                onClick={() => setAsTodo(true)}
              >
                待办
              </button>
            </div>
            <span className="top-composer__divider" aria-hidden="true" />
            <button
              type="button"
              className="top-composer__tool"
              title="插入标签"
              aria-label="插入标签"
              onClick={() => handleInsert('#')}
            >
              #
            </button>
            <button
              type="button"
              className="top-composer__tool"
              title="插入图片"
              aria-label="插入图片"
              onClick={handleInsertImage}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="9" cy="10" r="1.5" fill="currentColor" />
                <path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="top-composer__divider" aria-hidden="true" />
            <button
              type="button"
              className="top-composer__tool"
              title="无序列表"
              aria-label="无序列表"
              onClick={() => handleInsert('- ')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M8 6h13M8 12h13M8 18h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="4" cy="6" r="1.2" fill="currentColor" />
                <circle cx="4" cy="12" r="1.2" fill="currentColor" />
                <circle cx="4" cy="18" r="1.2" fill="currentColor" />
              </svg>
            </button>
            <button
              type="button"
              className="top-composer__tool"
              title="有序列表"
              aria-label="有序列表"
              onClick={() => handleInsert('1. ')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6h12M9 12h12M9 18h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M4 6h1v4H3.5M4 11.5h1.2a.8.8 0 1 0 0-1.6H4v1.6Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M3.5 16h2v1.5H3.5V18h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className="top-composer__actions">
            {isEditing && (
              <button
                type="button"
                className="top-composer__cancel"
                disabled={submitting}
                onClick={handleCancel}
              >
                取消
              </button>
            )}
            <button
              type="button"
              className="top-composer__send"
              disabled={!canSend}
              onClick={() => void handleSubmit()}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </section>
  );
});
