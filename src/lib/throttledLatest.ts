export interface ThrottledLatest<T> {
  /** Queue a value; sends now if the interval has passed, otherwise at its end */
  push: (value: T) => void;
  /** Drops any queued value (e.g. once the sentence is finalized) */
  cancel: () => void;
}

/**
 * Sends only the newest value, at most once per interval, so a fast stream
 * of partial words becomes a steady trickle of writes.
 */
export function createThrottledLatest<T>(
  send: (value: T) => void,
  intervalMs: number,
  now: () => number = Date.now
): ThrottledLatest<T> {
  let lastSentAt = Number.NEGATIVE_INFINITY;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { value: T } | null = null;

  const flush = () => {
    timer = null;
    if (!pending) return;
    const { value } = pending;
    pending = null;
    lastSentAt = now();
    send(value);
  };

  return {
    push(value) {
      pending = { value };
      if (timer) return;
      const wait = lastSentAt + intervalMs - now();
      if (wait <= 0) flush();
      else timer = setTimeout(flush, wait);
    },
    cancel() {
      pending = null;
      if (timer) clearTimeout(timer);
      timer = null;
    },
  };
}
