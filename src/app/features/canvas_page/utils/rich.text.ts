/**
 * Lightweight rich-text helpers for canvas text boxes (contentEditable).
 * Plain strings stay plain; once the user applies inline styles we store HTML.
 */

const HTML_TAG_RE = /<\/?[a-z][\s\S]*>/i;

export function looksLikeHtml(content: string): boolean {
  return HTML_TAG_RE.test(content);
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Strip tags for Denise / snapshots / list math. Preserves newlines from <br> / block ends. */
export function htmlToPlain(content: string): string {
  if (!content) return '';
  if (!looksLikeHtml(content)) return content.replace(/\r\n/g, '\n');

  return content
    .replace(/\r\n/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|li|h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n');
}

/** HTML suitable for contentEditable / display. Plain text → escaped + <br>. */
export function contentToHtml(content: string): string {
  if (!content) return '';
  if (looksLikeHtml(content)) return content;
  return escapeHtml(content).replace(/\n/g, '<br>');
}

/**
 * Persist editor HTML. If there is no real inline/block formatting left,
 * collapse back to plain text with `\n` so the rest of the app stays simple.
 */
export function serializeEditorHtml(root: HTMLElement): string {
  const html = root.innerHTML;
  const withoutBreaks = html
    .replace(/<br\s*\/?>/gi, '')
    .replace(/<\/?div[^>]*>/gi, '')
    .replace(/<\/?p[^>]*>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();

  if (!withoutBreaks || !HTML_TAG_RE.test(withoutBreaks)) {
    return htmlToPlain(html);
  }
  return html;
}

function plainLengthOfRange(range: Range): number {
  const div = document.createElement('div');
  div.appendChild(range.cloneContents());
  return htmlToPlain(div.innerHTML).length;
}

/** Plain-text offsets for a Range inside `root` (br / block ends count as `\n`). */
export function rangeToPlainOffsets(
  root: HTMLElement,
  range: Range,
): { start: number; end: number } | null {
  try {
    const before = document.createRange();
    before.selectNodeContents(root);
    before.setEnd(range.startContainer, range.startOffset);
    const start = plainLengthOfRange(before);
    const end = start + plainLengthOfRange(range.cloneRange());
    return { start, end };
  } catch {
    return null;
  }
}

type PlainCursor = { node: Text; offset: number } | { node: HTMLElement; offset: number };

/**
 * Map a plain-text index (where `<br>` = 1 newline) back into the live DOM.
 */
function plainIndexToCursor(root: HTMLElement, index: number): PlainCursor | null {
  let remaining = Math.max(0, index);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);

  let current = walker.nextNode();
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      const text = current as Text;
      const len = text.data.length;
      if (remaining <= len) {
        return { node: text, offset: remaining };
      }
      remaining -= len;
    } else if (
      current.nodeType === Node.ELEMENT_NODE &&
      (current as HTMLElement).tagName === 'BR'
    ) {
      if (remaining === 0) {
        return { node: current.parentElement ?? root, offset: indexInParent(current) };
      }
      remaining -= 1;
    }
    current = walker.nextNode();
  }

  return { node: root, offset: root.childNodes.length };
}

function indexInParent(node: Node): number {
  const parent = node.parentNode;
  if (!parent) return 0;
  return Array.prototype.indexOf.call(parent.childNodes, node);
}

/** Restore a plain-text caret/selection inside a contentEditable after rewriting HTML. */
export function setPlainSelection(
  root: HTMLElement,
  start: number,
  end: number,
): void {
  const startCur = plainIndexToCursor(root, start);
  const endCur = plainIndexToCursor(root, end);
  if (!startCur || !endCur) return;

  const sel = window.getSelection();
  if (!sel) return;
  try {
    const range = document.createRange();
    range.setStart(startCur.node, startCur.offset);
    range.setEnd(endCur.node, endCur.offset);
    sel.removeAllRanges();
    sel.addRange(range);
  } catch {
    // Ignore invalid ranges after aggressive HTML rewrites
  }
}

export function selectionInside(root: HTMLElement | null): Range | null {
  if (!root) return null;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return null;
  return range;
}

export function hasNonCollapsedSelection(root: HTMLElement | null): boolean {
  const range = selectionInside(root);
  return !!range && !range.collapsed;
}

/** Apply an execCommand while keeping focus in the editor. Returns false if unavailable. */
export function applyExecCommand(command: string, value?: string): boolean {
  try {
    // Deprecated but still the practical API for selection formatting in contentEditable.
    return document.execCommand(command, false, value);
  } catch {
    return false;
  }
}
