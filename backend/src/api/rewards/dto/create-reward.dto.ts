import { z } from 'zod';

export const createRewardSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  pointsCost: z
    .number()
    .int()
    .positive('Points cost must be a positive integer'),
  stock: z.number().int().nonnegative('Stock must be 0 or more').optional(),
  expiresAt: z.coerce.date().optional(),
});

export type CreateRewardDto = z.infer<typeof createRewardSchema>;
