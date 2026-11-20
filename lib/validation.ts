/** Mirrors the backend rules for fast feedback. The backend remains the authority. */
export const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

export function validateUsername(value: string): string | null {
  if (!value) return "Choose a username.";
  if (!USERNAME_PATTERN.test(value)) return "Use 3 to 24 lowercase letters, numbers or underscores.";
  return null;
}

export function validateEmail(value: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? null : "Enter a valid email address.";
}

export function validatePassword(value: string): string | null {
  return value.length >= 8 ? null : "Use at least 8 characters.";
}

export function validateDisplayName(value: string): string | null {
  const v = value.trim();
  if (v.length < 1) return "Enter the name readers will see.";
  if (v.length > 60) return "Keep it under 60 characters.";
  return null;
}
