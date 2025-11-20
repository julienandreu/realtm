import type { Socket } from 'socket.io';
import { inject, injectable } from 'tsyringe';
import { SOCKET_EVENT_JOIN, SOCKET_ROOM_WAITROOM } from '../../domain/constants/socket.constants';
import { Logger } from '../../domain/interfaces/utils/Logger';
import { SocketManagerService } from '../services/socket-manager.service';

/**
 * Controller responsible for handling socket events.
 * Follows Clean Architecture: Controllers handle presentation concerns and delegate to application services.
 */
@injectable()
export class SocketController {
  constructor(
    @inject(SocketManagerService)
    private readonly socketManager: SocketManagerService,
    @inject(Logger)
    private readonly logger: Logger,
  ) {}

  /**
   * Handles socket connection events.
   * @param socket - The connected socket instance
   */
  async handleConnection(socket: Socket): Promise<void> {
    this.logger.debug('User connected', { socketId: socket.id });

    await socket.join(SOCKET_ROOM_WAITROOM);
    this.logger.debug('Socket joined waitroom', { socketId: socket.id });

    this.registerJoinHandler(socket);
    this.registerDisconnectHandler(socket);
  }

  /**
   * Registers handler for join room events.
   * @param socket - The socket instance
   */
  private registerJoinHandler(socket: Socket): void {
    socket.on(SOCKET_EVENT_JOIN, async (tags: string[], callback: (succeeded: boolean) => void) => {
      try {
        this.logger.debug('Client wants to join rooms', { socketId: socket.id, tags });

        await socket.join(tags);
        this.logger.debug('Socket joined rooms', { socketId: socket.id, tags });
        await socket.leave(SOCKET_ROOM_WAITROOM);
        this.logger.debug('Socket left waitroom', { socketId: socket.id });

        await this.socketManager.onSocketJoined();

        callback(true);
        this.logger.debug('Join callback succeeded', { socketId: socket.id });
      } catch (error) {
        this.logger.error('Error joining room', { socketId: socket.id, tags, error });
        callback(false);
      }
    });
  }

  /**
   * Registers handler for disconnect events.
   * @param socket - The socket instance
   */
  private registerDisconnectHandler(socket: Socket): void {
    socket.on('disconnect', () => {
      this.logger.debug('User disconnected', { socketId: socket.id });
      this.socketManager.onSocketDisconnected();
    });
  }
}
