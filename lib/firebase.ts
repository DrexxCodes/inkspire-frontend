import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { firebaseConfig } from "./config";

/**
 * Firebase on the client is used for Authentication only. There is no Firestore, Storage or
 * Admin access in the browser: all data operations go through the Fastify backend.
 */
export function firebaseAuth(): Auth {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
}
