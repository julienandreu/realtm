interface StartEntrypointArgs {
    entrypointId: string;
}

interface StartEntrypointResult {
    backendExecutionId: string;
    metadata: Record<string, unknown>;
    createdTaskIds: string[];
}

export async function startEntrypoint({ entrypointId }: StartEntrypointArgs): Promise<StartEntrypointResult> {
    return Promise.resolve({
        backendExecutionId: '123',
        metadata: {
            entrypointId,
        },
        results: {},
        createdTaskIds: [],
    });
}
