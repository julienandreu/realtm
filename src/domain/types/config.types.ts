import { z } from 'zod';

export const ServerConfigSchema = z.object({
  certPath: z.string().default('cert.pem'),
  encryptionKey: z.string(),
  keyPath: z.string().default('key.pem'),
  port: z.number().int().positive().min(1).max(65535).default(3000),
  redisUrl: z.url().default('redis://127.0.0.1:6379'),
  useCloudWatchLogger: z.boolean().default(false),
  logger: z.object({
    level: z.string().default('debug'),
    format: z.enum(['json', 'text']).optional(),
  }),
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

export const ClientConfigSchema = z.object({
  url: z.url().default('ws://127.0.0.1:3000'),
  reconnectionDelay: z.number().int().positive().default(1000),
  connectionTimeout: z.number().int().positive().default(20000),
  useCloudWatchLogger: z.boolean().default(false),
  logger: z.object({
    level: z.string().default('debug'),
    format: z.enum(['json', 'text']).optional(),
  }),
});

export type ClientConfig = z.infer<typeof ClientConfigSchema>;

export type Config = ServerConfig | ClientConfig;
export const Config = Symbol('Config');
