import DiffMatchPatch from "diff-match-patch";

function expandDelta(delta) {
  if (!delta || !delta.ops) return [];
  const result = [];
  for (const op of delta.ops) {
    if (typeof op.insert === "string") {
      const attrs = op.attributes || {};
      for (let i = 0; i < op.insert.length; i++) {
        result.push({ char: op.insert[i], attributes: attrs });
      }
    }
  }
  return result;
}

function diffAttributes(oldAttrs = {}, newAttrs = {}) {
  const result = {};
  const keys = new Set([...Object.keys(oldAttrs), ...Object.keys(newAttrs)]);
  for (const key of keys) {
    if (oldAttrs[key] !== newAttrs[key]) {
      if (newAttrs[key] === undefined) {
        result[key] = null;
      } else {
        result[key] = newAttrs[key];
      }
    }
  }
  return Object.keys(result).length ? result : null;
}

// check if attributes are equal (for compacting ops)
function isEqualAttributes(a = {}, b = {}) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) return false; // obv not equal

  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

// compute diff delta between oldDelta and newDelta
export function computeDeltaDiff(oldDelta, newDelta) {
  // expand deltas into char arrays with attributes
  const oldArr = expandDelta(oldDelta);
  const newArr = expandDelta(newDelta);

  // get plain text only
  const oldText = oldArr.map((x) => x.char).join("");
  const newText = newArr.map((x) => x.char).join("");

  // create diff instance and compute diff
  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupEfficiency(diffs);

  let oldIndex = 0;
  let newIndex = 0;
  const ops = [];

  for (const [type, text] of diffs) {
    if (!text.length) continue;

    if (type === 0) {
      // if type is 0, then text is the same in both old and new. Meaning it's a retain. We then check if formatting changed
      let len = text.length;
      while (len > 0) {
        // find how many consecutive chars have same attribute diff
        let runLen = 1;
        let lastDiff = diffAttributes(
          oldArr[oldIndex]?.attributes || {},
          newArr[newIndex]?.attributes || {},
        );
        while (
          runLen < len &&
          JSON.stringify(
            diffAttributes(
              oldArr[oldIndex + runLen]?.attributes || {},
              newArr[newIndex + runLen]?.attributes || {},
            ),
          ) === JSON.stringify(lastDiff)
        ) {
          runLen++;
        }
        if (lastDiff) {
          ops.push({ retain: runLen, attributes: lastDiff });
        } else {
          ops.push({ retain: runLen });
        }
        oldIndex += runLen;
        newIndex += runLen;
        len -= runLen;
      }
    } else if (type === -1) {
      // delete text from old
      ops.push({ delete: text.length });
      oldIndex += text.length;
    } else if (type === 1) {
      let len = text.length;
      while (len > 0) {
        const attrs = newArr[newIndex]?.attributes || {};
        let runLen = 1;

        while (
          runLen < len &&
          isEqualAttributes(attrs, newArr[newIndex + runLen]?.attributes || {})
        ) {
          runLen++;
        }
        const insertedText = newArr
          .slice(newIndex, newIndex + runLen)
          .map((x) => x.char)
          .join("");
        if (Object.keys(attrs).length) {
          ops.push({ insert: insertedText, attributes: attrs });
        } else {
          ops.push({ insert: insertedText });
        }
        newIndex += runLen;
        len -= runLen;
      }
    }
  }

  while (ops.length && ops[ops.length - 1].retain !== undefined) {
    ops.pop();
  }

  return { ops };
}
