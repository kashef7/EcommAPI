import { logger } from './logger';

export interface ErrorReporter {
  report(error: unknown, context?: Record<string, unknown>): void;
}

class ConsoleErrorReporter implements ErrorReporter {
  report(error: unknown, context?: Record<string, unknown>): void {
    const message = error instanceof Error ? error.message : 'Unexpected application error';
    logger.error(message, { error, ...(context ?? {}) });
  }
}

let activeReporter: ErrorReporter = new ConsoleErrorReporter();

export function setErrorReporter(reporter: ErrorReporter): void {
  activeReporter = reporter;
}

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  activeReporter.report(error, context);
}
