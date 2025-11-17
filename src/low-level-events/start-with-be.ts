interface StartWithBackendArgs {
    workflowId: string;
    inputs: Record<string, unknown>;
}

interface StartWithBackendResult {
    backendTaskId: string;
    metadata: Record<string, unknown>;
    results: Record<string, unknown>;
}

export async function startWithBackend({ workflowId, inputs }: StartWithBackendArgs): Promise<StartWithBackendResult> {
    return Promise.resolve({
        backendTaskId: '123',
        metadata: {
            workflowId,
            inputs,
        },
        results: {},
    });
}
