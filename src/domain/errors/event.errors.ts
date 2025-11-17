export class NoSocketsFoundError extends Error {
    constructor(public readonly tags: readonly string[]) {
        super(`No sockets found matching all tags: ${tags.join(', ')}`);
        this.name = 'NoSocketsFoundError';
    }
}

export class SocketSelectionError extends Error {
    constructor(public readonly filteredSocketsLength: number) {
        super(`Failed to select socket from filtered list of ${String(filteredSocketsLength)} sockets`);
        this.name = 'SocketSelectionError';
    }
}

export class SocketEmitError extends Error {
    constructor(
        public readonly socketId: string,
        public readonly eventId: string,
        public readonly originalError?: unknown
    ) {
        super(`Failed to emit event ${eventId} to socket ${socketId}`);
        this.name = 'SocketEmitError';
    }
}

