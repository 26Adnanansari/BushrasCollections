import { z } from 'zod';

export const productSchema = z.object({
  sku: z
    .string()
    .trim()
    .max(50, 'SKU must be less than 50 characters')
    .optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Product name is required')
    .max(200, 'Product name must be less than 200 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
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
  // Boutique-specific optional fields
  fabric_type: z
    .string()
    .trim()
    .max(100, 'Fabric type must be less than 100 characters')
    .optional(),
  available_sizes: z
    .array(z.string())
    .optional(),
  available_colors: z
    .array(z.string())
    .optional(),
  care_instructions: z
    .string()
    .trim()
    .max(500, 'Care instructions must be less than 500 characters')
    .optional(),
  occasion_type: z
    .string()
    .trim()
    .max(100, 'Occasion type must be less than 100 characters')
    .optional(),
  embellishment: z
    .array(z.string())
    .optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
