interface ContinueWorkflowArgs {
    backendTaskId: string;
}

export async function continueWorkflow({ backendTaskId }: ContinueWorkflowArgs): Promise<void> {
    // Get the current context
    // Get the current terminal
}
