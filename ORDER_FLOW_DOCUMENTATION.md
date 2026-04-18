# Complete Order Process Flow

This document outlines the current data flow, parameters, and statuses for receiving orders in the application, along with the planned updates you requested.

## 1. Current Order Flow (Checkout Phase)

When a customer places an order, the application follows this process:

### A. Cart & Input Validation
- **Cart Data (`useCartStore/Zustand`):** Collects product details, prices, and quantities.
- **Form Validation (`shippingSchema/Zod`):** Strictly checks user input:
  - **Phone Number:** Ensures a valid Pakistani format (e.g., `03001234567` or `+923001234567`).
  - **Information:** Name, Address, City are strictly validated for length and valid characters to avoid spam.

### B. Security Checks (Anti-Fraud)
- **VPN / Proxy Blocker:** If the admin has enabled the `vpn_blocker` setting, the system verifies the user's IP. If a VPN or Proxy is detected, the checkout is automatically **blocked**.

### C. Payment Methods
- **Cash on Delivery (COD)** (Default)
- **Bank Transfer** (Requires manual verification via WhatsApp)
- **JazzCash / EasyPaisa** (Digital Wallets, if keys are provided)

### D. Database Insertion (Supabase)
The order is securely sent to the `orders` table containing the following structure:

| Parameter | Type | Description |
|-----------|------|-------------|
| `user_id` | UUID (nullable)| ID of the registered user (or NULL for guest checkout). |
| `items` | JSON Array | Array of objects tracking `{ id, name, price, quantity, image }`. |
| `total` | Number | Total price of the cart. |
| `shipping_address` | JSON | Complete details: `{ name, phone, address, city, postalCode, notes }`. |
| `whatsapp_number` | String | Pulled directly from the shipping phone field. |
| `payment_method` | String | Selected option (e.g., `cod`, `bank_transfer`). |
| `payment_status` | String | Status of the payment (see below). |
| `status` | String | Lifecycle status of the order (see below). |

### E. Order Statuses

**1. Fulfillment Status (`status`)**
- `pending`: Brand new order, awaiting action.
- `processing`: Admin is preparing or stitching the order.
- `shipped`: Order handed to the courier.
- `delivered`: Order received by customer.

**2. Payment Status (`payment_status`)**
- `pending`: Default for COD.
- `pending_payment`: Awaiting funds (for Bank Transfer/Wallets).

---

## 2. Planned Updates (Future Roadmap)

*As requested, these updates are documented here for future coding phases. No code changes have been made yet.*

### A. Product Category Tagging
To differentiate between types of orders, the following parameters/tags will be introduced to Products and Order Items:
1. **`Ready to Wear`:** Items available in stock for immediate dispatch.
2. **`Made to Order`:** Custom orders (jin ka sirf order liya jata hai, ready main nahi hote).
   - *Future Impact:* Admin will be able to filter orders by these tags. Estimated delivery days will auto-adjust based on this type.

### B. Client-First "No Return" Policy UI
During the final Checkout Step (Order Summary), an elegant, professional text element (small text size) will be implemented to transparently manage expectations while assuring the customer of support:

**Sample Professional Copy for Checkout:**
> *"Please note that we operate on a strictly No Return Policy to maintain highest standards. However, we value our clients deeply—should you require any fitting corrections or possible rework, our team is always here to assist. (Modifications/Alterations may be subject to a minimal service charge). We are always with our clients."*

**Future Implementation Steps:**
- Add an elegant small-font text block near the "Place Order" button.
- Ensure the user reads this before placing a "Made to Order" purchase.
