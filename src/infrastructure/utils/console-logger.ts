import { inject, injectable } from 'tsyringe';
import { Config } from '../../domain/types/config.types';
import { Logger } from '../../domain/interfaces/utils/Logger';
import { inspect } from 'util';
import { getLogLevel, getLogLevelString, LogLevel } from './log-level';

// ANSI color codes
const Colors = {
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  DIM: '\x1b[2m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
  GRAY: '\x1b[90m',
} as const;

@injectable()
export class ConsoleLogger implements Logger {
  private readonly logLevel: LogLevel;

  constructor(@inject(Config) private readonly config: Config) {
    const envLogLevel = this.config.logger.level;
    if (envLogLevel) {
      // eslint-disable-next-line no-console
      console.log('Starting ConsoleLogger with log level from environment: ', envLogLevel);
      this.logLevel = getLogLevel(envLogLevel);
    } else {
      // eslint-disable-next-line no-console
      console.log('Starting ConsoleLogger with default log level: DEBUG');
      this.logLevel = LogLevel.DEBUG;
    }
  }

  private getColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return Colors.GRAY;
      case LogLevel.ERROR:
        return `${Colors.RED}${Colors.BRIGHT}`;
      case LogLevel.WARN:
        return Colors.YELLOW;
      case LogLevel.INFO:
      default:
        return Colors.BLUE;
    }
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    return [
      `${Colors.GRAY}${timestamp}${Colors.RESET}`,
      `${this.getColor(level)}[${getLogLevelString(level)}]${Colors.RESET}`,
      message,
      data !== undefined ? inspect(data, { colors: true, depth: null }) : '',
    ].join(' ');
  }

  private output(level: LogLevel, message: string, data?: unknown): void {
    const formattedMessage = this.formatMessage(level, message, data);

    // eslint-disable-next-line no-console
    console.log(formattedMessage);
  }

  info(message: string, data?: unknown): void {
    if (this.logLevel <= LogLevel.INFO) {
      this.output(LogLevel.INFO, message, data);
    }
  }

  error(message: string, data?: unknown): void {
    if (this.logLevel <= LogLevel.ERROR) {
      this.output(LogLevel.ERROR, message, data);
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.logLevel <= LogLevel.WARN) {
      this.output(LogLevel.WARN, message, data);
    }
  }

  debug(message: string, data?: unknown): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      this.output(LogLevel.DEBUG, message, data);
    }
  }
}
