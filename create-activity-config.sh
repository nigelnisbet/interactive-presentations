#!/bin/bash

echo "╔════════════════════════════════════════════════════════╗"
echo "║  Interactive Presentations - Activity Setup Helper    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "This will create a sample activity configuration for your presentation."
echo ""

# Get presentation ID
echo "📝 Step 1: Enter your presentation ID"
echo "   (This is the last part of your slides.com URL)"
echo "   Example: https://slides.com/yourname/demo-talk → 'demo-talk'"
echo ""
read -p "Presentation ID: " PRES_ID

if [ -z "$PRES_ID" ]; then
    echo "❌ Error: Presentation ID cannot be empty"
    exit 1
fi

# Create directory
DIR="packages/server/activities/${test-interactive}"
mkdir -p "$DIR"

# Create config
cat > "$DIR/config.json" << EOF
{
  "presentationId": "${PRES_ID}",
  "title": "My Interactive Presentation",
  "description": "Created with activity setup helper",
  "activities": [
    {
      "slidePosition": { "indexh": 1, "indexv": 0 },
      "activityType": "poll",
      "activityId": "poll-test",
      "config": {
        "type": "poll",
        "question": "Is this interactive presentation system working?",
        "options": [
          "Yes, it's amazing! 🎉",
          "Getting there...",
          "Having some issues"
        ],
        "allowMultiple": false,
        "showResults": "live"
      }
    },
    {
      "slidePosition": { "indexh": 2, "indexv": 0 },
      "activityType": "quiz",
      "activityId": "quiz-test",
      "config": {
        "type": "quiz",
        "question": "What is 2 + 2?",
        "options": [
          "3",
          "4",
          "5",
          "22 (if concatenated!)"
        ],
        "correctAnswer": 1,
        "timeLimit": 30,
        "points": 100
      }
    }
  ]
}
EOF

echo ""
echo "✅ Configuration created successfully!"
echo ""
echo "📁 Location: $DIR/config.json"
echo ""
echo "📍 Activities configured for:"
echo "   • Slide 2 (URL #/1) → Poll"
echo "   • Slide 3 (URL #/2) → Quiz"
echo ""
echo "🔄 Next steps:"
echo "   1. Restart your server (Ctrl+C, then 'npm run dev:server')"
echo "   2. Open your slides.com presentation"
echo "   3. Create a session in the extension"
echo "   4. Join on another device with the code"
echo "   5. Navigate to slide 2 or 3 → activities appear!"
echo ""
echo "💡 Tip: Watch the URL as you navigate slides:"
echo "   #/0 = slide 1 (indexh: 0)"
echo "   #/1 = slide 2 (indexh: 1) ← Poll is here"
echo "   #/2 = slide 3 (indexh: 2) ← Quiz is here"
echo ""
echo "📖 For more help, see: SETUP_ACTIVITIES.md"
echo ""
