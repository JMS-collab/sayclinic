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

googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Flag to prevent race conditions during sign-in popup
let isSigningIn = false;

// In-memory cache for OAuth access token (MANDATORY: never store in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let cachedGoogleUser: User | null = null;
let lastAuthError: string | null = null;

// Callbacks for subscribers
type AuthListener = (user: User | null, token: string | null, error?: string | null) => void;
const listeners = new Set<AuthListener>();

export const notifyListeners = () => {
  listeners.forEach((listener) => listener(cachedGoogleUser, cachedAccessToken, lastAuthError));
};

export const subscribeWorkspaceAuth = (listener: AuthListener) => {
  listeners.add(listener);
  // Send immediate current state
  listener(cachedGoogleUser, cachedAccessToken, lastAuthError);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Umožňuje nastaviť alebo vymazať token zvonku (napr. z NextAuth session alebo pri 401 expirácii)
 */
export const setExternalAccessToken = (token: string | null, user?: any) => {
  cachedAccessToken = token;
  if (user) {
    cachedGoogleUser = user;
  } else if (!token) {
    // Ak bol token zneplatnený, necháme používateľa nepripojeného k API, kým sa znova neprihlási
    cachedAccessToken = null;
  }
  lastAuthError = null;
  notifyListeners();
};

export const getLastAuthError = (): string | null => lastAuthError;

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
          if (onAuthSuccess && cachedGoogleUser && cachedAccessToken) {
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
          // Používateľ má iba starú Firebase session bez OAuth accessTokenu v pamäti
          cachedAccessToken = null;
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

/**
 * Prihlásenie cez Google Identity Services (GIS - accounts.google.com/gsi/client)
 * Tento mechanizmus beží priamo v prehliadači a slúži ako spoľahlivá alternatíva
 * na produkčných doménach (ako napr. sayclinic.vercel.app).
 */
export const signInWithGIS = async (): Promise<{ user: any; accessToken: string } | null> => {
  if (typeof window === 'undefined') return null;

  return new Promise((resolve, reject) => {
    const clientId = (firebaseConfig as any)?.oAuthClientId || '704742860453-cfbop2maqnajj7cujhm8acghaisp74tr.apps.googleusercontent.com';

    const loadGisScript = (): Promise<void> => {
      if ((window as any).google?.accounts?.oauth2) {
        return Promise.resolve();
      }
      return new Promise((res, rej) => {
        const existingScript = document.getElementById('google-gis-sdk');
        if (existingScript) {
          existingScript.addEventListener('load', () => res());
          return;
        }
        const script = document.createElement('script');
        script.id = 'google-gis-sdk';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => res();
        script.onerror = () => rej(new Error('Nepodarilo sa načítať Google Identity SDK.'));
        document.head.appendChild(script);
      });
    };

    loadGisScript()
      .then(() => {
        const google = (window as any).google;
        if (!google?.accounts?.oauth2) {
          throw new Error('Google Identity Services nie je v prehliadači dostupné.');
        }

        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: WORKSPACE_SCOPES.join(' '),
          callback: async (response: any) => {
            if (response.error) {
              const msg = `Google OAuth chyba: ${response.error_description || response.error}`;
              lastAuthError = msg;
              notifyListeners();
              reject(new Error(msg));
              return;
            }

            if (response.access_token) {
              cachedAccessToken = response.access_token;
              
              // Získame základný profil používateľa priamo cez token
              try {
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${response.access_token}` },
                });
                if (userRes.ok) {
                  const userData = await userRes.json();
                  cachedGoogleUser = {
                    email: userData.email,
                    displayName: userData.name || userData.email,
                    photoURL: userData.picture,
                    uid: userData.sub,
                  } as any;
                }
              } catch {
                // Ak zlyhá userInfo, ponecháme základné konto
                cachedGoogleUser = {
                  email: 'say@sayclinic.sk',
                  displayName: 'SAY CLINIC Lekár',
                  uid: 'gis-user',
                } as any;
              }

              lastAuthError = null;
              notifyListeners();
              resolve({ user: cachedGoogleUser, accessToken: cachedAccessToken! });
            } else {
              reject(new Error('Google nevrátil prístupový token.'));
            }
          },
          error_callback: (err: any) => {
            const msg = err?.message || 'Chyba inicializácie Google prihlásenia.';
            lastAuthError = msg;
            notifyListeners();
            reject(new Error(msg));
          },
        });

        // Vyžiadanie autorizácie od používateľa
        client.requestAccessToken({ prompt: 'consent' });
      })
      .catch((err) => {
        lastAuthError = err?.message || 'Chyba načítania Google prihlásenia.';
        notifyListeners();
        reject(err);
      });
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User | any; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    lastAuthError = null;

    // 1. Pokus cez Firebase Auth Popup
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
        cachedGoogleUser = result.user;
        lastAuthError = null;
        notifyListeners();
        return { user: result.user, accessToken: cachedAccessToken };
      }
    } catch (firebaseErr: any) {
      // Špecifické ošetrenie nepovolenej domény (napr. sayclinic.vercel.app)
      if (
        firebaseErr?.code === 'auth/unauthorized-domain' ||
        firebaseErr?.message?.includes('auth/unauthorized-domain')
      ) {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'sayclinic.vercel.app';
        console.warn(`[Google Drive Auth] Doména "${currentDomain}" vyžaduje povolenie vo Firebase Console alebo použitie Google Identity Services.`);

        // Skúsime automatický fallback na Google Identity Services
        try {
          const gisRes = await signInWithGIS();
          if (gisRes?.accessToken) {
            return gisRes;
          }
        } catch (gisErr: any) {
          console.warn('[Google Drive Auth] GIS fallback zlyhal:', gisErr);
        }

        lastAuthError = `Doména "${currentDomain}" vyžaduje pridanie do zoznamu Authorized Domains vo Firebase Console (projekt gen-lang-client-0588591925 -> Authentication -> Settings -> Authorized Domains).`;
        notifyListeners();
        return null;
      }

      // Používateľ zavrel popup okno
      if (
        firebaseErr?.code === 'auth/popup-closed-by-user' ||
        firebaseErr?.code === 'auth/cancelled-popup-request' ||
        firebaseErr?.message?.includes('popup-closed-by-user') ||
        firebaseErr?.message?.includes('cancelled-popup-request')
      ) {
        return null;
      }

      // Zablokovaný popup prehliadačom
      if (firebaseErr?.code === 'auth/popup-blocked') {
        // Skúsime fallback na GIS
        try {
          const gisRes = await signInWithGIS();
          if (gisRes?.accessToken) return gisRes;
        } catch {
          // ignore
        }
        lastAuthError = 'Prehliadač zablokoval vyskakovacie okno Google prihlásenia. Povoľte prosím vyskakovacie okná pre túto stránku.';
        notifyListeners();
        return null;
      }

      throw firebaseErr;
    }

    lastAuthError = 'Nepodarilo sa získať prístupový token pre Google Drive.';
    notifyListeners();
    return null;
  } catch (error: any) {
    const msg = error?.message || 'Prihlásenie do Google Drive zlyhalo.';
    lastAuthError = msg;
    notifyListeners();
    console.warn('Upozornenie prihlásenia do Google Workspace / Drive:', msg);
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

// DÔLEŽITÉ: Skutočne pripojený k Google Drive/Calendar API sme iba vtedy, keď máme platný OAuth access token!
export const isGoogleSignedIn = (): boolean => {
  return Boolean(cachedAccessToken);
};

/**
 * Živý test overenia pripojenia ku Google Drive API
 */
export const testGoogleDriveConnection = async (token?: string): Promise<{ success: boolean; message: string; userEmail?: string }> => {
  const effectiveToken = token || cachedAccessToken;
  if (!effectiveToken) {
    return { success: false, message: 'Nie je k dispozícii žiadny aktívny token.' };
  }

  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
      headers: {
        Authorization: `Bearer ${effectiveToken}`,
      },
    });

    if (res.status === 401 || res.status === 403) {
      return { success: false, message: 'Platnosť tokenu vypršala alebo chýbajú potrebné povolenia pre Google Drive.' };
    }

    if (!res.ok) {
      return { success: false, message: `Google Drive API odpovedalo chybou HTTP ${res.status}.` };
    }

    const data = await res.json();
    const userEmail = data.user?.emailAddress || 'Neznámy účet';
    return {
      success: true,
      message: `Spojenie s Google Drive je plne aktívne (účet: ${userEmail}).`,
      userEmail,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Chyba sieťového spojenia s Google Drive API: ${err?.message || 'timeout'}`,
    };
  }
};

export const googleLogout = async () => {
  try {
    await signOut(auth);
  } catch {
    // ignore
  }
  cachedAccessToken = null;
  cachedGoogleUser = null;
  lastAuthError = null;
  notifyListeners();
};

