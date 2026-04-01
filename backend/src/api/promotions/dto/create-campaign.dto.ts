import { z } from 'zod';

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum([
    'POINTS_MULTIPLIER',
    'BONUS_POINTS',
    'DISCOUNT',
    'FREE_REWARD',
  ]),
  pointsMultiplier: z.number().positive().optional(),
  bonusPoints: z.number().int().positive().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().optional().default(true),
});

export type CreateCampaignDto = z.infer<typeof createCampaignSchema>;
