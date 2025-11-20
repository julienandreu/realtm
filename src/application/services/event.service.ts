import { SocketRepository } from 'src/infrastructure/repositories/socket.repository';
import { inject, injectable } from 'tsyringe';
import { SOCKET_EVENT_MESSAGE } from '../../domain/constants/socket.constants';
import { NoSocketsFoundError, SocketEmitError, SocketSelectionError } from '../../domain/errors/event.errors';
import type { RawEvent } from '../../domain/types/event.types';
import { Logger } from '../../domain/interfaces/utils/Logger';

@injectable()
export class EventService {
  constructor(
    @inject(SocketRepository)
    private readonly socketRepository: SocketRepository,
    @inject(Logger)
    private readonly logger: Logger,
  ) {}

  async processEvent(event: RawEvent): Promise<void> {
    this.logger.debug('Processing event', { eventId: event.id, type: event.type, tags: event.tags });

    const server = this.socketRepository.getServer();

    this.logger.debug('Fetching sockets for tags', { tags: event.tags });
    const availableSockets = await Promise.all(
      event.tags.map(async (tag) => {
        const sockets = await server.in(tag).fetchSockets();
        this.logger.debug(`Tag ${tag} has ${String(sockets.length)} sockets`, { tag, count: sockets.length });
        return sockets;
      }),
    );

    const filteredSockets = availableSockets.reduce((acc, curr) => {
      return acc.filter((socket) => curr.some((s) => s.id === socket.id));
    }, availableSockets[0] ?? []);

    this.logger.debug('Filtered sockets matching all tags', { count: filteredSockets.length });

    if (filteredSockets.length === 0) {
      this.logger.warn('No sockets found matching all tags', { tags: event.tags });
      throw new NoSocketsFoundError(event.tags);
    }

    const randomIndex = Math.floor(Math.random() * filteredSockets.length);
    const socket = filteredSockets[randomIndex];
    if (!socket) {
      this.logger.error('Failed to select socket from filtered list', { count: filteredSockets.length });
      throw new SocketSelectionError(filteredSockets.length);
    }

    this.logger.debug('Selected socket', { socketId: socket.id, index: randomIndex, total: filteredSockets.length });
    this.logger.debug('Emitting message to socket', { event });
    try {
      socket.emit(SOCKET_EVENT_MESSAGE, event);
      this.logger.debug('Message emitted successfully');
    } catch (error) {
      this.logger.error('Error emitting message to socket', { socketId: socket.id, eventId: event.id, error });
      throw new SocketEmitError(socket.id, event.id, error);
    }
  }
}
