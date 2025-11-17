import { z } from 'zod';

const RedisMessageSchema = z.object({
    id: z.string(),
    message: z.record(z.string(), z.string()),
});

export type RedisMessage = z.infer<typeof RedisMessageSchema>;

export const RedisXReadGroupResponseSchema = z.object({
    messages: z.array(RedisMessageSchema),
});

export type RedisXReadGroupResponse = z.infer<typeof RedisXReadGroupResponseSchema>;

export const RedisXAutoClaimResponseSchema = z.object({
    messages: z.array(RedisMessageSchema).nullable(),
});

export type RedisXAutoClaimResponse = z.infer<typeof RedisXAutoClaimResponseSchema>;

export function parseRedisMessage(message: z.infer<typeof RedisMessageSchema>): RedisMessage {
    return {
        id: message.id,
        message: message.message,
    };
}

