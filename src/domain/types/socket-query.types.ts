import { z } from 'zod';

export const SocketQueryIdSchema = z.string().optional();

export function parseSocketQueryId(value: unknown): string {
  const parsed = SocketQueryIdSchema.parse(value);
  return parsed ?? '';
}
