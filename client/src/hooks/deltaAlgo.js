export function flattenDelta(delta) {
  const runs = [];
  for (const op of delta.ops) {
    if (op.insert) {
      const text = typeof op.insert === "string" ? op.insert : "";
      for (let i = 0; i < text.length; i++) {
        runs.push({
          char: text[i],
          attributes: op.attributes || {},
        });
      }
    } else if (op.retain) {
      for (let i = 0; i < op.retain; i++) {
        runs.push({
          char: null,
          attributes: op.attributes || {},
        });
      }
    }
  }
  return runs;
}

