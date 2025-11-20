import 'reflect-metadata';
import { container } from 'tsyringe';
import { overrideSocketId } from '../middlewares/socket-id.middleware';
import { setupServerContainer } from '../ioc/container';
import { createServerConfig } from '../config/config.factory';
import { Logger } from '../../domain/interfaces/utils/Logger';
import { SocketRepository } from '../repositories/socket.repository';
import { SocketManagerService } from '../../application/services/socket-manager.service';
import { SocketController } from '../../application/controllers/socket.controller';
import type { Socket } from 'socket.io';

/**
 * Bootstrap function to initialize and start the server.
 * Follows Clean Architecture: Infrastructure layer handles technical setup.
 */
export function startServer(): void {
  const config = createServerConfig();
  setupServerContainer(config);

  const logger = container.resolve<Logger>(Logger);
  logger.info('Starting server...');
  logger.debug('Configuration loaded', { port: config.port, redisUrl: config.redisUrl });
  logger.debug('IoC container setup complete');

  const socketRepository = container.resolve(SocketRepository);
  socketRepository.use(overrideSocketId);
  logger.debug('Socket middleware registered');

  const socketManager = container.resolve(SocketManagerService);
  const socketController = container.resolve(SocketController);

  // Register connection handler through controller
  socketRepository.onConnection(async (socket: Socket) => {
    await socketController.handleConnection(socket);
  });

  // Register disconnect handler through socket manager
  socketRepository.onDisconnect(() => {
    socketManager.onSocketDisconnected();
  });

  logger.debug('Socket handlers registered');

  socketRepository.startListening(config.port);
  logger.info('Server started on port', { port: config.port });
}
