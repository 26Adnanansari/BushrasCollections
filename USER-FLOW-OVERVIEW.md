# User Flow Overview - Quick Reference

## Visual User Paths

```
┌─────────────────────────────────────────────────────────────┐
│                      LANDING PAGE (/)                        │
│  • Hero Slider • 9 Latest Products • Promotional Banners    │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    [Guest User]  [New User]  [Returning User]
         │             │             │
         ▼             ▼             ▼
```

---

## 1️⃣ Guest User Path

```
Landing Page
    ↓
Browse Products (/products)
    ↓
View Product Detail (/products/:id)
    ↓
Click "Add to Cart"
    ↓
❌ Redirected to /auth (Login Required)
```

**Access:** Browse only, cannot purchase

---

## 2️⃣ New User Path (First Time Signup)

```
Landing Page → Click "Sign In"
    ↓
/auth → Fill Sign Up Form
    ↓
Enter: Email, Password, Name, Phone
    ↓
Submit Registration
    ↓
✅ Avatar Selection Modal (12 Presets)
    ↓
Select Avatar → Save
    ↓
Redirect to /dashboard
    ↓
Browse → Add to Cart → /checkout
    ↓
Fill Shipping Address → Place Order
    ↓
Order Confirmation → View in Dashboard
```

**Key Moments:**
- ✅ Avatar selection on first login
- 📱 Phone marked as "Unverified"
- 🛒 Cart persists across sessions

---

## 3️⃣ Returning User Path

```
Landing Page → Click "Sign In"
    ↓
/auth → Login (Email + Password)
    ↓
Redirect to /dashboard
    ↓
View Previous Orders
    ↓
Browse Products → Add to Cart
    ↓
/checkout (Pre-filled Address)
    ↓
Place Order → View in Dashboard
```

**Benefits:**
- Pre-filled profile data
- Order history accessible
- Quick reorder flow

---

## 4️⃣ Admin User Path

```
Landing Page → Click "Sign In"
    ↓
/auth → Login (Admin Account)
    ↓
Redirect to /admin (Admin Panel)
    ↓
Dashboard Overview:
  • Total Products, Orders, Users
  • Recent Orders List
    ↓
Manage Sections:
  ├─ /admin/products (Create, Edit, Delete)
  ├─ /admin/orders (View, Update Status)
  ├─ /admin/banners (Promotional Management)
  ├─ /admin/users (View, Assign Roles)
  └─ /admin/payment-methods (Super Admin Only)
```

**Admin Actions:**
- ✅ Full CRUD on products, orders, banners
- ✅ Update order status (pending → shipped → delivered)
- ✅ Upload images to storage
- ✅ Manage user roles (Super Admin only)

---

## Role-Based Access Summary

| Feature | Guest | User | Admin | Super Admin |
|---------|-------|------|-------|-------------|
| Browse Products | ✅ | ✅ | ✅ | ✅ |
| Add to Cart | ❌ | ✅ | ✅ | ✅ |
| Checkout | ❌ | ✅ | ✅ | ✅ |
| User Dashboard | ❌ | ✅ | ❌ | ❌ |
| Admin Panel | ❌ | ❌ | ✅ | ✅ |
| Manage Products | ❌ | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ✅ | ✅ |
| Manage Roles | ❌ | ❌ | ❌ | ✅ |
| Manage Payments | ❌ | ❌ | ❌ | ✅ |

---

## Key Pages Quick Reference

| Page | Route | Access | Purpose |
|------|-------|--------|---------|
| **Landing** | `/` | Public | Browse, discover products |
| **Auth** | `/auth` | Public | Login / Sign Up |
| **Products** | `/products` | Public | Full catalog |
| **Product Detail** | `/products/:id` | Public | View single product |
| **User Dashboard** | `/dashboard` | User | Orders, profile, settings |
| **Checkout** | `/checkout` | User | Complete purchase |
| **Profile** | `/profile` | User | Edit profile, avatar |
| **Admin Panel** | `/admin` | Admin | Management dashboard |
| **Manage Products** | `/admin/products` | Admin | CRUD products |
| **Manage Orders** | `/admin/orders` | Admin | Update order status |
| **Manage Banners** | `/admin/banners` | Admin | Promotional banners |
| **Manage Users** | `/admin/users` | Admin | View, assign roles |
| **Payment Methods** | `/admin/payment-methods` | Super Admin | Configure payments |

---

## Payment Flow (Contact-Based)

```
User places order → Order status: "pending_payment"
    ↓
Payment method: "Contact Payment"
    ↓
Instructions displayed:
  "Contact us via WhatsApp at +92-XXX-XXXXXXX"
    ↓
User contacts → Admin verifies payment
    ↓
Admin updates order status:
  pending_payment → paid → processing → shipped → delivered
    ↓
User sees updated status in /dashboard
```

**Note:** No payment gateway integration. All payments handled manually.

---

## Authentication Flow

```
User visits protected page
    ↓
Check authentication (Supabase session)
    ↓
    ├─ Not Authenticated → Redirect to /auth
    ↓
    └─ Authenticated → Check role
        ↓
        ├─ Regular User → /dashboard
        ├─ Admin → /admin
        └─ Super Admin → /admin (full access)
```

---

## Quick Stats

- **3 User Types:** Guest, User, Admin/Super Admin
- **12 Public Pages:** Landing, products, auth, etc.
- **8 Protected Pages:** Dashboard, checkout, profile, admin sections
- **4 Database Tables:** products, orders, profiles, user_roles, payment_methods, promotional_banners, hero_slides
- **1 Payment Method:** Contact Payment (manual)

---

**For detailed technical documentation, see:** `APP-COMPLETE-FLOW.md`
