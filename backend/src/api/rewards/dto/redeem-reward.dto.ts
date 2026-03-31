import { z } from 'zod';

export const redeemRewardSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
});

export type RedeemRewardDto = z.infer<typeof redeemRewardSchema>;
