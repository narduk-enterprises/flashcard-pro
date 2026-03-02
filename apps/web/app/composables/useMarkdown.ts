/**
 * Minimal safe Markdown-like rendering: escape HTML, then support **bold**, *italic*, and newlines.
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

export function useMarkdown() {
  function render(text: string): string {
    if (!text) return ''
    let out = escapeHtml(text)
    out = out.replaceAll(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    out = out.replaceAll(/\*(.+?)\*/g, '<em>$1</em>')
    out = out.replaceAll('\n', '<br>')
    return out
  }
  return { render }
}
