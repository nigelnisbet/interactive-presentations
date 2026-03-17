# Personal Sessions - Deployment Instructions

**Date:** March 17, 2026
**Status:** Ready for Production Deployment

---

## 📦 What to Deploy

### 1. Attendee App (presentations.stmath.com)

**Location:** `packages/attendee-app/dist/`

**Files to upload:**
```
dist/
├── index.html
├── assets/
│   ├── index-TDOShrVv.css
│   └── index-B_G49zOs.js
└── vite.svg
```

**Upload to:** AWS S3 / CloudFront at `presentations.stmath.com`

**Important:** Make sure the bucket/CDN serves `index.html` for all routes (SPA routing)

---

## 🔧 Extension Setup for Sales Team

### For Each Team Member:

**James (example):**

1. **Edit configuration:**
   ```bash
   cd packages/extension/src
   # Edit personal-session-config.ts
   ```

   ```typescript
   export const personalSessionConfig: PersonalSessionConfig = {
     enabled: true,
     teamMemberName: 'james',
     sessionCode: '7MC7CD',
     allowedPresentationIds: ['conversation-tool'],
   };
   ```

2. **Build extension:**
   ```bash
   cd packages/extension
   npm run build
   ```

3. **Package for distribution:**
   ```bash
   cd dist
   zip -r ../extension-james.zip .
   ```

4. **Install on James's laptop:**
   - Open Chrome → `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `dist/` folder
   - Extension installed!

**Repeat for Sarah (RHXZ9V) and Michael (QY9G4H)**

---

## 🎯 How It Works for Sales Team

### Zero-Friction Workflow:

1. **Sales team member opens Conversation Tool**
   - URL: `https://mind.slides.com/jedmiston/conversation-tool/fullscreen`
   - Extension automatically detects it
   - Session starts silently in background
   - No clicking, no interaction needed!

2. **Attendees scan QR code**
   - QR code shows: `https://presentations.stmath.com/conv-tool/james`
   - Auto-joins James's session
   - Sees waiting screen

3. **Presenter navigates slides**
   - Extension tracks slide changes automatically
   - When reaching a slide with an activity → attendees see it
   - ST Math games, polls, quizzes all work

4. **Presenter closes browser**
   - Session ends
   - Attendees get redirected (future feature)

---

## 📄 QR Codes to Print

### James:
- URL: `https://presentations.stmath.com/conv-tool/james`
- QR Code: https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=https%3A%2F%2Fpresentations.stmath.com%2Fconv-tool%2Fjames

### Sarah:
- URL: `https://presentations.stmath.com/conv-tool/sarah`
- QR Code: https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=https%3A%2F%2Fpresentations.stmath.com%2Fconv-tool%2Fsarah

### Michael:
- URL: `https://presentations.stmath.com/conv-tool/michael`
- QR Code: https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=https%3A%2F%2Fpresentations.stmath.com%2Fconv-tool%2Fmichael

**Print these on:**
- Business cards
- Table tents for conference booths
- Posters
- Laminated cards

---

## ✅ Pre-Deployment Checklist

- [ ] Firebase `/personalSessions/` entries created (✅ Done - james, sarah, michael)
- [ ] Conversation Tool presentation created with `presentationId: "conversation-tool"` (✅ Done)
- [ ] Activities added to Conversation Tool in Activity Builder (✅ Done - 1 activity)
- [ ] Attendee app built (`npm run build` in packages/attendee-app) (✅ Done)
- [ ] Attendee app uploaded to presentations.stmath.com (⏳ To do)
- [ ] Extensions configured for each team member (⏳ To do)
- [ ] Extensions installed on team laptops (⏳ To do)
- [ ] QR codes printed (⏳ To do)
- [ ] Test end-to-end with production URLs (⏳ After deployment)

---

## 🧪 Testing After Deployment

### 1. Test Personal URLs
```
https://presentations.stmath.com/conv-tool/james
https://presentations.stmath.com/conv-tool/sarah
https://presentations.stmath.com/conv-tool/michael
```

Should auto-join respective sessions and show waiting screen.

### 2. Test with Extension
1. Open Conversation Tool on laptop with extension installed
2. Session should start automatically (check extension popup)
3. On phone, scan QR code → should join
4. Navigate to slide 2 → ST Math game should appear

### 3. Test Activity Triggering
1. Navigate between slides
2. Activities should appear/disappear based on slide position
3. ST Math games should load properly (CORS fixed on presentations.stmath.com)

---

## 🔒 Firebase Security (Already Configured)

Firebase rules include:
```json
{
  "rules": {
    "personalSessions": {
      ".read": true,
      ".write": true
    },
    "sessions": {
      ".read": true,
      ".write": true
    },
    "presentations": {
      ".read": true,
      ".write": true
    }
  }
}
```

---

## 📊 Firebase Data Structure

### `/personalSessions/{name}`
```json
{
  "james": {
    "displayName": "James",
    "sessionCode": "7MC7CD",
    "presentationId": "conversation-tool",
    "displayMode": "display-only",
    "redirectUrl": "https://stmath.com",
    "active": true,
    "createdAt": 1773765441913,
    "lastUsed": null
  }
}
```

### `/presentations/conversation-tool`
```json
{
  "presentationId": "conversation-tool",
  "title": "Conversation Tool",
  "activities": [
    {
      "activityId": "game-1",
      "slidePosition": { "indexh": 1, "indexv": 0 },
      "activityType": "web-link",
      "config": {
        "type": "web-link",
        "title": "ST Math Game",
        "url": "https://play.stmath.com/...",
        "displayMode": "new-tab"
      }
    }
  ]
}
```

### `/sessions/7MC7CD` (Auto-created)
```json
{
  "id": "session_xxx",
  "presentationId": "conversation-tool",
  "presenterId": "chrome_extension_id",
  "status": "active",
  "createdAt": timestamp,
  "currentSlide": { "indexh": 0, "indexv": 0 },
  "currentActivity": null,
  "participants": { /* auto-populated */ }
}
```

---

## 🚀 Going Live

1. **Upload dist/ to AWS**
2. **Test personal URLs work**
3. **Install extensions on laptops**
4. **Print QR codes**
5. **Brief sales team** (show them it's automatic - they just open the Conversation Tool)
6. **Ready for conferences!**

---

## 📞 Support

If issues arise:
- Check service worker console: `chrome://extensions` → "service worker"
- Check Firebase Realtime Database for session data
- Verify QR codes point to correct URLs
- Check that Conversation Tool has `presentationId: "conversation-tool"`

---

## 🎉 Features Delivered

✅ **Personal persistent URLs** - Each team member has their own
✅ **Automatic session start** - No extension interaction needed
✅ **Automatic slide tracking** - Activities trigger at correct slides
✅ **Printable QR codes** - Ready for conference use
✅ **Zero friction** - Sales team just opens Conversation Tool and presents
✅ **Works with ST Math games** - When deployed to presentations.stmath.com
✅ **Parallel system** - Doesn't affect existing full-featured system

---

**Deployment Status:** ✅ Built, ⏳ Awaiting AWS Upload
