/**
 * Check what presentations exist in Firebase and their IDs
 */

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

async function checkPresentations() {
  try {
    console.log('🔍 Checking presentations in Firebase...\n');

    const presentationsRef = ref(database, 'presentations');
    const snapshot = await get(presentationsRef);

    if (!snapshot.exists()) {
      console.log('❌ No presentations found in Firebase');
      process.exit(0);
    }

    const presentations = snapshot.val();
    const ids = Object.keys(presentations);

    console.log(`✅ Found ${ids.length} presentation(s):\n`);

    for (const id of ids) {
      const pres = presentations[id];
      console.log(`📊 Presentation ID: "${id}"`);
      console.log(`   Title: ${pres.title || 'No title'}`);
      console.log(`   Owner: ${pres.ownerId || 'No owner'}`);
      console.log(`   Activities: ${pres.activities ? pres.activities.length : 0}`);

      if (pres.activities && pres.activities.length > 0) {
        console.log(`   Activity details:`);
        pres.activities.forEach((act, idx) => {
          console.log(`     ${idx + 1}. Type: ${act.activityType}, Slide: h${act.slidePosition?.indexh || 0}/v${act.slidePosition?.indexv || 0}`);
        });
      }
      console.log('');
    }

    console.log('\n💡 To fix the Conversation Tool:');
    console.log('   1. If the ID is wrong (like "fullscreen"), you need to:');
    console.log('      - Open Activity Builder');
    console.log('      - Edit the presentation');
    console.log('      - Change presentationId to "conversation-tool"');
    console.log('      - Save');
    console.log('   2. Or create a new presentation with presentationId: "conversation-tool"');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkPresentations();
