import { z } from 'zod';
import { createRewardSchema } from './create-reward.dto.js';

export const updateRewardSchema = createRewardSchema
  .partial()
  .extend({ isActive: z.boolean().optional() });

export type UpdateRewardDto = z.infer<typeof updateRewardSchema>;
