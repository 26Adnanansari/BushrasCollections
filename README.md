# Bushra's Collection - E-commerce Platform

## Project Overview

**Bushra's Collection** is a full-stack fashion e-commerce application built with React, TypeScript, Vite, and Supabase. This platform supports product browsing, user authentication, cart management, order placement, and comprehensive admin controls.

**Lovable Project URL**: https://lovable.dev/projects/04ff6587-da9c-4927-a56e-6c144297e032

---

## Features

### Customer Features
- 🛍️ Browse products with category filtering
- 🔐 User authentication (email/password + Google OAuth)
- 🎨 Avatar selection system (12 preset options)
- 🛒 Persistent cart system (cookie-based)
- 📦 Order placement and tracking
- 👤 User dashboard with order history
- 📱 Phone number collection (verification coming soon)
- 💳 Contact-based payment system

### Admin Features
- 📊 Admin dashboard with analytics
- 📦 Product management (full CRUD)
- 🛒 Order management and status updates
- 👥 User management
- 🎯 Promotional banner management
- 💰 Payment method configuration (Super Admin)
- 👨‍💼 Role-based access control (User, Admin, Super Admin)
- 💾 **Form auto-save system** - Never lose form data on refresh/navigate

### Technical Features
- ⚡ Lightning-fast Vite development
- 🎨 Beautiful UI with Tailwind CSS + shadcn/ui
- 🔒 Secure authentication with Supabase Auth
- 💾 PostgreSQL database with Row Level Security (RLS)
- 📤 Image upload to Supabase Storage
- ✅ Form validation with Zod + React Hook Form
- 🔄 State management with Zustand + React Query
- 📱 Fully responsive design

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **UI:** Tailwind CSS, shadcn/ui components
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **State:** Zustand, @tanstack/react-query
- **Forms:** React Hook Form, Zod validation
- **Routing:** React Router v6

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm installed
- Supabase account (or use Lovable Cloud)
- Git installed

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

Visit `http://localhost:5173` to view the app.

---

## Database Setup

### Option 1: Quick Setup (Single Migration)
See **[QUICK-START.md](./QUICK-START.md)** for fastest setup using the consolidated migration file.

### Option 2: Automated Setup Script
```bash
npm run setup
```

### Option 3: Manual Setup
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `SINGLE_INIT.sql`
3. Paste and run the migration

**Make yourself admin:**
```sql
-- Find your user ID after signing up
SELECT id, email FROM auth.users;

-- Add admin role (replace YOUR_USER_ID)
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'admin');
```

See **[SETUP-GUIDE.md](./SETUP-GUIDE.md)** for detailed instructions.

---

## Deployment

### Testing Phase: Deploy to Vercel (Free)
Perfect for 1-2 months of testing before moving to production.

📖 **[DEPLOYMENT-VERCEL.md](./DEPLOYMENT-VERCEL.md)** - Quick Vercel deployment guide

### Production: Deploy to PKDomain (Shared Hosting)
Best for long-term hosting with lower costs and better latency for Pakistani audience.

📖 **[DEPLOYMENT-PKDOMAIN.md](./DEPLOYMENT-PKDOMAIN.md)** - Full PKDomain deployment guide

---

## Documentation

| Document | Description |
|----------|-------------|
| **[QUICK-START.md](./QUICK-START.md)** | Fast setup in 3 commands |
| **[SETUP-GUIDE.md](./SETUP-GUIDE.md)** | Detailed setup instructions |
| **[ADMIN-GUIDE.md](./ADMIN-GUIDE.md)** | Complete admin panel guide with auto-save system |
| **[USER-FLOW.md](./USER-FLOW.md)** | Complete user journey documentation |
| **[DEPLOYMENT-VERCEL.md](./DEPLOYMENT-VERCEL.md)** | Deploy to Vercel for testing |
| **[DEPLOYMENT-PKDOMAIN.md](./DEPLOYMENT-PKDOMAIN.md)** | Deploy to PKDomain for production |
| **[PHONE-VERIFICATION-SETUP.md](./PHONE-VERIFICATION-SETUP.md)** | Enable SMS verification (Phase 2) |
| **[BACKUP-GUIDE.md](./BACKUP-GUIDE.md)** | Automated backup strategies |
| **[AUTO-SETUP-CHECKLIST.md](./AUTO-SETUP-CHECKLIST.md)** | Step-by-step setup checklist |

---

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/04ff6587-da9c-4927-a56e-6c144297e032) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/04ff6587-da9c-4927-a56e-6c144297e032) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
