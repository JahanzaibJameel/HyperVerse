import Constants from 'expo-constants';

// Dynamic import for Sentry since it might not be installed in all environments
let Sentry: any = null;
try {
  Sentry = require('sentry-expo');
} catch {
  // Sentry not available, will use console logging only
}

// Initialize Sentry if DSN is available and Sentry is installed
const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn || process.env.EXPO_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN && __DEV__ === false && Sentry) {
  Sentry.init({
    dsn: SENTRY_DSN,
    enableInExpoDevelopment: false,
    debug: __DEV__,
    environment: __DEV__ ? 'development' : 'production',
  });
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

/**
 * Keys whose values must never reach a log sink. `adb logcat` is readable by
 * anyone with USB access to a debuggable build, and a Sentry `extra` payload is
 * retained on someone else's infrastructure, so anything logged is effectively
 * published. Matching is done on the lower-cased key so `apiKey`, `API_KEY`, and
 * `api_key` are all caught.
 */
const SENSITIVE_KEYS = new Set([
  'password',
  'pass',
  'secret',
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'apikey',
  'api_key',
  'authorization',
  'auth',
  'cookie',
  'session',
  'dsn',
  'privatekey',
  'private_key',
  'pin',
  'otp',
  'cvv',
  'cardnumber',
  'card_number',
  'ssn',
]);

const MAX_STRING_LENGTH = 256;
const MAX_DEPTH = 4;

/** True when a key name looks like it holds a secret. */
export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase());
}

/**
 * Recursively redact secrets and truncate long values.
 *
 * Cycles are broken with a seen set, and depth is capped so a deeply nested or
 * self-referential payload cannot hang or flood the log sink. Redaction is
 * applied to every payload, in development as well as production, so a
 * development build is not a way to leak what a release build would not.
 */
export function redact(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return value.length > MAX_STRING_LENGTH
      ? `${value.slice(0, MAX_STRING_LENGTH)}…[truncated ${value.length - MAX_STRING_LENGTH} chars]`
      : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') return value;

  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }

  if (depth >= MAX_DEPTH) return '[max depth]';

  if (typeof value === 'object') {
    if (seen.has(value as object)) return '[circular]';
    seen.add(value as object);

    if (Array.isArray(value)) {
      return value.slice(0, 50).map((item) => redact(item, depth + 1, seen));
    }

    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      output[key] = isSensitiveKey(key) ? '[redacted]' : redact(item, depth + 1, seen);
    }
    return output;
  }

  return String(value);
}

class Logger {
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string) {
    this.userId = userId;
    if (SENTRY_DSN && __DEV__ === false && Sentry) {
      Sentry.setUser({ id: userId });
    }
  }

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      // Redact here rather than at each call site so no caller can bypass it.
      data: data === undefined ? undefined : redact(data),
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
    };
  }

  private log(entry: LogEntry) {
    const logMessage = `[${entry.level.toUpperCase()}] ${entry.message}`;
    
    // Console logging for development
    if (__DEV__) {
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(logMessage, entry.data);
          break;
        case LogLevel.INFO:
          console.info(logMessage, entry.data);
          break;
        case LogLevel.WARN:
          console.warn(logMessage, entry.data);
          break;
        case LogLevel.ERROR:
          console.error(logMessage, entry.data);
          break;
      }
    } else {
      // In production, send to Sentry for errors and warnings if available
      if (Sentry) {
        if (entry.level === LogLevel.ERROR) {
          Sentry.captureException(new Error(entry.message), {
            extra: entry.data,
            tags: {
              sessionId: entry.sessionId,
              userId: entry.userId,
            },
          });
        } else if (entry.level === LogLevel.WARN) {
          Sentry.captureMessage(entry.message, 'warning', {
            extra: entry.data,
            tags: {
              sessionId: entry.sessionId,
              userId: entry.userId,
            },
          });
        }
      }
    }
  }

  debug(message: string, data?: any) {
    this.log(this.createLogEntry(LogLevel.DEBUG, message, data));
  }

  info(message: string, data?: any) {
    this.log(this.createLogEntry(LogLevel.INFO, message, data));
  }

  warn(message: string, data?: any) {
    this.log(this.createLogEntry(LogLevel.WARN, message, data));
  }

  error(message: string, error?: Error | any) {
    const data = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error;

    this.log(this.createLogEntry(LogLevel.ERROR, message, data));
  }

  // Performance logging
  startTimer(label: string): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.info(`Timer: ${label}`, { duration: `${duration}ms` });
    };
  }

  // User action tracking
  track(action: string, properties?: any) {
    this.info(`User Action: ${action}`, properties);
  }

  // Screen view tracking
  screen(screenName: string, properties?: any) {
    this.info(`Screen View: ${screenName}`, properties);
  }
}

// Export singleton instance
export const logger = new Logger();

// For backward compatibility, export console-like methods
export const log = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);

export default logger;
