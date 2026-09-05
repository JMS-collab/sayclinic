import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App only once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Workspace Google Auth Provider with all Drive and Calendar scopes
export const googleProvider = new GoogleAuthProvider();

export const WORKSPACE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.appdata',
];

WORKSPACE_SCOPES.forEach((scope) => {
  googleProvider.addScope(scope);
});

// Flag to prevent race conditions during sign-in popup
let isSigningIn = false;

// In-memory cache for OAuth access token (MANDATORY: never store in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let cachedGoogleUser: User | null = null;

// Callbacks for subscribers
type AuthListener = (user: User | null, token: string | null) => void;
const listeners = new Set<AuthListener>();

export const notifyListeners = () => {
  listeners.forEach((listener) => listener(cachedGoogleUser, cachedAccessToken));
};

export const subscribeWorkspaceAuth = (listener: AuthListener) => {
  listeners.add(listener);
  // Send immediate current state
  listener(cachedGoogleUser, cachedAccessToken);
  return () => {
    listeners.delete(listener);
  };
};

// Initialize auth state listener. Call this on app load.
export const initWorkspaceAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    cachedGoogleUser = user;
    if (user) {
      if (cachedAccessToken) {
        notifyListeners();
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        notifyListeners();
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      notifyListeners();
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Nepodarilo sa získať prístupový token pre Google Drive.');
    }

    cachedAccessToken = credential.accessToken;
    cachedGoogleUser = result.user;
    notifyListeners();
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Chyba prihlásenia do Google Drive:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getGoogleUser = (): User | null => {
  return cachedGoogleUser;
};

export const googleLogout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedGoogleUser = null;
  notifyListeners();
};
