/**
 * Create a test session that matches a personal session code
 */

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');

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

const sessionCode = '7MC7CD'; // James's session code
const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

async function createSession() {
  try {
    console.log('Creating test session:', sessionCode);

    const sessionRef = ref(database, `sessions/${sessionCode}`);
    await set(sessionRef, {
      id: sessionId,
      presentationId: 'conversation-tool',
      presenterId: 'test_presenter',
      status: 'active',
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000),
      currentSlide: { indexh: 0, indexv: 0, timestamp: Date.now() },
      currentActivity: null,
      activities: []
    });

    console.log('✅ Session created successfully!');
    console.log('\nNow test:');
    console.log('1. Visit: http://localhost:5173/conv-tool-james');
    console.log('2. Should auto-join session 7MC7CD');
    console.log('3. Should see waiting screen');
    console.log('\nSession will expire in 24 hours.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating session:', error);
    process.exit(1);
  }
}

createSession();
