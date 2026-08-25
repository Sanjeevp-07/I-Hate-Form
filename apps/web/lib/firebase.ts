import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAqQ0fDS3GbKvY0Dm_Gr0SpQpxoTVnDiXc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "i-hate-form.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "i-hate-form",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "i-hate-form.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "783709091115",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:783709091115:web:ef936daaf542b33dba816e",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-H5T28Y97R6",
};

// Initialize Firebase singleton
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

/**
 * Synchronize Firebase user state with backend session cookie & database
 */
export async function syncFirebaseSession(user: FirebaseUser | null): Promise<boolean> {
  if (!user) return false;

  try {
    const idToken = await user.getIdToken();
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split("@")[0] || "User",
        photoURL: user.photoURL,
        idToken,
      }),
    });

    return res.ok;
  } catch (err) {
    console.error("Failed to synchronize session with backend:", err);
    return false;
  }
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  await syncFirebaseSession(result.user);
  return result.user;
}

/**
 * Sign in with Email and Password
 */
export async function signInWithEmail(email: string, pass: string) {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  await syncFirebaseSession(result.user);
  return result.user;
}

/**
 * Register with Email, Password and Display Name
 */
export async function signUpWithEmail(email: string, pass: string, name?: string) {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && result.user) {
    await updateProfile(result.user, { displayName: name });
  }
  await syncFirebaseSession(result.user);
  return result.user;
}

/**
 * Sign out from Firebase and clear backend session cookie
 */
export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Firebase signout error:", err);
  }

  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch (err) {
    console.error("Backend session logout error:", err);
  }
}

export { onAuthStateChanged, type FirebaseUser };
