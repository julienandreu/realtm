import debug from 'debug';

export const debugServer = debug('realtm:server');
export const debugClient = debug('realtm:client');
export const debugRedis = debug('realtm:redis');
export const debugSocket = debug('realtm:socket');
export const debugEvent = debug('realtm:event');
export const debugStream = debug('realtm:stream');
export const debugConfig = debug('realtm:config');
export const debugIoc = debug('realtm:ioc');
export const debugMiddleware = debug('realtm:middleware');
