# Activity Configurations

This directory contains activity configurations for different presentations.

## Structure

Each presentation should have its own folder named after the presentation ID:

```
activities/
├── example-presentation/
│   └── config.json
├── my-conference-talk/
│   └── config.json
└── workshop-2024/
    └── config.json
```

## Configuration Format

Each `config.json` file should follow this structure:

```json
{
  "presentationId": "unique-presentation-id",
  "title": "Presentation Title",
  "description": "Optional description",
  "activities": [
    {
      "slidePosition": { "indexh": 2, "indexv": 0 },
      "activityType": "poll",
      "activityId": "unique-activity-id",
      "config": {
        // Activity-specific configuration
      }
    }
  ]
}
```

## Slide Position

- `indexh`: Horizontal slide index (0-based)
- `indexv`: Vertical slide index (0-based, use 0 if no vertical slides)

To find the slide position in slides.com:
1. Open your presentation
2. Navigate to the slide
3. Look at the URL: `https://slides.com/user/presentation#/2/1`
   - The first number (2) is `indexh`
   - The second number (1) is `indexv`

## Activity Types

### Poll

```json
{
  "type": "poll",
  "question": "Your question here?",
  "options": ["Option 1", "Option 2", "Option 3"],
  "allowMultiple": false,
  "showResults": "live"
}
```

- `allowMultiple`: Allow selecting multiple options
- `showResults`: `"live"`, `"after-close"`, or `"never"`

### Quiz

```json
{
  "type": "quiz",
  "question": "Your question here?",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": 1,
  "timeLimit": 30,
  "points": 100
}
```

- `correctAnswer`: Index of the correct option (0-based)
- `timeLimit`: Time in seconds (optional)
- `points`: Base points for correct answer

## Example

See `example-presentation/config.json` for a complete example with multiple activity types.

## Tips

1. **Presentation ID**: Use the last part of your slides.com URL as the presentation ID
2. **Activity IDs**: Make them descriptive and unique within the presentation
3. **Testing**: Start with just one activity to test the setup
4. **Live Results**: Use `"showResults": "live"` for polls to show real-time updates
5. **Timed Quizzes**: Add time pressure with `timeLimit` for more engaging quizzes
