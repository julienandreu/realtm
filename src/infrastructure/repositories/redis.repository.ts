import { injectable } from 'tsyringe';
import { createClient, type RedisClientType } from 'redis';
import { debugRedis } from '../debug/debug-namespaces';
import { REDIS_ERROR_BUSYGROUP, REDIS_OPTION_BLOCK, REDIS_OPTION_COUNT, REDIS_OPTION_MKSTREAM, REDIS_STREAM_NEW_MESSAGES_ID, REDIS_STREAM_START_ID } from '../../domain/constants/redis.constants';
import { parseRedisMessage, type RedisMessage, RedisXAutoClaimResponseSchema, RedisXReadGroupResponseSchema } from '../../domain/types/redis-response.types';
import type { RedisStreamBaseOptions, RedisStreamClaimOptions, RedisStreamReadOptions } from '../../domain/types/redis-stream-options.types';

@injectable()
export class RedisRepository {
    private readonly client: RedisClientType;

    constructor(redisUrl: string) {
        debugRedis('Creating Redis client with URL: %s', redisUrl);
        this.client = createClient({ url: redisUrl });
    }

    async connect(): Promise<void> {
        if (!this.client.isOpen) {
            debugRedis('Connecting to Redis');
            await this.client.connect();
            debugRedis('Connected to Redis successfully');
        } else {
            debugRedis('Redis client already connected');
        }
    }

    isConnected(): boolean {
        return this.client.isOpen;
    }

    async ensureConsumerGroupExists(options: RedisStreamBaseOptions): Promise<void> {
        debugRedis('Ensuring consumer group exists: streamKey=%s, groupName=%s', options.streamKey, options.groupName);
        try {
            await this.client.xGroupCreate(
                options.streamKey,
                options.groupName,
                REDIS_STREAM_START_ID,
                { [REDIS_OPTION_MKSTREAM]: true }
            );
            debugRedis('Consumer group created successfully: groupName=%s', options.groupName);
        } catch (error: unknown) {
            if (error instanceof Error && error.message.includes(REDIS_ERROR_BUSYGROUP)) {
                debugRedis('Consumer group already exists, setting ID: groupName=%s', options.groupName);
                try {
                    await this.client.xGroupSetId(options.streamKey, options.groupName, REDIS_STREAM_START_ID);
                    debugRedis('Consumer group ID set successfully: groupName=%s', options.groupName);
                } catch {
                    debugRedis('Failed to set consumer group ID (may not be supported)');
                }
                return;
            }
            debugRedis('Error ensuring consumer group: %O', error);
            throw error;
        }
    }

    async claimMessages(options: RedisStreamClaimOptions): Promise<readonly RedisMessage[]> {
        debugRedis('Claiming messages: streamKey=%s, groupName=%s, consumerName=%s', options.streamKey, options.groupName, options.consumerName);
        const claimed = await this.client.xAutoClaim(
            options.streamKey,
            options.groupName,
            options.consumerName,
            options.reclaimMinIdleMs ?? 1000,
            REDIS_STREAM_START_ID,
            { [REDIS_OPTION_COUNT]: 1 }
        );

        const parsedClaimed = RedisXAutoClaimResponseSchema.safeParse(claimed);
        if (!parsedClaimed.success) {
            debugRedis('Invalid Redis claim response: %O', parsedClaimed.error);
            return [];
        }

        const messagesArray = parsedClaimed.data.messages;
        if (!messagesArray || messagesArray.length === 0) {
            debugRedis('No messages claimed');
            return [];
        }

        const messages = messagesArray.map(parseRedisMessage);

        debugRedis('Claimed %d messages: %O', messages.length, messages.map((m) => m.id));
        return messages;
    }

    async readMessages(options: RedisStreamReadOptions): Promise<readonly RedisMessage[]> {
        debugRedis('Reading messages: streamKey=%s, groupName=%s, consumerName=%s, blockMs=%d', options.streamKey, options.groupName, options.consumerName, options.blockMs ?? 1000);
        const responses = await this.client.xReadGroup(
            options.groupName,
            options.consumerName,
            [{ key: options.streamKey, id: REDIS_STREAM_NEW_MESSAGES_ID }],
            { [REDIS_OPTION_COUNT]: 1, [REDIS_OPTION_BLOCK]: options.blockMs ?? 1000 }
        );

        if (!Array.isArray(responses) || responses.length === 0) {
            debugRedis('No responses from Redis');
            return [];
        }

        const response = responses[0];
        const parsedResponse = RedisXReadGroupResponseSchema.safeParse(response);
        if (!parsedResponse.success) {
            debugRedis('Invalid Redis response structure: %O', parsedResponse.error);
            return [];
        }

        if (parsedResponse.data.messages.length === 0) {
            debugRedis('No messages in response');
            return [];
        }

        const messages = parsedResponse.data.messages.map(parseRedisMessage);

        debugRedis('Read %d messages: %O', messages.length, messages.map((m) => m.id));
        return messages;
    }

    async acknowledgeMessage(options: RedisStreamBaseOptions, messageId: string): Promise<void> {
        debugRedis('Acknowledging message: streamKey=%s, groupName=%s, messageId=%s', options.streamKey, options.groupName, messageId);
        await this.client.xAck(options.streamKey, options.groupName, messageId);
        debugRedis('Message acknowledged: messageId=%s', messageId);
    }

    async deleteMessage(streamKey: string, messageId: string): Promise<void> {
        debugRedis('Deleting message: streamKey=%s, messageId=%s', streamKey, messageId);
        await this.client.xDel(streamKey, messageId);
        debugRedis('Message deleted: messageId=%s', messageId);
    }
}

