/**
 * Firebase Realtime Database service module
 * Used by both attendee-app and extension for real-time sync
 *
 * Uses the same Firebase project as the trillionaire app (class-session-games)
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  off,
  push,
  child,
  runTransaction,
  onDisconnect,
  serverTimestamp,
  Database,
  DatabaseReference,
  DataSnapshot,
  Unsubscribe
} from 'firebase/database';

// Firebase configuration - same project as trillionaire
const firebaseConfig = {
  apiKey: "AIzaSyALHOftrFMc8iELsW5BRzT6fUz_qofRSuw",
  authDomain: "class-session-games.firebaseapp.com",
  databaseURL: "https://class-session-games-default-rtdb.firebaseio.com",
  projectId: "class-session-games",
  storageBucket: "class-session-games.firebasestorage.app",
  messagingSenderId: "528175934275",
  appId: "1:528175934275:web:1c10fb554988405f639df6"
};

// Initialize Firebase app (singleton)
let app: FirebaseApp | null = null;
let database: Database | null = null;

export function initializeFirebase(): Database {
  if (!app) {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
  }
  return database!;
}

export function getFirebaseDatabase(): Database {
  if (!database) {
    return initializeFirebase();
  }
  return database;
}

// Re-export Firebase functions for convenience
export {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  off,
  push,
  child,
  runTransaction,
  onDisconnect,
  serverTimestamp
};

// Export types
export type {
  Database,
  DatabaseReference,
  DataSnapshot,
  Unsubscribe
};

// Helper function to generate 6-character session code
export function generateSessionCode(): string {
  // Exclude confusing characters: 0, O, 1, I, L
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper to get a reference to a session
export function getSessionRef(sessionCode: string): DatabaseReference {
  const db = getFirebaseDatabase();
  return ref(db, `sessions/${sessionCode}`);
}

// Helper to get a reference to presentations config
export function getPresentationRef(presentationId: string): DatabaseReference {
  const db = getFirebaseDatabase();
  return ref(db, `presentations/${presentationId}`);
}
