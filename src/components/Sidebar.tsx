import type { ThemeMode } from '../lib/theme.js';

type NavSection = 'all' | 'favorites' | 'tags';

interface Props {
  active: NavSection;
  onNavigate: (section: NavSection) => void;
  onNewMemo: () => void;
  onLogout: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  counts: {
    all: number;
    favorites: number;
  };
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  storageBytes: number;
}

function formatStorage(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function Sidebar({
  active,
  onNavigate,
  onNewMemo,
  onLogout,
  theme,
  onToggleTheme,
  counts,
  tags,
  selectedTags,
  onToggleTag,
  onClearTags,
  storageBytes,
}: Props) {
  const storageLimit = 1024 * 1024 * 1024;
  const storagePct = Math.min(100, (storageBytes / storageLimit) * 100);

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo">m</span>
        <span className="sidebar__name">memos</span>
      </div>

      <button type="button" className="sidebar__new" onClick={onNewMemo}>
        <span className="sidebar__new-icon">✎</span>
        <span>新建 memos</span>
        <kbd>Ctrl N</kbd>
      </button>

      <nav className="sidebar__nav">
        <button
          type="button"
          className={`sidebar__item${active === 'all' ? ' active' : ''}`}
          onClick={() => onNavigate('all')}
        >
          <span className="sidebar__item-icon">▦</span>
          <span>全部</span>
          <span className="sidebar__count">{counts.all}</span>
        </button>
        <button
          type="button"
          className={`sidebar__item${active === 'favorites' ? ' active' : ''}`}
          onClick={() => onNavigate('favorites')}
        >
          <span className="sidebar__item-icon">★</span>
          <span>置顶</span>
          <span className="sidebar__count">{counts.favorites}</span>
        </button>
        <button
          type="button"
          className={`sidebar__item${active === 'tags' ? ' active' : ''}`}
          onClick={() => onNavigate('tags')}
        >
          <span className="sidebar__item-icon">⌗</span>
          <span>标签</span>
        </button>
      </nav>

      {active === 'tags' && (
        <div className="sidebar__tags">
          {tags.length === 0 ? (
            <div className="sidebar__tags-empty">暂无标签</div>
          ) : (
            tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`sidebar__tag${selectedTags.includes(tag) ? ' active' : ''}`}
                onClick={() => onToggleTag(tag)}
              >
                # {tag}
              </button>
            ))
          )}
          {selectedTags.length > 0 && (
            <button type="button" className="sidebar__tag-clear" onClick={onClearTags}>
              清除筛选
            </button>
          )}
        </div>
      )}

      <div className="sidebar__bottom">
        <button type="button" className="sidebar__item sidebar__theme" onClick={onToggleTheme}>
          <span className="sidebar__item-icon">{theme === 'dark' ? '☀' : '☾'}</span>
          <span>{theme === 'dark' ? '浅色模式' : '黑夜模式'}</span>
        </button>

        <button type="button" className="sidebar__item sidebar__logout" onClick={onLogout}>
          <span className="sidebar__item-icon">↪</span>
          <span>退出登录</span>
        </button>

        <div className="sidebar__storage">
          <div className="sidebar__storage-label">
            <span>存储使用</span>
            <span>
              {formatStorage(storageBytes)} / 1 GB
            </span>
          </div>
          <div className="sidebar__storage-bar">
            <div className="sidebar__storage-fill" style={{ width: `${storagePct}%` }} />
          </div>
        </div>
      </div>
    </aside>
  );
}

export type { NavSection };
