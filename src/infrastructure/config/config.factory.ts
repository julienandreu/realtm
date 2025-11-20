import type { ClientConfig, ServerConfig } from '../../domain/types/config.types';
import { ClientConfigSchema, ServerConfigSchema } from '../../domain/types/config.types';

process.loadEnvFile();

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] | undefined;
};

export function createServerConfig(): ServerConfig {
  const config = {
    certPath: process.env['CERT_PATH'],
    encryptionKey: process.env['ENCRYPTION_KEY'],
    keyPath: process.env['KEY_PATH'],
    port: process.env['PORT'] !== undefined ? Number(process.env['PORT']) : undefined,
    redisUrl: process.env['REDIS_URL'],
    useCloudWatchLogger: process.env['USE_CLOUDWATCH_LOGGER'] === 'true' || process.env['NODE_ENV'] === 'production',
    logger: {
      level: process.env['LOG_LEVEL'] ?? 'debug',
      format:
        process.env['LOG_FORMAT'] === 'json' || process.env['LOG_FORMAT'] === 'text'
          ? process.env['LOG_FORMAT']
          : process.env['NODE_ENV'] === 'production'
            ? 'json'
            : 'text',
    },
  } satisfies DeepPartial<ServerConfig>;

  const parsedConfig = ServerConfigSchema.parse(config);

  return parsedConfig;
}

export function createClientConfig(): ClientConfig {
  const config = {
    url: process.env['URL'],
    reconnectionDelay:
      process.env['RECONNECTION_DELAY'] !== undefined ? Number(process.env['RECONNECTION_DELAY']) : undefined,
    connectionTimeout:
      process.env['CONNECTION_TIMEOUT'] !== undefined ? Number(process.env['CONNECTION_TIMEOUT']) : undefined,
  } satisfies DeepPartial<ClientConfig>;

  const parsedConfig = ClientConfigSchema.parse(config);

  return parsedConfig;
}
