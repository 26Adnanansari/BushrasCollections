import { z } from 'zod';

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Product name is required')
    .max(200, 'Product name must be less than 200 characters'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters'),
  price: z
    .number()
    .positive('Price must be greater than 0')
    .max(9999999.99, 'Price is too high'),
  list_price: z
    .number()
    .positive('List price must be greater than 0')
    .max(9999999.99, 'List price is too high')
    .optional(),
  category: z
    .string()
    .trim()
    .min(1, 'Category is required')
    .max(100, 'Category must be less than 100 characters'),
  brand: z
    .string()
    .trim()
    .min(1, 'Brand is required')
    .max(100, 'Brand must be less than 100 characters'),
  stock_quantity: z
    .number()
    .int('Stock must be a whole number')
    .min(0, 'Stock quantity must be 0 or greater'),
});

export type ProductFormData = z.infer<typeof productSchema>;
