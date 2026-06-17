type Listener = (sourceId: string) => void;

let listeners: Listener[] = [];

export function subscribe(fn: Listener) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export function notify(sourceId: string) {
  listeners.forEach((fn) => fn(sourceId));
}
