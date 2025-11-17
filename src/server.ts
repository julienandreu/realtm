import { readFileSync } from 'fs';
import { createSecureServer } from 'http2';
import { Server } from 'socket.io';
import { config } from './config';
import { overrideSocketId } from './middlewares';
import { listenToStream } from './redis';
import { RawEvent } from './events';

/* Example event:
id
123
type
run_workflow
createdAt
456123789
tags
["web", "darwin"]
payload
{"a":"A","b":"B"}
 */

let abortController = new AbortController();
abortController.abort();

function resetAbortController() {
    abortController = new AbortController();
}

function getAbortController() {
    return abortController;
}

export function startServer() {
    console.log('Starting server...');

    const httpServer = createSecureServer({
        allowHTTP1: true,
        key: readFileSync(config.keyPath),
        cert: readFileSync(config.certPath)
    });

    const io = new Server(httpServer, {});

    io.use(overrideSocketId);

    const startListeningToStream = async (abortSignal: AbortSignal) => listenToStream({
        abortSignal,
        callback: async (message) => {
            const rawEvent = RawEvent.safeParse(message);
            if (!rawEvent.success) {
                console.error('Invalid event', message, rawEvent.error);
                return;
            }

            const event = rawEvent.data;
            console.dir({ event }, { depth: null });

            const availableSockets = await Promise.all(
                event.tags.map(async (tag) => await io.in(tag).fetchSockets())
            );

            // Find sockets that are in all tags (intersection)
            const filteredSockets = availableSockets.reduce((acc, curr) => {
                return acc.filter(socket => curr.some(s => s.id === socket.id));
            }, availableSockets.at(0) ?? []);

            if (filteredSockets.length === 0) {
                console.error('No sockets found matching all tags', event.tags);
                return;
            }

            // Randomly pick one socket from the filtered sockets
            const randomIndex = Math.floor(Math.random() * filteredSockets.length);
            const socket = filteredSockets[randomIndex];
            if (!socket) {
                console.error('Failed to select socket');
                return;
            }

            console.dir({ socketId: socket.id }, { depth: null });
            socket.emit('message', event);
        },
        streamKey: 'stream',
        groupName: 'realtm',
        consumerName: 'realtm',
    });

    io.on('connection', async (socket) => {
        console.log('A user connected');

        await socket.join('waitroom');

        socket.on('join', async (tags: string[], callback: (succeeded: boolean) => void) => {
            try {
                console.log('A client declared that it wants to join a room', tags);

                await socket.join(tags);
                await socket.leave('waitroom');

                if (abortController.signal.aborted) {
                    resetAbortController();
                    await startListeningToStream(abortController.signal);
                }

                callback(true);
            } catch (error) {
                console.error('Error joining room', tags, error);

                callback(false);
            }
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected');

            const remainingSockets = io.sockets.sockets.size;
            if (remainingSockets === 0) {
                getAbortController().abort();
            }
        });
    });

    io.on('new_namespace', (namespace) => {
        console.log('A new namespace was created', namespace);
    });

    io.on('disconnect', (_socket) => {
        console.log('A user disconnected');

        const remainingSockets = io.sockets.sockets.size;
        if (remainingSockets === 0) {
            getAbortController().abort();
        }
    });

    io.on('message', (message) => {
        console.log('A message was received:', message);
    });

    io.listen(config.port);

    console.log(`Server started on port ${String(config.port)}`);

    return io;
}
