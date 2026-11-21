"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface FieldShellProps {
  label: string;
  hideLabel?: boolean;
  hint?: string;
  error?: string | null;
  children: (ids: { id: string; describedBy?: string }) => ReactNode;
}

function FieldShell({ label, hideLabel, hint, error, children }: FieldShellProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="field">
      <label className={hideLabel ? "visually-hidden" : "field__label"} htmlFor={id}>
        {label}
      </label>
      {children({ id, describedBy })}
      {hint && !error && (
        <span className="field__hint" id={hintId}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field__error" id={errId} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

type Shared = { label: string; hideLabel?: boolean; hint?: string; error?: string | null; className?: string };

export function TextField({ label, hideLabel, hint, error, className, ...rest }: Shared & Omit<InputHTMLAttributes<HTMLInputElement>, "className">) {
  return (
    <FieldShell label={label} hideLabel={hideLabel} hint={hint} error={error}>
      {({ id, describedBy }) => <input id={id} className={cn("input", className)} aria-invalid={!!error || undefined} aria-describedby={describedBy} {...rest} />}
    </FieldShell>
  );
}

export function TextAreaField({ label, hideLabel, hint, error, className, ...rest }: Shared & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">) {
  return (
    <FieldShell label={label} hideLabel={hideLabel} hint={hint} error={error}>
      {({ id, describedBy }) => <textarea id={id} className={cn("textarea", className)} aria-invalid={!!error || undefined} aria-describedby={describedBy} {...rest} />}
    </FieldShell>
  );
}

export function SelectField({ label, hideLabel, hint, error, children, ...rest }: Shared & Omit<SelectHTMLAttributes<HTMLSelectElement>, "className">) {
  return (
    <FieldShell label={label} hideLabel={hideLabel} hint={hint} error={error}>
      {({ id, describedBy }) => (
        <select id={id} className="select" aria-invalid={!!error || undefined} aria-describedby={describedBy} {...rest}>
          {children}
        </select>
      )}
    </FieldShell>
  );
}

export function Switch({ checked, onChange, label, disabled, hideLabel }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; disabled?: boolean; hideLabel?: boolean }) {
  return (
    <label className="switch">
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch__track" aria-hidden="true" />
      <span className={hideLabel ? "visually-hidden" : undefined}>{label}</span>
    </label>
  );
}
