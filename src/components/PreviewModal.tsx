import { separateContent } from '../../server/thino/tags.js';
import {
  parseDoneItems,
  parseTodoItems,
  toggleTaskCheckbox,
  undoTaskDoneItem,
} from '../../server/thino/task.js';
import type { ThinoNote } from '../types.js';
import { formatRelativeTime, getNoteDisplay } from '../utils/noteDisplay.js';
import { MarkdownContent } from './MarkdownContent.js';
import { TodoItemList } from './TodoItemList.js';

interface Props {
  note: ThinoNote;
  onClose: () => void;
  onUpdate: (note: ThinoNote) => void;
}

export function PreviewModal({ note, onClose, onUpdate }: Props) {
  const display = getNoteDisplay(note);
  const isTodo = note.thinoType === 'TASK-TODO';
  const isDone = note.thinoType === 'TASK-DONE';
  const rawBody = separateContent(note.content).body;
  const todoItems = isTodo ? parseTodoItems(rawBody) : [];
  const doneItems = isDone ? parseDoneItems(rawBody) : [];

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="preview-panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="preview-close" aria-label="关闭" onClick={onClose}>
          ✕
        </button>

        {note.pinned && (
          <header className="preview-card__header">
            <span className="preview-card__star">★ 置顶</span>
          </header>
        )}

        <div className="preview-card__body">
          {isTodo && (
            <TodoItemList
              items={todoItems}
              onToggle={(index) => onUpdate(toggleTaskCheckbox(note, index))}
            />
          )}

          {isDone && (
            <TodoItemList
              items={doneItems}
              onToggle={(index) => onUpdate(undoTaskDoneItem(note, index))}
            />
          )}

          {!isTodo && !isDone && display.body.trim() && (
            <MarkdownContent content={display.body} className="md-content--preview" />
          )}
        </div>

        <footer className="preview-card__footer">
          <div className="preview-card__footer-left">
            {display.tags.length > 0 && (
              <div className="preview-card__tags">
                {display.tags.map((tag) => (
                  <span key={tag} className="memo-card__tag">
                    # {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="preview-card__footer-right">
            <time className="preview-card__time">{formatRelativeTime(note.timestamp)}</time>
          </div>
        </footer>
      </div>
    </div>
  );
}
