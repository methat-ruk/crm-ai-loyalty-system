import { z } from 'zod';

export const redeemPointsSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  points: z.number().int().positive('Points must be a positive integer'),
  description: z.string().min(1, 'Description is required'),
  referenceId: z.string().optional(),
});

export type RedeemPointsDto = z.infer<typeof redeemPointsSchema>;
