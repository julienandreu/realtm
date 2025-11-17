interface CommitContextArgs {
    backendTaskId: string;
    context: Record<string, unknown>;
}

interface CommitContextResult {
    backendTaskId: string;
    metadata: Record<string, unknown>;
    context: Record<string, unknown>;
}

export async function commitContext({ backendTaskId, context }: CommitContextArgs): Promise<CommitContextResult> {
    const existingContext = {
        a: 'A',
        b: 'B',
        c: 'C',
    };

    return Promise.resolve({
        backendTaskId: '123',
        metadata: {
            backendTaskId,
            context,
        },
        context: {
            ...existingContext,
            ...context,
        },
    });
}
