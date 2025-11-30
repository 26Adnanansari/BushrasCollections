# Bulk Product Upload Guide

## Overview
Upload multiple products at once using CSV (Comma-Separated Values) files. This is faster than adding products one by one through the manual form.

## Quick Start
1. Navigate to **Admin → Products → Bulk Upload** tab
2. Click **"Download Sample CSV"** to get the correct format
3. Fill in your product data following the format
4. Upload the CSV file
5. Review results and fix any errors

---

## CSV Format Requirements

### Required Columns (Must Include)
Your CSV **must** have these column headers in the first row:

| Column Name | Type | Required | Description |
|------------|------|----------|-------------|
| `name` | Text | ✅ Yes | Product name (max 200 characters) |
| `description` | Text | ✅ Yes | Product description (max 2000 characters) |
| `price` | Number | ✅ Yes | Sale price in PKR (must be > 0) |
| `brand` | Text | ✅ Yes | Brand name (max 100 characters) |
| `category` | Text | ✅ Yes | Product category (max 100 characters) |
| `stock_quantity` | Integer | ✅ Yes | Available stock (must be ≥ 0) |
| `image_url` | URL | ✅ Yes | Single product image URL |

### Optional Columns
| Column Name | Type | Required | Description |
|------------|------|----------|-------------|
| `list_price` | Number | ⬜ No | Original/list price in PKR (for discount display) |
| `is_active` | Boolean | ⬜ No | Set to "true" or "false" (defaults to true) |

---

## Sample CSV Format

```csv
name,description,price,list_price,brand,category,stock_quantity,image_url,is_active
"Summer Dress","Beautiful floral summer dress perfect for warm weather occasions",2999,3499,"Fashion Brand","Women",10,"https://example.com/image.jpg",true
"Casual Shirt","Comfortable cotton casual shirt for everyday wear",1499,1799,"Style Co","Men",15,"https://example.com/shirt.jpg",true
"Kids T-Shirt","Soft cotton t-shirt for children",799,,"Bushra's Collection","Kids",20,"https://example.com/kids-tshirt.jpg",true
```

### Important Notes:
- ✅ First row **must** be column headers (exact names shown above)
- ✅ Use double quotes `"..."` around text fields that contain commas
- ✅ Leave `list_price` empty if you don't have an original price
- ✅ `is_active` can be omitted - defaults to `true`
- ✅ Use valid URLs for `image_url` (must be accessible online)

---

## Validation Rules

### Same as Manual Form
CSV upload uses **identical validation** as the manual product form:

#### Text Fields:
- **name**: 1-200 characters, cannot be empty
- **description**: 1-2000 characters, cannot be empty
- **brand**: 1-100 characters, cannot be empty
- **category**: 1-100 characters, cannot be empty

#### Numeric Fields:
- **price**: Must be a positive number > 0, max 9,999,999.99
- **list_price**: If provided, must be positive > 0, max 9,999,999.99
- **stock_quantity**: Must be whole number (integer) ≥ 0

#### URLs:
- **image_url**: Must be valid URL format (e.g., https://...)

#### Boolean:
- **is_active**: Use `true`, `false`, `TRUE`, `FALSE`, or leave empty

---

## Common Errors & Fixes

### ❌ "Product name is required"
**Fix:** Ensure every row has a value in the `name` column

### ❌ "Price must be greater than 0"
**Fix:** Check that `price` column has numeric values > 0 (no text, no negative numbers)

### ❌ "Stock must be a whole number"
**Fix:** `stock_quantity` must be integers (0, 1, 2, 10...) - no decimals like 5.5

### ❌ "Brand is required"
**Fix:** Fill in the `brand` column for all products

### ❌ "Row X: Invalid data"
**Fix:** Check that row X has all required columns filled and matches validation rules

### ❌ "Failed to parse CSV file"
**Fix:** 
- Open CSV in text editor (not Excel) to check format
- Ensure commas separate columns correctly
- Use UTF-8 encoding when saving CSV

---

## Step-by-Step Upload Process

### 1. Prepare Your CSV File
- Use Excel, Google Sheets, or text editor
- Follow the format exactly (see sample above)
- Save as `.csv` format (not `.xlsx`)

### 2. Test with Small Batch First
- Upload 2-3 products first to test
- Fix any errors before uploading full catalog
- This saves time if format is wrong

### 3. Upload CSV
- Go to **Admin → Products → Bulk Upload**
- Click **"Select CSV File"**
- Choose your prepared file
- Click **"Upload CSV"**

### 4. Review Results
- Success: Shows "Successfully uploaded X products"
- Errors: Shows which rows failed and why
- Fix errors in CSV and re-upload failed rows

### 5. Verify Products
- Switch to **"Product List"** tab
- Check that all products appear correctly
- Edit any products if needed

---

## Tips for Success

✅ **Download the sample CSV first** - it has the correct format  
✅ **Keep a backup** of your CSV file before uploading  
✅ **Test with 2-3 products first** before bulk upload  
✅ **Use consistent category names** (Women, Men, Kids, Accessories)  
✅ **Use consistent brand names** (avoid typos like "Nike" vs "nike")  
✅ **Host images online first** - CSV doesn't support uploading image files  
✅ **Use high-quality image URLs** from your own website or CDN  

❌ **Don't mix formats** - stick to one date format, one currency  
❌ **Don't use special characters** in column names (stick to template)  
❌ **Don't upload huge files** - break into batches of 50-100 products  

---

## Image URLs Best Practices

Since CSV upload requires image URLs (not file uploads), you need to:

### Option 1: Upload images manually first
1. Create 1-2 sample products manually via form
2. Upload product images through the form
3. Get the image URLs from those products
4. Use similar URLs in your CSV

### Option 2: Use external image hosting
- Upload images to your website/server
- Use direct image URLs like: `https://yourdomain.com/images/product1.jpg`
- Ensure URLs are publicly accessible

### Option 3: Use image CDN
- Upload to services like Cloudinary, ImgBB, or similar
- Copy the direct image URLs
- Use those URLs in CSV

**⚠️ Important:** URLs must be direct image links (ending in .jpg, .png, etc.), not webpage links.

---

## Troubleshooting

### Products uploaded but images not showing
**Cause:** Invalid or inaccessible image URLs  
**Fix:** Check that URLs:
- Start with `https://` or `http://`
- End with image extension (.jpg, .png, .webp)
- Are publicly accessible (open in browser to test)

### CSV upload says "No valid products found"
**Cause:** All rows failed validation  
**Fix:** 
- Check that column names match exactly (case-sensitive)
- Ensure at least one row has all required fields
- Remove any empty rows at end of CSV

### "Failed to process CSV"
**Cause:** CSV file format issue  
**Fix:**
- Save as proper CSV format (not Excel .xlsx)
- Use UTF-8 encoding
- Check for special characters causing parse errors

---

## Need Help?

1. **Download Sample CSV** - The template is your best reference
2. **Check existing products** - See what format works
3. **Test small batches** - Upload 2-3 products to test first
4. **Compare to manual form** - Validation is identical

Remember: **CSV bulk upload follows the exact same rules as adding products manually.** If a product wouldn't be valid in the manual form, it won't work in CSV either.
