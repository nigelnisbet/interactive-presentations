/**
 * Script to upload activity configurations to Firebase Realtime Database
 * Run with: node scripts/upload-activities.mjs
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function uploadActivities() {
  const activitiesDir = path.join(__dirname, '../packages/server/activities');

  // Get all presentation directories
  const entries = fs.readdirSync(activitiesDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const configPath = path.join(activitiesDir, entry.name, 'config.json');

      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const presentationId = config.presentationId || entry.name;

        console.log(`Uploading config for presentation: ${presentationId}`);

        try {
          await set(ref(database, `presentations/${presentationId}/config`), config);
          console.log(`  - Uploaded successfully!`);
        } catch (error) {
          console.error(`  - Error uploading:`, error.message);
        }
      }
    }
  }

  console.log('\nDone! Activities uploaded to Firebase.');
  process.exit(0);
}

uploadActivities().catch(console.error);
