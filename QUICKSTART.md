# Quick Start Guide

Your interactive presentation system is ready! Here's how to get started.

## What You Just Built

A complete real-time interactive presentation system with:
- ✅ Chrome extension that monitors slides.com presentations
- ✅ Backend server with WebSocket support
- ✅ Mobile-friendly attendee web app
- ✅ Poll and Quiz activities with live results
- ✅ QR code generation for easy joining

## First-Time Setup

### 1. Start the Backend Server

```bash
cd /Users/nnisbet/Desktop/presentations
npm run dev:server
```

The server will start on `http://localhost:3000`

### 2. Start the Attendee App

In a new terminal:

```bash
cd /Users/nnisbet/Desktop/presentations
npm run dev:app
```

The app will be available at `http://localhost:5173`

### 3. Load the Chrome Extension

1. Open Chrome and go to [chrome://extensions](chrome://extensions)
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Navigate to `/Users/nnisbet/Desktop/presentations/packages/extension/dist`
5. Click "Select"

The extension icon should now appear in your toolbar!

## Your First Presentation

### Step 1: Create a Test Presentation on slides.com

1. Go to [slides.com](https://slides.com) and create a free account
2. Create a new presentation with at least 3 slides
3. Note the URL (e.g., `https://slides.com/yourname/my-presentation`)
4. The presentation ID is the last part: `my-presentation`

### Step 2: Configure Activities

Create a folder for your presentation:

```bash
mkdir packages/server/activities/my-presentation
```

Copy the example config:

```bash
cp packages/server/activities/example-presentation/config.json packages/server/activities/my-presentation/
```

Edit `packages/server/activities/my-presentation/config.json`:
- Change `presentationId` to match your slides.com URL
- Adjust `slidePosition` values to match your slides (see below)

**Finding Slide Positions:**
- Open your presentation on slides.com
- Navigate to a slide
- Look at the URL: `https://slides.com/user/presentation#/2/0`
  - The first number (2) is `indexh`
  - The second number (0) is `indexv`
- For slides with no second number: `#/2` means `indexh: 2, indexv: 0`

### Step 3: Present!

1. Open your slides.com presentation in Chrome
2. Click the extension icon
3. Click "Create Session"
4. You'll see a QR code and session code (e.g., "ABC123")

### Step 4: Join as Attendee

On your phone or another browser:
1. Go to `http://localhost:5173` (or your computer's IP address on the same network)
2. Enter the session code
3. You'll see a waiting screen

### Step 5: Navigate to an Interactive Slide

1. In your presentation, navigate to a slide with an activity configured
2. The activity will automatically appear on attendee devices!
3. Attendees can submit responses
4. For polls with `"showResults": "live"`, results update in real-time

## Network Setup (For Real Presentations)

### Local Network (Recommended for conferences)

1. Find your computer's IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Attendees connect to: `http://YOUR-IP:5173`

3. Update server config:
   - Edit `packages/server/.env` (create from `.env.example`)
   - Set `ATTENDEE_APP_URL=http://YOUR-IP:5173`

### Deploy to Cloud (For Remote Presentations)

For production use, deploy:
- Backend to Railway, Render, or DigitalOcean
- Attendee app to Vercel or Netlify
- Update URLs in configs

## Activity Types

### Poll Example

```json
{
  "slidePosition": { "indexh": 2, "indexv": 0 },
  "activityType": "poll",
  "activityId": "poll-favorite-color",
  "config": {
    "type": "poll",
    "question": "What's your favorite color?",
    "options": ["Red", "Blue", "Green"],
    "allowMultiple": false,
    "showResults": "live"
  }
}
```

### Quiz Example

```json
{
  "slidePosition": { "indexh": 4, "indexv": 0 },
  "activityType": "quiz",
  "activityId": "quiz-trivia",
  "config": {
    "type": "quiz",
    "question": "What is 2 + 2?",
    "options": ["3", "4", "5", "6"],
    "correctAnswer": 1,
    "timeLimit": 30,
    "points": 100
  }
}
```

## Troubleshooting

### Extension doesn't detect slides

- Make sure you're on a slides.com page
- Refresh the page after loading the extension
- Check the browser console for errors (F12 → Console)

### Attendees can't connect

- Make sure backend server is running
- Check that you're using the correct IP address
- Ensure you're on the same network (if local)
- Check firewall settings

### Activities don't appear

- Verify your `presentationId` matches the slides.com URL
- Double-check slide positions (indexh/indexv)
- Restart the server after changing configs
- Check server console for errors

## Next Steps

1. **Create your own activities**: Edit JSON configs for your presentations
2. **Test with friends**: Get feedback on the experience
3. **Customize styling**: Edit Tailwind classes in attendee app components
4. **Add more activity types**: ST Math games, word clouds (see plan file)
5. **Deploy to production**: Use Railway + Vercel for hosting

## Tips for Great Presentations

1. **Keep polls simple**: 3-5 options work best
2. **Use quizzes for engagement**: Add time pressure for excitement
3. **Show live results**: Audiences love seeing real-time responses
4. **Test beforehand**: Run through once before your actual presentation
5. **Have a backup**: Always have your regular slides ready

## Support

For issues or questions:
- Check the README.md for architecture details
- Review the plan file at `~/.claude/plans/wiggly-inventing-music.md`
- Examine server logs for debugging
- Check browser console for frontend errors

Enjoy your interactive presentations! 🎉
