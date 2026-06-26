export function createLogger(prefix: string) {
  return {
    info: (msg: string, ...args: unknown[]) =>
      console.log(`[${prefix}] ${msg}`, ...args),
    warn: (msg: string, ...args: unknown[]) =>
      console.warn(`[${prefix}] ${msg}`, ...args),
    error: (msg: string, ...args: unknown[]) =>
      console.error(`[${prefix}] ${msg}`, ...args),
  };
}
