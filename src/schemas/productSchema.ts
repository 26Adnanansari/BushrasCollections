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
    .max(10000, 'Description must be less than 10000 characters'),
  price: z
    .number()
    .min(0, 'Price must be 0 or greater')
    .max(9999999.99, 'Price is too high')
    .optional()
    .default(0),
  list_price: z
    .number()
    .positive('List price must be greater than 0')
    .max(9999999.99, 'List price is too high')
    .optional(),
  category: z
    .string()
    .trim()
    .max(100, 'Category must be less than 100 characters')
    .optional(),
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
  embellishment: z
    .array(z.string())
    .optional(),
  is_custom: z.boolean().optional().default(false),
  advance_required: z
    .number()
    .min(0, 'Advance percentage must be 0 or greater')
    .max(100, 'Advance percentage must be 100 or less')
    .optional()
    .default(0),
  dress_components: z.array(z.object({
    name: z.string().min(1, 'Component name is required'),
    price: z.number().positive().nullable().optional(),
  })).optional().default([]),
  delivery_weeks: z.string().max(30).optional().nullable(),
});

export type ProductFormData = z.infer<typeof productSchema>;
