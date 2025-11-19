import type {ClientConfig, ServerConfig} from '../../domain/types/config.types';
import {ClientConfigSchema, ServerConfigSchema} from '../../domain/types/config.types';
import {debugConfig} from '../debug/debug-namespaces';

process.loadEnvFile();

export function createServerConfig(): ServerConfig {
  debugConfig('Loading server configuration from environment variables');
  const config = {
    certPath: process.env['CERT_PATH'],
    encryptionKey: process.env['ENCRYPTION_KEY'],
    keyPath: process.env['KEY_PATH'],
    port: process.env['PORT'] !== undefined ? Number(process.env['PORT']) : undefined,
    redisUrl: process.env['REDIS_URL'],
  } satisfies Partial<Record<keyof ServerConfig, unknown>>;

  debugConfig('Raw server config values: %O', {
    certPath: config.certPath,
    keyPath: config.keyPath,
    port: config.port,
    redisUrl: config.redisUrl,
    hasEncryptionKey: config.encryptionKey !== undefined,
  });

  const parsedConfig = ServerConfigSchema.parse(config);
  debugConfig(
    'Server configuration parsed successfully: port=%d, redisUrl=%s',
    parsedConfig.port,
    parsedConfig.redisUrl,
  );

  return parsedConfig;
}

export function createClientConfig(): ClientConfig {
  debugConfig('Loading client configuration from environment variables');
  const config = {
    url: process.env['URL'],
    reconnectionDelay:
      process.env['RECONNECTION_DELAY'] !== undefined ? Number(process.env['RECONNECTION_DELAY']) : undefined,
    connectionTimeout:
      process.env['CONNECTION_TIMEOUT'] !== undefined ? Number(process.env['CONNECTION_TIMEOUT']) : undefined,
  } satisfies Partial<Record<keyof ClientConfig, unknown>>;

  debugConfig('Raw client config values: %O', {
    url: config.url,
    reconnectionDelay: config.reconnectionDelay,
    connectionTimeout: config.connectionTimeout,
  });

  const parsedConfig = ClientConfigSchema.parse(config);
  debugConfig('Client configuration parsed successfully: url=%s', parsedConfig.url);

  return parsedConfig;
}
