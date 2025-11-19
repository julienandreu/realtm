import {io, type Socket} from 'socket.io-client';
import {createClientConfig} from '../infrastructure/config/config.factory';
import {debugClient} from '../infrastructure/debug/debug-namespaces';
import {
  SOCKET_EVENT_JOIN,
  SOCKET_EVENT_MESSAGE,
  SOCKET_ID_SEPARATOR,
  SOCKET_QUERY_ID_PARAM,
  SOCKET_TRANSPORT_POLLING,
  SOCKET_TRANSPORT_WEBSOCKET,
} from '../domain/constants/socket.constants';

interface StartClientArgs {
  readonly tags?: readonly string[];
}

const startTime = Date.now();

function joinRooms(socket: Socket, tags: readonly string[]): void {
  debugClient('Joining rooms: %O', tags);
  void socket.emitWithAck(SOCKET_EVENT_JOIN, [...tags]).then((succeeded: boolean) => {
    if (succeeded) {
      debugClient('Successfully joined rooms: %O', tags);
    } else {
      debugClient('Failed to join rooms: %O', tags);
    }
  });
}

export function startClient(args: StartClientArgs = {}): Socket {
  const {tags = []} = args;
  debugClient('Starting client with tags: %O', tags);

  const config = createClientConfig();
  const socketId = [startTime.toString(16), ...tags].join(SOCKET_ID_SEPARATOR);
  debugClient('Socket ID: %s', socketId);
  debugClient('Connecting to server: %s', config.url);

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
    debugClient('Connected to server');
    joinRooms(socket, tags);
  });

  socket.on('reconnect', (attemptNumber: number) => {
    debugClient('Reconnected to server after %d attempts', attemptNumber);
    joinRooms(socket, tags);
  });

  socket.on('new_namespace', (namespace: unknown) => {
    debugClient('A new namespace was created: %O', namespace);
  });

  socket.on('disconnect', (reason: string) => {
    debugClient('Disconnected from server: %s', reason);
  });

  socket.on('error', (error: unknown) => {
    debugClient('Socket error: %O', error);
  });

  socket.on(SOCKET_EVENT_MESSAGE, (message: unknown) => {
    debugClient('Message received: %O', message);
  });

  debugClient('Client started with auto-reconnect enabled (1000ms delay)');

  return socket;
}
