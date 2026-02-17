# Production Deployment Guide

## Overview

This guide covers deploying the Interactive Presentations system to production, specifically for hosting on MINDs servers.

## Architecture

```
[Presenter Chrome] → [Backend Server] ← [Attendee Browsers]
     Extension         (WebSocket)        (Web App)
```

## Components to Deploy

### 1. Attendee Web App (Static Files)
- **Technology**: React + Vite build output
- **Requirements**: Any web server (Apache, Nginx, etc.)
- **Location**: Can be anywhere - MINDs server, CDN, etc.

### 2. Backend Server (Node.js)
- **Technology**: Node.js + Express + Socket.IO
- **Requirements**: Node.js runtime, open port for WebSocket
- **Location**: Must be accessible from both extension and attendees

### 3. Chrome Extension
- **Distribution**: Chrome Web Store or manual .crx file
- **Configuration**: Needs backend server URL

## Step-by-Step: Deploy to MINDs Servers

### Prerequisites

- Access to MINDs web server
- Node.js installed on MINDs server (v18+ recommended)
- Domain names (e.g., `presentations.mindresearch.org`)
- SSL certificates (required for production)

### Step 1: Build All Components

```bash
cd /Users/nnisbet/Desktop/presentations

# Build shared types
npm run build:shared

# Build attendee app
npm run build:app
# Output: packages/attendee-app/dist/

# Build server
npm run build:server
# Output: packages/server/dist/

# Build extension
npm run build:extension
# Output: packages/extension/dist/
```

### Step 2: Deploy Attendee App

**Copy static files to web server:**

```bash
# Example: Copy to MINDs web server
scp -r packages/attendee-app/dist/* user@minds-server:/var/www/html/presentations/

# Or if using rsync:
rsync -avz packages/attendee-app/dist/ user@minds-server:/var/www/html/presentations/
```

**Apache Configuration Example:**

```apache
<VirtualHost *:443>
    ServerName presentations.mindresearch.org

    DocumentRoot /var/www/html/presentations

    <Directory /var/www/html/presentations>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # Single Page Application routing
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
</VirtualHost>
```

**Nginx Configuration Example:**

```nginx
server {
    listen 443 ssl;
    server_name presentations.mindresearch.org;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/html/presentations;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Step 3: Deploy Backend Server

**Copy server files:**

```bash
# Copy built server to MINDs server
scp -r packages/server/dist user@minds-server:/opt/presentations-server/
scp -r packages/server/node_modules user@minds-server:/opt/presentations-server/
scp packages/server/package.json user@minds-server:/opt/presentations-server/
scp -r packages/server/activities user@minds-server:/opt/presentations-server/

# Copy shared types
scp -r packages/shared/dist user@minds-server:/opt/presentations-server/node_modules/@interactive-presentations/shared/
```

**Create production .env:**

```bash
# On MINDs server: /opt/presentations-server/.env
PORT=3000
REDIS_URL=redis://localhost:6379
ATTENDEE_APP_URL=https://presentations.mindresearch.org
NODE_ENV=production
SESSION_EXPIRY_HOURS=24
```

**Install Redis:**

```bash
# On MINDs server
sudo apt-get install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

**Run with PM2 (Recommended):**

```bash
# Install PM2 globally on MINDs server
npm install -g pm2

# Start server
cd /opt/presentations-server
pm2 start dist/index.js --name presentations-server

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

**Or with systemd:**

```ini
# /etc/systemd/system/presentations-server.service
[Unit]
Description=Interactive Presentations Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/presentations-server
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable presentations-server
sudo systemctl start presentations-server
```

**Reverse Proxy (if needed):**

```nginx
# Nginx reverse proxy for backend
server {
    listen 443 ssl;
    server_name presentations-api.mindresearch.org;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # WebSocket support
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 4: Configure Backend CORS

**Update server configuration:**

```typescript
// In packages/server/src/config/index.ts
export const config = {
  // ...
  corsOrigins: [
    'https://presentations.mindresearch.org',  // Production attendee app
    'chrome-extension://*',                    // Chrome extensions
  ],
};
```

**Rebuild and redeploy after changes.**

### Step 5: Build Production Extension

**Update server URL:**

```typescript
// packages/extension/src/background/service-worker.ts
const SERVER_URL = process.env.NODE_ENV === 'production'
  ? 'https://presentations-api.mindresearch.org'
  : 'http://localhost:3000';
```

**Or create environment-specific builds:**

```bash
# Create .env.production in extension folder
echo "VITE_SERVER_URL=https://presentations-api.mindresearch.org" > packages/extension/.env.production
```

**Update background script to use env var:**

```typescript
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
```

**Build for production:**

```bash
npm run build:extension
# Output: packages/extension/dist/
```

**Distribute extension:**
- Option A: Upload to Chrome Web Store (recommended)
- Option B: Distribute .crx file manually to presenters
- Option C: Use enterprise Chrome policy for automatic installation

## Security Checklist

- [ ] Use HTTPS for all endpoints (required for WebSocket in production)
- [ ] Configure CORS properly (whitelist specific domains)
- [ ] Set up Redis authentication if exposed to network
- [ ] Use environment variables for sensitive config (never commit .env)
- [ ] Implement rate limiting on backend endpoints
- [ ] Enable firewall rules (only open necessary ports)
- [ ] Set secure session expiry times
- [ ] Regular security updates (npm audit, server patches)

## Monitoring & Maintenance

### Logging

**Backend logs:**
```bash
# With PM2
pm2 logs presentations-server

# With systemd
journalctl -u presentations-server -f
```

**Key metrics to monitor:**
- Active WebSocket connections
- Session count
- Redis memory usage
- Server CPU/RAM
- Response times

### Health Checks

The backend includes a health endpoint:

```bash
curl https://presentations-api.mindresearch.org/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Backup Strategy

**What to backup:**
- Activity configurations (`packages/server/activities/`)
- Redis data (if using persistence)
- Server configuration files

```bash
# Example backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
tar -czf backup-$DATE.tar.gz \
  /opt/presentations-server/activities \
  /opt/presentations-server/.env
```

## Scaling Considerations

### For Large Events (100+ attendees)

1. **Use Redis for session storage** (already configured)
2. **Multiple backend instances** behind load balancer
3. **Redis pub/sub** for multi-server Socket.IO
4. **Separate Redis instance** (not on same server)

### Load Balancer Configuration

```nginx
upstream backend_servers {
    least_conn;  # Load balancing method
    server 10.0.1.10:3000;
    server 10.0.1.11:3000;
    server 10.0.1.12:3000;
}

server {
    listen 443 ssl;
    server_name presentations-api.mindresearch.org;

    location / {
        proxy_pass http://backend_servers;
        # ... other proxy settings
    }
}
```

## Whitelisting ST Math (If Using iframe Mode)

If you want to embed ST Math in iframes instead of new-tab mode:

1. Contact ST Math support
2. Request X-Frame-Options whitelist for your domain:
   - `presentations.mindresearch.org`
3. They'll add your domain to their Content Security Policy

**Note:** With `new-tab` mode (current setup), no whitelisting needed!

## Testing Production Deployment

### Checklist

- [ ] Attendee app loads at production URL
- [ ] Backend health check returns 200 OK
- [ ] WebSocket connection works from attendee app
- [ ] Extension can connect to production backend
- [ ] Create session from extension works
- [ ] Join session from attendee app works
- [ ] Activities appear when navigating slides
- [ ] Poll responses are received and displayed
- [ ] Quiz scoring works correctly
- [ ] Web-link activities open correctly
- [ ] Session persists after server restart (with Redis)
- [ ] Multiple concurrent sessions work
- [ ] SSL certificates are valid

## Rollback Plan

If issues arise:

1. **Backend issues:**
   ```bash
   pm2 stop presentations-server
   # Fix issue, then:
   pm2 start presentations-server
   ```

2. **Frontend issues:**
   ```bash
   # Restore previous version
   cp -r /var/www/html/presentations-backup/* /var/www/html/presentations/
   ```

3. **Extension issues:**
   - Previous version remains installed on Chrome
   - Users can continue using until fixed

## Support & Troubleshooting

### Common Issues

**WebSocket connection fails:**
- Check firewall allows WebSocket traffic
- Verify SSL certificates are valid
- Check CORS configuration

**Extension can't connect:**
- Verify SERVER_URL in extension matches backend
- Check backend is running and accessible
- Test with curl: `curl https://your-backend/health`

**Activities don't appear:**
- Check activity config files are deployed
- Verify presentationId matches
- Check server logs for errors

### Getting Help

- Check server logs: `pm2 logs presentations-server`
- Check browser console (F12) for errors
- Test individual components in isolation
- Verify network connectivity between components

## Next Steps After Deployment

1. Train presenters on using the system
2. Create activity templates for common use cases
3. Set up automated backups
4. Monitor usage and performance
5. Gather feedback for improvements
6. Plan for scaling based on actual usage
