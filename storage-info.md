# Storage & Cookie Information for Bushra's Collection

This document explains how our application stores information on your device to ensure a smooth, secure, and persistent experience.

## 🍪 Storage Mechanisms

We primarily use **Local Storage** instead of traditional cookies for better performance and security in modern web apps.

| Key Name | Purpose | Duration |
| :--- | :--- | :--- |
| `sb-*-auth-token` | **Supabase Auth**: Keeps you logged in even after you close your browser. | Persistent until Logout |
| `auth-storage` | **Auth Persistence**: Stores basic profile info (roles, name) so the UI doesn't "flicker" on reload. | Persistent |
| `form-draft-*` | **Draft Recovery**: Saves your unsaved work in the Admin Panel (e.g., while editing a product). | Temporary until Save/Clear |
| `cart-storage` | **Shopping Cart**: Keeps your selected items in the cart between visits. | Persistent |
| `wishlist-storage` | **Wishlist**: Remembers items you've liked. | Persistent |

## 🚀 Best Practices for this App

### For Admins
- **Draft Recovery**: If your browser crashes or you accidentally close a tab while editing a product, don't worry! We save your work every few seconds to `form-draft`. When you reopen the editor, you'll see a "Draft saved" indicator.
- **Session Security**: Always click "Logout" if you are on a shared computer to clear your Auth Token.

### For Developers
- **Syncing Data**: Never use `localStorage` for sensitive data or data that must be synced across devices (like Order History). Use Supabase Database for that.
- **UI State**: Use `localStorage` for purely UI-related preferences like "Dark Mode" or "Recently Viewed".

## 🕵️ Future: Online User Tracking
We are implementing **Supabase Presence**. This will allow Admins to see how many people are browsing the store in real-time without storing invasive cookies.
