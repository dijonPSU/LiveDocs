import { useRef } from "react";
const timeout = 3000;


export default function useAutosave(save, onSuccess, onError, delay = timeout) {
  const timer = useRef(null);
  const composedDelta = useRef(null);

  function storeChanges(delta) {
    if (composedDelta.current) {
      composedDelta.current = composedDelta.current.compose(delta);
    } else {
      composedDelta.current = delta;
    }

    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(async () => {
      try {
        await save(composedDelta.current);
        composedDelta.current = null;
        onSuccess();
      } catch (err) {
        onError(err);
      }
    }, delay);
  }

  return storeChanges;
}
