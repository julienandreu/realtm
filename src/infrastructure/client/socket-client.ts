import { io, type Socket } from 'socket.io-client';
import { createClientConfig } from '../config/config.factory';
import {
  SOCKET_EVENT_JOIN,
  SOCKET_EVENT_MESSAGE,
  SOCKET_ID_SEPARATOR,
  SOCKET_QUERY_ID_PARAM,
  SOCKET_TRANSPORT_POLLING,
  SOCKET_TRANSPORT_WEBSOCKET,
} from '../../domain/constants/socket.constants';
import { container } from 'tsyringe';
import { Logger } from 'src/domain/interfaces/utils/Logger';
import { Clock } from 'src/domain/interfaces/utils/Clock';
import { setupClientContainer } from '../ioc/container';

interface StartClientArgs {
  readonly tags?: readonly string[];
}

function joinRooms(socket: Socket, tags: readonly string[]): void {
  const logger = container.resolve<Logger>(Logger);

  logger.debug('Joining rooms:', tags);
  void socket.emitWithAck(SOCKET_EVENT_JOIN, [...tags]).then((succeeded: boolean) => {
    if (succeeded) {
      logger.debug('Successfully joined rooms:', tags);
    } else {
      logger.debug('Failed to join rooms:', tags);
    }
  });
}

/**
 * Starts a socket.io client connection.
 * This is client-side infrastructure code for testing/development purposes.
 * @param args - Configuration arguments for the client
 * @returns The socket instance
 */
export function startClient(args: StartClientArgs = {}): Socket {
  const { tags = [] } = args;

  const config = createClientConfig();
  setupClientContainer(config);

  const clock = container.resolve<Clock>(Clock);
  const logger = container.resolve<Logger>(Logger);
  const startTime = Number(clock.now());

  logger.debug('Starting client with tags:', tags);

  const socketId = [startTime.toString(16), ...tags].join(SOCKET_ID_SEPARATOR);
  logger.debug('Socket ID:', socketId);

  logger.debug('Connecting to server:', config.url);

  const socket: Socket = io(config.url, {
    reconnection: true,
    reconnectionDelay: config.reconnectionDelay,
    reconnectionDelayMax: config.reconnectionDelay,
    reconnectionAttempts: Infinity,
    timeout: config.connectionTimeout,
    transports: [SOCKET_TRANSPORT_WEBSOCKET, SOCKET_TRANSPORT_POLLING],
    query: {
      [SOCKET_QUERY_ID_PARAM]: socketId,
    },
  });

  socket.on('connect', () => {
    logger.debug('Connected to server');
    joinRooms(socket, tags);
  });

  socket.on('reconnect', (attemptNumber: number) => {
    logger.debug(`Reconnected to server after ${String(attemptNumber)} attempts`);
    joinRooms(socket, tags);
  });

  socket.on('new_namespace', (namespace: unknown) => {
    logger.debug('A new namespace was created:', namespace);
  });

  socket.on('disconnect', (reason: string) => {
    logger.debug('Disconnected from server:', reason);
  });

  socket.on('error', (error: unknown) => {
    logger.error('Socket error:', error);
  });

  socket.on(SOCKET_EVENT_MESSAGE, (message: unknown) => {
    logger.debug('Message received:', message);
  });

  logger.debug('Client started with auto-reconnect enabled (1000ms delay)');

  return socket;
}
