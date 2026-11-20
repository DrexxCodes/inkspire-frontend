"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { USERNAME_CHECK_DELAY_MS } from "@/lib/config";
import { useAuth } from "@/stores/auth-store";
import { authService } from "@/services/auth.service";
import { errorMessage } from "@/lib/api/errors";
import { safeNext } from "@/lib/safe-next";
import { validateDisplayName, validateEmail, validatePassword, validateUsername } from "@/lib/validation";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import { AuthFrame } from "@/components/layout/AuthFrame";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/feedback";
import { TextField } from "@/components/ui/fields";

type Availability = "idle" | "checking" | "available" | "taken";

function RegisterForm() {
  const { status, signUp, completeProfile } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const settings = usePublicSettings();
  const profileStep = status === "needs-profile";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [availability, setAvailability] = useState<Availability>("idle");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Only ask the API once typing has paused for a while. Every keystroke resets the timer.
  const debounced = useDebouncedValue(username, USERNAME_CHECK_DELAY_MS);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => {
    if (status === "ready") router.replace(next);
  }, [status, next, router]);

  // The moment the text changes, any earlier answer (or request still in flight) is stale.
  useEffect(() => {
    ctrl.current?.abort();
    setAvailability("idle");
  }, [username]);

  useEffect(() => {
    if (validateUsername(debounced)) return;
    const c = new AbortController();
    ctrl.current = c;
    setAvailability("checking");
    authService
      .usernameAvailable(debounced, c.signal)
      .then((r) => !c.signal.aborted && setAvailability(r.available ? "available" : "taken"))
      .catch(() => !c.signal.aborted && setAvailability("idle"));
    return () => c.abort();
  }, [debounced]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = {
      email: profileStep ? null : validateEmail(email),
      password: profileStep ? null : validatePassword(password),
      displayName: validateDisplayName(displayName),
      username: validateUsername(username) ?? (availability === "taken" ? "That username is already taken." : null),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setBusy(true);
    setFormError(null);
    try {
      if (profileStep) await completeProfile({ username, displayName: displayName.trim() });
      else await signUp({ email: email.trim(), password, username, displayName: displayName.trim() });
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!settings.allowRegistration && !profileStep) {
    return (
      <AuthFrame title="Sign ups are paused" subtitle="New accounts are turned off right now. Please check back soon." footer={<Link href="/auth/login">Back to sign in</Link>}>
        <span />
      </AuthFrame>
    );
  }

  const typedValid = username.length > 0 && !validateUsername(username);
  const usernameHint =
    availability === "checking"
      ? "Checking..."
      : availability === "available"
        ? "That username is free."
        : typedValid
          ? "We will check if it is free when you pause typing."
          : "3 to 24 lowercase letters, numbers or underscores.";
  const usernameError = errors.username ?? (availability === "taken" ? "That username is already taken." : null);

  return (
    <AuthFrame
      title={profileStep ? "Finish your profile" : "Join Inkspire"}
      subtitle={profileStep ? "Pick the name and username readers will see." : "Publish your writing and find people who love it."}
      footer={profileStep ? undefined : <>Already have an account? <Link href="/auth/login">Sign in</Link></>}
    >
      <form onSubmit={submit} noValidate style={{ display: "grid", gap: 16 }}>
        {formError && <Banner tone="danger" title="Could not create your account">{formError}</Banner>}
        {!profileStep && (
          <>
            <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
            <TextField label="Password" type="password" autoComplete="new-password" hint="At least 8 characters." value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
          </>
        )}
        <TextField label="Display name" autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} error={errors.displayName} maxLength={60} />
        <div className="avatar-preview" aria-live="polite">
          <Avatar name={displayName || username || "You"} seed={username || displayName || "inkspire"} size={64} squircle />
          <p>
            <strong>Your avatar</strong>
            <span>We generate one for you from your username. You can upload your own photo later.</span>
          </p>
        </div>
        <TextField
          label="Username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          error={usernameError}
          hint={usernameHint}
          maxLength={24}
        />
        <Button type="submit" block loading={busy}>
          {profileStep ? "Finish" : "Create account"}
        </Button>
      </form>
    </AuthFrame>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
