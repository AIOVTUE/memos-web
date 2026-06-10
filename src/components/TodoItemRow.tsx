import type { MouseEvent } from 'react';
import { parseTaskDisplayText } from '../../server/thino/task.js';

const ACCENTS = ['blue', 'green', 'purple', 'amber'] as const;

interface Props {
  text: string;
  checked: boolean;
  index: number;
  onToggle: () => void;
  stopCardClick?: boolean;
}

export function TodoItemRow({
  text,
  checked,
  index,
  onToggle,
  stopCardClick = false,
}: Props) {
  const { title, time } = parseTaskDisplayText(text);
  const accent = ACCENTS[index % ACCENTS.length];

  const handleToggle = (e: MouseEvent) => {
    if (stopCardClick) {
      e.stopPropagation();
    }
    onToggle();
  };

  return (
    <li className={`todo-item todo-item--${accent}${checked ? ' is-checked' : ''}`}>
      <button
        type="button"
        className="todo-item__check"
        aria-label={checked ? `标记未完成：${title}` : `标记完成：${title}`}
        aria-pressed={checked}
        onClick={handleToggle}
      />
      <div className="todo-item__content">
        <div className={`todo-item__title-row${checked ? ' is-checked' : ''}`}>
          <span className="todo-item__title">{title}</span>
          {time && <span className="todo-item__deadline">（{time}）</span>}
        </div>
        {time && (
          <div className="todo-item__meta">
            <span className="todo-item__chip todo-item__chip--time">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              {time}
            </span>
          </div>
        )}
      </div>
    </li>
  );
}
