"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { api } from "@/lib/api/client";
import { ApiError, isApiError } from "@/lib/api/errors";
import { authService } from "@/services/auth.service";
import type { AccountStatus, Permissions, PrivateProfile } from "@/types/api";

/**
 *  loading        checking for a session
 *  anonymous      signed out
 *  needs-profile  has a Firebase account but no Inkspire profile yet (finish registration)
 *  restricted     account is disabled or blocked
 *  ready          signed in with an active profile
 *  error          the backend could not be reached
 */
export type AuthStatus = "loading" | "anonymous" | "needs-profile" | "restricted" | "ready" | "error";

interface AuthValue {
  status: AuthStatus;
  user: User | null;
  profile: PrivateProfile | null;
  permissions: Permissions | null;
  accountStatus: AccountStatus | null;
  /** UX only. The backend decides what a user may actually do. */
  isStaff: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { email: string; password: string; username: string; displayName: string }) => Promise<void>;
  completeProfile: (input: { username: string; displayName: string }) => Promise<void>;
  sendReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

const friendlyAuthError = (e: unknown): Error => {
  if (isApiError(e)) return e;
  const code = (e as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/invalid-credential": "That email and password do not match.",
    "auth/wrong-password": "That email and password do not match.",
    "auth/user-not-found": "That email and password do not match.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/email-already-in-use": "An account with this email already exists. Try signing in.",
    "auth/weak-password": "Use a password with at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
    "auth/network-request-failed": "We could not reach the sign in service. Check your connection.",
  };
  return new Error(map[code] ?? "We could not complete that. Please try again.");
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PrivateProfile | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const registering = useRef(false);

  // The API client asks Firebase for a fresh ID token on every call.
  useEffect(() => {
    const auth = firebaseAuth();
    api.setTokenProvider(async (force) => (auth.currentUser ? auth.currentUser.getIdToken(force) : null));
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const me = await authService.me();
      setProfile(me.profile);
      setPermissions(me.permissions);
      setAccountStatus(me.accountStatus);
      setStatus(me.accountStatus === "active" ? "ready" : "restricted");
    } catch (e) {
      if (isApiError(e) && e.is("PROFILE_REQUIRED")) {
        setProfile(null);
        setPermissions(null);
        setStatus("needs-profile");
      } else if (isApiError(e) && e.status === 401) {
        setStatus("anonymous");
      } else {
        setStatus("error");
      }
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth(), async (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setPermissions(null);
        setAccountStatus(null);
        setStatus("anonymous");
        return;
      }
      if (registering.current) return; // signUp finishes the profile itself
      setStatus("loading");
      await loadProfile();
    });
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(firebaseAuth(), email.trim(), password);
    } catch (e) {
      throw friendlyAuthError(e);
    }
  }, []);

  const completeProfile = useCallback(
    async (input: { username: string; displayName: string }) => {
      await authService.register({ username: input.username, displayName: input.displayName || undefined });
      await loadProfile();
    },
    [loadProfile],
  );

  const signUp = useCallback(
    async (input: { email: string; password: string; username: string; displayName: string }) => {
      // Check the username first so a taken name never leaves an orphaned account behind.
      const { available } = await authService.usernameAvailable(input.username.trim().toLowerCase());
      if (!available) throw new ApiError("USERNAME_TAKEN", "That username is not available. Try another.", 409);

      registering.current = true;
      try {
        await createUserWithEmailAndPassword(firebaseAuth(), input.email.trim(), input.password);
      } catch (e) {
        registering.current = false;
        throw friendlyAuthError(e);
      }
      try {
        await authService.register({ username: input.username, displayName: input.displayName || undefined });
      } catch (e) {
        // The account exists but the profile does not. Let the person retry from "needs-profile".
        registering.current = false;
        await loadProfile();
        throw e;
      }
      registering.current = false;
      await loadProfile();
    },
    [loadProfile],
  );

  const sendReset = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(firebaseAuth(), email.trim());
    } catch (e) {
      // Do not reveal whether an address has an account.
      if ((e as { code?: string })?.code === "auth/user-not-found") return;
      throw friendlyAuthError(e);
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(firebaseAuth());
  }, []);

  const refresh = useCallback(async () => {
    if (firebaseAuth().currentUser) await loadProfile();
  }, [loadProfile]);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      user,
      profile,
      permissions,
      accountStatus,
      isStaff: !!permissions && Object.values(permissions).some(Boolean),
      signIn,
      signUp,
      completeProfile,
      sendReset,
      signOut,
      refresh,
    }),
    [status, user, profile, permissions, accountStatus, signIn, signUp, completeProfile, sendReset, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
