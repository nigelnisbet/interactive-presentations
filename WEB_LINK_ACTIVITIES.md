# Web Link Activities

The `web-link` activity type allows you to redirect attendees to external websites or web applications like ST Math games, interactive simulations, or any other web-based content.

## Configuration

```json
{
  "slidePosition": { "indexh": 2, "indexv": 0 },
  "activityType": "web-link",
  "activityId": "stmath-game",
  "config": {
    "type": "web-link",
    "title": "ST Math - Pattern Machine",
    "description": "Play the Pattern Machine puzzle game",
    "url": "https://play.stmath.com/demo.html#/play/PatternMachine/PatternMachine5Puzzles",
    "displayMode": "new-tab",
    "iframeHeight": "80vh"
  }
}
```

## Properties

### Required

- **`type`**: Must be `"web-link"`
- **`title`**: Display name for the activity
- **`url`**: The full URL to open (must include `https://` or `http://`)
- **`displayMode`**: How to display the content (see below)

### Optional

- **`description`**: Additional text shown to users
- **`iframeHeight`**: Height of iframe (only used in `iframe` mode, default: `"80vh"`)

## Display Modes

### `"new-tab"` (Recommended for most external sites)

Opens the URL in a new browser tab. Best for:
- Sites that prevent iframe embedding (like ST Math)
- Content that needs full browser features
- Full-screen experiences

**Example:**
```json
{
  "displayMode": "new-tab",
  "url": "https://play.stmath.com/demo.html#/play/PatternMachine/PatternMachine5Puzzles"
}
```

**User Experience:**
1. Activity appears on attendee device
2. New tab automatically opens with the URL
3. Instructions shown to return to the app tab when done

### `"iframe"` (For embeddable content)

Displays the URL in an iframe within the app. Best for:
- Content designed to be embedded
- Your own web apps that allow embedding
- Sites without X-Frame-Options restrictions

**Example:**
```json
{
  "displayMode": "iframe",
  "url": "https://your-webapp.com/activity",
  "iframeHeight": "600px"
}
```

**Note:** Many external sites (including ST Math) block iframe embedding for security. If the iframe appears blank, use `"new-tab"` mode instead.

### `"redirect"` (Complete navigation)

Navigates the attendee's browser directly to the URL. Use sparingly as it leaves the app entirely.

**Example:**
```json
{
  "displayMode": "redirect",
  "url": "https://example.com/activity"
}
```

**Warning:** Users will need to manually navigate back to your session after the activity.

## ST Math Examples

### Pattern Machine
```json
{
  "slidePosition": { "indexh": 3, "indexv": 0 },
  "activityType": "web-link",
  "activityId": "pattern-machine",
  "config": {
    "type": "web-link",
    "title": "ST Math - Pattern Machine",
    "description": "Complete the pattern puzzles!",
    "url": "https://play.stmath.com/demo.html#/play/PatternMachine/PatternMachine5Puzzles",
    "displayMode": "new-tab"
  }
}
```

### Other ST Math Games
Replace the game path in the URL:
- Pattern Machine: `/play/PatternMachine/PatternMachine5Puzzles`
- Number Line: `/play/NumberLine/NumberLine`
- Add your own ST Math game URLs!

## Use Cases

### 1. ST Math Games
Perfect for math practice during presentations or workshops.

### 2. External Quizzes
Link to Kahoot, Quizizz, or other quiz platforms.

### 3. Simulations
Interactive science simulations, coding environments, etc.

### 4. Forms
Google Forms, surveys, or feedback forms.

### 5. Your Own Web Apps
Any custom web application you've built.

## Complete Example Configuration

```json
{
  "presentationId": "math-workshop",
  "title": "Interactive Math Workshop",
  "activities": [
    {
      "slidePosition": { "indexh": 1, "indexv": 0 },
      "activityType": "poll",
      "activityId": "pre-assessment",
      "config": {
        "type": "poll",
        "question": "How confident are you with patterns?",
        "options": ["Very confident", "Somewhat confident", "Need practice"],
        "allowMultiple": false,
        "showResults": "live"
      }
    },
    {
      "slidePosition": { "indexh": 2, "indexv": 0 },
      "activityType": "web-link",
      "activityId": "stmath-practice",
      "config": {
        "type": "web-link",
        "title": "Practice Time - ST Math",
        "description": "Try to complete at least 3 puzzles!",
        "url": "https://play.stmath.com/demo.html#/play/PatternMachine/PatternMachine5Puzzles",
        "displayMode": "new-tab"
      }
    },
    {
      "slidePosition": { "indexh": 3, "indexv": 0 },
      "activityType": "quiz",
      "activityId": "post-assessment",
      "config": {
        "type": "quiz",
        "question": "What's the next number in the pattern: 2, 4, 6, 8, ?",
        "options": ["9", "10", "11", "12"],
        "correctAnswer": 1,
        "timeLimit": 30,
        "points": 100
      }
    }
  ]
}
```

## Tips

1. **Test First**: Always test your URLs in a regular browser before adding to config
2. **Use HTTPS**: Most modern browsers require secure connections
3. **Check Mobile**: Some sites work differently on mobile vs desktop
4. **Return Instructions**: For `new-tab` mode, remind users to return to the app tab
5. **Timing**: Consider how long the external activity will take

## Troubleshooting

**New tab doesn't open:**
- Check if popup blocker is enabled
- User might need to allow popups for your site

**Iframe shows blank:**
- Site likely blocks iframe embedding
- Switch to `"new-tab"` mode instead

**URL doesn't work:**
- Verify the URL works in a regular browser
- Check for typos, especially in hash fragments (`#/play/...`)
- Ensure URL includes `https://` or `http://`

## Security Notes

The iframe mode includes these sandbox restrictions for security:
- `allow-same-origin`: Allows the content to run
- `allow-scripts`: Required for interactive content
- `allow-popups`: For links within the embedded content
- `allow-forms`: For form submissions

These restrictions help protect attendees while allowing interactive content.
