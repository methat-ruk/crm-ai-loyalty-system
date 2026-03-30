import { z } from 'zod';
import { createCustomerSchema } from './create-customer.dto.js';

export const updateCustomerSchema = createCustomerSchema
  .partial()
  .extend({ isActive: z.boolean().optional() });

export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
