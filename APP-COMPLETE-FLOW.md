# Complete Application Flow - Technical Documentation

## Table of Contents

1. [User Types & Permissions](#user-types--permissions)
2. [Complete User Journeys](#complete-user-journeys)
3. [Page-by-Page Breakdown](#page-by-page-breakdown)
4. [Component Architecture](#component-architecture)
5. [Database Schema & Interactions](#database-schema--interactions)
6. [Authentication & Authorization](#authentication--authorization)
7. [Payment Processing](#payment-processing)
8. [Data Flow & State Management](#data-flow--state-management)
9. [Error Handling & Edge Cases](#error-handling--edge-cases)
10. [Future Enhancements](#future-enhancements)

---

## User Types & Permissions

### 1. Guest User (Not Logged In)
**Capabilities:**
- Browse products on landing page and `/products`
- View product details at `/products/:id`
- View promotional banners and hero slider

**Restrictions:**
- ❌ Cannot add items to cart
- ❌ Cannot checkout
- ❌ Cannot view order history
- ❌ Redirected to `/auth` when attempting protected actions

**Technical Details:**
- No Supabase session exists
- Cookie-based cart is empty/inaccessible
- RLS policies prevent data access
- Frontend `ProtectedRoute` component blocks access

---

### 2. New User (First Time Registration)

**Signup Process:**
1. Navigate to `/auth` page
2. Fill signup form:
   - Email (validated via Zod schema)
   - Password (min 6 characters)
   - Name (required)
   - Phone number (validated with regex)
3. Submit registration
4. **Backend Actions:**
   - Supabase creates auth user
   - Profile created in `profiles` table
   - Default `user` role assigned in `user_roles` table
   - `phone_verified` set to `false`
5. **Frontend Actions:**
   - Avatar selection modal automatically opens
   - 12 preset avatars displayed (DiceBear API)
   - User selects avatar → saves to `profiles.avatar_url`
6. Redirect to `/dashboard`

**Database Schema:**
```sql
-- profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT false,
  avatar_url TEXT,
  address JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- user_roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  role app_role DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**State Management:**
- `useAuthStore` (Zustand) tracks user session
- `@tanstack/react-query` caches profile data
- Cookie-based cart persists across sessions

---

### 3. Returning User (Regular Customer)

**Login Flow:**
1. Navigate to `/auth` → Click "Sign In" tab
2. Enter email + password
3. Supabase validates credentials
4. **On Success:**
   - Session token stored in localStorage
   - `useAuthStore` fetches user + roles via `getUserWithRoles()`
   - Redirect logic:
     - Regular user → `/dashboard`
     - Admin/Super Admin → `/admin`
5. **Profile Data Loaded:**
   - Name, email, phone, avatar fetched from `profiles`
   - Order history fetched from `orders` table
   - Cart restored from cookies

**Technical Implementation:**
```typescript
// src/lib/auth.ts
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  
  const userWithRoles = await getUserWithRoles(data.user);
  
  // Redirect based on role
  if (userWithRoles.roles.includes('admin') || userWithRoles.roles.includes('super_admin')) {
    return '/admin';
  }
  return '/dashboard';
};
```

---

### 4. Admin User

**Access Level:**
- Full CRUD on products, orders, promotional banners
- View all users
- Update order status
- Upload images to Supabase storage

**Restricted:**
- ❌ Cannot assign user roles (Super Admin only)
- ❌ Cannot manage payment methods (Super Admin only)

**Admin Panel Sections:**
- `/admin` - Dashboard overview (stats, recent orders)
- `/admin/products` - Product management
- `/admin/orders` - Order management
- `/admin/banners` - Promotional banner management
- `/admin/users` - User list (view only)

**RLS Policies:**
```sql
-- Products table
CREATE POLICY "Admins can manage products"
ON products FOR ALL
USING (is_admin(auth.uid()));

-- Orders table
CREATE POLICY "Admins can view all orders"
ON orders FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update orders"
ON orders FOR UPDATE
USING (is_admin(auth.uid()));
```

---

### 5. Super Admin User

**Additional Capabilities:**
- ✅ Assign/revoke user roles (admin, moderator, user)
- ✅ Manage payment methods (create, edit, delete)
- ✅ Access `/admin/payment-methods` page
- ✅ View and modify system configuration

**Role Assignment Workflow:**
1. Navigate to `/admin/users`
2. Select user from table
3. Click "Change Role" dropdown
4. Select new role (user, admin, super_admin, moderator)
5. Confirm action
6. **Backend:**
   - Update `user_roles` table
   - RLS policy checks `is_super_admin(auth.uid())`
   - Audit log created (future enhancement)

---

## Complete User Journeys

### Journey 1: Guest Browsing

**Route:** `/` → `/products/:id` → `/auth`

**Step-by-Step:**

1. **Landing on Homepage (`/`)**
   - Hero slider displays active slides from `hero_slides` table
   - Query: `SELECT * FROM hero_slides WHERE is_active = true ORDER BY order_index`
   - 9 latest products displayed via `LatestProducts` component
   - Query: `SELECT * FROM products ORDER BY created_at DESC LIMIT 9`
   - Promotional banners carousel shows active banners
   - Query: `SELECT * FROM promotional_banners WHERE is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()) ORDER BY display_order`

2. **Browsing Products**
   - Click "Shop Now" or navigate to `/products`
   - Product grid displays all products
   - Query: `SELECT * FROM products WHERE stock > 0`
   - Category filter available (optional)
   - Search functionality (optional)

3. **Viewing Product Detail (`/products/:id`)**
   - Large product image, name, price, description displayed
   - Stock availability shown
   - "Add to Cart" button visible

4. **Attempting Checkout**
   - Click "Add to Cart"
   - `ProtectedRoute` middleware checks authentication
   - User not authenticated → Redirect to `/auth`
   - Toast notification: "Please sign in to add items to cart"

**Frontend Components:**
- `Hero.tsx` - Hero slider with navigation
- `LatestProducts.tsx` - Product card grid
- `PromotionalBanners.tsx` - Carousel component
- `ProductCard.tsx` - Individual product display
- `ProtectedRoute.tsx` - Authentication guard

**State Management:**
- No user state (guest)
- Product data cached via React Query
- Cart state empty

---

### Journey 2: New User Registration & First Order

**Route:** `/` → `/auth` → Avatar Modal → `/dashboard` → `/products/:id` → `/checkout` → `/dashboard`

**Detailed Flow:**

#### **Step 1: Registration (`/auth`)**

**Frontend (`src/pages/Auth.tsx`):**
```typescript
const handleSignUp = async (values: SignUpFormData) => {
  try {
    const { name, email, password, phone } = values;
    
    // Call auth service
    await signUp(email, password, name, phone);
    
    // Avatar modal opens automatically
    // Redirect handled by auth store
  } catch (error) {
    toast.error("Registration failed");
  }
};
```

**Backend (`src/lib/auth.ts`):**
```typescript
export const signUp = async (
  email: string,
  password: string,
  name: string,
  phone: string
) => {
  // Create auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  
  // Create profile
  await supabase.from('profiles').insert({
    id: data.user.id,
    name,
    phone,
    phone_verified: false,
  });
  
  // Assign default 'user' role
  await supabase.from('user_roles').insert({
    user_id: data.user.id,
    role: 'user',
  });
  
  return data;
};
```

**Database Actions:**
1. `auth.users` table - New user created
2. `profiles` table - Profile record inserted
3. `user_roles` table - Default role assigned

---

#### **Step 2: Avatar Selection**

**Component (`src/components/AvatarSelectionModal.tsx`):**
```typescript
const AvatarSelectionModal = ({ isOpen, onClose, userId }) => {
  const avatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
    // ... 12 total avatars
  ];
  
  const handleSelectAvatar = async (avatarUrl: string) => {
    await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);
    
    onClose();
    navigate('/dashboard');
  };
  
  return (
    <Dialog open={isOpen}>
      <div className="grid grid-cols-4 gap-4">
        {avatars.map((url) => (
          <img
            key={url}
            src={url}
            onClick={() => handleSelectAvatar(url)}
            className="cursor-pointer hover:scale-110"
          />
        ))}
      </div>
    </Dialog>
  );
};
```

**Database Update:**
```sql
UPDATE profiles
SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=3'
WHERE id = 'user-uuid-here';
```

---

#### **Step 3: User Dashboard (`/dashboard`)**

**Page (`src/pages/Dashboard.tsx`):**
```typescript
const Dashboard = () => {
  const { user } = useAuthStore();
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      return data;
    },
  });
  
  const { data: orders } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      return data;
    },
  });
  
  return (
    <div>
      {/* Profile summary */}
      <Card>
        <Avatar src={profile?.avatar_url} />
        <h2>{profile?.name}</h2>
        <p>{profile?.email}</p>
        <Badge>{profile?.phone_verified ? 'Verified' : 'Unverified'}</Badge>
      </Card>
      
      {/* Order history */}
      <Table>
        {orders?.map((order) => (
          <TableRow key={order.id}>
            <TableCell>#{order.id.slice(0, 8)}</TableCell>
            <TableCell>${order.total}</TableCell>
            <TableCell>{order.status}</TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
};
```

**Queries Executed:**
1. `SELECT * FROM profiles WHERE id = 'user-id'`
2. `SELECT * FROM orders WHERE user_id = 'user-id' ORDER BY created_at DESC`

---

#### **Step 4: Adding to Cart**

**Cart Store (`src/store/cart.ts`):**
```typescript
import Cookies from 'js-cookie';

export const useCartStore = create((set) => ({
  items: [],
  
  addItem: (product) => {
    set((state) => {
      const newItems = [...state.items, product];
      Cookies.set('cart', JSON.stringify(newItems), { expires: 30 });
      return { items: newItems };
    });
  },
  
  loadCart: () => {
    const cartData = Cookies.get('cart');
    if (cartData) {
      set({ items: JSON.parse(cartData) });
    }
  },
}));
```

**Cookie Structure:**
```json
{
  "cart": [
    {
      "id": "product-uuid",
      "name": "Product Name",
      "price": 49.99,
      "quantity": 2,
      "image_url": "https://..."
    }
  ]
}
```

**Expiration:** 30 days from last update

---

#### **Step 5: Checkout (`/checkout`)**

**Page (`src/pages/Checkout.tsx`):**
```typescript
const Checkout = () => {
  const { items, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { data: profile } = useQuery(['profile', user?.id]);
  
  const handlePlaceOrder = async (values: CheckoutFormData) => {
    const orderData = {
      user_id: user.id,
      items: items,
      total: calculateTotal(items),
      shipping_address: {
        street: values.street,
        city: values.city,
        postal_code: values.postal_code,
        country: values.country,
      },
      payment_method_id: values.payment_method_id,
      status: 'pending_payment',
      payment_status: 'pending_payment',
    };
    
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();
    
    if (!error) {
      clearCart();
      toast.success('Order placed successfully!');
      navigate('/dashboard');
    }
  };
  
  return (
    <Form onSubmit={handlePlaceOrder}>
      {/* Shipping address form (pre-filled from profile) */}
      <Input
        name="street"
        defaultValue={profile?.address?.street}
      />
      
      {/* Payment method selection */}
      <Select name="payment_method_id">
        <option value="contact-payment-uuid">Contact Payment</option>
      </Select>
      
      <Button type="submit">Place Order</Button>
    </Form>
  );
};
```

**Database Insert:**
```sql
INSERT INTO orders (
  user_id,
  items,
  total,
  shipping_address,
  payment_method_id,
  status,
  payment_status
) VALUES (
  'user-uuid',
  '[{"id": "product-uuid", "quantity": 2, ...}]'::jsonb,
  99.98,
  '{"street": "123 Main St", "city": "Karachi", ...}'::jsonb,
  'payment-method-uuid',
  'pending_payment',
  'pending_payment'
);
```

**Cart Cleared:**
```typescript
Cookies.remove('cart');
```

---

#### **Step 6: Order Confirmation**

**User sees:**
- Order ID (e.g., `#a1b2c3d4`)
- Total amount
- Payment instructions: "Contact us via WhatsApp at +92-XXX-XXXXXXX to arrange payment. Quote order ID: #a1b2c3d4"
- Order status: "Pending Payment"

**Order appears in `/dashboard` → Orders tab**

---

### Journey 3: Returning User Login & Purchase

**Route:** `/` → `/auth` → `/dashboard` → `/products` → `/checkout` → `/dashboard`

**Key Differences from New User:**
- No avatar selection (already set)
- Profile data pre-filled in checkout form
- Order history visible immediately
- Faster checkout flow (fewer steps)

**Technical Optimizations:**
- React Query cache reused from previous session (if not expired)
- Cookie-based cart persists across login/logout
- Supabase session token refreshed automatically

---

### Journey 4: Admin Management Workflow

**Route:** `/` → `/auth` → `/admin` → `/admin/products` → `/admin/orders` → `/admin/banners` → `/admin/users`

#### **Admin Dashboard (`/admin`)**

**Component (`src/pages/admin/Dashboard.tsx`):**
```typescript
const AdminDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [products, orders, users] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ]);
      
      return {
        totalProducts: products.count,
        totalOrders: orders.count,
        totalUsers: users.count,
      };
    },
  });
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatsCard title="Total Products" value={stats?.totalProducts} />
      <StatsCard title="Total Orders" value={stats?.totalOrders} />
      <StatsCard title="Total Users" value={stats?.totalUsers} />
    </div>
  );
};
```

---

#### **Product Management (`/admin/products`)**

**CRUD Operations:**

**1. Create Product:**
```typescript
const handleCreateProduct = async (values: ProductFormData) => {
  // Upload image to Supabase storage
  const { data: imageData } = await supabase.storage
    .from('products')
    .upload(`${Date.now()}-${values.image.name}`, values.image);
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('products')
    .getPublicUrl(imageData.path);
  
  // Insert product
  await supabase.from('products').insert({
    name: values.name,
    price: values.price,
    stock: values.stock,
    category: values.category,
    description: values.description,
    image_url: urlData.publicUrl,
  });
};
```

**2. Edit Product:**
```typescript
const handleEditProduct = async (productId: string, values: ProductFormData) => {
  await supabase
    .from('products')
    .update({
      name: values.name,
      price: values.price,
      stock: values.stock,
      category: values.category,
      description: values.description,
    })
    .eq('id', productId);
};
```

**3. Delete Product:**
```typescript
const handleDeleteProduct = async (productId: string) => {
  await supabase
    .from('products')
    .delete()
    .eq('id', productId);
};
```

**RLS Policies Applied:**
- Only users with `is_admin(auth.uid())` can execute these operations
- Regular users blocked by database-level security

---

#### **Order Management (`/admin/orders`)**

**Update Order Status:**
```typescript
const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
  await supabase
    .from('orders')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);
  
  // Optionally send notification to user
  // (Future enhancement: email/SMS notification)
};
```

**Status Transitions:**
- `pending_payment` → Admin verifies payment → `paid`
- `paid` → Admin prepares order → `processing`
- `processing` → Admin ships order → `shipped`
- `shipped` → Delivery confirmed → `delivered`

---

#### **Banner Management (`/admin/banners`)**

**Create Banner:**
```typescript
const handleCreateBanner = async (values: BannerFormData) => {
  // Upload banner image
  const { data: imageData } = await supabase.storage
    .from('banners')
    .upload(`${Date.now()}-${values.image.name}`, values.image);
  
  const { data: urlData } = supabase.storage
    .from('banners')
    .getPublicUrl(imageData.path);
  
  // Insert banner
  await supabase.from('promotional_banners').insert({
    title: values.title,
    description: values.description,
    image_url: urlData.publicUrl,
    cta_text: values.cta_text,
    cta_link: values.cta_link,
    is_active: values.is_active,
    start_date: values.start_date,
    end_date: values.end_date,
    display_order: values.display_order,
  });
};
```

**Banner Display Logic:**
```sql
SELECT * FROM promotional_banners
WHERE is_active = true
  AND (start_date IS NULL OR start_date <= now())
  AND (end_date IS NULL OR end_date >= now())
ORDER BY display_order ASC;
```

---

## Database Schema & Interactions

### Tables Overview

#### **1. `profiles` Table**

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY, -- References auth.users(id)
  name TEXT,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT false,
  avatar_url TEXT,
  address JSONB, -- {street, city, postal_code, country}
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policies:**
- Users can view their own profile: `auth.uid() = id`
- Users can update their own profile: `auth.uid() = id`
- Admins can view all profiles: `is_admin(auth.uid())`

---

#### **2. `products` Table**

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  stock INTEGER DEFAULT 0,
  category TEXT,
  description TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policies:**
- Anyone can view products: `true`
- Admins can manage products: `is_admin(auth.uid())`

---

#### **3. `orders` Table**

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- No foreign key to auth.users
  items JSONB NOT NULL, -- [{id, name, price, quantity, image_url}]
  total NUMERIC NOT NULL,
  shipping_address JSONB, -- {street, city, postal_code, country}
  payment_method_id UUID REFERENCES payment_methods(id),
  status TEXT DEFAULT 'pending_payment',
  payment_status TEXT DEFAULT 'pending_payment',
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policies:**
- Users can view their own orders: `auth.uid() = user_id`
- Users can create their own orders: `auth.uid() = user_id`
- Admins can view all orders: `is_admin(auth.uid())`
- Admins can update orders: `is_admin(auth.uid())`

---

#### **4. `user_roles` Table**

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enum for roles
CREATE TYPE app_role AS ENUM ('user', 'admin', 'super_admin', 'moderator');
```

**RLS Policies:**
- Users can view their own roles: `auth.uid() = user_id`
- Admins can view all roles: `is_admin(auth.uid())`
- Super admins can manage roles: `is_super_admin(auth.uid())`

---

#### **5. `payment_methods` Table**

```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type payment_method_type DEFAULT 'manual',
  logo_url TEXT,
  instructions TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enum for payment method types
CREATE TYPE payment_method_type AS ENUM ('manual', 'gateway', 'offline');
```

**RLS Policies:**
- Anyone can view active payment methods: `is_active = true`
- Admins can view all payment methods: `is_admin(auth.uid())`
- Admins can manage payment methods: `is_admin(auth.uid())`

---

#### **6. `promotional_banners` Table**

```sql
CREATE TABLE promotional_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  cta_text TEXT,
  cta_link TEXT,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policies:**
- Anyone can view active banners with date range validation
- Admins can manage all banners: `is_admin(auth.uid())`

---

#### **7. `hero_slides` Table**

```sql
CREATE TABLE hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  cta_text TEXT,
  cta_link TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policies:**
- Anyone can view active hero slides: `is_active = true`
- Admins can manage hero slides: `is_admin(auth.uid())`

---

### Database Functions

#### **1. `is_admin(user_id UUID)`**

```sql
CREATE OR REPLACE FUNCTION is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'super_admin')
  );
END;
$$;
```

**Usage in RLS Policies:**
```sql
CREATE POLICY "Admins can manage products"
ON products FOR ALL
USING (is_admin(auth.uid()));
```

---

#### **2. `is_super_admin(user_id UUID)`**

```sql
CREATE OR REPLACE FUNCTION is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'
  );
END;
$$;
```

---

## Authentication & Authorization

### Supabase Auth Flow

**1. Sign Up:**
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword123',
});
```

**Backend Actions:**
- User created in `auth.users` table
- Session token generated
- Email confirmation sent (if auto-confirm disabled)

---

**2. Sign In:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword123',
});
```

**Backend Actions:**
- Credentials validated
- Session token issued
- Stored in `localStorage` (key: `supabase.auth.token`)

---

**3. Session Management:**
```typescript
// Get current session
const { data: { session } } = await supabase.auth.getSession();

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // User logged in
  }
  if (event === 'SIGNED_OUT') {
    // User logged out
  }
});
```

---

**4. Password Reset:**
```typescript
// Request password reset
await supabase.auth.resetPasswordForEmail('user@example.com', {
  redirectTo: 'https://yourdomain.com/reset-password',
});

// Update password with token
await supabase.auth.updateUser({
  password: 'newpassword123',
});
```

---

### Role-Based Authorization

**Frontend Route Protection:**
```typescript
// src/components/ProtectedRoute.tsx
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, roles } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  if (requiredRole && !roles.includes(requiredRole)) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

// Usage in App.tsx
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
```

---

**Backend RLS Enforcement:**
```sql
-- Example: Only admins can update products
CREATE POLICY "Admins can update products"
ON products FOR UPDATE
USING (is_admin(auth.uid()));
```

**Security Guarantees:**
- Even if frontend is bypassed, RLS policies enforce security at database level
- All queries must pass RLS checks before execution
- Unauthenticated users blocked by `auth.uid()` returning NULL

---

## Payment Processing

### Contact-Based Payment Flow

**Current Implementation:**
- No payment gateway integration
- All payments handled manually via phone/WhatsApp
- Orders created with status: `pending_payment`

**User Workflow:**
1. User places order at `/checkout`
2. Order stored in database with:
   - `payment_method_id`: Contact Payment UUID
   - `payment_status`: `pending_payment`
   - `status`: `pending_payment`
3. User sees instructions:
   > "Please contact us via WhatsApp at +92-XXX-XXXXXXX or call to arrange payment. Quote your order ID: #a1b2c3d4"
4. User contacts via WhatsApp/phone
5. Admin verifies payment offline
6. Admin updates order status:
   - `pending_payment` → `paid` → `processing` → `shipped` → `delivered`
7. User sees updated status in `/dashboard` → Orders tab

---

**Future Gateway Integration (Phase 2):**
- Stripe or PayPal integration
- JazzCash / EasyPaisa (Pakistani payment gateways)
- Payment processing handled by Supabase Edge Functions
- Webhook handling for payment confirmation

---

## Data Flow & State Management

### Frontend State Architecture

**1. Authentication State (Zustand)**
```typescript
// src/store/auth.ts
export const useAuthStore = create((set) => ({
  user: null,
  roles: [],
  isLoading: true,
  
  setUser: (user, roles) => set({ user, roles, isLoading: false }),
  clearAuth: () => set({ user: null, roles: [], isLoading: false }),
}));
```

---

**2. Cart State (Zustand + Cookies)**
```typescript
// src/store/cart.ts
export const useCartStore = create((set) => ({
  items: [],
  
  addItem: (product) => {
    set((state) => {
      const newItems = [...state.items, product];
      Cookies.set('cart', JSON.stringify(newItems), { expires: 30 });
      return { items: newItems };
    });
  },
  
  removeItem: (productId) => {
    set((state) => {
      const newItems = state.items.filter((item) => item.id !== productId);
      Cookies.set('cart', JSON.stringify(newItems), { expires: 30 });
      return { items: newItems };
    });
  },
  
  clearCart: () => {
    Cookies.remove('cart');
    set({ items: [] });
  },
}));
```

---

**3. Server State (React Query)**
```typescript
// Example: Fetch products
const { data: products, isLoading, error } = useQuery({
  queryKey: ['products'],
  queryFn: async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    return data;
  },
  staleTime: 5 * 60 * 1000, // 5 minutes cache
});
```

**Benefits:**
- Automatic caching
- Background refetching
- Optimistic updates
- Error retry logic

---

## Error Handling & Edge Cases

### 1. User Not Logged In
**Scenario:** Guest tries to access `/dashboard`

**Response:**
- `ProtectedRoute` component detects no session
- Redirect to `/auth`
- Toast notification: "Please sign in to continue"

---

### 2. Invalid Product ID
**Scenario:** User navigates to `/products/invalid-uuid`

**Response:**
- Query returns null
- Show 404 page
- Message: "Product not found"
- Link back to `/products`

---

### 3. Out of Stock Product
**Scenario:** Product stock = 0

**Response:**
- "Add to Cart" button disabled
- Badge: "Out of Stock"
- No purchase option
- Admin can update stock in `/admin/products`

---

### 4. Failed Order Placement
**Scenario:** Network error during checkout

**Response:**
- Try-catch block catches error
- Toast error: "Unable to place order. Please try again."
- Form validation errors shown inline
- User can retry submission

---

### 5. Network Errors
**Scenario:** Supabase API unreachable

**Response:**
- React Query shows loading skeleton
- Error message: "Unable to load data. Please try again."
- Retry button displayed
- Background refetch on network recovery

---

### 6. Admin Unauthorized Access
**Scenario:** Regular user tries to access `/admin`

**Response:**
- `ProtectedRoute` checks roles
- User lacks `admin` or `super_admin` role
- Redirect to `/dashboard`
- Toast notification: "You don't have permission to access this page"

---

### 7. Session Expiration
**Scenario:** User session expires after 7 days (Supabase default)

**Response:**
- Supabase client detects expired token
- `onAuthStateChange` fires with `SIGNED_OUT` event
- User redirected to `/auth`
- Toast: "Your session has expired. Please sign in again."

---

## Future Enhancements (Phase 2)

### Planned Features:

**1. Phone SMS Verification**
- Supabase Phone Auth integration
- SMS sent on signup
- Verify button in profile
- Badge: "Verified" shown after confirmation

**2. User Search History**
- Track recently viewed products (6 latest)
- Display on landing page
- Stored in `user_search_history` table
- Quick re-access to frequently browsed items

**3. Custom Avatar Upload**
- Allow users to upload their own photos
- Supabase storage integration
- Image compression (max 500KB)
- Fallback to preset avatars

**4. Payment Gateway Integration**
- Stripe / PayPal
- JazzCash / EasyPaisa (Pakistani gateways)
- Webhook handling via Edge Functions
- Automatic order status updates

**5. Web Push Notifications**
- Order status updates
- Promotional announcements
- Browser notification API
- Firebase Cloud Messaging (FCM)

**6. Advanced Analytics**
- Admin dashboard charts (revenue, orders over time)
- Top-selling products
- User registration trends
- Recharts library integration

**7. Product Reviews**
- User ratings (1-5 stars)
- Written reviews
- Moderation by admin
- Display average rating on product cards

**8. Discount Codes**
- Promotional coupon system
- Percentage or fixed amount discounts
- Expiration dates
- Usage limit tracking

---

## Technical Stack Summary

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- shadcn/ui (component library)
- Zustand (client state management)
- React Query (server state caching)
- React Hook Form + Zod (form validation)
- React Router (routing)
- Lucide React (icons)
- Sonner (toast notifications)

**Backend:**
- Supabase (PostgreSQL database)
- Supabase Auth (authentication)
- Supabase Storage (file uploads)
- Row-Level Security (RLS policies)
- Database functions (security definer)

**Deployment:**
- Phase 1: Vercel (free tier)
- Phase 2: PKDomain shared hosting

**Monitoring & Analytics:**
- Supabase Dashboard (database queries, storage usage)
- Future: Google Analytics / Mixpanel

---

## Deployment Checklist

**Pre-Deployment:**
- ✅ Remove all demo/dummy data from `SINGLE_INIT.sql`
- ✅ Verify all RLS policies are enabled
- ✅ Test authentication flow (signup, login, logout)
- ✅ Test cart persistence across sessions
- ✅ Test order placement and status updates
- ✅ Test admin CRUD operations
- ✅ Test role-based access control
- ✅ Configure Supabase production environment variables
- ✅ Set up custom domain (optional)
- ✅ Enable auto-confirm emails in Supabase dashboard

**Post-Deployment:**
- Monitor error logs in Supabase dashboard
- Test all user flows in production
- Gather user feedback
- Plan Phase 2 enhancements

---

**For quick reference guide, see:** `USER-FLOW-OVERVIEW.md`

---

**Document Version:** 1.0  
**Last Updated:** [Current Date]  
**Maintained By:** Development Team
