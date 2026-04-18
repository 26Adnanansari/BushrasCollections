# 🚀 Project TODO List & Upcoming Features

## 👗 5-Point Custom Order Flow (Upcoming)
- [x] **1. Product Upload Update (Backend):** Add "Inventory Type" (Ready to Wear vs Made to Order) dropdown & "Advance %" setup fields.
- [ ] **2. Checkout Phase Logic:** Auto-detect custom products, show Advance Payment required message, and display "Pay Now (Advance)" and "Remaining Balance" breakdown.
- [ ] **3. Payment & WhatsApp Bridge:** Show Bank/EasyPaisa details after order placement and "Chat with Designer" smart link to send order ID & screenshot directly to WhatsApp.
- [ ] **4. Admin Order Lifecycle:** Add and track precise statuses: `Pending Advance`, `Confirmed / In-Production`, `Ready for Dispatch`, `Completed`.
- [x] **5. Database Schema Update (SQL):** Run an SQL migration to add `is_custom` (boolean) and `advance_required` (numeric) columns to the `products` table in Supabase.


## 📊 Google & Facebook/Meta Ecosystem (Maximize ROI)
- [ ] **Advanced Pixel Events:** Setup custom events for WhatsApp chat initiation and Add to Wishlist.
- [ ] **Google Analytics 4 (GA4):** Integrate GA4 via free tag management for deeper user demographics.
- [x] **Google Merchant Center:** Setup dynamic product feed for free Google Shopping listings (Done via High-Level Auto SEO JSON-LD).
- [ ] **Social Retargeting:** Build the admin interface to view basic pixel firing statistics.

## 🌍 Personalization & User Experience
- [x] **Auto-Language & Currency (Must Do):** Automatically detect user IP country and convert USD/EUR/AED prices.
- [ ] **Location-Specific Content:** Show specific banners/notifications (e.g., "Free Delivery in Karachi" or "Fast Shipping to UK").
- [x] **Admin UI:** Create a dashboard module so the admin can turn Auto-Currency ON/OFF easily.

## 🔒 Fraud Prevention & Security
- [x] **VPN/Proxy Detection:** Reject or flag high-risk checkout attempts using VPNs.
- [ ] **Login Protection:** Prevent brute-force logins and show a log of suspicious activities in the admin panel.
- [ ] **Admin UI:** Security tab in settings to view "Blocked IPs" or "Suspicious Orders."

## 📈 Analytics & Marketing
- [ ] **Timezone Sync:** Adjust dates in the backend so international customers see delivery times in their own timezone.
- [ ] **User Demographics:** Create charts on the admin dashboard showing from which countries visitors are purchasing.

## 📝 Regulatory Compliance
- [ ] **GDPR/Cookie Banner:** Free cookie consent banner for European users to stay compliant.

> **Implementation Note:** All upcoming features will prioritize Free / Open-Source API solutions to avoid monthly costs. UI modules will be placed in the Admin Dashboard first so the functionality is accessible and visible.
