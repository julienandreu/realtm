import * as z from 'zod';

process.loadEnvFile();

export const ConfigSchema = z.object({
    certPath: z.string().default('cert.pem'),
    encryptionKey: z.string(),
    keyPath: z.string().default('key.pem'),
    port: z.number().int().positive().min(1).max(65535).default(3000),
    redisUrl: z.url().default('redis://127.0.0.1:6379'),
    url: z.url().default('ws://127.0.0.1:3000'),
});

export const config = ConfigSchema.parse({
    certPath: process.env['CERT_PATH'],
    encryptionKey: process.env['ENCRYPTION_KEY'],
    keyPath: process.env['KEY_PATH'],
    port: Number(process.env['PORT']),
    redisUrl: process.env['REDIS_URL'],
    url: process.env['URL'],
});

export type Config = z.infer<typeof ConfigSchema>;