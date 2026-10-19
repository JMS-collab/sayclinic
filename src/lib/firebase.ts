import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Use custom database ID if specified in config, otherwise default
const databaseId = (firebaseConfig as any).firestoreDatabaseId;

let firestoreDb: Firestore;

if (typeof window !== 'undefined') {
  try {
    firestoreDb = initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
      },
      databaseId || undefined
    );
  } catch {
    firestoreDb = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  }

  // Validate connection to Firestore on initial boot
  getDocFromServer(doc(firestoreDb, 'test', 'connection')).catch((err) => {
    if (err instanceof Error && err.message.includes('the client is offline')) {
      console.warn('Firebase Firestore: klient je momentálne v offline režime.');
    }
  });
} else {
  firestoreDb = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
}

export const db: Firestore = firestoreDb;

export default app;
