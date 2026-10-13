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
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
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

/**
 * Umožňuje nastaviť token zvonku (napr. z NextAuth session pri prihlásení)
 */
export const setExternalAccessToken = (token: string | null, user?: any) => {
  cachedAccessToken = token;
  if (user && !cachedGoogleUser) {
    cachedGoogleUser = user;
  }
  notifyListeners();
};

// Initialize auth state listener. Call this on app load.
export const initWorkspaceAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // 1. Skontrolujeme, či máme session z NextAuth API (tichá synchronizácia)
  if (!cachedAccessToken && typeof window !== 'undefined') {
    fetch('/api/auth/session')
      .then((res) => (res.ok ? res.json() : null))
      .then((sessionData) => {
        if (sessionData?.accessToken) {
          cachedAccessToken = sessionData.accessToken;
          if (sessionData.user && !cachedGoogleUser) {
            cachedGoogleUser = sessionData.user;
          }
          notifyListeners();
          if (onAuthSuccess && cachedGoogleUser) {
            onAuthSuccess(cachedGoogleUser, cachedAccessToken);
          }
        }
      })
      .catch(() => {});
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      cachedGoogleUser = user;
      if (cachedAccessToken) {
        notifyListeners();
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Skúsime získať token cez /api/auth/session
        const token = await getAccessToken();
        if (token) {
          notifyListeners();
          if (onAuthSuccess) onAuthSuccess(user, token);
        } else {
          notifyListeners();
          if (onAuthFailure) onAuthFailure();
        }
      }
    } else {
      if (!cachedAccessToken) {
        cachedGoogleUser = null;
        notifyListeners();
        if (onAuthFailure) onAuthFailure();
      }
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
    // Ak používateľ okno prihlásenia zatvoril alebo bola požiadavka zrušená, nejde o chybu aplikácie
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.message?.includes('popup-closed-by-user') ||
      error?.message?.includes('cancelled-popup-request')
    ) {
      return null;
    }
    console.warn('Upozornenie prihlásenia do Google Workspace / Drive:', error?.message || error);
    return null;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  // Ak je vyrovnávacia pamäť prázdna, automaticky overíme aktívnu session v NextAuth
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const sessionData = await res.json();
        if (sessionData?.accessToken) {
          cachedAccessToken = sessionData.accessToken;
          if (sessionData.user && !cachedGoogleUser) {
            cachedGoogleUser = sessionData.user;
          }
          notifyListeners();
          return cachedAccessToken;
        }
      }
    } catch {
      // tichý fallback
    }
  }

  return null;
};

export const getGoogleUser = (): User | null => {
  return cachedGoogleUser;
};

export const isGoogleSignedIn = (): boolean => {
  return Boolean(cachedAccessToken || cachedGoogleUser);
};

export const googleLogout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedGoogleUser = null;
  notifyListeners();
};
