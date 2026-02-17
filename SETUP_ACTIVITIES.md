# Setting Up Interactive Activities

## Step-by-Step Guide

### 1. Find Your Presentation ID

Look at your slides.com URL:
- Example: `https://slides.com/yourname/demo-talk`
- Presentation ID: `demo-talk` (the last part)

### 2. Create Activity Configuration

Create a folder for your presentation:

```bash
cd /Users/nnisbet/Desktop/presentations/packages/server/activities
mkdir YOUR-PRESENTATION-ID
```

Replace `YOUR-PRESENTATION-ID` with your actual presentation ID.

### 3. Create config.json

Create a file at `packages/server/activities/YOUR-PRESENTATION-ID/config.json`:

```json
{
  "presentationId": "YOUR-PRESENTATION-ID",
  "title": "My Test Presentation",
  "activities": [
    {
      "slidePosition": { "indexh": 1, "indexv": 0 },
      "activityType": "poll",
      "activityId": "poll-1",
      "config": {
        "type": "poll",
        "question": "Is this working?",
        "options": ["Yes!", "Not yet", "Having issues"],
        "allowMultiple": false,
        "showResults": "live"
      }
    },
    {
      "slidePosition": { "indexh": 2, "indexv": 0 },
      "activityType": "quiz",
      "activityId": "quiz-1",
      "config": {
        "type": "quiz",
        "question": "What is 2 + 2?",
        "options": ["3", "4", "5", "22"],
        "correctAnswer": 1,
        "timeLimit": 30,
        "points": 100
      }
    }
  ]
}
```

**Important:** Replace `YOUR-PRESENTATION-ID` with your actual ID!

### 4. Understanding Slide Positions

Slide positions are based on your URL as you navigate:

| URL                                    | indexh | indexv | Description |
|----------------------------------------|--------|--------|-------------|
| `https://slides.com/user/talk#/`      | 0      | 0      | First slide |
| `https://slides.com/user/talk#/1`     | 1      | 0      | Second slide |
| `https://slides.com/user/talk#/2`     | 2      | 0      | Third slide |
| `https://slides.com/user/talk#/2/1`   | 2      | 1      | Third slide, first vertical |

**To find positions:**
1. Open your presentation
2. Navigate to a slide
3. Look at the URL: `#/2` means `indexh: 2, indexv: 0`
4. Use those numbers in your config

### 5. Restart the Server

After creating/editing the config:

```bash
# Stop the current server (Ctrl+C in that terminal)
# Then restart:
cd /Users/nnisbet/Desktop/presentations
npm run dev:server
```

The server will load your new configuration.

### 6. Test It!

1. **In Chrome (on your slides.com presentation):**
   - Click extension icon → "Create Session"
   - Note the 6-digit code

2. **In attendee browser/phone:**
   - Go to `http://localhost:5173`
   - Enter the session code
   - You'll see the waiting screen

3. **Navigate to your configured slides:**
   - Go to slide 2 (the one with `indexh: 1`)
   - The poll should appear on the attendee screen!
   - Go to slide 3 (the one with `indexh: 2`)
   - The quiz should appear!

## Quick Example

Let's say your URL is `https://slides.com/john/my-demo`:

1. **Create folder:**
   ```bash
   mkdir packages/server/activities/my-demo
   ```

2. **Create config file:**
   ```bash
   cat > packages/server/activities/my-demo/config.json << 'EOF'
   {
     "presentationId": "my-demo",
     "title": "John's Demo",
     "activities": [
       {
         "slidePosition": { "indexh": 1, "indexv": 0 },
         "activityType": "poll",
         "activityId": "favorite-color",
         "config": {
           "type": "poll",
           "question": "What's your favorite color?",
           "options": ["Red", "Blue", "Green", "Yellow"],
           "allowMultiple": false,
           "showResults": "live"
         }
       }
     ]
   }
   EOF
   ```

3. **Restart server**
4. **Navigate to slide 2 in your presentation**
5. **Poll appears on attendee devices!**

## Troubleshooting

**Activities don't appear:**
- ✅ Check your `presentationId` matches the slides.com URL exactly
- ✅ Check slide positions (indexh/indexv) match where you navigate
- ✅ Restart the server after changing configs
- ✅ Check server console for errors

**How to see what the server loaded:**
Look at the server terminal - it will show when it loads configs and any errors.

**Need to change slide positions?**
Navigate to the slide, check the URL `#/X` or `#/X/Y`, update your config, restart server.

## Next Steps

- Add more activities to different slides
- Try different poll types (multiple choice with `"allowMultiple": true`)
- Experiment with quiz timers and points
- Check out the full example at `packages/server/activities/example-presentation/config.json`
