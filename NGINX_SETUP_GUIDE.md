# 🚀 Production Nginx Setup Guide for AutoFinder Backend

## 📋 Prerequisites

- Ubuntu/Debian server
- Root or sudo access
- Node.js backend running on `localhost:8001`
- Domain name: `backend.autofinder.pk` (or your domain)

---

## 🔧 Installation Steps

### Step 1: Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

### Step 2: Copy Configuration File

```bash
# Copy the nginx.conf to sites-available
sudo cp nginx.conf /etc/nginx/sites-available/autofinder-backend

# Or create/edit directly
sudo nano /etc/nginx/sites-available/autofinder-backend
```

**Paste the entire content from `nginx.conf` file**

### Step 3: Enable the Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/autofinder-backend /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default
```

### Step 4: Test Configuration

```bash
# Test Nginx configuration
sudo nginx -t
```

**Expected output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 5: Create Log Directory (if needed)

```bash
sudo mkdir -p /var/log/nginx
sudo chown www-data:www-data /var/log/nginx
```

### Step 6: Restart Nginx

```bash
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 7: Check Status

```bash
sudo systemctl status nginx
```

---

## 🔒 Firewall Configuration

```bash
# Allow HTTP
sudo ufw allow 80/tcp comment 'HTTP'

# Allow HTTPS (after SSL setup)
sudo ufw allow 443/tcp comment 'HTTPS'

# Check status
sudo ufw status verbose
```

---

## 🔐 SSL Certificate Setup (Let's Encrypt)

### Step 1: Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Step 2: Get SSL Certificate

```bash
sudo certbot --nginx -d backend.autofinder.pk
```

**Follow the prompts:**
- Enter your email
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### Step 3: Auto-Renewal Test

```bash
# Test renewal
sudo certbot renew --dry-run
```

**Auto-renewal is already configured by Certbot**

### Step 4: Update Nginx Config for HTTPS

After SSL setup, uncomment the HTTPS server block in `/etc/nginx/sites-available/autofinder-backend`:

```bash
sudo nano /etc/nginx/sites-available/autofinder-backend
```

Uncomment:
- HTTPS server block (lines starting with `# server {`)
- HTTP to HTTPS redirect block

Then test and restart:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🛡️ Security Features Included

### ✅ Rate Limiting
- **API endpoints**: 10 requests/second (burst: 20)
- **Login endpoints**: 5 requests/minute (burst: 3)
- **Upload endpoints**: 2 requests/second (burst: 3)

### ✅ Bot Blocking
Blocks common bots and scrapers:
- curl, wget, python-requests
- SEO bots (ahrefs, semrush, majestic)
- Crawlers and scrapers
- Empty user agents

### ✅ Security Headers
- `X-Frame-Options`: SAMEORIGIN
- `X-Content-Type-Options`: nosniff
- `X-XSS-Protection`: 1; mode=block
- `Referrer-Policy`: strict-origin-when-cross-origin
- `Permissions-Policy`: Restricted
- `Strict-Transport-Security`: (HTTPS only)

### ✅ Access Restrictions
- **Hidden files**: `.env`, `.git`, `.htaccess`, etc. → **BLOCKED**
- **Uploads directory**: Direct access → **BLOCKED**
- **Connection limiting**: Max 20 connections per IP

### ✅ Request Size Limits
- **Client body**: 50MB max
- **Buffer size**: 128KB

---

## 📊 Monitoring & Logs

### View Access Logs
```bash
sudo tail -f /var/log/nginx/autofinder-backend-access.log
```

### View Error Logs
```bash
sudo tail -f /var/log/nginx/autofinder-backend-error.log
```

### Check Rate Limit Blocks
```bash
sudo grep "429" /var/log/nginx/autofinder-backend-access.log
```

### Check Blocked Bots
```bash
sudo grep "403" /var/log/nginx/autofinder-backend-access.log
```

---

## 🔧 Customization

### Add Suspicious IPs to Block

Edit `/etc/nginx/sites-available/autofinder-backend`:

```nginx
geo $block_ip {
    default 0;
    1.2.3.4 1;  # Block this IP
    5.6.7.8 1;  # Block this IP
}
```

Then restart:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Adjust Rate Limits

Edit the `limit_req_zone` directives:

```nginx
# Current: 10 requests/second
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# Change to: 20 requests/second
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;
```

### Allow Uploads Access (if needed)

If you need to allow direct access to uploads, comment out the uploads block:

```nginx
# location /uploads {
#     deny all;
#     ...
# }
```

---

## ✅ Verification Checklist

- [ ] Nginx installed and running
- [ ] Configuration file copied to `/etc/nginx/sites-available/`
- [ ] Site enabled via symbolic link
- [ ] `nginx -t` shows no errors
- [ ] Nginx restarted successfully
- [ ] Firewall allows ports 80 and 443
- [ ] Backend accessible via domain name
- [ ] Rate limiting working (test with multiple requests)
- [ ] Hidden files blocked (test: `curl http://backend.autofinder.pk/.env`)
- [ ] Uploads directory blocked (test: `curl http://backend.autofinder.pk/uploads/`)
- [ ] SSL certificate installed (if using HTTPS)
- [ ] Logs are being written

---

## 🐛 Troubleshooting

### Nginx won't start
```bash
# Check error logs
sudo tail -50 /var/log/nginx/error.log

# Test configuration
sudo nginx -t

# Check if port 80 is already in use
sudo netstat -tulpn | grep :80
```

### 502 Bad Gateway
- Check if Node.js backend is running: `pm2 status` or `ps aux | grep node`
- Check backend logs
- Verify backend is listening on `localhost:8001`

### Rate limiting too strict
- Adjust rate limits in configuration
- Check logs for 429 errors
- Increase burst values if needed

### SSL certificate issues
```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t
```

---

## 📝 Quick Commands Reference

```bash
# Restart Nginx
sudo systemctl restart nginx

# Reload Nginx (without downtime)
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# View logs
sudo tail -f /var/log/nginx/autofinder-backend-access.log
sudo tail -f /var/log/nginx/autofinder-backend-error.log

# Check Nginx version
nginx -v

# Reload after config changes
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🎯 Next Steps

1. ✅ Install and configure Nginx
2. ✅ Set up SSL certificate
3. ✅ Test all endpoints
4. ✅ Monitor logs for suspicious activity
5. ✅ Set up log rotation (optional)
6. ✅ Configure fail2ban for additional security (optional)

---

**Setup complete! Your backend is now protected by production-grade Nginx configuration.** 🚀
