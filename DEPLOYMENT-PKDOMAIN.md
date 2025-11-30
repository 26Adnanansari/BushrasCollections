# PKDomain Shared Hosting Deployment Guide

## Production Deployment to PKDomain

### Why PKDomain?
- **Lower cost:** Cheaper than Vercel for long-term hosting
- **Better latency:** Servers in Pakistan, faster for local audience
- **cPanel access:** Easy file management
- **Unlimited bandwidth:** No usage limits
- **Node.js support:** Runs React/Vite apps

Provider: [PKDomain.com](https://www.pkdomain.com.pk/)

---

## Prerequisites

1. **PKDomain Hosting Plan:**
   - Choose plan with Node.js support
   - Verify cPanel access included
   - Confirm SSL certificate included

2. **Local Setup:**
   - Node.js installed
   - Git installed
   - Project code from GitHub

3. **Credentials Ready:**
   - Supabase credentials
   - PKDomain cPanel login
   - Domain name (if using custom domain)

---

## Step 1: Build Production Bundle Locally

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# Install dependencies
npm install

# Create .env file with production credentials
cat > .env << EOF
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
EOF

# Build production bundle
npm run build
```

This creates a `dist/` folder with optimized production files.

---

## Step 2: Access cPanel

1. Visit: `https://yourdomain.com:2083` (or cPanel URL provided by PKDomain)
2. Login with credentials from PKDomain

---

## Step 3: Upload Files via File Manager

### Option A: cPanel File Manager (Recommended)
1. Navigate to **File Manager** in cPanel
2. Go to `public_html/` directory
3. Delete default files (index.html, etc.)
4. Click **Upload** button
5. Upload entire `dist/` folder contents
   - Or compress `dist/` to ZIP locally and upload ZIP
   - Extract ZIP in cPanel File Manager

### Option B: FTP Upload
1. Install FTP client (FileZilla recommended)
2. Get FTP credentials from cPanel → FTP Accounts
3. Connect to server
4. Upload `dist/` contents to `public_html/`

---

## Step 4: Configure Node.js Application

1. In cPanel, go to **Setup Node.js App**
2. Click **Create Application**
3. Configure:
   - **Node.js version:** Select latest stable (18.x or 20.x)
   - **Application mode:** Production
   - **Application root:** `public_html`
   - **Application URL:** Your domain
   - **Application startup file:** Not needed for static Vite build

4. Click **Create**

**Note:** Since Vite produces a static build, you may not need Node.js app configuration. The `dist/` folder serves as static HTML/CSS/JS files.

---

## Step 5: Configure .htaccess for React Router

Create `.htaccess` file in `public_html/`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Enable HTTPS redirect
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

This ensures:
- React Router URLs work correctly
- HTTPS enforced
- Static assets cached for performance

---

## Step 6: Enable SSL Certificate

1. cPanel → **SSL/TLS Status**
2. Enable SSL for your domain
3. Or use **Let's Encrypt** (free):
   - cPanel → Let's Encrypt SSL
   - Select your domain
   - Click "Issue"

---

## Step 7: Update Supabase Auth URLs

1. Open Lovable → Click "View Backend"
2. Navigate to Authentication → URL Configuration
3. Add PKDomain URL to **Redirect URLs**:
   ```
   https://yourdomain.com/**
   https://yourdomain.com/auth/callback
   ```
4. Update **Site URL**:
   ```
   https://yourdomain.com
   ```

---

## Step 8: Update Domain Configuration (Optional)

If using custom domain:

1. PKDomain → Domain Management
2. Update DNS records:
   - **A Record:** Point to server IP
   - **CNAME:** www → yourdomain.com
3. Wait 24-48 hours for DNS propagation

---

## Step 9: Test Production Deployment

Visit your domain and test:
- ✅ Homepage loads with products and banners
- ✅ Sign up/login works
- ✅ Avatar selection appears for new users
- ✅ User dashboard accessible
- ✅ Admin panel accessible
- ✅ Cart and checkout functional
- ✅ Images load from Supabase storage
- ✅ SSL certificate active (padlock icon)

---

## Updating Your App

When you make changes:

```bash
# Pull latest code
git pull origin main

# Rebuild
npm run build

# Upload new dist/ contents to cPanel
# Replace files in public_html/
```

**Automated Option:**
- Set up GitHub Actions to build and FTP deploy automatically
- Or use deployment scripts

---

## Performance Optimization

### Enable Gzip Compression
Add to `.htaccess`:
```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

### Enable Browser Caching
Already included in `.htaccess` above

### CDN Integration (Optional)
- Use Cloudflare free tier for additional caching
- Point domain DNS to Cloudflare
- Enable caching rules

---

## Troubleshooting

### 404 Errors on Page Refresh
- Verify `.htaccess` exists and is correct
- Check `mod_rewrite` is enabled in cPanel

### Images Not Loading
- Verify Supabase storage bucket is public
- Check CORS settings in Supabase
- Ensure image URLs are correct

### Slow Loading
- Enable Gzip compression
- Verify caching headers
- Consider Cloudflare CDN

### SSL Not Working
- Re-issue SSL certificate
- Force HTTPS in `.htaccess`
- Clear browser cache

---

## Backup Strategy

### Manual Backup
1. cPanel → File Manager
2. Select `public_html/`
3. Click **Compress** → Download ZIP

### Automated Backup
- Use cPanel backup tool (schedule weekly)
- Or set up automated FTP backup script

**Database Backup:**
- Supabase handles database backups automatically
- Or use `npm run backup` script from project

---

## Cost Comparison

| Provider | Monthly Cost | Bandwidth | Best For |
|----------|-------------|-----------|----------|
| Vercel Free | $0 | 100GB | Testing, staging |
| PKDomain Shared | $5-15 | Unlimited | Production, long-term |
| VPS (optional) | $20-50 | High | High traffic scaling |

---

## Support

**PKDomain Support:**
- Email: support@pkdomain.com.pk
- Live Chat: Available on website
- Phone: Check PKDomain website

**Common Issues:**
- File upload limits: Contact support to increase
- Node.js version: Request update if needed
- SSL issues: Support can manually install

---

**Duration:** ~30-60 minutes setup  
**Cost:** ~$5-15/month  
**Best For:** Production, Pakistani audience, long-term hosting
