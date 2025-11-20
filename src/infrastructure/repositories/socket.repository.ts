import { readFileSync } from 'fs';
import { createSecureServer } from 'http2';
import { type ExtendedError, Server, type Socket } from 'socket.io';
import { inject, injectable } from 'tsyringe';
import { Config, type ServerConfig } from '../../domain/types/config.types';
import { Logger } from '../../domain/interfaces/utils/Logger';

@injectable()
export class SocketRepository {
  private readonly server: Server;

  constructor(
    @inject(Config)
    config: ServerConfig,
    @inject(Logger)
    private readonly logger: Logger,
  ) {
    this.logger.debug('Creating Socket.IO server', { certPath: config.certPath, keyPath: config.keyPath });
    const httpServer = createSecureServer({
      allowHTTP1: true,
      key: readFileSync(config.keyPath),
      cert: readFileSync(config.certPath),
    });

    this.server = new Server(httpServer, {});
    this.logger.debug('Socket.IO server created');
  }

  getServer(): Server {
    return this.server;
  }

  use(middleware: (socket: Socket, next: (err?: ExtendedError) => void) => void): void {
    this.logger.debug('Registering middleware');
    this.server.use(middleware);
  }

  onConnection(handler: (socket: Socket) => Promise<void> | void): void {
    this.logger.debug('Registering connection handler');
    this.server.on('connection', handler);
  }

  onDisconnect(handler: () => void): void {
    this.logger.debug('Registering disconnect handler');
    this.server.on('disconnect', handler);
  }

  startListening(port: number): void {
    this.logger.debug('Starting to listen on port', { port });
    this.server.listen(port);
    this.logger.debug('Server listening on port', { port });
  }
}
