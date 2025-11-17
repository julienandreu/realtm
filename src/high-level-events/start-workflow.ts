interface StartWorkflowArgs {
    workflowId: string;
    inputs: Record<string, unknown>;
    terminal: 'backend' | 'native' | 'chrome';
}

interface StartWorkflowResult {
    backendTaskId: string;
    metadata: Record<string, unknown>;
    results: Record<string, unknown>;
}

export async function startWorkflow({ workflowId, inputs, terminal }: StartWorkflowArgs): Promise<StartWorkflowResult> {
    return Promise.resolve({
        backendTaskId: '123',
        metadata: {
            terminal,
            workflowId,
            inputs,
        },
        results: {},
    });
}
