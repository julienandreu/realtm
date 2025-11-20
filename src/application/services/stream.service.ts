import { RedisRepository } from 'src/infrastructure/repositories/redis.repository';
import { inject, injectable } from 'tsyringe';
import {
  REDIS_CONSUMER_GROUP_NAME,
  REDIS_CONSUMER_NAME,
  REDIS_STREAM_KEY,
} from '../../domain/constants/redis.constants';
import { RawEventSchema } from '../../domain/types/event.types';
import type { RedisStreamProcessingOptions } from '../../domain/types/redis-stream-options.types';
import { Logger } from '../../domain/interfaces/utils/Logger';
import { EventService } from './event.service';

@injectable()
export class StreamService {
  private abortController: AbortController = new AbortController();
  private listening = false;

  constructor(
    @inject(RedisRepository)
    private readonly redisRepository: RedisRepository,
    @inject(EventService)
    private readonly eventService: EventService,
    @inject(Logger)
    private readonly logger: Logger,
  ) {
    this.abortController.abort();
  }

  isListening(): boolean {
    return this.listening;
  }

  stopListening(): void {
    this.logger.debug('Stopping stream listening');
    this.abortController.abort();
    this.listening = false;
    this.logger.debug('Stream listening stopped');
  }

  async messageReceivedHandler(message: unknown): Promise<void> {
    this.logger.debug('Received message from stream', { message });
    const rawEvent = RawEventSchema.safeParse(message);
    if (!rawEvent.success) {
      this.logger.warn('Invalid event received', { message, error: rawEvent.error });
      return;
    }

    const event = rawEvent.data;
    this.logger.debug('Parsed event successfully', { eventId: event.id, type: event.type });

    await this.eventService.processEvent(event);
  }

  async startListening(): Promise<void> {
    this.abortController.abort();
    this.abortController = new AbortController();

    if (this.listening) {
      this.logger.debug('Stream service already listening, skipping start');
      return;
    }

    this.logger.debug('Starting stream listening');
    this.listening = true;

    const options = {
      abortSignal: this.abortController.signal,
      callback: this.messageReceivedHandler.bind(this),
      streamKey: REDIS_STREAM_KEY,
      groupName: REDIS_CONSUMER_GROUP_NAME,
      consumerName: REDIS_CONSUMER_NAME,
    } satisfies RedisStreamProcessingOptions;

    this.logger.debug('Connecting to Redis');
    await this.redisRepository.connect();
    this.logger.debug('Ensuring consumer group exists', {
      groupName: options.groupName,
      consumerName: options.consumerName,
    });
    await this.redisRepository.ensureConsumerGroupExists(options);
    this.logger.debug('Starting stream processing');

    void this.processStream(options);
  }

  private async processStream(options: RedisStreamProcessingOptions): Promise<void> {
    while (!options.abortSignal.aborted) {
      this.logger.debug('Claiming messages from stream');
      const claimed = await this.redisRepository.claimMessages(options);
      this.logger.debug('Claimed messages', { count: claimed.length });

      if (claimed.length > 0) {
        const message = claimed[0];
        if (message) {
          try {
            this.logger.debug('Processing claimed message', { messageId: message.id });
            await options.callback(message.message);
            this.logger.debug('Acknowledging message', { messageId: message.id });
            await this.redisRepository.acknowledgeMessage(options, message.id);
            this.logger.debug('Deleting message', { messageId: message.id });
            await this.redisRepository.deleteMessage(options.streamKey, message.id);
            this.logger.debug('Message processed successfully', { messageId: message.id });
          } catch (error) {
            this.logger.error('Error processing claimed message', { messageId: message.id, error });
            await this.processStream(options);
            return;
          }
        }
      }

      this.logger.debug('Reading new messages from stream');
      const messages = await this.redisRepository.readMessages(options);
      this.logger.debug('Read messages from stream', { count: messages.length });

      if (messages.length === 0) {
        this.logger.debug('No new messages, continuing to listen');
        await this.processStream(options);
        return;
      }

      const message = messages[0];
      if (message) {
        try {
          this.logger.debug('Processing new message', { messageId: message.id });
          await options.callback(message.message);
          this.logger.debug('Acknowledging message', { messageId: message.id });
          await this.redisRepository.acknowledgeMessage(options, message.id);
          this.logger.debug('Deleting message', { messageId: message.id });
          await this.redisRepository.deleteMessage(options.streamKey, message.id);
          this.logger.debug('Message processed successfully', { messageId: message.id });
        } catch (error) {
          this.logger.error('Error processing new message', { messageId: message.id, error });
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    this.logger.debug('Abort signal detected, stopping stream processing');
    this.listening = false;
  }
}
