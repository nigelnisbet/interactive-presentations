# Interactive Presentations - Project Status

**Last Updated**: February 17, 2026

## Project Overview

An interactive presentation system that transforms Google Slides presentations into real-time, multi-device experiences. Presenters use a Chrome extension to run presentations while attendees join via their phones/devices to participate in polls, quizzes, and ST Math games.

## System Architecture

### Three Main Components:

1. **Chrome Extension** (`packages/extension/`)
   - Runs in Google Slides presentations
   - Detects slide changes and triggers activities
   - Displays QR codes and session codes
   - Shows presenter dashboard link
   - Built with: Vite, TypeScript, React

2. **Backend Server** (`packages/server/`)
   - WebSocket server (Socket.IO) for real-time communication
   - Session management (in-memory)
   - Activity loading and result aggregation
   - QR code generation
   - Built with: Express, Socket.IO, TypeScript

3. **Attendee/Presenter Web App** (`packages/attendee-app/`)
   - Attendee interface: Join sessions, participate in activities
   - Presenter dashboard: View results, participant stats
   - Activity Builder: Create activities via UI
   - Built with: React, Vite, TypeScript

4. **Shared Package** (`packages/shared/`)
   - Common TypeScript types
   - Event definitions
   - Activity interfaces

## ✅ What's Working

### Core Functionality
- ✅ Extension detects when Google Slides presentation starts
- ✅ Creates unique session codes (6 characters)
- ✅ Generates QR codes for easy joining
- ✅ Attendees can join via QR code or typing URL (auto-join, no manual code entry)
- ✅ Real-time slide synchronization
- ✅ Activities trigger automatically based on slide position

### Activity Types
- ✅ **Polls**: Multiple choice questions with live result updates
- ✅ **Quizzes**: Timed questions with correct/incorrect tracking, points, leaderboards
- ✅ **ST Math Games**: Placeholder for embedded games (iframe ready)

### Mobile Support
- ✅ Phone connection works on Chrome mobile
- ✅ Auto-reconnection after tab switching/timeouts
- ✅ Safari mobile has issues (use Chrome)

### Data Flow
- ✅ Poll responses flow to presenter dashboard in real-time
- ✅ Quiz results show per-option breakdown
- ✅ Presenter dashboard shows participant count
- ✅ Results display correctly on both attendee and presenter views

### Activity Builder (NEW!)
- ✅ Visual interface to create activities
- ✅ Support for all activity types (poll, quiz, stmath)
- ✅ JSON export (copy/download)
- ✅ Form validation
- ✅ Activity list management

## 📁 File Structure

```
interactive-presentations/
├── packages/
│   ├── extension/
│   │   ├── src/
│   │   │   ├── background/     # Extension service worker
│   │   │   ├── content/        # Injected into Google Slides
│   │   │   ├── popup/          # Extension popup UI
│   │   │   └── data/
│   │   │       └── presentations/  # Activity JSON files
│   │   │           └── JpLoPiI.json  # Demo presentation activities
│   │   └── dist/               # Built extension
│   │
│   ├── server/
│   │   ├── src/
│   │   │   ├── socket/
│   │   │   │   └── socket-handler.ts  # WebSocket event handling
│   │   │   ├── services/
│   │   │   │   ├── session-manager.ts  # Session CRUD
│   │   │   │   ├── activity-loader.ts  # Load activities from JSON
│   │   │   │   └── qr-generator.ts     # Generate QR codes
│   │   │   ├── activities/
│   │   │   │   ├── poll-handler.ts     # Poll logic
│   │   │   │   └── quiz-handler.ts     # Quiz logic
│   │   │   └── index.ts        # Express + Socket.IO server
│   │   └── .env                # Server config (PORT, ATTENDEE_APP_URL)
│   │
│   ├── attendee-app/
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── JoinSession.tsx          # Entry point
│   │   │   │   ├── WaitingScreen.tsx        # Between activities
│   │   │   │   ├── PresenterDashboard.tsx   # Results view
│   │   │   │   └── ActivityBuilder.tsx      # NEW! Create activities
│   │   │   ├── components/
│   │   │   │   └── activities/
│   │   │   │       ├── Poll.tsx
│   │   │   │       ├── Quiz.tsx
│   │   │   │       └── WebLink.tsx
│   │   │   └── contexts/
│   │   │       └── SocketContext.tsx   # Socket.IO client
│   │   ├── .env.development     # Dev server URL
│   │   └── .env.production      # Production server URL
│   │
│   └── shared/
│       └── src/
│           └── types/
│               ├── activity.ts   # Activity type definitions
│               └── events.ts     # Socket event types
│
└── package.json  # Root workspace config
```

## 🚀 How to Run (Development)

### Prerequisites
- Node.js 18+ installed
- npm installed
- Chrome browser

### Start All Servers
```bash
cd ~/Desktop/interactive-presentations
npm install  # If not already done
npm run dev  # Starts all 3 servers concurrently
```

This starts:
- **Server**: `http://localhost:3000` (backend)
- **Attendee App**: `http://localhost:5173` (frontend)
- **Extension**: Builds to `packages/extension/dist/` (watch mode)

### Load Extension in Chrome
1. Open Chrome → `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select: `~/Desktop/interactive-presentations/packages/extension/dist`

### Test a Presentation
1. Open [test slides](https://docs.google.com/presentation/d/1JpLoPiIv9eWyghON5LfJJW3M7gAYPfqYkv4Yrd1a0o8/edit)
2. Start presenting (Present mode)
3. Extension popup shows session code + QR code
4. On phone: Scan QR code or visit `http://192.168.1.246:5173/?code=XXXXXX`
5. Navigate slides - activities trigger automatically!

### Activity Builder
Visit: `http://localhost:5173/builder`

## 🔧 Configuration Files

### Server Configuration
**File**: `packages/server/.env`
```env
PORT=3000
ATTENDEE_APP_URL=http://192.168.1.246:5173
NODE_ENV=development
SESSION_EXPIRY_HOURS=24
```

### Attendee App - Development
**File**: `packages/attendee-app/.env.development`
```env
VITE_SERVER_URL=http://192.168.1.246:3000
```

### Attendee App - Production
**File**: `packages/attendee-app/.env.production`
```env
VITE_SERVER_URL=http://192.168.1.246:3000
```
*Note: Update to production URL when deploying*

## 📝 How to Create Activities

### Option 1: Activity Builder (Recommended)
1. Navigate to: `http://localhost:5173/builder`
2. Select activity type (Poll, Quiz, or ST Math)
3. Fill out form fields
4. Click "Add Activity to List"
5. Repeat for more activities
6. Click "Copy JSON" or "Download JSON"
7. Save JSON to: `packages/extension/src/data/presentations/{presentationId}.json`

### Option 2: Manual JSON
Create a file: `packages/extension/src/data/presentations/YOUR_PRESENTATION_ID.json`

Example structure:
```json
[
  {
    "activityId": "poll-1",
    "slidePosition": { "indexh": 1, "indexv": 0 },
    "config": {
      "type": "poll",
      "question": "How are you feeling?",
      "options": ["😊 Great!", "😐 Okay", "😴 Tired"],
      "showResults": "live"
    }
  },
  {
    "activityId": "quiz-1",
    "slidePosition": { "indexh": 3, "indexv": 0 },
    "config": {
      "type": "quiz",
      "question": "What is 2+2?",
      "options": ["3", "4", "5"],
      "correctAnswer": 1,
      "timeLimit": 30,
      "showResults": "end"
    }
  }
]
```

**How to find Presentation ID:**
- Google Slides URL: `https://docs.google.com/presentation/d/1JpLoPiIv9eWyghON5LfJJW3M7gAYPfqYkv4Yrd1a0o8/edit`
- Presentation ID: `JpLoPiI` (first 7 chars after `/d/`)

**How to find Slide Position:**
- Present the slides
- Open browser console (F12)
- Look at URL: `#slide=id.g1234567890_0_5`
- First number = indexh (horizontal), second = indexv (vertical)
- Or check extension console logs

## 🐛 Known Issues & Solutions

### Issue: Phone Safari doesn't connect
**Solution**: Use Chrome mobile instead. Safari has WebSocket compatibility issues.

### Issue: Connection drops when switching tabs
**Solution**: Auto-reconnection is enabled! It will reconnect within 1-5 seconds.

### Issue: Activities not loading
**Troubleshooting:**
1. Check presentation ID matches filename
2. Verify slide position coordinates
3. Check browser console for errors
4. Ensure `npm run build:shared` was run

### Issue: npm install permission errors
**Solution**:
```bash
sudo chown -R 501:20 "/Users/mindadmin/.npm"
npm install
```

## 📦 Building for Production

### Build Attendee App
```bash
cd packages/attendee-app
npm run build
# Output: dist/ folder
```

### Build Extension
```bash
cd packages/extension
npm run build
# Output: dist/ folder
# Zip this folder to distribute
```

### Build Server
```bash
cd packages/server
npm run build
# Output: dist/ folder
# Run with: node dist/index.js
```

## 🌐 Deployment Plan (Next Steps)

### Phase 1: Basic Public Deployment
**Goal**: Make attendee app accessible to anyone with a link

**Steps:**
1. Deploy server to Mind server with HTTPS
   - Example domain: `presentations.mindresearch.org`
   - Requires: SSL certificate (Let's Encrypt)
   - Requires: Nginx reverse proxy config

2. Update environment variables:
   - Server `.env`: Update `ATTENDEE_APP_URL` to production domain
   - Attendee app `.env.production`: Update `VITE_SERVER_URL` to production server

3. Build and deploy attendee app:
   ```bash
   cd packages/attendee-app
   npm run build
   # Copy dist/ contents to web server
   ```

4. Run server on Mind server:
   ```bash
   cd packages/server
   NODE_ENV=production PORT=3000 node dist/index.js
   # Or use PM2 for process management
   ```

### Phase 2: Extension Distribution
**Goal**: Allow other presenters to use the extension

**Approach**: Private distribution (not Chrome Web Store)

**Steps:**
1. Update extension config with production URLs
2. Build extension: `npm run build`
3. Zip `packages/extension/dist/` folder
4. Share with users + instructions:
   - Enable "Developer mode" in Chrome
   - "Load unpacked"
   - Select unzipped folder

### Phase 3: Improve Activity Authoring
**Current**: Activity Builder UI exists but needs testing

**Future Enhancements:**
- Templates for common activity types
- Import/export presets
- Google Slides speaker notes integration
- Activity preview mode

## 🔑 Key Technical Decisions

### Why Socket.IO?
- Real-time bidirectional communication
- Auto-reconnection
- Fallback to polling if WebSocket fails
- Room-based broadcasting

### Why In-Memory Sessions?
- Simple for MVP
- No database setup needed
- Fast performance
- Sessions expire after 24 hours
- Future: Could move to Redis for persistence

### Why Monorepo?
- Shared types between packages
- Easy to keep in sync
- Single `npm install`
- Shared build commands

### Why Auto-Join?
- Reduces friction for attendees
- QR code includes session code in URL
- One scan → instant join
- No typing required

## 🎯 Critical Files to Remember

### Activity Logic
- `packages/server/src/socket/socket-handler.ts` - ALL socket event handling
- `packages/server/src/activities/poll-handler.ts` - Poll aggregation
- `packages/server/src/activities/quiz-handler.ts` - Quiz scoring

### Activity Types
- `packages/shared/src/types/activity.ts` - Type definitions (add new types here)

### WebSocket Events
- `packages/shared/src/types/events.ts` - Event names and payloads

### Extension Entry Points
- `packages/extension/src/background/index.ts` - Extension lifecycle
- `packages/extension/src/content/index.ts` - Google Slides integration
- `packages/extension/src/popup/Popup.tsx` - Popup UI

### Attendee App Routing
- `packages/attendee-app/src/App.tsx` - All routes
- `packages/attendee-app/src/contexts/SocketContext.tsx` - Socket client

## 📊 Current Test Data

**Test Presentation**:
- ID: `JpLoPiI`
- URL: https://docs.google.com/presentation/d/1JpLoPiIv9eWyghON5LfJJW3M7gAYPfqYkv4Yrd1a0o8/edit
- Activities:
  - Slide 1: Poll (How are you feeling?)
  - Slide 2: ST Math game placeholder
  - Slide 3: Quiz (Capital of France)

## 🎉 Major Accomplishments This Session

1. ✅ Fixed poll/quiz data not reaching presenter dashboard
   - Added `activityId` to activity broadcasts
   - Implemented quiz results aggregation
   - Fixed type mismatches in QuizResults interface

2. ✅ Deployed to Firebase (then reverted to local)
   - Learned about HTTPS → HTTP WebSocket blocking
   - Fixed base path issues for subdirectory deployment
   - Configured React Router basename

3. ✅ Resolved phone connection issues
   - Created `.env.development` and `.env.production` files
   - Discovered Safari compatibility issues
   - Implemented auto-reconnection on ping timeout

4. ✅ Built Activity Builder UI
   - Visual form-based activity creation
   - JSON export and download
   - Validation and preview

5. ✅ Added automatic reconnection
   - Session persistence in sessionStorage
   - Auto-rejoin on reconnect
   - User feedback for connection issues

## 🔮 Future Enhancements (Ideas)

- [ ] Persistent sessions (Redis/database)
- [ ] Activity templates library
- [ ] Google Slides API integration (auto-detect activities from speaker notes)
- [ ] More activity types (word clouds, drawings, ratings)
- [ ] Session recordings/analytics
- [ ] Multi-presenter support
- [ ] Breakout rooms
- [ ] Audio/video integration
- [ ] Accessibility improvements (keyboard nav, screen readers)
- [ ] Offline mode for attendees
- [ ] Export results to CSV/PDF

## 📞 Support & Debugging

### Check Server Logs
```bash
# Server is running in terminal
# Look for connection/disconnection messages
# Check for "Activity started" logs
```

### Check Browser Console (Attendee)
- F12 → Console tab
- Look for "Initializing socket with SERVER_URL"
- Check for connection errors

### Check Extension Console (Presenter)
- Click extension icon → Right-click → "Inspect popup"
- Check for presentation detection logs

### Network Issues
- Ensure both devices on same WiFi
- Check firewall settings (macOS may block port 3000)
- Verify IP address: `ipconfig getifaddr en0` (macOS)

## 🎓 Quick Reference

### Start Dev Environment
```bash
cd ~/Desktop/interactive-presentations && npm run dev
```

### Kill Port if Stuck
```bash
lsof -ti:3000 | xargs kill -9  # Kill port 3000
lsof -ti:5173 | xargs kill -9  # Kill port 5173
```

### Rebuild Shared Package
```bash
npm run build:shared
```

### Access Points
- Attendee Join: http://localhost:5173
- Activity Builder: http://localhost:5173/builder
- Presenter Dashboard: http://localhost:5173/presenter/:code
- Server Health: http://localhost:3000/health

---

**Status**: ✅ Fully functional for local development and testing. Ready for deployment planning.
