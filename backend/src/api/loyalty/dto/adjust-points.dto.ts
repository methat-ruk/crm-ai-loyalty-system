import { z } from 'zod';

export const adjustPointsSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  type: z.enum(['EARN', 'REDEEM', 'EXPIRE', 'ADJUST']),
  points: z.number().int().positive('Points must be a positive integer'),
  description: z.string().min(1, 'Description is required'),
  referenceId: z.string().optional(),
});

export type AdjustPointsDto = z.infer<typeof adjustPointsSchema>;
