import * as z from 'zod';
import { startClient } from './client';
import { startServer } from './server';

const command = z.enum(['server', 'client']).parse(process.argv.slice(2)[0]);

if (command === 'server') {
    startServer();
} else {
    startClient({
        tags: Array.from(
            new Set(
                process.argv.slice(3).concat(process.platform)
            ),
        ),
    });
}
