import 'reflect-metadata';
import {container} from 'tsyringe';
import {overrideSocketId} from '../infrastructure/middlewares/socket-id.middleware';
import {setupContainer} from '../infrastructure/ioc/container';
import {createServerConfig} from '../infrastructure/config/config.factory';
import {debugServer} from '../infrastructure/debug/debug-namespaces';
import {SocketManagerService} from '../application/services/socket-manager.service';
import {SocketRepository} from 'src/infrastructure/repositories/socket.repository';

export function startServer(): void {
  debugServer('Starting server...');

  const config = createServerConfig();
  debugServer('Configuration loaded: port=%d, redisUrl=%s', config.port, config.redisUrl);

  setupContainer(config);
  debugServer('IoC container setup complete');

  const socketRepository = container.resolve(SocketRepository);
  socketRepository.use(overrideSocketId);
  debugServer('Socket middleware registered');

  const socketManager = container.resolve(SocketManagerService);
  socketManager.initialize();
  debugServer('Socket manager initialized');

  socketRepository.startListening(config.port);
  debugServer('Server started on port %d', config.port);
}
