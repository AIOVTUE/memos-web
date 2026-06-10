import { TodoItemRow } from './TodoItemRow.js';

interface Props {
  items: Array<{ text: string; checked: boolean }>;
  onToggle: (index: number) => void;
  stopCardClick?: boolean;
  collapsed?: boolean;
  collapseLimit?: number;
}

export function TodoItemList({
  items,
  onToggle,
  stopCardClick = false,
  collapsed = false,
  collapseLimit = 3,
}: Props) {
  const visibleItems = collapsed ? items.slice(0, collapseLimit) : items;

  return (
    <ul className="todo-list">
      {visibleItems.map((item, index) => (
        <TodoItemRow
          key={index}
          text={item.text}
          checked={item.checked}
          index={index}
          onToggle={() => onToggle(index)}
          stopCardClick={stopCardClick}
        />
      ))}
      {collapsed && items.length > collapseLimit && (
        <li className="todo-list__more">还有 {items.length - collapseLimit} 项…</li>
      )}
    </ul>
  );
}
