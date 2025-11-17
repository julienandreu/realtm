import { injectable } from 'tsyringe';
import { readFileSync } from 'fs';
import { createSecureServer } from 'http2';
import { type ExtendedError, Server, type Socket } from 'socket.io';
import type { ServerConfig } from '../../domain/types/config.types';
import { debugSocket } from '../debug/debug-namespaces';

@injectable()
export class SocketRepository {
    private readonly server: Server;

    constructor(config: ServerConfig) {
        debugSocket('Creating Socket.IO server with cert: %s, key: %s', config.certPath, config.keyPath);
        const httpServer = createSecureServer({
            allowHTTP1: true,
            key: readFileSync(config.keyPath),
            cert: readFileSync(config.certPath),
        });

        this.server = new Server(httpServer, {});
        debugSocket('Socket.IO server created');
    }

    getServer(): Server {
        return this.server;
    }

    use(middleware: (socket: Socket, next: (err?: ExtendedError) => void) => void): void {
        debugSocket('Registering middleware');
        this.server.use(middleware);
    }

    onConnection(handler: (socket: Socket) => Promise<void> | void): void {
        debugSocket('Registering connection handler');
        this.server.on('connection', handler);
    }

    onDisconnect(handler: () => void): void {
        debugSocket('Registering disconnect handler');
        this.server.on('disconnect', handler);
    }

    startListening(port: number): void {
        debugSocket('Starting to listen on port: %d', port);
        this.server.listen(port);
        debugSocket('Server listening on port: %d', port);
    }
}

