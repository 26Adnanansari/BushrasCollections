# Complete User Flow Documentation

## Overview
This document maps the complete user journey through Bushra's Collection e-commerce application, from first visit to order completion.

---

## User Types

### 1. Guest User (Not Logged In)
- Can browse products
- Can view product details
- Cannot add to cart without login
- Redirected to /auth when attempting checkout

### 2. New User (First Time)
- Signs up at /auth
- Prompted to select avatar immediately
- Redirected to /dashboard after avatar selection
- Phone marked as "Unverified" (verification coming later)

### 3. Returning User (Regular Customer)
- Logs in at /auth
- Redirected to /dashboard
- Has order history and saved profile
- Can complete purchases

### 4. Admin User
- Logs in at /auth
- Redirected to /admin panel
- Full access to management tools
- Can manage: products, orders, users, banners, payment methods

### 5. Super Admin User
- Same as admin, plus:
- Can manage other admin roles
- Can manage payment methods
- Can assign/revoke admin privileges

---

## Complete User Journeys

### Journey 1: Guest Browsing

```
Landing Page (/)
    ↓
Browse Products
    ↓
View Product Details (/products/:id)
    ↓
Click "Add to Cart"
    ↓
Redirected to /auth
```

**Pages Visited:** `/` → `/products/:id` → `/auth`

**Features Used:**
- Hero slider with promotional banners
- 9 latest products display
- Promotional banners carousel
- Product card grid
- Product detail view

---

### Journey 2: New User Registration & First Order

```
Landing Page (/)
    ↓
Click "Sign In" (Navigation)
    ↓
Auth Page (/auth)
    ↓
Fill Sign Up Form:
  - Email
  - Password
  - Name
  - Phone Number
    ↓
Submit Registration
    ↓
Avatar Selection Modal Appears
  - 12 preset avatars (DiceBear API)
  - Click to select one
    ↓
Saved to Profile
    ↓
Redirected to User Dashboard (/dashboard)
    ↓
Browse Products from Dashboard
    ↓
View Product (/products/:id)
    ↓
Add to Cart
    ↓
View Cart (Drawer opens)
    ↓
Proceed to Checkout (/checkout)
    ↓
Fill Shipping Address
    ↓
Select "Contact Payment" Method
    ↓
Place Order
    ↓
Confirmation Screen
    ↓
Order Appears in Dashboard → Orders Tab
```

**Pages Visited:** `/` → `/auth` → `/dashboard` → `/products/:id` → `/checkout` → `/dashboard`

**Features Used:**
- Sign up form with validation (Zod schema)
- Avatar selection modal
- User dashboard
- Product browsing
- Cart system (cookie-based)
- Checkout form
- Order tracking

---

### Journey 3: Returning User Login & Purchase

```
Landing Page (/)
    ↓
Click "Sign In"
    ↓
Auth Page (/auth)
    ↓
Fill Login Form:
  - Email
  - Password
    ↓
Submit Login
    ↓
Redirected to Dashboard (/dashboard)
    ↓
View Previous Orders (Dashboard)
    ↓
Browse Products
    ↓
Add Items to Cart
    ↓
Checkout (/checkout)
    ↓
Address Pre-filled from Profile
    ↓
Place Order
    ↓
Back to Dashboard → View New Order
```

**Pages Visited:** `/` → `/auth` → `/dashboard` → `/products` → `/checkout` → `/dashboard`

**Features Used:**
- Login authentication
- Pre-filled user data
- Order history
- Cart persistence (cookies)
- Quick reorder flow

---

### Journey 4: Admin Management Workflow

```
Landing Page (/)
    ↓
Click "Sign In"
    ↓
Auth Page (/auth)
    ↓
Login with Admin Account
    ↓
Redirected to Admin Panel (/admin)
    ↓
Dashboard Overview:
  - Total products, orders, users
  - Recent orders list
    ↓
Manage Products (/admin/products)
  - View all products
  - Edit product (name, price, stock, image)
  - Delete product
  - Create new product
    ↓
Manage Orders (/admin/orders)
  - View all orders
  - Update order status
  - View order details
    ↓
Manage Promotional Banners (/admin/banners)
  - Create banner (image, title, CTA)
  - Edit banner
  - Delete banner
  - Set active/inactive status
    ↓
Manage Users (/admin/users)
  - View all users
  - View user details
  - (Super Admin only) Assign roles
    ↓
Manage Payment Methods (/admin/payment-methods)
  - (Super Admin only)
  - Update contact payment details
  - Add new payment methods
```

**Pages Visited:** `/` → `/auth` → `/admin` → `/admin/products` → `/admin/orders` → `/admin/banners` → `/admin/users` → `/admin/payment-methods`

**Features Used:**
- Role-based authentication
- Admin dashboard with analytics
- Full CRUD on all data tables
- Image upload to Supabase storage
- Order status management
- User role management (Super Admin)

---

## Page-by-Page Breakdown

### `/` - Landing Page (Public)
**Visible To:** Everyone

**Components:**
- Navigation bar
- Hero slider (managed via /admin/hero-slider)
- Promotional banners carousel (managed via /admin/banners)
- 9 latest products grid
- Featured products section
- About section
- Footer

**User Actions:**
- Browse products
- Click "Sign In" → Redirects to /auth
- Click product card → View product detail
- Scroll to view more content

---

### `/auth` - Authentication Page (Public)
**Visible To:** Not logged in users

**Components:**
- Sign In form (email, password)
- Sign Up form (email, password, name, phone)
- Tab switcher between Sign In/Sign Up
- Validation errors displayed inline

**User Actions:**
- **Sign In:** Enter credentials → Submit → Redirect to /dashboard or /admin
- **Sign Up:** Enter details → Submit → Avatar modal → Redirect to /dashboard

**Redirects:**
- Regular user → `/dashboard`
- Admin/Super Admin → `/admin`

---

### `/dashboard` - User Dashboard (Protected - Regular Users Only)
**Visible To:** Authenticated non-admin users

**Components:**
- Profile summary card (avatar, name, email, phone with "Unverified" badge)
- Order history table
- Quick actions (Edit Profile, Change Avatar)
- Navigation back to homepage

**User Actions:**
- View past orders
- Click order → View order details
- Edit profile → Navigate to /profile
- Change avatar → Open avatar selection modal
- Browse products → Navigate to /products

---

### `/admin` - Admin Dashboard (Protected - Admin Only)
**Visible To:** Admin and Super Admin users

**Components:**
- Stats cards (total products, orders, users, revenue)
- Recent orders table
- Quick action cards (Manage Products, Orders, Users, Banners)
- Navigation sidebar

**User Actions:**
- View analytics overview
- Navigate to management sections
- View recent activity

---

### `/admin/products` - Product Management (Protected - Admin)
**Visible To:** Admin and Super Admin users

**Components:**
- Products table (name, price, stock, category, image)
- Create new product button
- Edit/Delete actions per row
- Image upload component

**User Actions:**
- **Create Product:** Fill form (name, price, stock, category, description, image) → Submit
- **Edit Product:** Click edit → Modify fields → Save
- **Delete Product:** Click delete → Confirm deletion
- Upload product images to Supabase storage

---

### `/admin/orders` - Order Management (Protected - Admin)
**Visible To:** Admin and Super Admin users

**Components:**
- Orders table (order ID, customer, total, status, date)
- Status update dropdown per order
- View order details button

**User Actions:**
- **Update Status:** Select new status (pending, processing, shipped, delivered) → Save
- **View Details:** Click order → See full order items, shipping address, payment info

---

### `/admin/banners` - Promotional Banner Management (Protected - Admin)
**Visible To:** Admin and Super Admin users

**Components:**
- Banners table (title, image, CTA text, active status)
- Create banner form
- Edit/Delete actions
- Image upload component

**User Actions:**
- **Create Banner:** Upload image, set title, CTA text/link, active status → Submit
- **Edit Banner:** Modify banner details → Save
- **Delete Banner:** Remove banner from system
- Drag to reorder display order (optional enhancement)

---

### `/admin/users` - User Management (Protected - Admin)
**Visible To:** Admin and Super Admin users

**Components:**
- Users table (name, email, phone, roles, registration date)
- Role assignment dropdown (Super Admin only)
- View user details

**User Actions:**
- View all registered users
- **Super Admin Only:** Assign/revoke admin roles
- View user order history

---

### `/admin/payment-methods` - Payment Configuration (Protected - Super Admin)
**Visible To:** Super Admin users only

**Components:**
- Payment methods table (name, type, active status, instructions)
- Edit payment method details
- Contact information form

**User Actions:**
- **Super Admin Only:** Update contact payment details (phone, WhatsApp, instructions)
- Enable/disable payment methods
- Add new payment methods (future: gateway integrations)

---

### `/products` - Product Catalog (Public)
**Visible To:** Everyone

**Components:**
- Product grid
- Category filter
- Search bar
- Pagination

**User Actions:**
- Browse all products
- Filter by category
- Search products
- Click product → View details

---

### `/products/:id` - Product Detail Page (Public)
**Visible To:** Everyone

**Components:**
- Large product image
- Product name, price, description
- Stock availability
- "Add to Cart" button
- Related products

**User Actions:**
- View product details
- Add to cart (redirects to /auth if not logged in)
- View related products

---

### `/checkout` - Checkout Page (Protected - Logged In Users)
**Visible To:** Authenticated users with items in cart

**Components:**
- Cart summary (items, quantities, total)
- Shipping address form (pre-filled from profile)
- Payment method selection (only "Contact Payment" available)
- Order notes field
- Place Order button

**User Actions:**
- Review cart items
- Confirm/edit shipping address
- Select payment method
- Add order notes
- Place order → Confirmation → Redirect to /dashboard

---

### `/profile` - User Profile Settings (Protected - Logged In Users)
**Visible To:** Authenticated users

**Components:**
- Profile form (name, email, phone, address)
- Avatar display with "Change Avatar" button
- Phone verification badge ("Unverified" → "Verify" button disabled for now)
- Password change section
- Save changes button

**User Actions:**
- Edit profile details
- Change avatar → Open avatar selection modal
- Update shipping address
- (Future) Verify phone number

---

### `/wishlist` - User Wishlist (Protected - Logged In Users)
**Visible To:** Authenticated users

**Components:**
- Saved products grid
- Remove from wishlist button
- Add to cart button

**User Actions:**
- View saved products
- Remove items
- Add to cart
- Quick purchase flow

---

### `/orders` - Order History (Protected - Logged In Users)
**Visible To:** Authenticated users

**Components:**
- Orders table (order ID, date, total, status)
- View order details button
- Order tracking status

**User Actions:**
- View past orders
- Click order → See full details
- Track order status

---

### `/order-tracking` - Order Tracking (Protected - Logged In Users)
**Visible To:** Authenticated users

**Components:**
- Order status timeline
- Shipping updates
- Delivery estimate

**User Actions:**
- Enter order ID to track
- View real-time status updates

---

## Modal Components

### Avatar Selection Modal
**Triggers:**
- First login (if no avatar set)
- Click "Change Avatar" in profile settings

**Contains:**
- Grid of 12 preset avatars (DiceBear API)
- Click to select
- Save button
- Close button (× icon)

**User Actions:**
- Click avatar thumbnail → Highlight selection
- Click "Save" → Update profile → Close modal

---

### Cart Drawer
**Triggers:**
- Click cart icon in navigation
- Add item to cart

**Contains:**
- Cart items list (image, name, price, quantity)
- Quantity adjustment (+/-)
- Remove item button
- Cart total
- "Proceed to Checkout" button

**User Actions:**
- Adjust quantities
- Remove items
- Proceed to checkout
- Close drawer

---

## Authentication & Authorization

### Role-Based Access Control

| Page/Feature | Guest | User | Admin | Super Admin |
|--------------|-------|------|-------|-------------|
| Landing Page | ✅ | ✅ | ✅ | ✅ |
| Products | ✅ | ✅ | ✅ | ✅ |
| Product Detail | ✅ | ✅ | ✅ | ✅ |
| Add to Cart | ❌ Redirect to /auth | ✅ | ✅ | ✅ |
| Checkout | ❌ Redirect to /auth | ✅ | ✅ | ✅ |
| Dashboard | ❌ | ✅ | ❌ | ❌ |
| Profile | ❌ | ✅ | ✅ | ✅ |
| Wishlist | ❌ | ✅ | ✅ | ✅ |
| Orders | ❌ | ✅ | ✅ | ✅ |
| Admin Panel | ❌ | ❌ | ✅ | ✅ |
| Manage Products | ❌ | ❌ | ✅ | ✅ |
| Manage Orders | ❌ | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ✅ | ✅ |
| Manage Banners | ❌ | ❌ | ✅ | ✅ |
| Manage Roles | ❌ | ❌ | ❌ | ✅ |
| Manage Payment Methods | ❌ | ❌ | ❌ | ✅ |

### Authentication Flow

```
User visits protected page
    ↓
Check if authenticated (Supabase session)
    ↓
    ├─ Not Authenticated → Redirect to /auth
    ↓
    └─ Authenticated → Check role
        ↓
        ├─ Regular User → Allow access to user pages, redirect /admin to /dashboard
        ├─ Admin → Allow access to admin pages, redirect /dashboard to /admin
        └─ Super Admin → Allow access to all pages
```

---

## Payment Flow (Contact-Based Only)

```
User places order
    ↓
Order created with status: "pending_payment"
    ↓
Payment method: "Contact Payment" selected
    ↓
Instructions displayed:
  "Please contact us via WhatsApp at +92-XXX-XXXXXXX 
   or call to arrange payment. 
   Quote your order ID: #12345"
    ↓
User contacts via phone/WhatsApp
    ↓
Admin verifies payment offline
    ↓
Admin updates order status:
  "pending_payment" → "paid" → "processing" → "shipped" → "delivered"
    ↓
User sees updated status in /dashboard → Orders
```

**No payment gateway integration yet.** All payments handled manually via phone contact.

---

## Data Flow

### Product Data
```
Supabase products table
    ↓
Fetched via React Query
    ↓
Displayed on:
  - Landing page (9 latest)
  - /products page (all products)
  - /products/:id (single product)
    ↓
Admin can CRUD via /admin/products
```

### Order Data
```
User places order at /checkout
    ↓
Order stored in Supabase orders table
  - user_id
  - items (JSON)
  - total
  - shipping_address (JSON)
  - payment_method_id
  - status ("pending_payment")
    ↓
Visible in:
  - User: /dashboard → Orders tab
  - Admin: /admin/orders
    ↓
Admin updates order status
    ↓
User sees updated status in real-time (React Query refetch)
```

### Profile Data
```
User signs up
    ↓
Profile created in Supabase profiles table
  - name
  - phone (unverified)
  - avatar_url (selected from modal)
  - address (null initially)
    ↓
User updates profile at /profile
    ↓
Changes saved to Supabase
    ↓
Displayed in:
  - Navigation dropdown
  - /dashboard
  - /profile form (pre-filled)
```

### Cart Data
```
User adds product to cart
    ↓
Stored in cookies (30-day expiration)
    ↓
Persists across:
  - Browser sessions
  - Login/logout
  - Page refreshes
    ↓
Cart cleared only after:
  - Order placement
  - Manual removal by user
```

---

## Error Handling & Edge Cases

### User Not Logged In
- Redirects to /auth when accessing protected pages
- Shows "Sign In" button in navigation

### Invalid Product ID
- 404 page displayed
- "Product not found" message
- Link back to /products

### Out of Stock Product
- "Add to Cart" button disabled
- "Out of Stock" badge displayed
- No option to purchase

### Failed Order Placement
- Error toast displayed
- Form validation errors shown
- User can retry submission

### Network Errors
- Loading skeletons shown during data fetch
- Error message: "Unable to load data. Please try again."
- Retry button displayed

### Admin Unauthorized Access
- Regular user tries to access /admin → Redirected to /dashboard
- Guest tries to access /admin → Redirected to /auth

---

## Future Enhancements (Phase 2)

### Planned Features:
1. **Phone SMS Verification** - Supabase Phone Auth integration
2. **User Search History** - Track recently viewed products (6 latest on landing page)
3. **Custom Avatar Upload** - Allow users to upload their own photos
4. **Payment Gateway Integration** - Add Stripe, PayPal, or local Pakistani gateways
5. **Web Push Notifications** - Order updates, promotions
6. **Advanced Analytics** - Admin dashboard with charts, revenue tracking
7. **Product Reviews** - User ratings and reviews
8. **Discount Codes** - Promotional coupon system

---

**Document Version:** 1.0  
**Last Updated:** [Current Date]  
**Maintained By:** Development Team
