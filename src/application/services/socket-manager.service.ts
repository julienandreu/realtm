import { SocketRepository } from 'src/infrastructure/repositories/socket.repository';
import { inject, injectable } from 'tsyringe';
import { Logger } from '../../domain/interfaces/utils/Logger';
import { StreamService } from './stream.service';

/**
 * Service responsible for managing socket lifecycle and coordinating stream service.
 * Follows Single Responsibility Principle: manages socket state, not event handling.
 */
@injectable()
export class SocketManagerService {
  constructor(
    @inject(SocketRepository)
    private readonly socketRepository: SocketRepository,
    @inject(StreamService)
    private readonly streamService: StreamService,
    @inject(Logger)
    private readonly logger: Logger,
  ) {}

  /**
   * Called when a socket successfully joins rooms.
   * Ensures stream service is listening if needed.
   */
  async onSocketJoined(): Promise<void> {
    if (!this.streamService.isListening()) {
      this.logger.debug('Stream service not listening, starting it');
      await this.streamService.startListening();
    } else {
      this.logger.debug('Stream service already listening');
    }
  }

  /**
   * Called when a socket disconnects.
   * Stops stream service if no sockets remain.
   */
  onSocketDisconnected(): void {
    const server = this.socketRepository.getServer();
    const remainingSockets = server.sockets.sockets.size;
    this.logger.debug('Remaining sockets', { count: remainingSockets });

    if (remainingSockets === 0) {
      this.logger.debug('No remaining sockets, stopping stream service');
      this.streamService.stopListening();
    }
  }

  /**
   * Gets the socket repository for controller access.
   * @returns The socket repository instance
   */
  getSocketRepository(): SocketRepository {
    return this.socketRepository;
  }
}
