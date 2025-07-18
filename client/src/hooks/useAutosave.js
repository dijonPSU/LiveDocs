import { useRef } from "react";
import Delta from "quill-delta";

const timeout = 3000;

export default function useAutosave(save, onSuccess, onError, delay = timeout) {
  const timer = useRef(null);
  const latestDelta = useRef(null);

  function storeChanges(delta) {
    // construct delta
    if (!(delta instanceof Delta)) {
      delta = new Delta(delta);
    }

    if (latestDelta.current) {
      latestDelta.current = latestDelta.current.compose(delta);
    } else {
      latestDelta.current = delta;
    }

    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(async () => {
      try {
        await save(latestDelta.current);
        latestDelta.current = null;
        onSuccess();
      } catch (err) {
        onError(err);
      }
    }, delay);
  }

  return storeChanges;
}
