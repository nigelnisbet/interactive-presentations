/**
 * Options page for configuring personal session
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyALHOftrFMc8iELsW5BRzT6fUz_qofRSuw",
  authDomain: "class-session-games.firebaseapp.com",
  databaseURL: "https://class-session-games-default-rtdb.firebaseio.com",
  projectId: "class-session-games",
  storageBucket: "class-session-games.firebasestorage.app",
  messagingSenderId: "528175934275",
  appId: "1:528175934275:web:1c10fb554988405f639df6"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

interface PersonalSession {
  displayName: string;
  sessionCode: string;
  presentationId: string;
  active: boolean;
}

let sessions: Record<string, PersonalSession> = {};
let selectedSession: { name: string; session: PersonalSession } | null = null;

// Load team members from Firebase
async function loadTeamMembers() {
  const loading = document.getElementById('loading')!;
  const form = document.getElementById('form')!;
  const error = document.getElementById('error')!;
  const errorMessage = document.getElementById('errorMessage')!;

  try {
    const sessionsRef = ref(database, 'personalSessions');
    const snapshot = await get(sessionsRef);

    if (!snapshot.exists()) {
      throw new Error('No team members found. Please add them in the admin dashboard first.');
    }

    sessions = snapshot.val();
    populateDropdown();

    // Load current configuration
    await loadCurrentConfig();

    loading.style.display = 'none';
    form.style.display = 'block';
  } catch (err) {
    console.error('Error loading team members:', err);
    loading.style.display = 'none';
    error.style.display = 'block';
    errorMessage.textContent = (err as Error).message;
  }
}

function populateDropdown() {
  const select = document.getElementById('teamMember') as HTMLSelectElement;

  // Clear existing options (except first)
  while (select.options.length > 1) {
    select.remove(1);
  }

  // Add team members sorted by display name
  const sortedSessions = Object.entries(sessions)
    .filter(([_, session]) => session.active) // Only show active sessions
    .sort(([_, a], [__, b]) => a.displayName.localeCompare(b.displayName));

  for (const [name, session] of sortedSessions) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = session.displayName;
    select.appendChild(option);
  }
}

async function loadCurrentConfig() {
  try {
    const config = await chrome.storage.local.get(['personalSessionConfig']);
    if (config.personalSessionConfig) {
      const { teamMemberName, sessionCode } = config.personalSessionConfig;
      const currentConfig = document.getElementById('currentConfig')!;
      const currentName = document.getElementById('currentName')!;
      const currentSessionCode = document.getElementById('currentSessionCode')!;

      currentName.textContent = sessions[teamMemberName]?.displayName || teamMemberName;
      currentSessionCode.textContent = sessionCode;
      currentConfig.style.display = 'block';
    }
  } catch (err) {
    console.error('Error loading current config:', err);
  }
}

// Handle team member selection
document.getElementById('teamMember')!.addEventListener('change', (e) => {
  const select = e.target as HTMLSelectElement;
  const name = select.value;
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  const sessionInfo = document.getElementById('sessionInfo')!;

  if (!name) {
    saveBtn.disabled = true;
    sessionInfo.style.display = 'none';
    selectedSession = null;
    return;
  }

  const session = sessions[name];
  selectedSession = { name, session };

  // Show session info
  const sessionCode = document.getElementById('sessionCode')!;
  const personalUrl = document.getElementById('personalUrl')!;

  sessionCode.textContent = session.sessionCode;
  personalUrl.textContent = `presentations.stmath.com/conv-tool/${name}`;

  sessionInfo.style.display = 'block';
  saveBtn.disabled = false;
});

// Handle save button
document.getElementById('saveBtn')!.addEventListener('click', async () => {
  if (!selectedSession) return;

  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  const status = document.getElementById('status')!;

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    const config = {
      enabled: true,
      teamMemberName: selectedSession.name,
      sessionCode: selectedSession.session.sessionCode,
      presentationId: selectedSession.session.presentationId,
    };

    await chrome.storage.local.set({ personalSessionConfig: config });

    status.textContent = '✅ Configuration saved! The extension is now ready to use.';
    status.className = 'status success';
    status.style.display = 'block';

    // Reload current config display
    await loadCurrentConfig();

    // Reset form after 2 seconds
    setTimeout(() => {
      status.style.display = 'none';
      const select = document.getElementById('teamMember') as HTMLSelectElement;
      select.value = '';
      document.getElementById('sessionInfo')!.style.display = 'none';
      saveBtn.textContent = 'Save Configuration';
    }, 2000);
  } catch (err) {
    console.error('Error saving config:', err);
    status.textContent = '❌ Error saving configuration. Please try again.';
    status.className = 'status error';
    status.style.display = 'block';
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Configuration';
  }
});

// Load on page ready
loadTeamMembers();
