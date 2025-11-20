export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export function getLogLevel(level: unknown): LogLevel {
  switch (level) {
    case LogLevel.DEBUG:
    case 'debug':
    case 'DEBUG':
      return LogLevel.DEBUG;
    case LogLevel.INFO:
    case 'info':
    case 'INFO':
      return LogLevel.INFO;
    case LogLevel.WARN:
    case 'warn':
    case 'WARN':
      return LogLevel.WARN;
    case LogLevel.ERROR:
    case 'error':
    case 'ERROR':
      return LogLevel.ERROR;
    default:
      return LogLevel.DEBUG;
  }
}

export function getLogLevelString(level: LogLevel): string {
  switch (level) {
    case LogLevel.DEBUG:
      return 'DEBUG';
    case LogLevel.INFO:
      return 'INFO';
    case LogLevel.WARN:
      return 'WARN';
    case LogLevel.ERROR:
      return 'ERROR';
  }
}
