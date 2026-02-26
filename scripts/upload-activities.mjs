/**
 * Script to upload activity configurations to Firebase Realtime Database
 * Run with: node scripts/upload-activities.mjs
 *
 * Requires environment variables (create a .env file in project root):
 *   FIREBASE_API_KEY
 *   FIREBASE_AUTH_DOMAIN
 *   FIREBASE_DATABASE_URL
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_STORAGE_BUCKET
 *   FIREBASE_MESSAGING_SENDER_ID
 *   FIREBASE_APP_ID
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
config({ path: path.join(__dirname, '../.env') });

// Firebase configuration from environment
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Validate config
if (!firebaseConfig.apiKey || !firebaseConfig.databaseURL) {
  console.error('Error: Missing Firebase configuration.');
  console.error('Create a .env file in the project root with:');
  console.error('  FIREBASE_API_KEY=your-api-key');
  console.error('  FIREBASE_DATABASE_URL=your-database-url');
  console.error('  ... etc');
  process.exit(1);
}

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
