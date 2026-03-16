// Verify Trillionaire game is in Firebase
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

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

async function verifyLibrary() {
  console.log('Checking Firebase library for games...\n');

  const libraryRef = ref(database, 'activityLibrary');
  const snapshot = await get(libraryRef);

  if (!snapshot.exists()) {
    console.log('❌ No activityLibrary found in database');
    process.exit(1);
  }

  const data = snapshot.val();
  const games = Object.entries(data).filter(([id, activity]) => 
    activity.type === 'collaborative-tap-game'
  );

  console.log(`Found ${games.length} collaborative tap game(s):\n`);

  games.forEach(([id, game]) => {
    console.log('✅ Game ID:', id);
    console.log('   Name:', game.name);
    console.log('   Type:', game.type);
    console.log('   Shared:', game.isShared);
    console.log('   Config:', JSON.stringify(game.config, null, 2));
    console.log('');
  });

  if (games.length === 0) {
    console.log('⚠️  No collaborative-tap-game found. Running seed script...\n');
    // Re-seed
    const { push, set } = require('firebase/database');
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
    
    const newRef = push(libraryRef);
    await set(newRef, trillionaireGame);
    console.log('✅ Successfully seeded game with ID:', newRef.key);
  }

  process.exit(0);
}

verifyLibrary().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
