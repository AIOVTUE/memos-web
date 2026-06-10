import { marked } from 'marked';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const copyIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

marked.use({
  breaks: true,
  gfm: true,
  renderer: {
    code({ text, lang }) {
      const language = lang || 'text';
      return `<div class="code-window">
  <div class="code-window__bar">
    <span class="code-window__dots" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="code-window__lang">${escapeHtml(language)}</span>
    <button type="button" class="code-window__copy" title="复制代码" aria-label="复制代码">${copyIcon}</button>
  </div>
  <div class="code-window__body">
    <pre><code class="language-${escapeHtml(language)}">${escapeHtml(text.replace(/\n$/, ''))}</code></pre>
  </div>
</div>`;
    },
    codespan({ text }) {
      return `<code class="md-inline-code">${escapeHtml(text)}</code>`;
    },
  },
});

export function renderMarkdown(content: string): string {
  return marked.parse(content) as string;
}

export async function copyCodeFromButton(btn: Element): Promise<boolean> {
  const code = btn.closest('.code-window')?.querySelector('code');
  if (!code) return false;
  await navigator.clipboard.writeText(code.textContent || '');
  return true;
}
