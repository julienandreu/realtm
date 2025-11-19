import {RedisRepository} from 'src/infrastructure/repositories/redis.repository';
import {inject, injectable} from 'tsyringe';
import {REDIS_CONSUMER_GROUP_NAME, REDIS_CONSUMER_NAME, REDIS_STREAM_KEY} from '../../domain/constants/redis.constants';
import {RawEventSchema} from '../../domain/types/event.types';
import type {RedisStreamProcessingOptions} from '../../domain/types/redis-stream-options.types';
import {debugStream} from '../../infrastructure/debug/debug-namespaces';
import {EventService} from './event.service';

@injectable()
export class StreamService {
  private abortController: AbortController = new AbortController();
  private listening = false;

  constructor(
    @inject(RedisRepository)
    private readonly redisRepository: RedisRepository,
    @inject(EventService)
    private readonly eventService: EventService,
  ) {
    this.abortController.abort();
  }

  isListening(): boolean {
    return this.listening;
  }

  stopListening(): void {
    debugStream('Stopping stream listening');
    this.abortController.abort();
    this.listening = false;
    debugStream('Stream listening stopped');
  }

  async messageReceivedHandler(message: unknown): Promise<void> {
    debugStream('Received message from stream: %O', message);
    const rawEvent = RawEventSchema.safeParse(message);
    if (!rawEvent.success) {
      debugStream('Invalid event received: %O, error: %O', message, rawEvent.error);
      return;
    }

    const event = rawEvent.data;
    debugStream('Parsed event successfully: id=%s, type=%s', event.id, event.type);

    await this.eventService.processEvent(event);
  }

  async startListening(): Promise<void> {
    this.abortController.abort();
    this.abortController = new AbortController();

    if (this.listening) {
      debugStream('Stream service already listening, skipping start');
      return;
    }

    debugStream('Starting stream listening');
    this.listening = true;

    const options = {
      abortSignal: this.abortController.signal,
      callback: this.messageReceivedHandler.bind(this),
      streamKey: REDIS_STREAM_KEY,
      groupName: REDIS_CONSUMER_GROUP_NAME,
      consumerName: REDIS_CONSUMER_NAME,
    } satisfies RedisStreamProcessingOptions;

    debugStream('Connecting to Redis');
    await this.redisRepository.connect();
    debugStream('Ensuring consumer group exists: group=%s, consumer=%s', options.groupName, options.consumerName);
    await this.redisRepository.ensureConsumerGroupExists(options);
    debugStream('Starting stream processing');

    void this.processStream(options);
  }

  private async processStream(options: RedisStreamProcessingOptions): Promise<void> {
    while (!options.abortSignal.aborted) {
      debugStream('Claiming messages from stream');
      const claimed = await this.redisRepository.claimMessages(options);
      debugStream('Claimed %d messages', claimed.length);

      if (claimed.length > 0) {
        const message = claimed[0];
        if (message) {
          try {
            debugStream('Processing claimed message: id=%s', message.id);
            await options.callback(message.message);
            debugStream('Acknowledging message: id=%s', message.id);
            await this.redisRepository.acknowledgeMessage(options, message.id);
            debugStream('Deleting message: id=%s', message.id);
            await this.redisRepository.deleteMessage(options.streamKey, message.id);
            debugStream('Message processed successfully: id=%s', message.id);
          } catch (error) {
            debugStream('Error processing claimed message: id=%s, error=%O', message.id, error);
            await this.processStream(options);
            return;
          }
        }
      }

      debugStream('Reading new messages from stream');
      const messages = await this.redisRepository.readMessages(options);
      debugStream('Read %d messages from stream', messages.length);

      if (messages.length === 0) {
        debugStream('No new messages, continuing to listen');
        await this.processStream(options);
        return;
      }

      const message = messages[0];
      if (message) {
        try {
          debugStream('Processing new message: id=%s', message.id);
          await options.callback(message.message);
          debugStream('Acknowledging message: id=%s', message.id);
          await this.redisRepository.acknowledgeMessage(options, message.id);
          debugStream('Deleting message: id=%s', message.id);
          await this.redisRepository.deleteMessage(options.streamKey, message.id);
          debugStream('Message processed successfully: id=%s', message.id);
        } catch (error) {
          debugStream('Error processing new message: id=%s, error=%O', message.id, error);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    debugStream('Abort signal detected, stopping stream processing');
    this.listening = false;
  }
}
