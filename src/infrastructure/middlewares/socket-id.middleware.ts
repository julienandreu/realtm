import type { ExtendedError, Socket } from 'socket.io';
import { debugMiddleware } from '../debug/debug-namespaces';
import { SOCKET_ID_PREFIX, SOCKET_QUERY_ID_PARAM } from '../../domain/constants/socket.constants';
import { parseSocketQueryId } from '../../domain/types/socket-query.types';

export function overrideSocketId(
    socket: Socket,
    next: (err?: ExtendedError) => void
): void {
    const socketId = socket.handshake.query[SOCKET_QUERY_ID_PARAM];
    const idValue = parseSocketQueryId(socketId);
    const newId = `${SOCKET_ID_PREFIX}${idValue}`;

    debugMiddleware('Overriding socket ID: original=%s, new=%s', socket.id, newId);

    Object.defineProperty(socket, 'id', {
        value: newId,
        writable: false,
    });

    debugMiddleware('Socket ID overridden successfully: id=%s', newId);
    next();
}

