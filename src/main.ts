import 'reflect-metadata';
import { z } from 'zod';
import { COMMAND_CLIENT, COMMAND_SERVER } from './domain/constants/command.constants';
import { startServer } from './infrastructure/bootstrap/server.bootstrap';
import { startClient } from './infrastructure/client/socket-client';

const CommandSchema = z.enum([COMMAND_SERVER, COMMAND_CLIENT]);

const command = CommandSchema.parse(process.argv.slice(2)[0]);

if (command === COMMAND_SERVER) {
  startServer();
} else {
  const tags = Array.from(new Set([...process.argv.slice(3), process.platform]));
  startClient({ tags });
}
