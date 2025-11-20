import { createClient, type RedisClientType } from 'redis';
import { inject, injectable } from 'tsyringe';
import {
  REDIS_ERROR_BUSYGROUP,
  REDIS_OPTION_BLOCK,
  REDIS_OPTION_COUNT,
  REDIS_OPTION_MKSTREAM,
  REDIS_STREAM_NEW_MESSAGES_ID,
  REDIS_STREAM_START_ID,
} from '../../domain/constants/redis.constants';
import {
  parseRedisMessage,
  type RedisMessage,
  RedisXAutoClaimResponseSchema,
  RedisXReadGroupResponseSchema,
} from '../../domain/types/redis-response.types';
import type {
  RedisStreamBaseOptions,
  RedisStreamClaimOptions,
  RedisStreamReadOptions,
} from '../../domain/types/redis-stream-options.types';
import { Logger } from '../../domain/interfaces/utils/Logger';

@injectable()
export class RedisRepository {
  private readonly client: RedisClientType;

  constructor(
    @inject('RedisUrl')
    redisUrl: string,
    @inject(Logger)
    private readonly logger: Logger,
  ) {
    this.logger.debug('Creating Redis client', { redisUrl });
    this.client = createClient({ url: redisUrl });
  }

  async connect(): Promise<void> {
    if (!this.client.isOpen) {
      this.logger.debug('Connecting to Redis');
      await this.client.connect();
      this.logger.debug('Connected to Redis successfully');
    } else {
      this.logger.debug('Redis client already connected');
    }
  }

  isConnected(): boolean {
    return this.client.isOpen;
  }

  async ensureConsumerGroupExists(options: RedisStreamBaseOptions): Promise<void> {
    this.logger.debug('Ensuring consumer group exists', { streamKey: options.streamKey, groupName: options.groupName });
    try {
      await this.client.xGroupCreate(options.streamKey, options.groupName, REDIS_STREAM_START_ID, {
        [REDIS_OPTION_MKSTREAM]: true,
      });
      this.logger.debug('Consumer group created successfully', { groupName: options.groupName });
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes(REDIS_ERROR_BUSYGROUP)) {
        this.logger.debug('Consumer group already exists, setting ID', { groupName: options.groupName });
        try {
          await this.client.xGroupSetId(options.streamKey, options.groupName, REDIS_STREAM_START_ID);
          this.logger.debug('Consumer group ID set successfully', { groupName: options.groupName });
        } catch {
          this.logger.debug('Failed to set consumer group ID (may not be supported)');
        }
        return;
      }
      this.logger.error('Error ensuring consumer group', { error });
      throw error;
    }
  }

  async claimMessages(options: RedisStreamClaimOptions): Promise<readonly RedisMessage[]> {
    this.logger.debug('Claiming messages', {
      streamKey: options.streamKey,
      groupName: options.groupName,
      consumerName: options.consumerName,
    });
    const claimed = await this.client.xAutoClaim(
      options.streamKey,
      options.groupName,
      options.consumerName,
      options.reclaimMinIdleMs ?? 1000,
      REDIS_STREAM_START_ID,
      { [REDIS_OPTION_COUNT]: 1 },
    );

    const parsedClaimed = RedisXAutoClaimResponseSchema.safeParse(claimed);
    if (!parsedClaimed.success) {
      this.logger.warn('Invalid Redis claim response', { error: parsedClaimed.error });
      return [];
    }

    const messagesArray = parsedClaimed.data.messages;
    if (!messagesArray || messagesArray.length === 0) {
      this.logger.debug('No messages claimed');
      return [];
    }

    const messages = messagesArray.map(parseRedisMessage);

    this.logger.debug('Claimed messages', {
      count: messages.length,
      messageIds: messages.map((m) => m.id),
    });
    return messages;
  }

  async readMessages(options: RedisStreamReadOptions): Promise<readonly RedisMessage[]> {
    this.logger.debug('Reading messages', {
      streamKey: options.streamKey,
      groupName: options.groupName,
      consumerName: options.consumerName,
      blockMs: options.blockMs ?? 1000,
    });
    const responses = await this.client.xReadGroup(
      options.groupName,
      options.consumerName,
      [{ key: options.streamKey, id: REDIS_STREAM_NEW_MESSAGES_ID }],
      { [REDIS_OPTION_COUNT]: 1, [REDIS_OPTION_BLOCK]: options.blockMs ?? 1000 },
    );

    if (!Array.isArray(responses) || responses.length === 0) {
      this.logger.debug('No responses from Redis');
      return [];
    }

    const response = responses[0];
    const parsedResponse = RedisXReadGroupResponseSchema.safeParse(response);
    if (!parsedResponse.success) {
      this.logger.warn('Invalid Redis response structure', { error: parsedResponse.error });
      return [];
    }

    if (parsedResponse.data.messages.length === 0) {
      this.logger.debug('No messages in response');
      return [];
    }

    const messages = parsedResponse.data.messages.map(parseRedisMessage);

    this.logger.debug('Read messages', {
      count: messages.length,
      messageIds: messages.map((m) => m.id),
    });
    return messages;
  }

  async acknowledgeMessage(options: RedisStreamBaseOptions, messageId: string): Promise<void> {
    this.logger.debug('Acknowledging message', {
      streamKey: options.streamKey,
      groupName: options.groupName,
      messageId,
    });
    await this.client.xAck(options.streamKey, options.groupName, messageId);
    this.logger.debug('Message acknowledged', { messageId });
  }

  async deleteMessage(streamKey: string, messageId: string): Promise<void> {
    this.logger.debug('Deleting message', { streamKey, messageId });
    await this.client.xDel(streamKey, messageId);
    this.logger.debug('Message deleted', { messageId });
  }
}
