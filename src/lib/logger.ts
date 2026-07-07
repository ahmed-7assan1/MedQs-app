type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  requestId?: string;
  durationMs?: number;
  error?: string;
  [key: string]: unknown;
}

function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

export function createLogger(module: string) {
  const log = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      ...meta,
    };
    const line = formatLog(entry);
    switch (level) {
      case "error": console.error(line); break;
      case "warn":  console.warn(line);  break;
      default:      console.log(line);   break;
    }
    return entry;
  };

  return {
    info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
    warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
    debug: (msg: string, meta?: Record<string, unknown>) => log("debug", msg, meta),
  };
}
