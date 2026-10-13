/** True when a key press belongs to a text field or a modal dialog, not to the game. */
export function isElsewhere(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return true;
  const target = event.target;
  if (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.closest('input, textarea, select'))
  ) {
    return true;
  }
  return document.querySelector('[aria-modal="true"]') !== null;
}
