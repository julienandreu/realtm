import { inject, injectable } from 'tsyringe';
import { Config, type ServerConfig } from '../../domain/types/config.types';
import { Logger } from '../../domain/interfaces/utils/Logger';
import crypto from 'crypto';
import { getLogLevel, getLogLevelString, LogLevel } from './log-level';

// Internal types for CloudWatch implementation
interface LogContext {
  correlationId?: string;
  socketId?: string;
  eventId?: string;
  [key: string]: unknown;
}

interface LogMetadata {
  category?: string;
  errorCode?: string;
  duration?: number;
  latency?: number;
  count?: number;
  size?: number;
  status?: string;
  httpStatus?: number;
  method?: string;
  path?: string;
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  // Performance metrics
  successRate?: number;
  failureRate?: number;
  // Queue metrics
  queueDepth?: number;
  messagesProcessed?: number;
  messagesFailed?: number;
  messagesReclaimed?: number;
  // Additional fields
  [key: string]: unknown;
}

interface StructuredLogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  environment: string;
  context?: LogContext;
  metadata?: LogMetadata;
  error?: {
    message: string;
    stack?: string;
    code?: string;
    type?: string;
  };
}

@injectable()
export class CloudWatchLogger implements Logger {
  private readonly logLevel: LogLevel;
  private readonly format: 'json' | 'text';
  private readonly serviceName: string;
  private readonly environment: string;
  private readonly globalContext: LogContext = {};

  constructor(@inject(Config) private readonly config: ServerConfig) {
    const envLogLevel = this.config.logger.level;
    this.logLevel = getLogLevel(envLogLevel);
    this.format = this.config.logger.format ?? 'json';
    this.serviceName = 'realtm';
    this.environment = process.env['NODE_ENV'] === 'production' ? 'production' : 'development';

    // Initialize with a correlation ID for the entire service lifetime
    this.globalContext.correlationId = this.generateCorrelationId();

    // Log initialization using the standard interface
    const initData = {
      category: 'logger.init',
      logLevel: getLogLevelString(this.logLevel),
      format: this.format,
      service: this.serviceName,
      environment: this.environment,
    };

    if (this.format === 'text') {
      // eslint-disable-next-line no-console
      console.log(
        `Starting CloudWatchLogger with log level: ${getLogLevelString(this.logLevel)}, format: ${this.format}`,
      );
    } else {
      const entry = this.createStructuredEntry('INFO', 'CloudWatchLogger initialized', initData);
      this.outputLog(entry, LogLevel.INFO);
    }
  }

  private generateCorrelationId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevel <= level;
  }

  private extractContextFromMessage(
    message: string,
    data?: unknown,
  ): {
    extractedMessage: string;
    context: LogContext;
    metadata: LogMetadata;
  } {
    const extractedMessage = message;
    const context: LogContext = {};
    const metadata: LogMetadata = {};

    // Extract socket ID from message patterns
    const socketIdRegex = /socket[:\s#]+(\S+)/i;
    const socketIdMatch = socketIdRegex.exec(message);
    if (socketIdMatch?.[1]) {
      context.socketId = socketIdMatch[1];
    }

    // Extract event ID if present
    const eventIdRegex = /event[:\s#]+(\S+)/i;
    const eventIdMatch = eventIdRegex.exec(message);
    if (eventIdMatch?.[1]) {
      context.eventId = eventIdMatch[1];
    }

    // Infer category from message patterns
    if (message.toLowerCase().includes('socket') && message.toLowerCase().includes('connect')) {
      metadata.category = 'socket.connected';
    } else if (message.toLowerCase().includes('socket') && message.toLowerCase().includes('disconnect')) {
      metadata.category = 'socket.disconnected';
    } else if (message.toLowerCase().includes('socket') && message.toLowerCase().includes('join')) {
      metadata.category = 'socket.joined';
    } else if (message.toLowerCase().includes('event') && message.toLowerCase().includes('process')) {
      metadata.category = 'event.processed';
    } else if (message.toLowerCase().includes('redis')) {
      if (message.toLowerCase().includes('error')) {
        metadata.category = 'redis.error';
      } else if (message.toLowerCase().includes('connect')) {
        metadata.category = 'redis.connected';
      } else if (message.toLowerCase().includes('message')) {
        metadata.category = 'redis.message';
      } else {
        metadata.category = 'redis.operation';
      }
    } else if (message.toLowerCase().includes('stream')) {
      metadata.category = 'stream.operation';
    }

    // Extract structured data if provided
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const dataObj = data as Record<string, unknown>;

      // Extract known context fields
      if (typeof dataObj['socketId'] === 'string') context.socketId = dataObj['socketId'];
      if (typeof dataObj['eventId'] === 'string') context.eventId = dataObj['eventId'];
      if (typeof dataObj['correlationId'] === 'string') context.correlationId = dataObj['correlationId'];

      // Extract known metadata fields
      if (typeof dataObj['category'] === 'string') metadata.category = dataObj['category'];
      if (typeof dataObj['duration'] === 'number') metadata.duration = dataObj['duration'];
      if (typeof dataObj['latency'] === 'number') metadata.latency = dataObj['latency'];
      if (typeof dataObj['status'] === 'string') metadata.status = dataObj['status'];
      if (typeof dataObj['errorCode'] === 'string') metadata.errorCode = dataObj['errorCode'];
      if (typeof dataObj['count'] === 'number') metadata.count = dataObj['count'];
      if (typeof dataObj['size'] === 'number') metadata.size = dataObj['size'];

      // Extract performance metrics
      if (typeof dataObj['processingTime'] === 'number') metadata.duration = dataObj['processingTime'];
      if (typeof dataObj['executionDuration'] === 'number') metadata.duration = dataObj['executionDuration'];
      if (typeof dataObj['successRate'] === 'number') metadata.successRate = dataObj['successRate'];
      if (typeof dataObj['failureRate'] === 'number') metadata.failureRate = dataObj['failureRate'];

      // Extract queue metrics
      if (typeof dataObj['queueDepth'] === 'number') metadata.queueDepth = dataObj['queueDepth'];
      if (typeof dataObj['messagesProcessed'] === 'number') metadata.messagesProcessed = dataObj['messagesProcessed'];
      if (typeof dataObj['messagesFailed'] === 'number') metadata.messagesFailed = dataObj['messagesFailed'];
      if (typeof dataObj['messagesReclaimed'] === 'number') metadata.messagesReclaimed = dataObj['messagesReclaimed'];
    }

    return { extractedMessage, context, metadata };
  }

  private createStructuredEntry(level: string, message: string, data?: unknown, error?: unknown): StructuredLogEntry {
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.serviceName,
      environment: this.environment,
    };

    // Extract context and metadata from message and data
    const { extractedMessage, context, metadata } = this.extractContextFromMessage(message, data);
    entry.message = extractedMessage;

    // Merge contexts (extracted context overrides global context)
    entry.context = { ...this.globalContext, ...context };

    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      entry.metadata = metadata;
    }

    if (error) {
      entry.error = this.extractErrorInfo(error);
    }

    return entry;
  }

  private extractErrorInfo(error: unknown): {
    message: string;
    stack?: string;
    code?: string;
    type?: string;
  } {
    if (error instanceof Error) {
      const errorInfo: {
        message: string;
        stack?: string;
        code?: string;
        type?: string;
      } = {
        message: error.message,
        type: error.constructor.name,
      };

      if (error.stack) {
        errorInfo.stack = error.stack;
      }

      // Check for custom error properties
      if ('errorCode' in error && typeof (error as Record<string, unknown>)['errorCode'] === 'string') {
        errorInfo.code = (error as Record<string, unknown>)['errorCode'] as string;
      }
      if ('code' in error && typeof (error as Record<string, unknown>)['code'] === 'string') {
        errorInfo.code = (error as Record<string, unknown>)['code'] as string;
      }

      return errorInfo;
    }

    return {
      message: String(error),
      type: typeof error,
    };
  }

  private outputLog(entry: StructuredLogEntry, level: LogLevel): void {
    // eslint-disable-next-line no-console
    const logMethod = level === LogLevel.ERROR ? console.error : console.log;

    if (this.format === 'json') {
      // JSON format for CloudWatch
      logMethod(JSON.stringify(entry));
    } else {
      // Text format for local development
      const contextStr = entry.context
        ? ` [${Object.entries(entry.context)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => `${k}:${String(v)}`)
            .join(' ')}]`
        : '';
      const metadataStr = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : '';
      const errorStr = entry.error
        ? `\n  Error: ${entry.error.message}${entry.error.stack ? `\n  Stack: ${entry.error.stack}` : ''}`
        : '';

      logMethod(
        `${entry.timestamp} [${entry.level.toUpperCase()}]${contextStr} ${entry.message}${metadataStr}${errorStr}`,
      );
    }
  }

  info(message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.INFO)) {
      return;
    }

    let error: unknown;
    if (data && typeof data === 'object' && 'cause' in data) {
      error = (data as Record<string, unknown>)['cause'];
    }

    const entry = this.createStructuredEntry('INFO', message, data, error);
    this.outputLog(entry, LogLevel.INFO);
  }

  error(message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.ERROR)) {
      return;
    }

    let error: unknown;

    if (data instanceof Error) {
      error = data;
    } else if (data && typeof data === 'object' && !Array.isArray(data)) {
      const dataObj = data as Record<string, unknown>;
      error = dataObj['cause'] ?? dataObj['error'] ?? (typeof dataObj['stack'] === 'string' ? data : undefined);
    }

    const entry = this.createStructuredEntry('ERROR', message, data, error);
    this.outputLog(entry, LogLevel.ERROR);
  }

  warn(message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.WARN)) {
      return;
    }

    let error: unknown;
    if (data && typeof data === 'object' && 'cause' in data) {
      error = (data as Record<string, unknown>)['cause'];
    }

    const entry = this.createStructuredEntry('WARN', message, data, error);
    this.outputLog(entry, LogLevel.WARN);
  }

  debug(message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.DEBUG)) {
      return;
    }

    const entry = this.createStructuredEntry('DEBUG', message, data);
    this.outputLog(entry, LogLevel.DEBUG);
  }
}
