import { z } from 'zod';

export const generateCustomerInsightSchema = z.object({
  customerId: z.string().min(1),
});

export type GenerateCustomerInsightDto = z.infer<
  typeof generateCustomerInsightSchema
>;

export const generatePromoRecommendationSchema = z.object({
  context: z.string().optional(),
});

export type GeneratePromoRecommendationDto = z.infer<
  typeof generatePromoRecommendationSchema
>;
