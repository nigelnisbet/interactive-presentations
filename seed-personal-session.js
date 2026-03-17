/**
 * Seed script to create personal sessions for sales team members
 *
 * Usage: node seed-personal-session.js
 */

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Generate a unique session code (same logic as extension)
function generateSessionCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Personal sessions to create
const personalSessions = [
  {
    name: 'james',
    displayName: 'James',
    sessionCode: generateSessionCode(),
  },
  {
    name: 'sarah',
    displayName: 'Sarah',
    sessionCode: generateSessionCode(),
  },
  {
    name: 'michael',
    displayName: 'Michael',
    sessionCode: generateSessionCode(),
  },
  // Add more as needed
];

async function seedPersonalSessions() {
  try {
    console.log('🌱 Seeding personal sessions...\n');

    for (const session of personalSessions) {
      const personalSessionRef = ref(database, `personalSessions/${session.name}`);

      await set(personalSessionRef, {
        displayName: session.displayName,
        sessionCode: session.sessionCode,
        presentationId: 'conversation-tool',
        displayMode: 'display-only',
        redirectUrl: 'https://stmath.com',
        active: true,
        createdAt: Date.now(),
        lastUsed: null,
      });

      console.log(`✅ Created personal session for ${session.displayName}`);
      console.log(`   URL: https://presentations.stmath.com/conv-tool-${session.name}`);
      console.log(`   Session Code: ${session.sessionCode}`);
      console.log(`   QR Code: https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`https://presentations.stmath.com/conv-tool-${session.name}`)}`);
      console.log('');
    }

    console.log('✅ Personal sessions seeded successfully!');
    console.log('\nNext steps:');
    console.log('1. Open the Activity Builder');
    console.log('2. Create or edit the "Conversation Tool" presentation');
    console.log('3. Set presentationId to "conversation-tool"');
    console.log('4. Add activities as needed');
    console.log('5. Sales team members can use their personal URLs');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding personal sessions:', error);
    process.exit(1);
  }
}

seedPersonalSessions();
