import type { ExtendedError, Socket } from 'socket.io';

export function overrideSocketId(
    socket: Socket,
    next: (err?: ExtendedError) => void
): void {
    Object.defineProperty(
        socket,
        'id',
        {
            value: `id:${String(socket.handshake.query['_id'])}`,
            writable: false,
        }
    );

    next();
}