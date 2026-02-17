# Quick Demo Setup

## Ready-to-Use Demo Configuration

A working example is already created at:
```
packages/server/activities/demo/config.json
```

## Slide Layout

- **Slide 1** (URL: `#/0` or `#/`) - Blank (no activity)
- **Slide 2** (URL: `#/1`) - Poll: "How are you feeling today?"
- **Slide 3** (URL: `#/2`) - ST Math Pattern Machine game (opens in new tab)
- **Slide 4** (URL: `#/3`) - Quiz: "What is the capital of France?"
- **Slide 5** (URL: `#/4`) - Blank (no activity)

## To Use This Demo

### Option 1: Quick Test (Use with ANY Presentation)

1. **Open any slides.com presentation** (or create a new one with at least 5 slides)

2. **Get your presentation ID** from the URL:
   - Example: `https://slides.com/yourname/my-presentation`
   - ID: `my-presentation`

3. **Update the demo config:**
   ```bash
   # Edit the presentationId in the config file
   # Change "demo" to your actual presentation ID
   ```

   Or just rename the folder:
   ```bash
   cd /Users/nnisbet/Desktop/presentations/packages/server/activities
   mv demo YOUR-PRESENTATION-ID
   ```

   Then edit `YOUR-PRESENTATION-ID/config.json` and change the `presentationId` field.

4. **Restart the server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev:server
   ```

5. **Test it:**
   - Click extension → "Create Session"
   - Join on another device
   - Navigate through slides 1-5
   - Activities appear on slides 2, 3, and 4!

### Option 2: Create a Demo Presentation

1. **Go to slides.com**

2. **Create a new presentation called "demo"**
   - Make sure URL is: `https://slides.com/yourname/demo`

3. **Add 5 slides:**
   - Slide 1: Title slide (e.g., "Interactive Demo")
   - Slide 2: "Let's start with a poll..."
   - Slide 3: "Time for ST Math!"
   - Slide 4: "Quick quiz..."
   - Slide 5: "Thanks for participating!"

4. **Restart server** (if not already running)

5. **Test it** - activities will appear automatically!

## What Happens on Each Slide

### Slide 1 (Blank)
Attendees see the waiting screen with connection status.

### Slide 2 (Poll)
- Poll appears instantly on attendee devices
- Question: "How are you feeling today?"
- 4 emoji-based options
- Results update live as people vote
- Bar chart shows percentages

### Slide 3 (ST Math)
- New tab opens automatically with Pattern Machine
- Message shown with "Open Activity" button
- Users complete puzzles in new tab
- Return to app tab when done

### Slide 4 (Quiz)
- Quiz appears with 20-second timer
- Question: "What is the capital of France?"
- Immediate feedback (correct/incorrect)
- Shows 100 points for correct answer
- Displays correct answer after submission

### Slide 5 (Blank)
Back to waiting screen.

## Troubleshooting

**Activities don't appear:**
- Check that your presentationId matches exactly
- Look at the URL as you navigate: `#/1` = slide 2, `#/2` = slide 3, etc.
- Check server console for errors
- Make sure server restarted after config changes

**ST Math doesn't open:**
- Check if popup blocker is active
- Click the "Open Activity" button manually
- Verify the URL works in a regular browser

**Poll/Quiz doesn't appear:**
- Check browser console (F12) for errors
- Verify attendee is connected (check waiting screen)
- Make sure you're on the right slide

## Customize It

Want to change the questions or add more activities? Edit:
```
packages/server/activities/demo/config.json
```

Then restart the server.

## Next Steps

Once this demo works:
1. Create configs for your real presentations
2. Use the helper script: `./create-activity-config.sh`
3. See full docs: `SETUP_ACTIVITIES.md`
4. Add more activity types: `WEB_LINK_ACTIVITIES.md`
