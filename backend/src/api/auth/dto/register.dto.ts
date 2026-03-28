import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['ADMIN', 'STAFF', 'MARKETING']).optional().default('STAFF'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
