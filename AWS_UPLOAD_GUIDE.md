# AWS Upload Guide - presentations.stmath.com

## 📦 Files to Upload

**Source:** `packages/attendee-app/dist/`

**Contents:**
```
dist/
├── index.html (0.52 KB)
├── vite.svg
└── assets/
    ├── index-TDOShrVv.css (20.78 KB)
    └── index-B_G49zOs.js (668.45 KB)
```

---

## 🚀 Upload Steps

### Option 1: AWS Console (Web UI)

1. **Login to AWS Console**
   - Go to https://aws.amazon.com
   - Navigate to S3 service

2. **Find the bucket**
   - Should be something like: `presentations-stmath-com` or similar
   - Check existing files to confirm correct bucket

3. **Upload files**
   - Upload `index.html` to root
   - Upload `assets/` folder (with both CSS and JS files)
   - Upload `vite.svg` to root

4. **Set permissions**
   - Make files public (if needed)
   - Or ensure CloudFront can access them

5. **Invalidate CloudFront cache** (if using CloudFront)
   - Go to CloudFront distributions
   - Find presentations.stmath.com distribution
   - Create invalidation: `/*` (all files)

### Option 2: AWS CLI (Faster)

```bash
cd /Users/mindadmin/Desktop/build-projects/active/interactive-presentations/packages/attendee-app

# Upload to S3 (replace BUCKET_NAME with actual bucket)
aws s3 sync dist/ s3://BUCKET_NAME/ --delete

# Invalidate CloudFront (replace DISTRIBUTION_ID with actual ID)
aws cloudfront create-invalidation --distribution-id DISTRIBUTION_ID --paths "/*"
```

---

## ⚙️ Important Settings

### S3 Bucket Configuration

**Required settings for SPA routing:**

1. **Static Website Hosting:**
   - Enable static website hosting
   - Index document: `index.html`
   - Error document: `index.html` (important for client-side routing!)

2. **Bucket Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::BUCKET_NAME/*"
    }
  ]
}
```

### CloudFront Configuration

**Error Pages (Required for React Router):**

| HTTP Code | Error Caching (seconds) | Custom Error Response | Response Page Path | HTTP Response Code |
|-----------|-------------------------|----------------------|-------------------|-------------------|
| 403       | 0                       | Yes                  | /index.html       | 200               |
| 404       | 0                       | Yes                  | /index.html       | 200               |

This ensures routes like `/conv-tool/james` work correctly!

---

## ✅ Verification Checklist

After upload, test these URLs:

- [ ] `https://presentations.stmath.com/` (should show join page)
- [ ] `https://presentations.stmath.com/join` (should show join page)
- [ ] `https://presentations.stmath.com/conv-tool/james` (should auto-join and show waiting screen)
- [ ] `https://presentations.stmath.com/conv-tool/sarah` (should auto-join)
- [ ] `https://presentations.stmath.com/conv-tool/michael` (should auto-join)
- [ ] `https://presentations.stmath.com/builder` (should show activity builder)

**If any show 404 or redirect to error:** Check CloudFront error pages configuration above!

---

## 🧪 Full End-to-End Test

1. **Upload app to AWS**
2. **Verify personal URLs work**
3. **Open Conversation Tool** with extension installed
4. **Scan QR code** on phone: https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https%3A%2F%2Fpresentations.stmath.com%2Fconv-tool%2Fjames
5. **Should auto-join session** and show waiting screen with session code badge
6. **Navigate to slide 2** in Conversation Tool
7. **ST Math game should appear** on phone (this will work on production, not localhost!)

---

## 🔧 Troubleshooting

**Problem:** Routes show 404 or redirect to S3 error page
**Solution:** Configure CloudFront error pages (see above)

**Problem:** Files not updating after upload
**Solution:** Invalidate CloudFront cache (`/*`)

**Problem:** Personal URLs don't work
**Solution:** Check Firebase rules allow reading `/personalSessions`

**Problem:** Activities don't trigger
**Solution:** Verify presentation has `presentationId: "conversation-tool"` in Firebase

---

## 📊 Expected File Sizes

After gzip compression (CloudFront should handle this):

- `index.html`: ~0.32 KB
- `index-TDOShrVv.css`: ~4.52 KB
- `index-B_G49zOs.js`: ~170.40 KB

**Total:** ~175 KB (very fast load!)

---

## 🎯 Success Confirmation

You'll know it worked when:

✅ `https://presentations.stmath.com/conv-tool/james` auto-joins session
✅ No console errors
✅ Session code badge appears in corner
✅ ST Math games load (when you navigate to activity slides)
✅ QR codes work when scanned

---

**Ready to deploy!** 🚀

Upload the files and test the personal URLs. Once working, you can install extensions on sales team laptops and print QR codes.
