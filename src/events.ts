import * as z from 'zod';

// Schema for tags that accepts both stringified JSON array and actual array
const TagsSchema = z.preprocess(
    (value: unknown) => {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value) as unknown;
            } catch (error) {
                console.error('Tags parsing error', value, error);

                return value;
            }
        }

        return value;
    },
    z.array(z.string())
);

// Schema for payload that accepts both stringified JSON object and actual object
const PayloadSchema = z.preprocess(
    (value: unknown) => {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value) as unknown;
            } catch (error) {
                console.error('Payload parsing error', value, error);

                return value;
            }
        }

        return value;
    },
    z.record(z.string(), z.unknown())
);

export const RawEvent = z.object({
    id: z.string(),
    type: z.string(),
    createdAt: z.preprocess(
        (value: unknown) => {
            if (typeof value === 'string') {
                const parsed = Number(value);
                return isNaN(parsed) ? value : parsed;
            }
            return value;
        },
        z.number()
    ),
    tags: TagsSchema,
    payload: PayloadSchema,
});

export type RawEvent = z.infer<typeof RawEvent>;


export const RunWorkflowEvent = RawEvent.extend({
    type: z.literal('run_workflow'),
    payload: z.preprocess(
        (value: unknown) => {
            if (typeof value === 'string') {
                try {
                    return JSON.parse(value) as unknown;
                } catch {
                    return value;
                }
            }
            return value;
        },
        z.object({
            workflowId: z.string(),
        })
    ),
});

export type RunWorkflowEvent = z.infer<typeof RunWorkflowEvent>;