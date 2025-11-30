# Admin Guide - Bushra's Collection

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Product Management](#product-management)
4. [Order Management](#order-management)
5. [User Management](#user-management)
6. [Promotional Banners](#promotional-banners)
7. [Hero Slider Management](#hero-slider-management)
8. [Payment Methods](#payment-methods)
9. [Form Draft System](#form-draft-system)

---

## Getting Started

### Accessing Admin Panel
1. Sign in with your admin account at `/auth`
2. You'll be automatically redirected to `/admin` dashboard
3. Navigation sidebar shows all available admin features

### Role Permissions
- **Admin**: Manage products, orders, users, banners, hero slides
- **Super Admin**: All admin features + payment method configuration + team management

---

## Dashboard Overview

The admin dashboard displays:
- **Total Revenue**: Sum of all completed orders
- **Total Orders**: Count of all orders
- **Total Products**: Number of products in catalog
- **Active Users**: Registered user count
- **Recent Orders**: Latest 5 orders with quick actions
- **Analytics Charts**: Revenue and order trends

---

## Product Management

### Adding a Product
1. Navigate to **Products** in sidebar
2. Click **Add Product** button
3. Fill in required fields:
   - **Name** (required)
   - **Price** (required, numeric)
   - **Description** (optional, markdown supported)
   - **Category** (optional)
   - **Stock** (default: 0)
   - **Featured** (toggle for homepage display)
4. **Upload Images**:
   - Click "Upload Images" or drag & drop
   - Multiple images supported
   - First image becomes primary display
5. Click **Create Product**

### Editing a Product
1. Find product in the products table
2. Click **Edit** (pencil icon)
3. Modify fields as needed
4. Click **Update Product**

### Deleting a Product
1. Find product in the products table
2. Click **Delete** (trash icon)
3. Confirm deletion in popup
4. Product is permanently removed

### Managing Stock
- Set stock quantity when creating/editing
- Stock decreases automatically when orders are placed
- Low stock products highlighted in red

---

## Order Management

### Viewing Orders
- All orders displayed in table format
- Columns: Order ID, Customer, Total, Status, Payment Status, Date
- Click **View** to see full order details

### Order Statuses
- **Pending**: New order, awaiting processing
- **Processing**: Order is being prepared
- **Shipped**: Order dispatched for delivery
- **Delivered**: Order completed successfully
- **Cancelled**: Order cancelled by admin/customer

### Payment Statuses
- **Pending Payment**: Awaiting customer payment
- **Paid**: Payment received
- **Pending Verification**: Payment under review
- **Failed**: Payment failed

### Updating Order Status
1. Click **View** on order
2. Use **Status** dropdown to change order status
3. Status updates automatically saved
4. Customer sees updated status in their orders

---

## User Management

### Viewing Users
- All registered users listed with email, name, role, join date
- Search users by email or name
- Filter by role (User, Admin, Super Admin)

### Assigning Roles
**(Super Admin only)**
1. Find user in the table
2. Click **Edit Role**
3. Select new role:
   - **User**: Standard customer access
   - **Admin**: Product/order management
   - **Super Admin**: Full system access
4. Confirm role change

### User Information
- View user's order history
- Check profile completion (name, phone, avatar, address)
- Monitor account creation date

---

## Promotional Banners

### Creating a Banner
1. Navigate to **Promotional Banners**
2. Click **Add Banner**
3. Fill in details:
   - **Title** (required)
   - **Description** (optional)
   - **Banner Image** (required, upload from computer)
   - **Button Text** (e.g., "Shop Now")
   - **Button Link** (e.g., "/products")
   - **Display Order** (numeric, lower = higher priority)
   - **Active** (toggle visibility)
4. Click **Create**

### Managing Banners
- Banners displayed on homepage in carousel
- Only **active** banners are visible to customers
- Edit display order to control sequence
- Upload high-quality images (recommended: 1920x600px)

### Editing/Deleting Banners
- Click **Edit** to modify banner
- Click **Delete** to remove permanently
- Changes reflect immediately on homepage

---

## Hero Slider Management

### Creating a Hero Slide
1. Navigate to **Hero Slider**
2. Click **Add Slide**
3. Fill in fields:
   - **Title** (required)
   - **Subtitle** (optional)
   - **Image** (required, large format)
   - **CTA Text** (call-to-action button text)
   - **CTA Link** (button destination URL)
   - **Order Index** (slide sequence)
   - **Active** (toggle visibility)
4. Click **Create**

### Best Practices
- Use high-resolution images (1920x1080px minimum)
- Keep titles short and impactful
- Limit to 3-5 active slides for better UX
- Test CTA links before publishing

---

## Payment Methods

**(Super Admin only)**

### Adding Payment Method
1. Navigate to **Payment Methods**
2. Click **Add Payment Method**
3. Configure:
   - **Name** (e.g., "Bank Transfer")
   - **Type**: Manual, Gateway, or Offline
   - **Instructions** (shown to customers at checkout)
   - **Logo** (optional image upload)
   - **Config** (JSON for gateway settings)
   - **Display Order**
   - **Active** status
4. Click **Create**

### Default Payment Method
- **Contact Payment** is the default method
- Customers contact shop owner to arrange payment
- No online payment processing required

### Managing Methods
- Activate/deactivate payment options
- Update instructions for customers
- Reorder display sequence

---

## Form Draft System 💾

### What is Auto-Save?
All admin forms automatically save your progress as you type. This prevents data loss if:
- Browser crashes or refreshes
- You accidentally navigate away
- Computer loses power
- You need to leave and come back later

### How It Works

#### Auto-Save Behavior
- **Saves every 2 seconds** while you type
- Drafts stored in **browser localStorage** (not database)
- Zero server cost, works offline
- Each form has a separate draft

#### Visual Indicator
When a draft is saved, you'll see:
```
💾 Draft saved 2 seconds ago [Clear draft]
```
- Shows timestamp of last save
- **Clear draft** button removes saved data

#### Draft Restoration
1. Fill form partially
2. Navigate away or refresh page
3. Return to form
4. Draft automatically restored with all your data

#### Navigate Away Warning
If you try to leave with unsaved changes:
```
⚠️ Unsaved changes
You have unsaved changes. Are you sure you want to leave?
```
- Browser shows native warning prompt
- Only appears if form is modified ("dirty")

#### Draft Cleared After Submit
- Successfully submit form → draft automatically deleted
- Prevents old data from reappearing
- Fresh form for next entry

### Forms with Auto-Save
✅ Product add/edit forms
✅ Banner add/edit forms
✅ Hero slide add/edit forms
✅ Payment method forms

### Draft Storage Keys
Each form has a unique localStorage key:
- `draft_product_new` - New product form
- `draft_product_{id}` - Edit product form
- `draft_banner_new` - New banner form
- `draft_banner_{id}` - Edit banner form
- `draft_hero_new` - New hero slide
- `draft_hero_{id}` - Edit hero slide
- `draft_payment_new` - New payment method

### Clearing Drafts

#### Manual Clear
Click **Clear draft** button next to "Draft saved" message

#### Automatic Clear
- Submit form successfully
- Clear browser localStorage
- Use incognito/private browsing

### Limitations
- Drafts stored **per browser** (not account-wide)
- Different computers = different drafts
- Incognito mode = no draft persistence
- Image uploads NOT saved in draft (must re-upload)

### Best Practices
1. **Trust the auto-save**: It saves every 2 seconds automatically
2. **Check the indicator**: Look for "Draft saved" message
3. **Don't panic on refresh**: Your data will be restored
4. **Clear when done**: Use "Clear draft" if you want to start fresh
5. **One form at a time**: Each form maintains separate draft

### Troubleshooting

**Q: Draft not restoring?**
- Check if you're in the same browser
- Ensure localStorage is enabled
- Try clearing old draft and re-entering

**Q: Images not saved in draft?**
- Image uploads are not included in drafts (file size limits)
- Re-upload images when restoring form

**Q: Multiple drafts conflicting?**
- Each form has separate draft storage
- Product draft won't interfere with banner draft

**Q: Draft persisting after submit?**
- This is a bug - draft should clear on successful submit
- Manually click "Clear draft" button

---

## Tips & Best Practices

### General
- **Save frequently**: Although auto-save is enabled, preview changes before submitting
- **Use descriptive names**: Makes searching easier
- **Test links**: Always verify CTA links work before publishing
- **Monitor stock**: Keep product inventory updated
- **Backup data**: Export important data regularly

### Images
- Use high-quality images (web-optimized)
- Compress before upload to reduce load time
- Keep aspect ratios consistent
- Name files descriptively

### Security
- Never share admin credentials
- Assign roles carefully (admin access is powerful)
- Review user permissions regularly
- Log out when done

### Performance
- Limit active banners to 3-5
- Archive old/completed orders periodically
- Remove unused payment methods
- Clean up deleted products from storage

---

## Support

For technical issues or questions:
1. Check this guide first
2. Review error messages carefully
3. Contact super admin for role/permission issues
4. Refer to main README.md for setup questions

---

**Last Updated**: {{ current_date }}
**Version**: 1.0.0
