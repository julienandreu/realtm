import {z} from 'zod';

/**
 * Base options for Redis stream operations.
 * Contains the minimal required fields: stream key and consumer group name.
 */
export const RedisStreamBaseOptionsSchema = z.object({
  streamKey: z.string().min(1),
  groupName: z.string().min(1),
});

export type RedisStreamBaseOptions = z.infer<typeof RedisStreamBaseOptionsSchema>;

/**
 * Options for Redis consumer group operations.
 * Extends base options with consumer name.
 */
export const RedisConsumerGroupOptionsSchema = RedisStreamBaseOptionsSchema.extend({
  consumerName: z.string().min(1),
});

export type RedisConsumerGroupOptions = z.infer<typeof RedisConsumerGroupOptionsSchema>;

/**
 * Options for claiming messages from a Redis stream.
 * Extends consumer group options with reclaim minimum idle time.
 */
export const RedisStreamClaimOptionsSchema = RedisConsumerGroupOptionsSchema.extend({
  reclaimMinIdleMs: z.number().int().positive().optional(),
});

export type RedisStreamClaimOptions = z.infer<typeof RedisStreamClaimOptionsSchema>;

/**
 * Options for reading messages from a Redis stream.
 * Extends consumer group options with blocking timeout.
 */
export const RedisStreamReadOptionsSchema = RedisConsumerGroupOptionsSchema.extend({
  blockMs: z.number().int().nonnegative().optional(),
});

export type RedisStreamReadOptions = z.infer<typeof RedisStreamReadOptionsSchema>;

/**
 * Options for processing Redis stream messages.
 * Combines all options needed for full stream processing including abort signal and callback.
 */
export const RedisStreamProcessingOptionsSchema = RedisConsumerGroupOptionsSchema.extend({
  abortSignal: z.instanceof(AbortSignal),
  callback: z.custom<(message: unknown) => Promise<void> | void>(),
  reclaimMinIdleMs: z.number().int().positive().optional(),
  blockMs: z.number().int().nonnegative().optional(),
});

export type RedisStreamProcessingOptions = z.infer<typeof RedisStreamProcessingOptionsSchema>;
