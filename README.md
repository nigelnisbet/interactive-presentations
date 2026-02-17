# Interactive Presentations

Turn your slides.com presentations into interactive experiences! Attendees join via QR code and participate in polls, quizzes, and games as you present.

## Architecture

- **Chrome Extension**: Detects slide changes in your slides.com presentation
- **Backend Server**: Real-time communication via Socket.IO
- **Attendee Web App**: Mobile-friendly interface for participants
- **Shared Types**: TypeScript types used across all components

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Redis

```bash
docker-compose up -d
```

### 3. Start Development Servers

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3000`
- Attendee app on `http://localhost:5173`
- Extension build in watch mode

### 4. Load Chrome Extension

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `packages/extension/dist` directory

## Usage

### Creating a Session

1. Open your slides.com presentation in Chrome
2. Click the extension icon in your toolbar
3. Click "Create Session"
4. Share the QR code or session code with attendees

### Joining as an Attendee

1. Scan the QR code or visit the attendee app
2. Enter the session code
3. Wait for interactive activities to appear

### Configuring Activities

Create a JSON file at `packages/server/activities/{your-presentation-id}/config.json`:

```json
{
  "presentationId": "my-presentation",
  "title": "My Awesome Presentation",
  "activities": [
    {
      "slidePosition": { "indexh": 2, "indexv": 0 },
      "activityType": "poll",
      "activityId": "poll-1",
      "config": {
        "type": "poll",
        "question": "What's your favorite feature?",
        "options": ["Polls", "Quizzes", "Games"],
        "allowMultiple": false,
        "showResults": "live"
      }
    }
  ]
}
```

## Project Structure

```
presentations/
├── packages/
│   ├── shared/          # Shared TypeScript types
│   ├── server/          # Backend server (Express + Socket.IO)
│   ├── attendee-app/    # React web app for participants
│   └── extension/       # Chrome extension
├── docker-compose.yml   # Redis container
└── package.json         # Monorepo configuration
```

## Development

### Building Individual Packages

```bash
npm run build:shared      # Build shared types
npm run build:server      # Build backend
npm run build:app         # Build attendee app
npm run build:extension   # Build extension
```

### Environment Variables

Create `packages/server/.env`:

```env
PORT=3000
REDIS_URL=redis://localhost:6379
ATTENDEE_APP_URL=http://localhost:5173
NODE_ENV=development
```

## Testing

See the plan file for detailed end-to-end testing steps.

## Future Enhancements

- PostgreSQL for session persistence and analytics
- Web-based activity configuration UI
- Advanced activity types (word clouds, drawings, team challenges)
- Presenter dashboard with real-time analytics
- Results export (CSV/PDF)
