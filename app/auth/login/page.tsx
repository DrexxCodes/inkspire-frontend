"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/stores/auth-store";
import { errorMessage } from "@/lib/api/errors";
import { safeNext } from "@/lib/safe-next";
import { validateEmail } from "@/lib/validation";
import { useToast } from "@/stores/toast-store";
import { AuthFrame } from "@/components/layout/AuthFrame";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/feedback";
import { TextField } from "@/components/ui/fields";

function LoginForm() {
  const { status, signIn, sendReset } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "ready") router.replace(next);
    if (status === "needs-profile") router.replace("/auth/register?step=profile");
  }, [status, next, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ve = validateEmail(email);
    setEmailError(ve);
    if (ve || !password) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    const ve = validateEmail(email);
    setEmailError(ve);
    if (ve) return;
    try {
      await sendReset(email.trim());
      toast.success("If that email has an account, a reset link is on its way.");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <AuthFrame
      title="Welcome back"
      subtitle="Sign in to write, like and comment."
      footer={
        <>
          New here? <Link href={`/auth/register${next !== "/discover" ? `?next=${encodeURIComponent(next)}` : ""}`}>Create an account</Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate style={{ display: "grid", gap: 16 }}>
        {error && <Banner tone="danger" title="Could not sign you in">{error}</Banner>}
        <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailError} />
        <TextField label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" block loading={busy}>
          Sign in
        </Button>
        <Button type="button" variant="ghost" block onClick={reset}>
          Forgot your password?
        </Button>
      </form>
    </AuthFrame>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
