import { z } from 'zod';

export const checkoutSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format'),
  address: z
    .string()
    .trim()
    .min(10, 'Please provide a complete address')
    .max(500, 'Address is too long'),
  city: z
    .string()
    .trim()
    .min(2, 'City is required')
    .max(100, 'City name is too long'),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, 'Postal code must be 5 digits'),
  notes: z
    .string()
    .trim()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
