import { env, envValidation, type LogLevel } from '@/config/env';

const LOG_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const REDACT_KEY_PATTERN = /(token|password|authorization|cookie)/i;

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `sess-${Date.now().toString(36)}`;
}

const SESSION_ID = createSessionId();

export function redactContext(value: unknown, depth = 0): unknown {
  if (depth > 4) {
    return '[Truncated]';
  }
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactContext(item, depth + 1));
  }
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
    };
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (REDACT_KEY_PATTERN.test(key)) {
        out[key] = '[REDACTED]';
      } else {
        out[key] = redactContext(entry, depth + 1);
      }
    }
    return out;
  }
  return value;
}

export interface LogEntry {
  readonly time: string;
  readonly level: LogLevel;
  readonly message: string;
  readonly sessionId: string;
  readonly context?: unknown;
}

function shouldLog(level: LogLevel): boolean {
  const configuredLevel: LogLevel = envValidation.ok ? env.logLevel : 'error';
  return LOG_PRIORITY[level] >= LOG_PRIORITY[configuredLevel];
}

function writeLog(level: LogLevel, message: string, context?: unknown): void {
  if (!shouldLog(level)) {
    return;
  }

  const entry: LogEntry =
    context === undefined
      ? {
          time: new Date().toISOString(),
          level,
          message,
          sessionId: SESSION_ID,
        }
      : {
          time: new Date().toISOString(),
          level,
          message,
          sessionId: SESSION_ID,
          context: redactContext(context),
        };

  if (level === 'error') {
    console.error(entry);
  } else if (level === 'warn') {
    console.warn(entry);
  } else if (level === 'info') {
    console.info(entry);
  } else {
    console.debug(entry);
  }
}

export const logger = {
  debug(message: string, context?: unknown): void {
    writeLog('debug', message, context);
  },
  info(message: string, context?: unknown): void {
    writeLog('info', message, context);
  },
  warn(message: string, context?: unknown): void {
    writeLog('warn', message, context);
  },
  error(message: string, context?: unknown): void {
    writeLog('error', message, context);
  },
};
