/**
 * True when keyboard events should stay with a text field / editable UI
 * instead of triggering canvas shortcuts (delete selected element, etc.).
 */
export function isTypingIntoField(
  event?: KeyboardEvent | { target?: EventTarget | null },
): boolean {
  const target =
    (event?.target as HTMLElement | null | undefined) ??
    (typeof document !== 'undefined' ? document.activeElement : null);

  if (!(target instanceof HTMLElement)) return false;

  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  if (target.closest('[contenteditable="true"]')) return true;
  // Native form controls nested in custom widgets
  if (target.closest('input, textarea, select, [role="textbox"]')) return true;

  return false;
}
