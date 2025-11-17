import { startWithoutBackend } from './start-without-be';
import { startWithBackend } from './start-with-be';

export const events = {
    startWithoutBackend,
    startWithBackend,
} as const;