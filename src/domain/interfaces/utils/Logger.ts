export interface LoggerConfig {
  level: string;
  format?: 'json' | 'text';
}

export interface Logger {
  info(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  debug(message: string, data?: unknown): void;
}

export const Logger = Symbol('Logger');
