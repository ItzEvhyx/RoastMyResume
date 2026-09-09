/**
 * Force readable markdown lists even when the model emits mid-line "•" bullets.
 */
export function normalizeDeniseMarkdown(content: string): string {
  let s = content.replace(/\r\n/g, '\n').trim();
  // Mid-paragraph unicode bullets → new markdown list items
  s = s.replace(/[ \t]*[•●▪‣]\s+/g, '\n- ');
  // " - **" glued after a sentence → break onto new line
  s = s.replace(/([^\n])[ \t]+-[ \t]+(\*\*)/g, '$1\n- $2');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}
