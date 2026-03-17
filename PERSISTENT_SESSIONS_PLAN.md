# Persistent Personal Sessions for Sales Team - Implementation Plan

**Date:** March 17, 2026
**Goal:** Create a parallel, simplified system for sales team members to use the Conversation Tool at conferences without needing the Chrome extension.

---

## Features

✅ **Personal persistent URLs** for each sales team member (e.g., `conv-tool-james`)
✅ **Display-only mode** for polls/quizzes (visual prompts, no submit buttons)
✅ **ST Math games work normally** (web-link activities unchanged)
✅ **Presenter disconnect detection** (1-minute grace period)
✅ **Auto-redirect attendees** to stmath.com when presenter closes browser
✅ **Simple admin dashboard** to manage personal sessions
✅ **Only works with Conversation Tool** (`presentationId: "conversation-tool"`)

---

## Implementation Tasks

### 1. Backend - Persistent Session Routing

**Goal:** Map friendly URLs to long-lived sessions

- [ ] Create new route handler: `/join/conv-tool-{name}`
- [ ] Map friendly names to permanent/long-lived session codes
- [ ] Store mapping in Firebase `/personalSessions/{name}`
- [ ] Auto-create session if doesn't exist when first attendee joins
- [ ] Load activities from master Conversation Tool config (`/presentations/conversation-tool`)

**Firebase Schema:**
```json
/personalSessions/
  james/
    sessionCode: "ABC123"  // permanent or auto-generated
    presentationId: "conversation-tool"
    displayMode: "display-only"
    redirectUrl: "https://stmath.com"
    active: true
    createdAt: timestamp
    lastUsed: timestamp
```

---

### 2. Display-Only Activity Mode

**Goal:** Show questions visually without interaction

- [ ] Add `displayMode` field to activity definitions
- [ ] Modify `Poll.tsx`: hide submit button if display-only
- [ ] Modify `Quiz.tsx`: hide submit button if display-only
- [ ] Modify `TextResponse.tsx`: hide submit button if display-only
- [ ] Keep `WebLink.tsx` unchanged (games still work)
- [ ] Update Activity Builder to support display-only toggle

**Changes:**
```typescript
// In activity components
const isDisplayOnly = activity.displayMode === 'display-only';

return (
  <div>
    <h2>{activity.question}</h2>
    {activity.options.map(opt => <div key={opt}>{opt}</div>)}
    {!isDisplayOnly && <button onClick={submit}>Submit</button>}
  </div>
);
```

---

### 3. Presenter Presence Detection

**Goal:** Detect when presenter closes browser and end session

- [ ] Add presenter presence tracking to Firebase
- [ ] Use `onDisconnect()` to mark presenter as disconnected
- [ ] Implement 1-minute grace period before ending session
- [ ] When session ends, push redirect URL to all attendees
- [ ] Attendees automatically redirect to stmath.com

**Firebase Schema:**
```json
/sessions/{code}/
  presenterPresence:
    connected: true
    lastSeen: timestamp
    gracePeriodEnds: timestamp  // null or future timestamp
```

**Logic:**
1. When presenter joins, set `presenterPresence/connected = true`
2. Setup `onDisconnect()` handler to set `connected = false`
3. Cloud Function or client-side monitor checks `connected` status
4. If disconnected, wait 60 seconds (grace period)
5. If still disconnected after grace period, set session `status = 'ended'`
6. Attendees see redirect screen: "Presenter has ended the session. Redirecting to stmath.com..."

---

### 4. Admin Dashboard

**Goal:** Simple interface to manage personal sessions

- [ ] Create `/admin` route (basic auth or Firebase Auth)
- [ ] List all personal sessions with status
- [ ] Add/Edit/Delete personal session mappings
- [ ] Pause/Resume sessions (temporarily disable joins)
- [ ] Reset sessions (kick all attendees, start fresh)
- [ ] View current participant count per session
- [ ] Generate printable QR codes

**UI Mockup:**
```
Personal Sessions Admin

┌─────────────────────────────────────────────────────┐
│ Name      │ Status  │ Participants │ Last Used      │
├───────────┼─────────┼──────────────┼────────────────┤
│ James     │ Active  │ 5            │ 5 minutes ago  │
│ Sarah     │ Active  │ 12           │ 2 hours ago    │
│ Michael   │ Paused  │ 0            │ Yesterday      │
└─────────────────────────────────────────────────────┘

[+ Add New Session] [Print All QR Codes]
```

---

### 5. URL Structure & Routing

**Goal:** Clean, memorable URLs for sales team

**URL Pattern:**
- `presentations.stmath.com/conv-tool-james`
- `presentations.stmath.com/conv-tool-sarah`
- `presentations.stmath.com/conv-tool-michael`

**Routing Logic:**
```typescript
// In App.tsx
<Route path="/conv-tool-:name" element={<PersonalSessionJoin />} />

// PersonalSessionJoin component
const { name } = useParams();
const sessionMapping = await get(ref(database, `personalSessions/${name}`));
if (sessionMapping.exists()) {
  const { sessionCode } = sessionMapping.val();
  // Auto-join this session
  await joinSession(sessionCode);
  navigate('/waiting');
} else {
  // Show error: "Invalid session"
}
```

---

### 6. Testing Checklist

- [ ] Test personal URL joins (`/conv-tool-james`)
- [ ] Test display-only mode (no submit buttons visible)
- [ ] Test ST Math games still work (web-link activities)
- [ ] Test presenter disconnect (close browser tab)
- [ ] Test 1-minute grace period
- [ ] Test attendee redirect after disconnect
- [ ] Test multiple simultaneous presenters (no collision)
- [ ] Test admin dashboard CRUD operations
- [ ] Print QR codes and test scanning

---

## Files to Modify

### Existing Files:
- `packages/attendee-app/src/App.tsx` - Add `/conv-tool-:name` route
- `packages/attendee-app/src/contexts/FirebaseContext.tsx` - Presenter presence logic
- `packages/attendee-app/src/components/activities/Poll.tsx` - Display-only mode
- `packages/attendee-app/src/components/activities/Quiz.tsx` - Display-only mode
- `packages/attendee-app/src/components/activities/TextResponse.tsx` - Display-only mode
- `packages/attendee-app/src/pages/ActivityBuilder.tsx` - Display-only toggle

### New Files:
- `packages/attendee-app/src/pages/AdminDashboard.tsx` - Admin interface
- `packages/attendee-app/src/pages/PersonalSessionJoin.tsx` - Personal URL handler
- `packages/attendee-app/src/components/RedirectScreen.tsx` - Session ended screen

---

## Implementation Phases

### Phase 1: Core Functionality (MVP)
1. Personal session routing
2. Display-only mode
3. Basic presenter presence detection

**Goal:** Working demo for sales team meeting

### Phase 2: Polish & Admin
1. 1-minute grace period
2. Admin dashboard
3. QR code generation

**Goal:** Production-ready for conferences

### Phase 3: Enhancements (Optional)
1. Session analytics
2. Custom redirect URLs per session
3. Scheduling (auto-activate sessions for events)

---

## Estimated Effort

- **Phase 1 (MVP):** 1 day
- **Phase 2 (Production):** 1-2 days
- **Phase 3 (Optional):** 1 day

**Total:** 2-3 days for full implementation

---

## Benefits

✅ **Zero friction for sales team** - no extension, no setup
✅ **Printable QR codes** - works offline at booths
✅ **Doesn't affect existing system** - parallel implementation
✅ **Centralized content management** - you update, they benefit
✅ **Professional UX** - attendees get clean redirect when done

---

## Next Steps

1. ✅ Brainstorm and design (COMPLETE)
2. [ ] Implement Phase 1 (MVP)
3. [ ] Test with sample personal session
4. [ ] Demo to sales team
5. [ ] Implement Phase 2 based on feedback
6. [ ] Deploy to production
7. [ ] Print QR codes for team members

---

**Status:** Ready to implement
**Priority:** High (conference use case)
**Risk:** Low (isolated from main system)
