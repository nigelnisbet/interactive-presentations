# Configure Extension for Personal Session Mode

## Overview
This guide explains how to configure the extension for a sales team member so it automatically uses their personal session code.

---

## Step 1: Get Team Member's Personal Session Info

Run the seed script if you haven't already:
```bash
node seed-personal-session.js
```

This outputs each team member's:
- Name (e.g., `james`)
- Session Code (e.g., `7MC7CD`)
- URL (e.g., `https://presentations.stmath.com/conv-tool/james`)

---

## Step 2: Configure the Extension

Open: `packages/extension/src/personal-session-config.ts`

Update the configuration:

```typescript
export const personalSessionConfig: PersonalSessionConfig = {
  enabled: true,  // ← Change to true
  teamMemberName: 'james',  // ← Team member's name
  sessionCode: '7MC7CD',  // ← Their personal session code
  allowedPresentationIds: ['conversation-tool'],  // ← Stays the same
};
```

**Example for James:**
```typescript
export const personalSessionConfig: PersonalSessionConfig = {
  enabled: true,
  teamMemberName: 'james',
  sessionCode: '7MC7CD',
  allowedPresentationIds: ['conversation-tool'],
};
```

---

## Step 3: Build the Extension

```bash
cd packages/extension
npm run build
```

This creates the extension in `packages/extension/dist/`

---

## Step 4: Install on Team Member's Computer

### First Time Installation:
1. Open Chrome
2. Go to `chrome://extensions`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `packages/extension/dist` folder
6. Extension is now installed!

### Updates (When Code Changes):
1. Go to `chrome://extensions`
2. Find "Interactive Presentations"
3. Click the refresh icon ↻

---

## How It Works

Once configured:

1. **Team member opens Conversation Tool**
   - URL: `https://mind.slides.com/jedmiston/conversation-tool/fullscreen`

2. **Extension auto-detects the presentation**
   - Sees `presentationId: "conversation-tool"`
   - Checks if personal session mode is enabled

3. **Automatically uses personal session**
   - Connects to their permanent session code (e.g., `7MC7CD`)
   - No need to click "Start Session"
   - No random code generation

4. **QR code shows friendly URL**
   - Instead of: `presentations.stmath.com/join/7MC7CD`
   - Shows: `presentations.stmath.com/conv-tool/james`

5. **Attendees scan QR → auto-join**
   - Visit `/conv-tool/james`
   - System looks up james's session code
   - Joins session automatically

6. **Presenter navigates slides normally**
   - Extension tracks slide changes
   - Updates Firebase automatically
   - Activities trigger at correct slides

---

## Creating Builds for Multiple Team Members

To create customized extensions for each team member:

### Option A: Manual (Simple)
1. Edit `personal-session-config.ts` for James
2. Build extension → save as `extension-james.zip`
3. Edit config for Sarah
4. Build extension → save as `extension-sarah.zip`
5. Repeat for each member

### Option B: Script (Advanced)
Create a build script that generates all versions:

```bash
#!/bin/bash
# build-all-extensions.sh

MEMBERS=("james:7MC7CD" "sarah:RHXZ9V" "michael:QY9G4H")

for member in "${MEMBERS[@]}"; do
  IFS=':' read -r name code <<< "$member"

  # Update config
  sed -i '' "s/enabled: false/enabled: true/" personal-session-config.ts
  sed -i '' "s/teamMemberName: ''/teamMemberName: '$name'/" personal-session-config.ts
  sed -i '' "s/sessionCode: ''/sessionCode: '$code'/" personal-session-config.ts

  # Build
  npm run build

  # Package
  cd dist
  zip -r "../extension-$name.zip" .
  cd ..

  echo "✅ Built extension for $name"
done
```

---

## Testing Personal Session Mode

1. **Build extension with James's config**
2. **Load in Chrome**
3. **Open Conversation Tool**
4. **On another device/tab, visit:**
   ```
   http://localhost:5173/conv-tool/james
   ```
5. **Should auto-join session**
6. **Navigate slides on presenter → attendee sees activities**

---

## Troubleshooting

**Extension doesn't auto-start session:**
- Check `personal-session-config.ts` has `enabled: true`
- Verify `presentationId` matches (must be "conversation-tool")
- Check browser console for errors

**QR code shows wrong URL:**
- Make sure `teamMemberName` is set correctly
- Rebuild extension after changing config

**Session not found:**
- Run `node seed-personal-session.js` to create session mapping
- Check Firebase `/personalSessions/{name}` exists

**Activities don't trigger:**
- Verify activities are added in Activity Builder
- Check `presentationId: "conversation-tool"` matches
- Ensure slide positions match

---

## Production Deployment

For actual conference use:

1. **Build production version of attendee app:**
   ```bash
   cd packages/attendee-app
   npm run build
   # Deploy dist/ to presentations.stmath.com
   ```

2. **Update extension URLs:**
   - Change localhost URLs to production
   - Already set to `presentations.stmath.com` in code

3. **Create extension builds for each team member**

4. **Install on team members' laptops**
   - Can be done remotely via Chrome Enterprise policies
   - Or manually during setup meeting

5. **Print QR codes**
   - Use QR code URLs from seed script output
   - Print on business cards, table tents, posters

---

## Security Note

Personal session codes are permanent and tied to team members. Anyone with the QR code can join the session. For public conferences, this is fine. For private events, consider:

- Time-limited session activation
- Admin dashboard to disable sessions
- Different codes for different events

---

**Questions?** Contact the development team.
