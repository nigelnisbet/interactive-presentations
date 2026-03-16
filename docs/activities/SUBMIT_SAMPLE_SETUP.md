# Submit-Sample Activity Setup Guide

## Overview

The `submit-sample` activity type enables students to interact with canvas-based activities, annotate them, and submit screenshots to the teacher for review and discussion.

## What's Been Built

### 1. Type Definitions (`packages/shared/`)
- Added `'submit-sample'` to `ActivityType`
- Created `SubmitSampleActivity` interface
- Created `SubmitSampleResults` interface
- Created `SubmitSampleSubmission` interface

### 2. Student Component (`packages/attendee-app/`)
- **File**: `src/components/activities/SubmitSample.tsx`
- **Features**:
  - Iframe embedding of canvas activities
  - Mode toggle: Play Mode ↔ Draw Mode
  - Drawing tools: Pen, Line, Circle, Rectangle, Arrow
  - Color picker: Black, Red, Blue, Green, Orange
  - Size selector: Thin, Medium, Thick
  - Clear annotations button
  - Capture & merge (iframe canvas + annotations)
  - Firebase Storage upload
  - Submit & Submit Update buttons

### 3. Teacher Component (`packages/attendee-app/`)
- **File**: `src/components/presenter/SubmitSampleResults.tsx`
- **Features**:
  - Grid view of submission thumbnails
  - Student name & timestamp display
  - Version number badges
  - Click to expand full-screen
  - Sorted by newest first

### 4. Sample Activities Package (`packages/sample-activities/`)
- **Demo Canvas Activity**: Interactive circle-drawing game
- **PostMessage integration**: Ready for canvas capture
- **Vite dev server**: Hot reload during development
- **Build system**: Production-ready output

### 5. Integration
- Added to `App.tsx` routing
- Added to `PresenterDashboard.tsx`
- Firebase Storage configured
- Example activity configurations provided

## Quick Start

### Step 1: Start the Sample Activity Dev Server

```bash
cd ~/Desktop/interactive-presentations/packages/sample-activities
npm run dev
```

This starts the dev server at `http://localhost:5174`

### Step 2: Add Activity to Your Presentation

Edit your presentation's activity JSON file:

```json
{
  "activityId": "sample-1",
  "slidePosition": { "indexh": 5, "indexv": 0 },
  "config": {
    "type": "submit-sample",
    "activityId": "sample-1",
    "url": "http://localhost:5174/src/demo-canvas/index.html",
    "instructions": "Create a colorful pattern",
    "allowAnnotations": true,
    "allowMultipleSubmissions": true,
    "canvasSelector": "#game-canvas"
  }
}
```

### Step 3: Test the Flow

1. **Start all services**:
   ```bash
   cd ~/Desktop/interactive-presentations
   npm run dev
   ```

2. **Load extension** in Chrome

3. **Open presentation** and navigate to the submit-sample slide

4. **Join as student** on phone/another browser

5. **Test workflow**:
   - Click circles in Play Mode
   - Switch to Draw Mode, annotate
   - Submit work
   - Check Presenter Dashboard for thumbnail

## Configuration Options

### Activity Config

```typescript
{
  type: 'submit-sample',
  activityId: string,              // Unique ID
  url: string,                      // URL of canvas activity
  instructions: string,             // Shown to students
  allowAnnotations: boolean,        // Enable draw mode
  allowMultipleSubmissions: boolean,// Enable submit updates
  canvasSelector?: string          // CSS selector (default: 'canvas')
}
```

### When to Enable Annotations

**Enable (`allowAnnotations: true`):**
- Math problem solving (show work)
- Diagrams that need labeling
- Highlighting specific areas
- Adding explanatory notes

**Disable (`allowAnnotations: false`):**
- Pure gameplay/interaction capture
- Activities with built-in annotation tools
- When you want unmodified screenshots

### When to Allow Multiple Submissions

**Enable (`allowMultipleSubmissions: true`):**
- Iterative problem solving
- Activities with multiple attempts
- "Show your progress" scenarios
- Practice/draft submissions

**Disable (`allowMultipleSubmissions: false`):**
- Assessments/tests
- One-time captures
- Final submissions only

## Building Your Own Activity

### Minimal Template

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Activity</title>
</head>
<body>
  <canvas id="game-canvas" width="800" height="600"></canvas>
  <script>
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // Your game logic here
    function drawSomething() {
      ctx.fillStyle = 'blue';
      ctx.fillRect(100, 100, 200, 150);
    }

    // REQUIRED: Handle capture requests
    window.addEventListener('message', (event) => {
      if (event.data.type === 'capture') {
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        window.parent.postMessage({
          type: 'captureResponse',
          imageData: imageData
        }, '*');
      }
    });

    drawSomething();
  </script>
</body>
</html>
```

### Using Pixi.js

```typescript
import * as PIXI from 'pixi.js';

const app = new PIXI.Application({
  width: 800,
  height: 600,
  backgroundColor: 0x1099bb
});

document.body.appendChild(app.view);

// Your game logic...

// Handle capture
window.addEventListener('message', (event) => {
  if (event.data.type === 'capture') {
    // Pixi.js canvas is app.view
    const imageData = app.view.toDataURL('image/jpeg', 0.8);
    window.parent.postMessage({
      type: 'captureResponse',
      imageData: imageData
    }, '*');
  }
});
```

### Using p5.js

```javascript
function setup() {
  createCanvas(800, 600);
}

function draw() {
  // Your p5.js code
  background(220);
  ellipse(mouseX, mouseY, 50, 50);
}

// Handle capture
window.addEventListener('message', (event) => {
  if (event.data.type === 'capture') {
    // p5.js canvas is accessible via canvas element
    const cnv = document.querySelector('canvas');
    const imageData = cnv.toDataURL('image/jpeg', 0.8);
    window.parent.postMessage({
      type: 'captureResponse',
      imageData: imageData
    }, '*');
  }
});
```

## Firebase Storage Setup

### Storage Rules

Ensure your Firebase Storage rules allow uploads:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /submissions/{presentationId}/{fileName} {
      allow write: if request.auth != null || true; // Allow unauthenticated for demo
      allow read: if true;
    }
  }
}
```

### File Organization

Submissions are stored at:
```
/submissions/{activityId}/{timestamp}.jpg
```

Example:
```
/submissions/submit-sample-demo-1/1709812345678.jpg
```

## Production Deployment

### 1. Build Attendee App

```bash
cd ~/Desktop/interactive-presentations
npm run build:shared
npm run build:app
```

Upload `packages/attendee-app/dist/` to `presentations.stmath.com`

### 2. Build Sample Activities

```bash
cd packages/sample-activities
npm run build
```

Upload `dist/` to Firebase Hosting or static host.

### 3. Update Activity URLs

Change from:
```json
"url": "http://localhost:5174/src/demo-canvas/index.html"
```

To:
```json
"url": "https://visual-first-math.web.app/sample-activities/demo-canvas/index.html"
```

## Troubleshooting

### "Cannot access iframe"
- **Cause**: CORS policy blocking iframe access
- **Fix**: Host activities on same domain or configure CORS headers

### "Capture timeout"
- **Cause**: Activity not responding to postMessage
- **Fix**: Check console for errors, verify message handler is set up

### "Image too large"
- **Cause**: Canvas dimensions too big
- **Fix**: Reduce canvas size or lower JPEG quality

### Annotations not showing
- **Cause**: Canvas overlay not positioned correctly
- **Fix**: Check CSS positioning, z-index

### Submissions not appearing
- **Cause**: Firebase Storage permissions or upload failing
- **Fix**: Check Firebase console, verify storage rules

## Testing Checklist

- [ ] Activity loads in iframe
- [ ] Can switch between Play/Draw modes
- [ ] Drawing tools work (pen, shapes, colors)
- [ ] Clear button works
- [ ] Submit captures both canvas + annotations
- [ ] Thumbnail appears in presenter dashboard
- [ ] Can expand/collapse thumbnails
- [ ] Multiple submissions show version numbers
- [ ] Works on mobile devices

## Next Steps

1. **For Friday's Demo**:
   - Test demo canvas activity thoroughly
   - Prepare backup local URL in case network issues
   - Have sample student work ready to showcase

2. **Future Development**:
   - Build math-specific activities
   - Add more drawing tools (text, eraser)
   - Implement peer review features
   - Export submissions to PDF

## Support

For questions or issues:
1. Check console logs (F12)
2. Verify all components are running
3. Test postMessage communication
4. Review Firebase Storage logs

---

**Status**: ✅ Ready for testing and development
**Demo Date**: Friday (conference presentation)
