import { useRef } from "react";
const timeout = 3000;

export default function useAutosave(save, onSuccess, onError, delay = timeout) {
  const timer = useRef(null);
  const latestDelta = useRef(null);

  function storeChanges(delta) {
    latestDelta.current = delta;

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
