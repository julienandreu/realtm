interface StartWithoutBackendArgs {
    workflowId: string;
    inputs: Record<string, unknown>;
}

interface StartWithoutBackendResult {
    backendTaskId: string;
    metadata: Record<string, unknown>;
    results: Record<string, unknown>;
}

export async function startWithoutBackend({ workflowId, inputs }: StartWithoutBackendArgs): Promise<StartWithoutBackendResult> {
    return Promise.resolve({
        backendTaskId: '123',
        metadata: {
            workflowId,
            inputs,
        },
        results: {},
    });
}
