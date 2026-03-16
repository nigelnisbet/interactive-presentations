# Submit-Sample Testing Checklist

## Pre-Test Setup

- [ ] All services running (`npm run dev`)
- [ ] Sample activities server running (port 5174)
- [ ] Extension loaded in Chrome
- [ ] Presentation with submit-sample slide ready

## Basic Flow Test

### Student Side:
- [ ] Navigate to submit-sample slide
- [ ] Activity loads in iframe
- [ ] Can interact with activity (click circles)
- [ ] "Play Mode" button visible
- [ ] "Draw Mode" button visible (if annotations enabled)

### Switch to Draw Mode:
- [ ] Click "Draw Mode" button
- [ ] Button highlights as active
- [ ] Drawing tools panel appears
- [ ] Canvas cursor changes to crosshair
- [ ] Activity becomes non-interactive

### Test Drawing Tools:
- [ ] Pen tool draws freehand lines
- [ ] Line tool draws straight lines
- [ ] Circle tool draws circles from center
- [ ] Rectangle tool draws rectangles
- [ ] Arrow tool draws arrows with arrowheads
- [ ] Color picker changes pen color
- [ ] Size selector changes line thickness
- [ ] Clear button removes all annotations

### Switch Back to Play Mode:
- [ ] Click "Play Mode" button
- [ ] Activity becomes interactive again
- [ ] Annotations remain visible
- [ ] Can still interact with circles

### Submit Work:
- [ ] Click "Submit My Work" button
- [ ] Button shows "Submitting..." state
- [ ] Button disabled during submit
- [ ] Success message appears after submit
- [ ] Checkmark icon displays

### Submit Update (if enabled):
- [ ] "Submit Update" button appears
- [ ] Can click to submit again
- [ ] Shows "Updating..." state
- [ ] Version number increments
- [ ] Success message updates

## Teacher Dashboard Test

### View Submissions:
- [ ] Open presenter dashboard
- [ ] Navigate to submit-sample slide
- [ ] Activity title displays correctly
- [ ] Thumbnail grid appears
- [ ] Each submission shows:
  - [ ] Student image
  - [ ] Student name (or "Student N")
  - [ ] Timestamp
  - [ ] Version badge (if v2+)

### Expand Submission:
- [ ] Click on a thumbnail
- [ ] Modal overlay appears
- [ ] Image expands to full screen
- [ ] Close button (X) visible
- [ ] Image centered on screen
- [ ] Background darkened

### Close Expanded View:
- [ ] Click X button → closes
- [ ] Click outside image → closes
- [ ] Returns to thumbnail grid

## Edge Cases

### No Submissions:
- [ ] Shows "Waiting for students..." message
- [ ] Clear placeholder text

### Multiple Students:
- [ ] Multiple thumbnails appear
- [ ] Sorted by timestamp (newest first)
- [ ] Each has unique position

### Multiple Versions:
- [ ] Updated submissions show version badge
- [ ] Latest version displays
- [ ] Version number increments correctly

### Canvas Capture:
- [ ] Annotations appear in captured image
- [ ] Activity content captured correctly
- [ ] Image quality acceptable
- [ ] No visual artifacts

## Mobile Testing

- [ ] Activity loads on mobile
- [ ] Touch drawing works
- [ ] Pinch zoom disabled on canvas
- [ ] Buttons accessible
- [ ] Submit works on mobile
- [ ] Dashboard thumbnails responsive

## Error Handling

### Network Issues:
- [ ] Submit retry works after failure
- [ ] Clear error message shown
- [ ] Doesn't lose work

### Iframe Issues:
- [ ] Timeout handled gracefully
- [ ] Error message if activity won't load
- [ ] Fallback UI appears

### Storage Issues:
- [ ] Firebase error caught
- [ ] User notified of issue
- [ ] Can retry upload

## Performance

- [ ] Drawing feels smooth (no lag)
- [ ] Canvas capture completes quickly (< 2s)
- [ ] Upload completes within 5s
- [ ] Dashboard loads thumbnails quickly
- [ ] Expanding image is instant

## Browser Compatibility

### Chrome Desktop:
- [ ] All features work
- [ ] Performance good

### Safari Desktop:
- [ ] All features work
- [ ] Drawing tools work

### Chrome Mobile:
- [ ] All features work
- [ ] Touch drawing works

### Safari Mobile:
- [ ] All features work
- [ ] Touch drawing works

## Integration Tests

### With Other Activities:
- [ ] Can navigate from poll → submit-sample
- [ ] Can navigate from submit-sample → quiz
- [ ] State resets properly (key prop working)

### Extension Integration:
- [ ] Activity triggers on correct slide
- [ ] Session management works
- [ ] Multiple presenters don't conflict

### Firebase Integration:
- [ ] Files uploaded to correct path
- [ ] Download URLs generated
- [ ] Storage rules allow uploads
- [ ] Can view files in Firebase console

## Demo Scenario Test

1. **Presenter introduces activity**
   - [ ] Activity appears on student devices
   - [ ] Clear instructions visible

2. **Students work on activity**
   - [ ] 3-5 students complete work
   - [ ] Some use annotations, some don't
   - [ ] Mix of simple and complex work

3. **Students submit**
   - [ ] All submissions successful
   - [ ] Thumbnails appear in order

4. **Teacher reviews work**
   - [ ] Clicks through thumbnails
   - [ ] Expands interesting examples
   - [ ] Discusses with class
   - [ ] Easy to navigate

5. **Student updates work**
   - [ ] One student revises and resubmits
   - [ ] Version badge appears
   - [ ] Latest version shown

## Post-Test Cleanup

- [ ] Check Firebase Storage usage
- [ ] Verify all images uploaded
- [ ] Check for console errors
- [ ] Review server logs
- [ ] Note any issues for fixes

## Known Issues to Watch For

- Iframe CORS errors (should handle gracefully)
- Canvas security exceptions (should catch)
- Firebase quota limits (monitor usage)
- Network timeouts (should retry)
- Mobile keyboard covering buttons (should scroll)

## Success Criteria

✅ All basic flow tests pass
✅ Teacher dashboard shows submissions clearly
✅ No console errors during normal use
✅ Performance feels smooth
✅ Works on both desktop and mobile
✅ Error handling works gracefully

---

**Ready for demo when all checkboxes are ticked!**
