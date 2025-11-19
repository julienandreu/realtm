import {SocketRepository} from 'src/infrastructure/repositories/socket.repository';
import {inject, injectable} from 'tsyringe';
import {SOCKET_EVENT_MESSAGE} from '../../domain/constants/socket.constants';
import {NoSocketsFoundError, SocketEmitError, SocketSelectionError} from '../../domain/errors/event.errors';
import type {RawEvent} from '../../domain/types/event.types';
import {debugEvent} from '../../infrastructure/debug/debug-namespaces';

@injectable()
export class EventService {
  constructor(
    @inject(SocketRepository)
    private readonly socketRepository: SocketRepository,
  ) {}

  async processEvent(event: RawEvent): Promise<void> {
    debugEvent('Processing event: id=%s, type=%s, tags=%O', event.id, event.type, event.tags);

    const server = this.socketRepository.getServer();

    debugEvent('Fetching sockets for tags: %O', event.tags);
    const availableSockets = await Promise.all(
      event.tags.map(async (tag) => {
        const sockets = await server.in(tag).fetchSockets();
        debugEvent('Tag %s has %d sockets', tag, sockets.length);
        return sockets;
      }),
    );

    const filteredSockets = availableSockets.reduce((acc, curr) => {
      return acc.filter((socket) => curr.some((s) => s.id === socket.id));
    }, availableSockets[0] ?? []);

    debugEvent('Filtered sockets matching all tags: %d', filteredSockets.length);

    if (filteredSockets.length === 0) {
      debugEvent('No sockets found matching all tags: %O', event.tags);
      throw new NoSocketsFoundError(event.tags);
    }

    const randomIndex = Math.floor(Math.random() * filteredSockets.length);
    const socket = filteredSockets[randomIndex];
    if (!socket) {
      debugEvent('Failed to select socket from filtered list');
      throw new SocketSelectionError(filteredSockets.length);
    }

    debugEvent('Selected socket: id=%s, index=%d/%d', socket.id, randomIndex, filteredSockets.length);
    debugEvent('Emitting message to socket: %O', event);
    try {
      socket.emit(SOCKET_EVENT_MESSAGE, event);
      debugEvent('Message emitted successfully');
    } catch (error) {
      debugEvent('Error emitting message to socket: %O', error);
      throw new SocketEmitError(socket.id, event.id, error);
    }
  }
}
