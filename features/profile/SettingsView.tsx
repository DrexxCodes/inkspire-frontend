"use client";

import { useState } from "react";
import { usersService } from "@/services/users.service";
import { errorMessage } from "@/lib/api/errors";
import { validateDisplayName } from "@/lib/validation";
import { useAuth } from "@/stores/auth-store";
import { useToast } from "@/stores/toast-store";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/fields";
import { ResponsiveSheet } from "@/components/ui/Overlay";

type Kind = "profile" | "cover";

function PhotoRow({ kind, label, url, name, seed, onChanged }: { kind: Kind; label: string; url: string | null; name: string; seed: string; onChanged: () => Promise<void> }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      await usersService.uploadPhoto(kind, file);
      await onChanged();
      toast.success(`${label} updated`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    try {
      await usersService.removePhoto(kind);
      await onChanged();
      toast.success(kind === "profile" ? "Back to your generated avatar" : "Cover removed");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="photo-edit">
      <div className="photo-edit__preview">
        {kind === "profile" ? (
          <Avatar name={name} seed={seed} src={url} size={72} squircle />
        ) : (
          <div className="photo-edit__cover" style={{ width: 200 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {url && <img src={url} alt="" />}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <label className="btn btn--secondary btn--sm" aria-disabled={busy} style={{ cursor: "pointer" }}>
            {busy ? "Working..." : `Change ${label.toLowerCase()}`}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="visually-hidden" disabled={busy} onChange={(e) => upload(e.target.files?.[0])} />
          </label>
          {url && (
            <Button size="sm" variant="ghost" onClick={remove} disabled={busy}>
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SettingsView() {
  const { profile, refresh, sendReset } = useAuth();
  const toast = useToast();
  const settings = usePublicSettings();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [busy, setBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  if (!profile) return null;

  const openEdit = () => {
    setDisplayName(profile.displayName);
    setBio(profile.bio);
    setNameError(null);
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateDisplayName(displayName);
    setNameError(err);
    if (err) return;
    setBusy(true);
    try {
      await usersService.update({ displayName: displayName.trim(), bio: bio.trim() });
      await refresh();
      setOpen(false);
      toast.success("Profile saved");
    } catch (e2) {
      toast.error(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!profile.email) return;
    try {
      await sendReset(profile.email);
      toast.success("Password reset email sent");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div style={{ display: "grid", gap: 28 }}>
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <h1>Settings</h1>
          <p>Manage how you appear on Inkspire.</p>
        </div>
      </div>

      <section style={{ display: "grid", gap: 12 }} aria-labelledby="s-profile">
        <h2 id="s-profile" className="h3">Profile</h2>
        <div className="person">
          <Avatar name={profile.displayName} seed={profile.username} src={profile.profilePhotoUrl} size={56} squircle />
          <div className="person__text">
            <div className="person__name">{profile.displayName}</div>
            <div className="person__sub">@{profile.username}</div>
          </div>
          <Button variant="secondary" size="sm" icon="pen" onClick={openEdit}>
            Edit
          </Button>
        </div>
        {profile.bio && <p className="muted" style={{ whiteSpace: "pre-wrap" }}>{profile.bio}</p>}
      </section>

      <section style={{ display: "grid", gap: 12 }} aria-labelledby="s-photos">
        <h2 id="s-photos" className="h3">Photos</h2>
        <PhotoRow kind="profile" label="Profile photo" url={profile.avatarType === "uploaded" ? profile.profilePhotoUrl : null} name={profile.displayName} seed={profile.username} onChanged={refresh} />
        <PhotoRow kind="cover" label="Cover photo" url={profile.coverPhotoUrl} name={profile.displayName} seed={profile.username} onChanged={refresh} />
      </section>

      <section style={{ display: "grid", gap: 12 }} aria-labelledby="s-account">
        <h2 id="s-account" className="h3">Account</h2>
        <p className="muted">Signed in as {profile.email ?? "your account"}.</p>
        <div>
          <Button variant="secondary" onClick={reset} disabled={!profile.email}>
            Email me a password reset link
          </Button>
        </div>
      </section>

      <ResponsiveSheet open={open} onClose={() => setOpen(false)} title="Edit profile">
        <form onSubmit={save} noValidate style={{ display: "grid", gap: 16 }}>
          <TextField label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} error={nameError} maxLength={60} />
          <TextAreaField label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={settings.maxBioLength} hint={`${bio.length}/${settings.maxBioLength}`} />
          <Button type="submit" block loading={busy}>
            Save changes
          </Button>
        </form>
      </ResponsiveSheet>
    </div>
  );
}
