export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private level: LogLevel = "info";

  constructor() {
    if (process.env.NODE_ENV === "development") {
      this.level = "debug";
    }
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...(context && { context }),
    });
  }

  debug(message: string, context?: LogContext) {
    if (this.level === "debug") {
      console.debug(this.formatMessage("debug", message, context));
    }
  }

  info(message: string, context?: LogContext) {
    if (["debug", "info"].includes(this.level)) {
      console.info(this.formatMessage("info", message, context));
    }
  }

  warn(message: string, context?: LogContext) {
    if (["debug", "info", "warn"].includes(this.level)) {
      console.warn(this.formatMessage("warn", message, context));
    }
  }

  error(message: string, error?: unknown, context?: LogContext) {
    const errorDetails = error instanceof Error 
      ? { name: error.name, message: error.message, stack: error.stack }
      : { error };
      
    console.error(this.formatMessage("error", message, { ...context, ...errorDetails }));
  }
}

export const logger = new Logger();
