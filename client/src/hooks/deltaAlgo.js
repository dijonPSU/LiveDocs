import DiffMatchPatch from "diff-match-patch";


function getPlainText(delta) {
  if (!delta || !delta.ops) return "";
  return delta.ops
    .map((op) => (typeof op.insert === "string" ? op.insert : ""))
    .join("");
}

export function computeDeltaDiff(oldDelta, newDelta) {
  const dmp = new DiffMatchPatch();
  const oldText = getPlainText(oldDelta);
  const newText = getPlainText(newDelta);

  const diffs = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupEfficiency(diffs);

  const ops = [];
  let oldIndex = 0;
  let newIndex = 0;

  diffs.forEach(([type, text]) => {
    if (type === 0) {
      // Equal: retain text
      ops.push({ retain: text.length });
      oldIndex += text.length;
      newIndex += text.length;
    } else if (type === -1) {

      // Delete: delete text from old
      ops.push({ delete: text.length });
      oldIndex += text.length;
    } else if (type === 1) {

      // Insert: insert text from new
      ops.push({ insert: text });
      newIndex += text.length;
    }
  });

  return { ops };
}
