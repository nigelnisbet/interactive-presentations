# Deploy to Production - Complete Guide

## What's Ready to Deploy

### ✅ 1. Bug Fix (Poll Answer Persistence)
- Fixed and built
- Ready to upload to presentations.stmath.com

### ✅ 2. Submit-Sample Feature
- Complete system built
- Integrated into attendee app
- Ready to test

### ✅ 3. Fraction Builder Activity
- Built and ready
- Needs hosting (Firebase or visual-first-math.web.app)

---

## Deployment Steps

### Step 1: Deploy Attendee App to AWS (presentations.stmath.com)

**Files to upload:**
```
~/Desktop/interactive-presentations/packages/attendee-app/dist/
├── index.html
└── assets/
    ├── index-CDR08_PT.css
    └── index-Dpd0qGy4.js
```

**Upload to:** `presentations.stmath.com`

**Action:** You handle this manually (AWS upload)

---

### Step 2: Deploy Fraction Builder to Firebase

**Option A: Deploy to Firebase Hosting (Recommended)**

```bash
cd ~/Desktop/interactive-presentations/packages/sample-activities

# Initialize Firebase (if not already done)
firebase init hosting
# Choose existing project: class-session-games
# Public directory: dist
# Single-page app: No
# Overwrites: No

# Deploy
firebase deploy --only hosting
```

**Result:** Activities will be available at:
- `https://class-session-games.web.app/src/fraction-builder/index.html`
- `https://class-session-games.web.app/src/demo-canvas/index.html`

**Option B: Upload to visual-first-math.web.app**

If you prefer to host on visual-first-math.web.app:
```bash
# Copy built files
cp -r ~/Desktop/interactive-presentations/packages/sample-activities/dist/* /path/to/visual-first-math/public/interactive-activities/

# Then deploy visual-first-math as usual
```

**I can do this for you!** Would you like me to deploy to Firebase now?

---

### Step 3: Update Activity Configuration

Once fraction-builder is deployed, update your presentation JSON:

**For local testing (current):**
```json
{
  "activityId": "fraction-1",
  "slidePosition": { "indexh": 7, "indexv": 0 },
  "config": {
    "type": "submit-sample",
    "activityId": "fraction-1",
    "url": "http://localhost:5174/src/fraction-builder/index.html",
    "instructions": "Build the fraction 2/3",
    "allowAnnotations": true,
    "allowMultipleSubmissions": false,
    "canvasSelector": "#game-canvas"
  }
}
```

**For production (after deployment):**
```json
{
  "activityId": "fraction-1",
  "slidePosition": { "indexh": 7, "indexv": 0 },
  "config": {
    "type": "submit-sample",
    "activityId": "fraction-1",
    "url": "https://class-session-games.web.app/src/fraction-builder/index.html",
    "instructions": "Build the fraction 2/3",
    "allowAnnotations": true,
    "allowMultipleSubmissions": false,
    "canvasSelector": "#game-canvas"
  }
}
```

**Where to add this:**
Add to your presentation's activity config file in:
```
packages/extension/src/data/presentations/{YOUR_PRESENTATION_ID}.json
```

---

## Quick Testing Checklist

### Before Deploying:
- [x] Attendee app built successfully
- [x] Fraction builder built successfully
- [x] Bug fix tested locally
- [x] Fraction builder works in submit-sample

### After Deploying Attendee App:
- [ ] Visit presentations.stmath.com
- [ ] Join a test session
- [ ] Test poll bug fix (2 polls back-to-back)
- [ ] Test other activity types still work

### After Deploying Fraction Builder:
- [ ] Visit deployed fraction-builder URL directly
- [ ] Test denominator selection (drag down)
- [ ] Test GO button
- [ ] Test numerator filling (drag up)
- [ ] Test RESET button
- [ ] Test in submit-sample activity via presentation

### Full Integration Test:
- [ ] Create presentation with fraction-builder slide
- [ ] Load in extension
- [ ] Join as student
- [ ] Navigate to fraction slide
- [ ] Build a fraction (e.g., 2/3)
- [ ] Try annotation tools (Draw Mode)
- [ ] Submit work
- [ ] Check presenter dashboard shows thumbnail
- [ ] Click thumbnail to expand
- [ ] Test on mobile device

---

## Files Currently Built

### Attendee App:
```
packages/attendee-app/dist/
├── index.html (0.52 kB)
└── assets/
    ├── index-CDR08_PT.css (20.41 kB)
    └── index-Dpd0qGy4.js (645.71 kB)
```

### Sample Activities:
```
packages/sample-activities/dist/
├── src/
│   ├── fraction-builder/
│   │   └── index.html (1.18 kB)
│   └── demo-canvas/
│       └── index.html (2.47 kB)
└── assets/
    ├── fraction-builder-grrTMs4O.js (4.59 kB)
    └── demo-canvas-CDqhnEUg.js (1.90 kB)
```

---

## Configuration Files

### For Conference Demo:

**Create:** `packages/extension/src/data/presentations/DEMO.json`

```json
[
  {
    "activityId": "poll-1",
    "slidePosition": { "indexh": 1, "indexv": 0 },
    "config": {
      "type": "poll",
      "activityId": "poll-1",
      "question": "How confident are you with fractions?",
      "options": ["Very confident", "Somewhat confident", "Not confident"],
      "allowMultiple": false,
      "showResults": "live"
    }
  },
  {
    "activityId": "poll-2",
    "slidePosition": { "indexh": 2, "indexv": 0 },
    "config": {
      "type": "poll",
      "activityId": "poll-2",
      "question": "Which fraction is larger: 2/3 or 3/4?",
      "options": ["2/3", "3/4", "They're equal"],
      "allowMultiple": false,
      "showResults": "after-close"
    }
  },
  {
    "activityId": "fraction-1",
    "slidePosition": { "indexh": 3, "indexv": 0 },
    "config": {
      "type": "submit-sample",
      "activityId": "fraction-1",
      "url": "https://class-session-games.web.app/src/fraction-builder/index.html",
      "instructions": "Build the fraction 2/3",
      "allowAnnotations": true,
      "allowMultipleSubmissions": false,
      "canvasSelector": "#game-canvas"
    }
  },
  {
    "activityId": "fraction-2",
    "slidePosition": { "indexh": 4, "indexv": 0 },
    "config": {
      "type": "submit-sample",
      "activityId": "fraction-2",
      "url": "https://class-session-games.web.app/src/fraction-builder/index.html",
      "instructions": "Build the fraction 5/8",
      "allowAnnotations": true,
      "allowMultipleSubmissions": true,
      "canvasSelector": "#game-canvas"
    }
  }
]
```

---

## Troubleshooting

### Fraction Builder Not Loading:
- Check CORS policy on hosting
- Verify URL is accessible
- Check browser console for errors

### Canvas Not Capturing:
- Verify `canvasSelector: "#game-canvas"` is correct
- Check Firebase Storage permissions
- Test postMessage communication in console

### Thumbnails Not Showing:
- Check Firebase Storage rules allow reads
- Verify image URLs are valid
- Check network tab for failed requests

---

## What I Can Do For You

**Option 1: Deploy to Firebase Now**
I can run the Firebase deploy command to host the fraction-builder on class-session-games.web.app right now.

**Option 2: Create firebase.json Config**
I can create the Firebase hosting config file so you can deploy yourself later.

**Option 3: Wait Until Testing Complete**
Test everything on localhost first, then deploy when you're satisfied.

---

## Current Status

✅ **Attendee App:** Built, ready to upload to AWS
✅ **Fraction Builder:** Built, ready to deploy to Firebase
✅ **Activity Config:** Example JSON provided above
⏳ **Firebase Deployment:** Waiting for your decision
⏳ **AWS Upload:** You handle this

**Next Step:**
1. Upload attendee app dist/ to presentations.stmath.com
2. Let me know if you want me to deploy fraction-builder to Firebase
3. Test everything in production

---

Ready to deploy? Let me know! 🚀
