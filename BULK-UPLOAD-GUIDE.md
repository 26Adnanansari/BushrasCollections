# Bulk Product Upload Guide

This guide explains how to use the CSV upload feature to add products in bulk to your store.

## CSV Format Requirements

Your CSV file must include the following headers (exact names required):

| Column Name | Required | Type | Description |
|------------|----------|------|-------------|
| `name` | Yes | Text | Product name (max 200 chars) |
| `description` | Yes | Text | Product description (max 2000 chars) |
| `price` | Yes | Number | Sale price in PKR |
| `list_price` | No | Number | Original/List price in PKR (for discounts) |
| `brand` | Yes | Text | Brand name (max 100 chars) |
| `category` | Yes | Text | Product category (e.g., Formal Dress, Accessories) |
| `stock_quantity` | Yes | Number | Available stock quantity (integer ≥ 0) |
| `image_url` | Yes | URL | Direct link to product image |
| `is_active` | No | Boolean | `true` or `false` (defaults to true) |
| `sku` | No | Text | SKU Code (auto-generated if empty) |
| `fabric_type` | No | Text | e.g., Cotton, Silk, Chiffon |
| `available_sizes` | No | Text | Comma-separated sizes (e.g., "S,M,L") |
| `available_colors` | No | Text | Comma-separated colors (e.g., "Red,Blue") |
| `occasion_type` | No | Text | e.g., Wedding, Party, Casual |
| `care_instructions` | No | Text | e.g., "Dry clean only" |
| `embellishment` | No | Text | e.g., "Embroidery", "Sequins" |

## Example CSV Data

```csv
name,description,price,list_price,brand,category,stock_quantity,image_url,is_active,sku,fabric_type,available_sizes,available_colors,occasion_type,care_instructions,embellishment
Summer Dress,Beautiful floral dress,2999,3499,Fashion Brand,Formal Dress,10,https://example.com/img1.jpg,true,SKU-FO-12345,Cotton,"S,M,L","Red,Blue",Party,Dry clean only,Embroidery
Casual Shirt,Comfortable cotton shirt,1499,,Style Co,Casual Dress,15,https://example.com/img2.jpg,true,,Silk,"M,L,XL","White,Black",Casual,Hand wash,Plain
```

## Important Notes

1. **Images**: You must provide a valid direct URL for the image. You can upload images to the `product-images` bucket in Supabase storage first and use those URLs.
2. **Validation**: The system performs the same validation as the manual entry form. If any row fails validation, the entire upload will be rejected to prevent partial data issues.
3. **SKU**: If you leave the `sku` column empty, the system will automatically generate a unique SKU for you (e.g., `SKU-FO-12345`).
4. **Lists**: For `available_sizes` and `available_colors`, separate multiple values with commas. If the values contain commas themselves, wrap the entire field in quotes.
