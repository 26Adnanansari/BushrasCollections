# Vercel Deployment Guide (Testing Phase)

## Quick Deploy to Vercel

### Prerequisites
- GitHub account connected to your Lovable project
- Vercel account (free tier works)
- Supabase credentials ready

---

## Step 1: Push to GitHub

Your Lovable project should already be connected to GitHub. If not:
1. Click GitHub button in Lovable editor
2. Authorize and create repository
3. Code automatically syncs

---

## Step 2: Deploy to Vercel

### Option A: Import from GitHub
1. Visit [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your project repository
4. Click "Import"

### Option B: Deploy Button
1. Add this to your repository README:
   ```markdown
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL)
   ```

---

## Step 3: Configure Environment Variables

In Vercel dashboard, add these variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

**Where to find these:**
- Open Lovable → Click "View Backend" button
- Or check your `.env` file locally

---

## Step 4: Deploy Settings

Vercel should auto-detect settings, but verify:

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```
dist
```

**Install Command:**
```bash
npm install
```

**Framework:** Vite

---

## Step 5: Update Supabase Auth URLs

1. Open Lovable → Click "View Backend"
2. Navigate to Authentication → URL Configuration
3. Add your Vercel URL to **Redirect URLs**:
   ```
   https://your-app.vercel.app/**
   https://your-app.vercel.app/auth/callback
   ```
4. Update **Site URL**:
   ```
   https://your-app.vercel.app
   ```

---

## Step 6: Test Deployment

1. Visit your Vercel URL
2. Test critical flows:
   - ✅ Homepage loads with 9 latest products
   - ✅ Sign up new user
   - ✅ Avatar selection modal appears
   - ✅ User redirects to /dashboard
   - ✅ Admin redirects to /admin
   - ✅ Add to cart works
   - ✅ Order placement works

---

## Continuous Deployment

**Automatic:**
- Push to GitHub main branch → Vercel auto-deploys
- Preview deployments for pull requests

**Manual:**
- Vercel dashboard → Select project → "Redeploy"

---

## Custom Domain (Optional)

1. Vercel dashboard → Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update Supabase auth URLs with custom domain

---

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Test build locally: `npm run build`

### Auth Redirect Errors
- Verify Site URL and Redirect URLs in Supabase
- Must include `https://` prefix
- Wildcard `/**` allows all routes

### Images Not Loading
- Check Supabase storage bucket permissions
- Verify image URLs are publicly accessible

---

## Free Tier Limits

Vercel Free Plan includes:
- ✅ 100GB bandwidth/month
- ✅ Unlimited projects
- ✅ Automatic HTTPS
- ✅ Preview deployments

**Perfect for 1-2 months of testing!**

---

## Next Steps

After testing phase (1-2 months):
- Gather user feedback
- Fix any production issues
- Migrate to PKDomain for long-term production (see DEPLOYMENT-PKDOMAIN.md)

---

**Duration:** ~10 minutes setup  
**Cost:** Free  
**Best For:** Testing, staging, rapid iteration
