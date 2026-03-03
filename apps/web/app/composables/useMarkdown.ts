/**
 * Minimal safe Markdown-like rendering: escape HTML, then support
 * **bold**, *italic*, `code`, ![images](url), and newlines.
 * No external deps; safe for SSR and edge.
 */
function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function sanitizeUrl(url: string): string {
  const decoded = url.trim()
  if (/^https?:\/\//i.test(decoded) || /^data:image\//i.test(decoded)) return decoded
  return ''
}

export function useMarkdown() {
  function render(text: string): string {
    if (!text) return ''
    let out = escapeHtml(text)
    // Images: ![alt](url) — only allow safe protocols
    out = out.replaceAll(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt: string, url: string) => {
      const safeUrl = sanitizeUrl(url)
      if (!safeUrl) return `[image: ${alt}]`
      return `<img src="${safeUrl}" alt="${alt}" class="max-w-full rounded-lg my-1" loading="lazy" />`
    })
    // Code: `inline code`
    out = out.replaceAll(/`([^`]+)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-sm">$1</code>')
    out = out.replaceAll(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    out = out.replaceAll(/\*(.+?)\*/g, '<em>$1</em>')
    out = out.replaceAll('\n', '<br>')
    return out
  }
  return { render }
}
