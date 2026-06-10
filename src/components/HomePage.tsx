import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseTags } from '../../server/thino/tags.js';
import { api } from '../api.js';
import type { ThemeMode } from '../lib/theme.js';
import type { ThinoNote } from '../types.js';
import { NoteCard } from './NoteCard.js';
import { PreviewModal } from './PreviewModal.js';
import { Sidebar, type NavSection } from './Sidebar.js';
import { TopComposer, type TopComposerHandle } from './TopComposer.js';

interface Props {
  onLogout: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const PAGE_SIZE = 30;
const SIDEBAR_BREAKPOINT = 1280;

function isWideViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth >= SIDEBAR_BREAKPOINT;
}
type ViewMode = 'grid' | 'list';

export function HomePage({ onLogout, theme, onToggleTheme }: Props) {
  const [notes, setNotes] = useState<ThinoNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [navSection, setNavSection] = useState<NavSection>('all');
  const [previewNote, setPreviewNote] = useState<ThinoNote | null>(null);
  const [editNote, setEditNote] = useState<ThinoNote | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sidebarOpen, setSidebarOpen] = useState(isWideViewport);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<TopComposerHandle>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  const loadMemos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getMemos();
      setNotes(data.notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMemos();
  }, [loadMemos]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setEditNote(null);
        composerRef.current?.reset();
        composerRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        if (search.trim()) {
          setSearch('');
          setVisibleCount(PAGE_SIZE);
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [search]);

  useEffect(() => {
    const onResize = () => {
      setSidebarOpen(window.innerWidth >= SIDEBAR_BREAKPOINT);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!sidebarOpen || isWideViewport()) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [sidebarOpen]);

  const persist = useCallback(async (nextNotes: ThinoNote[]) => {
    setSaving(true);
    setError('');
    try {
      await api.saveMemos(nextNotes);
      setNotes(nextNotes);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const note of notes) {
      for (const tag of parseTags(note.content)) set.add(tag);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }, [notes]);

  const counts = useMemo(
    () => ({
      all: notes.length,
      favorites: notes.filter((n) => n.pinned).length,
    }),
    [notes],
  );

  const storageBytes = useMemo(
    () => new TextEncoder().encode(notes.map((n) => n.content).join('\n')).length,
    [notes],
  );

  const sectionNotes = useMemo(() => {
    switch (navSection) {
      case 'favorites':
        return notes.filter((n) => n.pinned);
      default:
        return notes;
    }
  }, [notes, navSection]);

  const visibleNotes = useMemo(() => {
    let list = [...sectionNotes];

    list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const dateCmp = b.date.localeCompare(a.date);
      const timeCmp = b.timestamp.localeCompare(a.timestamp);
      const latestFirst = dateCmp !== 0 ? dateCmp : timeCmp;
      return latestFirst;
    });

    if (selectedTags.length > 0) {
      list = list.filter((note) => {
        const tags = parseTags(note.content);
        return selectedTags.some((t) => tags.includes(t));
      });
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (note) =>
          note.content.toLowerCase().includes(q) ||
          note.timestamp.includes(q),
      );
    }

    return list;
  }, [sectionNotes, selectedTags, search]);

  const displayedNotes = visibleNotes.slice(0, visibleCount);

  const sectionLabel = useMemo(() => {
    if (navSection === 'favorites') return '置顶';
    if (navSection === 'tags') {
      if (selectedTags.length === 1) return `#${selectedTags[0]}`;
      if (selectedTags.length > 1) return '标签筛选';
      return '标签';
    }
    return '全部';
  }, [navSection, selectedTags]);

  const handleNavigate = (section: NavSection) => {
    setNavSection(section);
    setVisibleCount(PAGE_SIZE);
    if (section !== 'tags') setSelectedTags([]);
    if (!isWideViewport() && section !== 'tags') setSidebarOpen(false);
  };

  const handleAdd = async (note: ThinoNote) => {
    await persist([note, ...notes]);
  };

  const handleUpdate = async (updated: ThinoNote) => {
    await persist(notes.map((n) => (n.id === updated.id ? updated : n)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条记录？')) return;
    await persist(notes.filter((n) => n.id !== id));
  };

  const handleTogglePin = async (id: string) => {
    await persist(notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
    setVisibleCount(PAGE_SIZE);
  };

  const handleStartEdit = (note: ThinoNote) => {
    setPreviewNote(null);
    setEditNote(note);
    requestAnimationFrame(() => {
      contentAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      composerRef.current?.focus();
    });
  };

  return (
    <div className={`app-layout${sidebarOpen ? ' sidebar-open' : ''}`}>
      <div
        className="sidebar-backdrop"
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />
      <Sidebar
        active={navSection}
        onNavigate={handleNavigate}
        onNewMemo={() => {
          setEditNote(null);
          composerRef.current?.reset();
          composerRef.current?.focus();
          if (!isWideViewport()) setSidebarOpen(false);
        }}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
        counts={counts}
        tags={allTags}
        selectedTags={selectedTags}
        onToggleTag={toggleTag}
        onClearTags={() => setSelectedTags([])}
        storageBytes={storageBytes}
      />

      <div className="main-area">
        <div className="content-area" ref={contentAreaRef}>
          <div className="content-column">
          <header className="page-header">
            <div className="page-header__main">
              <div className="page-header__row">
                <button
                  type="button"
                  className="page-header__brand"
                  onClick={() => setSidebarOpen((v) => !v)}
                  aria-expanded={sidebarOpen}
                >
                  Memos
                </button>
                <div className="page-header__controls">
                <div className="page-header__search">
                  <div className="page-header__search-field">
                    <span className="page-header__search-icon">⌕</span>
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="搜索 memos…"
                      value={search}
                      enterKeyHint="search"
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setVisibleCount(PAGE_SIZE);
                      }}
                    />
                    {search.trim() && (
                      <button
                        type="button"
                        className="page-header__search-clear"
                        aria-label="清空搜索"
                        onClick={() => {
                          setSearch('');
                          setVisibleCount(PAGE_SIZE);
                          searchInputRef.current?.focus();
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <button type="button" className="icon-btn" title="刷新" onClick={loadMemos}>
                  ↻
                </button>
                <div className="view-toggle">
                  <button
                    type="button"
                    className={viewMode === 'grid' ? 'active' : ''}
                    title="网格视图"
                    onClick={() => setViewMode('grid')}
                  >
                    ⊞
                  </button>
                  <button
                    type="button"
                    className={viewMode === 'list' ? 'active' : ''}
                    title="列表视图"
                    onClick={() => setViewMode('list')}
                  >
                    ☰
                  </button>
                </div>
              </div>
              </div>
              <div className="page-header__subtitle-row">
                <p className="page-header__subtitle">
                  {sectionLabel !== '全部' ? `${sectionLabel} · ` : ''}
                  {visibleNotes.length} 条 memos
                </p>
                {saving && <span className="page-header__saving">保存中…</span>}
              </div>
            </div>
          </header>

          {error && (
            <div className="status-bar">{error}</div>
          )}

          <TopComposer
            ref={composerRef}
            editingNote={editNote}
            onSave={handleAdd}
            onUpdate={handleUpdate}
            onCancelEdit={() => setEditNote(null)}
          />

          <main className={`memo-board memo-board--${viewMode}`}>
            {loading ? (
              <div className="loading">加载中…</div>
            ) : displayedNotes.length === 0 ? (
              <div className="empty-state">
                {notes.length === 0
                  ? '还没有记录，在上方输入框写下第一条 memo'
                  : '没有匹配的记录'}
              </div>
            ) : (
              displayedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  view={viewMode}
                  onPreview={setPreviewNote}
                  onUpdate={handleUpdate}
                  onEdit={handleStartEdit}
                  onDelete={handleDelete}
                  onTogglePin={handleTogglePin}
                />
              ))
            )}

            {!loading && visibleCount < visibleNotes.length && (
              <button
                type="button"
                className="btn btn-ghost load-more"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                加载更多
              </button>
            )}
          </main>
          </div>
        </div>
      </div>

      {previewNote && (
        <PreviewModal
          note={previewNote}
          onClose={() => setPreviewNote(null)}
          onUpdate={async (updated) => {
            await handleUpdate(updated);
            setPreviewNote(updated);
          }}
        />
      )}
    </div>
  );
}
