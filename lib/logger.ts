import Constants from 'expo-constants';

// Dynamic import for Sentry since it might not be installed in all environments
let Sentry: any = null;
try {
  Sentry = require('sentry-expo');
} catch (error) {
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
      data,
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
