# Fraction Builder Activity

## Overview

A simple, visual fraction builder where students:
1. Drag down to split a bar into equal segments (denominator)
2. Click the yellow GO button
3. Drag up to fill segments (numerator)
4. Submit their work

## How It Works

### Step 1: Choose Denominator
- **Vertical bar** in the center (white)
- **Slider on the right** starts at the top
- **Drag down** to split the bar into more segments
  - Drag slightly down → splits into 2 (halves)
  - Drag further → splits into 3 (thirds)
  - Continue → up to 15 segments
- **Snap effect**: Slider gently pulls to each fraction position as you pass it
- **Visual feedback**: Bar splits with black borders between segments

### Step 2: Click GO
- **GO button** in top-right corner
- Starts **grey** (disabled)
- Turns **yellow** once you start dragging the denominator slider
- **Click it** when ready to move to filling

### Step 3: Fill Numerator
- Slider **jumps to bottom** of the bar
- **Drag up** to fill segments with ST Math blue
- Fills from bottom to top
- Can fill any number from 0 to the denominator

### Step 4: Submit
- Once satisfied, student clicks **"Submit My Work"**
- Canvas captures the visual fraction
- Teacher sees the submission in the dashboard

## Visual Design

- **Bar**: White with black segment borders
- **Filled segments**: ST Math blue (#0077c8)
- **Slider handles**: Blue (ST Math blue), turn yellow when dragging
- **GO button**: Grey → Yellow when active
- **Background**: Purple gradient (matches demo canvas)
- **Mobile-optimized**: Portrait orientation, touch-friendly

## Configuration Example

```json
{
  "activityId": "fraction-builder-1",
  "slidePosition": { "indexh": 7, "indexv": 0 },
  "config": {
    "type": "submit-sample",
    "url": "http://localhost:5174/src/fraction-builder/index.html",
    "instructions": "Build the fraction 2/3",
    "allowAnnotations": true,
    "allowMultipleSubmissions": false
  }
}
```

## Presentation Integration

### Slide Setup:
1. Put the **target fraction** (e.g., "Build 2/3") on your slide
2. Configure activity to launch on that slide
3. Students see the instruction, then work in the app

### Multiple Problems:
Create multiple slides with different fractions:
- Slide 7: "Build 2/3"
- Slide 8: "Build 5/8"
- Slide 9: "Build 3/4"
- etc.

Each gets its own activity configuration with unique `activityId`.

## Teaching Uses

### Basic Fractions:
- "Build 1/2" → verify students can identify halfway
- "Build 3/4" → three out of four parts

### Equivalent Fractions:
- "Build 2/4" then "Build 1/2" → compare submissions

### Comparing Fractions:
- "Build 2/3" and "Build 3/5" → which is larger?

### Improper Fractions:
- Student might build 5/3 (fills all 3, needs more)
- Good discussion point!

## Annotation Uses

With annotations enabled, students can:
- **Circle** specific segments
- **Draw arrows** to show counting
- **Add lines** to compare
- **Annotate** their thinking process

## Teacher Dashboard

Teachers see:
- Grid of all student submissions
- Visual comparison of different approaches
- Who built correctly vs incorrectly
- Common misconceptions (e.g., counting segments instead of spaces)

## Testing

### Local Testing:
```bash
# Start dev server
cd ~/Desktop/interactive-presentations/packages/sample-activities
npm run dev

# Visit in browser:
http://localhost:5174/src/fraction-builder/index.html
```

### Test Flow:
1. Drag down slowly → bar splits into segments
2. Watch snap effect at each fraction position
3. GO button turns yellow
4. Click GO
5. Drag up from bottom → segments fill
6. Visual looks good?

### Mobile Testing:
- Test on phone (touch dragging)
- Verify slider is easy to grab
- Check that segments are clearly visible
- Ensure GO button is easy to tap

## Technical Details

### Canvas Size:
- 600 x 900 pixels (portrait)
- Scales to fit screen
- Touch-optimized

### Interaction:
- Mouse events for desktop
- Touch events for mobile
- Prevents default scrolling
- Smooth dragging

### Capture:
- Canvas exports as JPEG (0.8 quality)
- ~50-100 KB file size
- Fast upload to Firebase

## Future Enhancements

Potential additions:
- Show fraction as text (2/3)
- Allow resetting without reloading
- Add percentage display
- Multiple bars for comparing fractions
- Animation when segments fill
- Sound effects for snap
- Haptic feedback on mobile

## Troubleshooting

### Slider not moving smoothly:
- Check touch-action CSS
- Verify event preventDefault

### Snap feeling wrong:
- Adjust snap strength (currently 0.3)
- Tweak in `handleDenominatorMove()`

### GO button not activating:
- Ensure `denominatorTouched` flag is set
- Check click detection radius

### Segments not visible:
- Increase border width
- Adjust segment spacing
- Check color contrast

## Demo Tips

For Friday's conference:
1. **Start simple**: "Build 1/2" to show basic interaction
2. **Show snap**: Drag slowly so audience sees splits happen
3. **Demonstrate GO**: Show button changing color
4. **Fill segments**: Show smooth upward dragging
5. **Show dashboard**: Pull up multiple student submissions
6. **Discuss**: Use thumbnails to compare approaches

---

**Status**: ✅ Built and ready to test
**URL**: http://localhost:5174/src/fraction-builder/index.html
**Next**: Test the interaction flow and visual feel!
