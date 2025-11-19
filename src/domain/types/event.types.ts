import {z} from 'zod';

const TagsSchema = z.preprocess((value: unknown): unknown => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}, z.array(z.string()));

const PayloadSchema = z.preprocess(
  (value: unknown): unknown => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  },
  z.record(z.string(), z.unknown()),
);

export const RawEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  createdAt: z.preprocess((value: unknown) => {
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    }
    return value;
  }, z.number()),
  tags: TagsSchema,
  payload: PayloadSchema,
});

export type RawEvent = z.infer<typeof RawEventSchema>;

export const RunWorkflowEventSchema = RawEventSchema.extend({
  type: z.literal('run_workflow'),
  payload: z.preprocess(
    (value: unknown): unknown => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;
    },
    z.object({
      workflowId: z.string(),
    }),
  ),
});

export type RunWorkflowEvent = z.infer<typeof RunWorkflowEventSchema>;
