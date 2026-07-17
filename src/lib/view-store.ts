type Listener = (view: "modules" | "saved") => void;

let _view: "modules" | "saved" = "modules";
const listeners = new Set<Listener>();

export function getView() {
  return _view;
}

export function setView(v: "modules" | "saved") {
  _view = v;
  listeners.forEach((fn) => fn(v));
}

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
