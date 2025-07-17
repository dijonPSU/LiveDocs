export function diffText(oldText, newText) {
  let start = 0;

  // common prefix
  while (start < oldText.length && start < newText.length && oldText[start] === newText[start]) {
    start++;
  }

  let oldEnd = oldText.length - 1;
  let newEnd = newText.length - 1;

  // common suffix
  while (oldEnd >= start && newEnd >= start && oldText[oldEnd] === newText[newEnd]) {
    oldEnd--;
    newEnd--;
  }

  // delete the old text
  const deleted = oldText.slice(start, oldEnd + 1);

  // add the new text
  const inserted = newText.slice(start, newEnd + 1);

  return { start, deleted, inserted };
}
