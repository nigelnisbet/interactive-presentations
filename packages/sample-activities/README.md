# Sample Activities for Submit-Sample Type

This package contains canvas-based activities designed to work with the `submit-sample` activity type.

## What is Submit-Sample?

The submit-sample activity allows students to interact with a canvas-based game or activity, optionally annotate it with drawing tools, and submit a screenshot to the teacher. The teacher sees all student submissions as thumbnails that can be expanded for discussion.

## How It Works

### Student Experience:
1. Activity loads in an iframe with a border
2. Toggle between "Play Mode" (interact with activity) and "Draw Mode" (annotate)
3. Click "Submit My Work" to capture and send to teacher
4. Can submit updates if allowed

### Teacher Experience:
1. See thumbnails of all student submissions in grid view
2. Click thumbnail to expand full-screen
3. Submissions show student name, timestamp, and version number

## Creating Your Own Activity

### Requirements:
1. **Must use HTML Canvas for rendering**
2. **Must handle postMessage communication**
3. **Must respond to capture requests**

### Template:

```typescript
const canvas = document.getElementById('your-canvas') as HTMLCanvasElement;

// Listen for capture requests
window.addEventListener('message', (event) => {
  if (event.data.type === 'capture') {
    // Capture canvas as base64 JPEG
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    // Send back to parent
    window.parent.postMessage({
      type: 'captureResponse',
      imageData: imageData,
    }, '*');
  }
});
```

### Activity Configuration (JSON):

```json
{
  "activityId": "sample-demo-1",
  "slidePosition": { "indexh": 5, "indexv": 0 },
  "config": {
    "type": "submit-sample",
    "url": "http://localhost:5174/src/demo-canvas/index.html",
    "instructions": "Create a colorful pattern",
    "allowAnnotations": true,
    "allowMultipleSubmissions": true,
    "canvasSelector": "#game-canvas"
  }
}
```

## Running the Demo

### Development:
```bash
cd packages/sample-activities
npm install
npm run dev
```

Visit: `http://localhost:5174/src/demo-canvas/index.html`

### Production Build:
```bash
npm run build
```

Output will be in `dist/` folder, ready to deploy to Firebase Hosting or any static host.

## Included Activities

### Demo Canvas (`/demo-canvas/`)
A simple interactive canvas where students click to place colorful circles.

**Features:**
- Click to add circles
- Random color mode
- Clear canvas button
- Demonstrates basic canvas capture

## Best Practices

### 1. Canvas Sizing
- Use responsive canvas sizing
- Maintain aspect ratio
- Test on mobile devices

### 2. Performance
- Keep animations smooth (60fps)
- Optimize drawing operations
- Use `requestAnimationFrame` for animations

### 3. Data Size
- Compress canvas capture: `toDataURL('image/jpeg', 0.8)`
- Typical capture: 50-150KB (vs 2-5MB for photos)
- Consider canvas dimensions (800x600 is good balance)

### 4. User Experience
- Clear instructions
- Visual feedback for interactions
- Test capture/submit flow thoroughly

## Firebase Hosting Deployment

To deploy to `visual-first-math.web.app`:

1. Build activities:
   ```bash
   npm run build
   ```

2. Deploy to Firebase:
   ```bash
   firebase deploy --only hosting:sample-activities
   ```

3. Update activity URLs to production:
   ```json
   {
     "url": "https://visual-first-math.web.app/sample-activities/demo-canvas/index.html"
   }
   ```

## Technologies Used

- **TypeScript** - Type-safe game logic
- **HTML Canvas API** - Graphics rendering
- **Vite** - Fast build tool and dev server
- **PostMessage API** - iframe communication

## Troubleshooting

### Canvas not capturing:
- Verify canvas has `id` attribute
- Check `canvasSelector` in activity config
- Ensure canvas is visible (not display:none)
- Test postMessage handler in console

### Capture timeout:
- Check for JavaScript errors in activity
- Verify canvas is fully rendered before capture
- Test in dev tools iframe simulator

### Image quality:
- Adjust JPEG quality: `toDataURL('image/jpeg', 0.7)` (lower = smaller file)
- For crisp text/diagrams, use PNG: `toDataURL('image/png')`
- Balance quality vs file size (< 200KB recommended)

## Future Activity Ideas

- Math manipulatives (fraction bars, base-10 blocks)
- Drawing/art tools
- Physics simulations
- Pattern puzzles
- Graph plotting
- Geometry tools
- Code visualization
- Data charts

All of these work great with canvas and can capture student work for teacher review!
