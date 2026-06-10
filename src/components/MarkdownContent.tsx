import { useEffect, useMemo, useRef } from 'react';
import { copyCodeFromButton, renderMarkdown } from '../lib/markdown.js';

interface Props {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const html = useMemo(() => renderMarkdown(content), [content]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const onClick = async (e: MouseEvent) => {
      const btn = (e.target as Element).closest('.code-window__copy');
      if (!btn || !root.contains(btn)) return;
      e.preventDefault();
      e.stopPropagation();
      try {
        await copyCodeFromButton(btn);
        btn.classList.add('is-copied');
        window.setTimeout(() => btn.classList.remove('is-copied'), 1500);
      } catch {
        // clipboard unavailable
      }
    };

    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={`md-content${className ? ` ${className}` : ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
