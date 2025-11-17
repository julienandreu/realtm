import { createClient } from 'redis';
import { config } from './config';

const redisClient = createClient({ url: config.redisUrl });

interface ListenToStreamOptions {
    abortSignal: AbortSignal;
    callback: (message: unknown) => Promise<void> | void;
    streamKey: string;
    groupName: string;
    consumerName: string;
    reclaimMinIdleMs?: number;
    blockMs?: number;
}

interface Message {
    id: string;
    message: Record<string, string>;
}

function assertMessage(message: unknown): message is Message {
    if (typeof message !== 'object' || message === null) {
        return false;
    }

    if (!('id' in message) || !('message' in message)) {
        return false;
    }

    if (typeof message.id !== 'string' || typeof message.message !== 'object' || message.message === null) {
        return false;
    }

    return true;
}

function isMessage(message: unknown): message is Message {
    try {
        assertMessage(message);
        return true;
    } catch {
        return false;
    }
}

async function getRedisClient(): Promise<typeof redisClient> {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }

    return redisClient;
}

async function ensureConsumerGroupExists(options: ListenToStreamOptions): Promise<void> {
    try {
        // '0-0' means start from the beginning; backlog will be delivered to this group
        await redisClient.xGroupCreate(options.streamKey, options.groupName, '0-0', { MKSTREAM: true });
    } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('BUSYGROUP')) {
            // Group already exists. Reset ID so backlog (never-delivered) entries are readable.
            try {
                await redisClient.xGroupSetId(options.streamKey, options.groupName, '0-0');
            } catch {
                // ignore if not supported or not necessary
            }
            return;
        }
        throw err;
    }
}

async function ackMessage(options: ListenToStreamOptions, message: Message) {
    await redisClient.xAck(options.streamKey, options.groupName, message.id);
    await redisClient.xDel(options.streamKey, message.id);
}

export async function listenToStream(options: ListenToStreamOptions) {
    console.log('Listening to stream', options.streamKey, options.groupName, options.consumerName);

    if (options.abortSignal.aborted) {
        console.log('Abort signal is aborted');
        return;
    }

    await getRedisClient();
    await ensureConsumerGroupExists(options);

    const claimed = await redisClient.xAutoClaim(
        options.streamKey,
        options.groupName,
        options.consumerName,
        options.reclaimMinIdleMs ?? 1000,
        '0-0',
        { COUNT: 1 },
    );

    console.log('Claimed messages', claimed.messages);

    if (Array.isArray(claimed.messages) && claimed.messages.length > 0) {
        const [message] = claimed.messages;
        if (message) {
            try {
                console.log('Processing message', message.message);

                await options.callback(message.message);

                await ackMessage(options, message);
            } catch (error) {
                console.error('Error processing message', message.id, error);
                return listenToStream(options);
            }
        }
    }

    // Read new messages
    const responses = await redisClient.xReadGroup(
        options.groupName,
        options.consumerName,
        [{ key: options.streamKey, id: '>' }],
        { COUNT: 1, BLOCK: options.blockMs ?? 1000 },
    );

    console.log('Responses', responses);

    if (!(Array.isArray(responses) && responses.length > 0)) {
        return listenToStream(options);
    }

    const [response] = responses;
    if (!(typeof response === 'object' && response !== null && 'messages' in response && Array.isArray(response.messages) && response.messages.length > 0)) {
        return listenToStream(options);
    }

    const [message] = response.messages;
    if (isMessage(message)) {
        try {
            console.log('Processing message', message.message);

            await options.callback(message.message);

            await ackMessage(options, message);
        } catch (error) {
            console.error('Error processing message', message.id, error);
        }
    }

    return listenToStream(options);
}
