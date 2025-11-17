import type { Socket } from 'socket.io';
import { SocketRepository } from 'src/infrastructure/repositories/socket.repository';
import { inject, injectable } from 'tsyringe';
import { SOCKET_EVENT_JOIN, SOCKET_ROOM_WAITROOM } from '../../domain/constants/socket.constants';
import { debugSocket } from '../../infrastructure/debug/debug-namespaces';
import { StreamService } from './stream.service';

@injectable()
export class SocketManagerService {
    constructor(
        @inject(SocketRepository)
        private readonly socketRepository: SocketRepository,
        @inject(StreamService)
        private readonly streamService: StreamService
    ) { }

    initialize(): void {
        debugSocket('Initializing socket manager');
        this.socketRepository.onConnection(async (socket: Socket) => {
            debugSocket('User connected: id=%s', socket.id);

            await socket.join(SOCKET_ROOM_WAITROOM);
            debugSocket('Socket joined waitroom: id=%s', socket.id);

            socket.on(SOCKET_EVENT_JOIN, async (tags: string[], callback: (succeeded: boolean) => void) => {
                try {
                    debugSocket('Client wants to join rooms: socketId=%s, tags=%O', socket.id, tags);

                    await socket.join(tags);
                    debugSocket('Socket joined rooms: socketId=%s, tags=%O', socket.id, tags);
                    await socket.leave(SOCKET_ROOM_WAITROOM);
                    debugSocket('Socket left waitroom: socketId=%s', socket.id);

                    if (!this.streamService.isListening()) {
                        debugSocket('Stream service not listening, starting it');
                        await this.streamService.startListening();
                    } else {
                        debugSocket('Stream service already listening');
                    }

                    callback(true);
                    debugSocket('Join callback succeeded: socketId=%s', socket.id);
                } catch (error) {
                    debugSocket('Error joining room: socketId=%s, tags=%O, error=%O', socket.id, tags, error);
                    callback(false);
                }
            });

            socket.on('disconnect', () => {
                debugSocket('User disconnected: id=%s', socket.id);
                this.handleDisconnect();
            });
        });

        this.socketRepository.onDisconnect(() => {
            debugSocket('Socket disconnect event received');
            this.handleDisconnect();
        });
    }

    private handleDisconnect(): void {
        const server = this.socketRepository.getServer();
        const remainingSockets = server.sockets.sockets.size;
        debugSocket('Remaining sockets: %d', remainingSockets);

        if (remainingSockets === 0) {
            debugSocket('No remaining sockets, stopping stream service');
            this.streamService.stopListening();
        }
    }
}

