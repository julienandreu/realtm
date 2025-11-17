import 'reflect-metadata';
import { container } from 'tsyringe';
import type { ServerConfig } from '../../domain/types/config.types';
import { RedisRepository } from '../repositories/redis.repository';
import { SocketRepository } from '../repositories/socket.repository';
import { EventService } from '../../application/services/event.service';
import { StreamService } from '../../application/services/stream.service';
import { SocketManagerService } from '../../application/services/socket-manager.service';
import { debugIoc } from '../debug/debug-namespaces';

export function setupContainer(config: ServerConfig): void {
    debugIoc('Setting up IoC container');

    debugIoc('Registering RedisRepository');
    const redisRepository = new RedisRepository(config.redisUrl);
    container.registerInstance(RedisRepository, redisRepository);

    debugIoc('Registering SocketRepository');
    const socketRepository = new SocketRepository(config);
    container.registerInstance(SocketRepository, socketRepository);

    debugIoc('Registering EventService');
    container.registerSingleton(EventService, EventService);

    debugIoc('Registering StreamService');
    container.registerSingleton(StreamService, StreamService);

    debugIoc('Registering SocketManagerService');
    container.registerSingleton(SocketManagerService, SocketManagerService);

    debugIoc('IoC container setup complete');
}

