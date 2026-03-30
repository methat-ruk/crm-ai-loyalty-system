import { z } from 'zod';

export const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.email('Invalid email format'),
  phone: z
    .string()
    .transform((val) => val.replace(/[\s-]/g, ''))
    .pipe(
      z
        .string()
        .regex(
          /^0[6-9]\d{8}$|^0[2-5]\d{7,8}$/,
          'Invalid Thai phone number (e.g. 081-234-5678)',
        ),
    )
    .transform((val) =>
      val.length === 10
        ? `${val.slice(0, 3)}-${val.slice(3, 6)}-${val.slice(6)}`
        : `${val.slice(0, 2)}-${val.slice(2, 5)}-${val.slice(5)}`,
    )
    .optional(),
  dateOfBirth: z.coerce.date().optional(),
  tier: z
    .enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'])
    .optional()
    .default('BRONZE'),
});

export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
