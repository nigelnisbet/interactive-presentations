// Quick script to seed Trillionaire game into Firebase
// Run with: node seed-library.js

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, push, set } = require('firebase/database');

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

const trillionaireGame = {
  type: "collaborative-tap-game",
  name: "Who Wants to be a Trillionaire?",
  config: {
    title: "Who Wants to be a Trillionaire?",
    question: "Would you prefer $1,000,000 a day, or $1 on day one that grows to $2 on day two, and $4 on day three etc?",
    linearIncrement: 1000000,
    cooldownSeconds: 3,
    winCondition: 1000000000000
  },
  createdBy: "system",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isShared: true
};

async function seedLibrary() {
  console.log('Seeding Trillionaire game to Firebase...');

  const libraryRef = ref(database, 'activityLibrary');
  const newRef = push(libraryRef);

  await set(newRef, trillionaireGame);

  console.log('✅ Successfully added Trillionaire game!');
  console.log('Game ID:', newRef.key);
  process.exit(0);
}

seedLibrary().catch(err => {
  console.error('❌ Error seeding library:', err);
  process.exit(1);
});
