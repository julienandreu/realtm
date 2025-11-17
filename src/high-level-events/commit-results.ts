interface CommitResultsArgs {
    backendTaskId: string;
    results: Record<string, unknown>;
}

interface CommitResultsResult {
    backendTaskId: string;
    metadata: Record<string, unknown>;
    results: Record<string, unknown>;
}

export async function commitResults({ backendTaskId, results }: CommitResultsArgs): Promise<CommitResultsResult> {
    const existingResults = {
        a: 'A',
        b: 'B',
        c: 'C',
    };

    return Promise.resolve({
        backendTaskId: '123',
        metadata: {
            backendTaskId,
            results,
        },
        results: {
            ...existingResults,
            ...results,
        },
    });
}
