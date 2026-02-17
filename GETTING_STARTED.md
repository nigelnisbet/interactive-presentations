# Getting Started

## ✅ Your server is already running!

I can see the backend server is running on `http://localhost:3000`. Great!

## Next Steps

### 1. Start the Attendee App

Open a **new terminal** and run:

```bash
cd /Users/nnisbet/Desktop/presentations
npm run dev:app
```

You should see:
```
VITE ready in XXX ms
Local: http://localhost:5173/
```

### 2. Load the Chrome Extension

1. Open Chrome
2. Go to `chrome://extensions`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Navigate to `/Users/nnisbet/Desktop/presentations/packages/extension/dist`
6. Click "Select"

### 3. Test with slides.com

1. Go to [slides.com](https://slides.com) (create a free account if needed)
2. Open any presentation OR create a new one
3. Click the extension icon in Chrome toolbar
4. Click "Create Session"
5. You'll see a QR code and 6-digit code

### 4. Join as Attendee

On your phone or another browser:
1. Go to `http://localhost:5173`
2. Enter the 6-digit session code
3. You'll see a waiting screen

### 5. Navigate Your Slides

Navigate through your presentation. The waiting screen will remain active until you reach a slide with a configured activity.

## Setting Up Your First Activity

### Quick Test with Example Presentation

The system comes with an example configuration. To test it:

1. On slides.com, navigate to slide 3 (URL will show `#/2` - that's indexh: 2, indexv: 0)
2. The example config has a poll at that position
3. Attendee devices will show the poll automatically!

### Create Your Own Activities

1. Find your presentation ID from the URL:
   - Example: `https://slides.com/yourname/my-talk`
   - Presentation ID: `my-talk`

2. Create a config folder:
   ```bash
   mkdir packages/server/activities/my-talk
   ```

3. Create `packages/server/activities/my-talk/config.json`:
   ```json
   {
     "presentationId": "my-talk",
     "title": "My Awesome Talk",
     "activities": [
       {
         "slidePosition": { "indexh": 2, "indexv": 0 },
         "activityType": "poll",
         "activityId": "poll-1",
         "config": {
           "type": "poll",
           "question": "What's your favorite programming language?",
           "options": ["JavaScript", "Python", "Go", "Rust"],
           "allowMultiple": false,
           "showResults": "live"
         }
       }
     ]
   }
   ```

4. Restart the server (Ctrl+C, then `npm run dev:server`)

5. Navigate to slide 3 in your presentation - the poll appears!

## Finding Slide Positions

Look at your slides.com URL as you navigate:
- `#/0` = indexh: 0, indexv: 0 (first slide)
- `#/2` = indexh: 2, indexv: 0 (third slide)
- `#/2/1` = indexh: 2, indexv: 1 (third slide, second vertical)

## Example Activities

See [packages/server/activities/example-presentation/config.json](packages/server/activities/example-presentation/config.json) for:
- Single-choice polls
- Multiple-choice polls
- Timed quizzes
- Quizzes with points

## Troubleshooting

**Extension doesn't work:**
- Make sure you built it: `cd packages/extension && npm run build`
- Reload the extension in chrome://extensions
- Refresh your slides.com page

**Attendees can't connect:**
- Check server is running on port 3000
- Check attendee app is running on port 5173
- Both terminals must be open!

**Activities don't appear:**
- Verify your presentationId matches the slides.com URL
- Check slide positions (indexh/indexv) match your navigation
- Restart server after config changes
- Check server console for errors

## Local Network (For Real Presentations)

To let attendees on the same WiFi join:

1. Find your IP:
   ```bash
   ipconfig getifaddr en0  # or en1
   ```

2. Attendees visit: `http://YOUR-IP:5173`

3. Update server config:
   ```bash
   echo "ATTENDEE_APP_URL=http://YOUR-IP:5173" > packages/server/.env
   ```

## Ready to Present!

You now have:
- ✅ Backend server running
- ⏳ Attendee app (start in new terminal)
- ⏳ Chrome extension (load in browser)

Once all three are running, you're ready to create interactive presentations!

For more details, see [QUICKSTART.md](QUICKSTART.md) and [README.md](README.md).
