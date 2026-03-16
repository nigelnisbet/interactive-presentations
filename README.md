# Interactive Presentations

Transform your Google Slides presentations into interactive, real-time experiences! Attendees join via QR code and participate in polls, quizzes, and ST Math games as you present.

## 🏗️ Architecture

**Current Stack (Firebase-based):**
- **Chrome Extension** - Detects slide changes in Google Slides
- **Firebase Realtime Database** - Real-time sync between presenter and attendees
- **Firebase Storage** - Student work submissions and uploads
- **Attendee/Presenter Web App** - Mobile-friendly interface for participants
- **Activity Builder** - Visual interface to create activities
- **Shared Types** - TypeScript types used across all components

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Firebase project configured

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development

```bash
npm run dev
```

This starts:
- Attendee app on `http://localhost:5173`
- Extension build in watch mode

### 3. Load Chrome Extension

1. Open Chrome → `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `packages/extension/dist` directory

## 📖 Documentation

Full documentation available in [docs/](docs/):
- [Getting Started Guide](docs/guides/GETTING_STARTED.md)
- [Adding Activity Types](docs/guides/ADDING_NEW_ACTIVITY_TYPES.md)
- [Deployment Guide](docs/guides/PRODUCTION_DEPLOYMENT.md)
- [Activity Documentation](docs/activities/)

## 🎯 Usage

### Creating a Session

1. Open Google Slides presentation
2. Click extension icon
3. Click "Start Session"
4. Share QR code with attendees

### Joining as Attendee

1. Scan QR code or visit attendee app
2. Automatically joins session
3. Participate in activities as they appear

### Creating Activities

Use the Activity Builder at `/builder` or manually create JSON configs.

## 📦 Project Structure

```
interactive-presentations/
├── packages/
│   ├── shared/                 # Shared TypeScript types
│   ├── attendee-app/           # React web app (attendee + presenter + builder)
│   ├── extension/              # Chrome extension for regular slides
│   ├── extension-google-slides/# Chrome extension for Google Slides
│   └── sample-activities/      # Canvas-based activity templates
├── docs/                       # Documentation
└── package.json                # Monorepo configuration
```

## 🛠️ Building

```bash
npm run build:shared      # Build shared types
npm run build:app         # Build attendee app
npm run build:extension   # Build extension
```

## 🌐 Deployment

- **Attendee App**: Hosted at presentations.stmath.com
- **Activity Builder**: Available at presentations.stmath.com/builder
- **Chrome Extension**: Load unpacked for development, package for distribution

See [Deployment Guide](docs/guides/PRODUCTION_DEPLOYMENT.md) for details.

## 🎮 Activity Types

- **Poll** - Multiple choice questions with live results
- **Quiz** - Timed questions with scoring and leaderboards
- **Text Response** - Open-ended questions
- **Review Game** - Kahoot-style competitive quiz
- **Submit-Sample** - Canvas-based student work with annotations
- **ST Math Games** - Embedded games via iframe
- **Trillionaire** - Collaborative tap game

## 🔧 Development

### Environment Variables

Create `packages/attendee-app/.env.local`:

```env
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project
# ... other Firebase config
```

### Building Individual Packages

Each package can be built independently:

```bash
cd packages/attendee-app && npm run build
cd packages/extension && npm run build
```

## 📝 License

Private project for ST Math educational content.
