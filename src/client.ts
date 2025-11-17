import { io, type Socket } from 'socket.io-client';
import { config } from './config';
import { UserSchema } from './interface';

interface StartClientArgs {
    tags?: string[];
}

const startTime = Date.now();

export function startClient({
    tags = [],
}: StartClientArgs = {}) {
    console.log('Starting client...');

    const socket: Socket = io(config.url, {
        reconnectionDelayMax: 1000,
        query: {
            _id: [startTime.toString(16), ...tags].join('|'),
        }
    });

    socket.on('connect', () => {
        console.log('Connected to server');

        console.log('Starting to join namespaces', tags);
        void socket.emitWithAck('join', tags);
    });

    socket.on('new_namespace', (namespace) => {
        console.log('A new namespace was created', namespace);
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });

    socket.on('error', (error: unknown) => {
        console.error('Error:', error);
    });

    socket.on('message', (message: unknown) => {
        console.log('Message:', message);

        console.dir({ message }, { depth: null });
        if (typeof message === 'object' && message !== null && 'user' in message) {
            const user = UserSchema.parse(message.user);

            console.dir({ user }, { depth: null });
        }
    });

    console.log('Client started');

    return socket;
}