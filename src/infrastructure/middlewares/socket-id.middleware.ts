import type { ExtendedError, Socket } from 'socket.io';
import { SOCKET_ID_PREFIX, SOCKET_QUERY_ID_PARAM } from '../../domain/constants/socket.constants';
import { parseSocketQueryId } from '../../domain/types/socket-query.types';
import { container } from 'tsyringe';
import { Logger } from '../../domain/interfaces/utils/Logger';

export function overrideSocketId(socket: Socket, next: (err?: ExtendedError) => void): void {
  const logger = container.resolve<Logger>(Logger);
  const socketId = socket.handshake.query[SOCKET_QUERY_ID_PARAM];
  const idValue = parseSocketQueryId(socketId);
  const newId = `${SOCKET_ID_PREFIX}${idValue}`;

  logger.debug('Overriding socket ID', { original: socket.id, new: newId });

  Object.defineProperty(socket, 'id', {
    value: newId,
    writable: false,
  });

  logger.debug('Socket ID overridden successfully', { id: newId });
  next();
}
