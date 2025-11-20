import 'reflect-metadata';
import { container } from 'tsyringe';
import { SocketController } from '../../application/controllers/socket.controller';
import { EventService } from '../../application/services/event.service';
import { SocketManagerService } from '../../application/services/socket-manager.service';
import { StreamService } from '../../application/services/stream.service';
import { type ClientConfig, Config, type ServerConfig } from '../../domain/types/config.types';
import { Logger } from '../../domain/interfaces/utils/Logger';
import { Clock } from '../../domain/interfaces/utils/Clock';
import { RedisRepository } from '../repositories/redis.repository';
import { SocketRepository } from '../repositories/socket.repository';
import { ConsoleLogger } from '../utils/console-logger';
import { CloudWatchLogger } from '../utils/cloudwatch-logger';
import { SystemClock } from '../utils/system-clock';

export function setupServerContainer(config: ServerConfig): void {
  // Register config instance
  container.registerInstance(Config, config);

  // Register Logger (choose based on config)
  if (config.useCloudWatchLogger) {
    container.registerSingleton(Logger, CloudWatchLogger);
  } else {
    container.registerSingleton(Logger, ConsoleLogger);
  }

  // Register Clock
  container.registerSingleton(Clock, SystemClock);

  // Get logger instance for logging container setup
  const logger = container.resolve<Logger>(Logger);
  logger.debug('Setting up IoC container');

  logger.debug('Registering RedisRepository');
  container.registerSingleton(RedisRepository, RedisRepository);
  container.registerInstance('RedisUrl', config.redisUrl);

  logger.debug('Registering SocketRepository');
  container.registerSingleton(SocketRepository, SocketRepository);

  logger.debug('Registering EventService');
  container.registerSingleton(EventService, EventService);

  logger.debug('Registering StreamService');
  container.registerSingleton(StreamService, StreamService);

  logger.debug('Registering SocketManagerService');
  container.registerSingleton(SocketManagerService, SocketManagerService);

  logger.debug('Registering SocketController');
  container.registerSingleton(SocketController, SocketController);

  logger.debug('IoC container setup complete');
}

export function setupClientContainer(config: ClientConfig): void {
  // Register config instance
  container.registerInstance(Config, config);

  // Register Logger (choose based on config)
  if (config.useCloudWatchLogger) {
    container.registerSingleton(Logger, CloudWatchLogger);
  } else {
    container.registerSingleton(Logger, ConsoleLogger);
  }

  // Register Clock
  container.registerSingleton(Clock, SystemClock);

  // Get logger instance for logging container setup
  const logger = container.resolve<Logger>(Logger);
  logger.debug('Setting up IoC container');

  logger.debug('IoC container setup complete');
}
