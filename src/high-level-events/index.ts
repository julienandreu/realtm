import { startWorkflow } from './start-workflow';
import { startEntrypoint } from './start-entrypoint';

export const events = {
    startWorkflow,
    startEntrypoint,
} as const;