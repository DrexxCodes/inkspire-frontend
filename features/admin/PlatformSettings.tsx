"use client";

import { useEffect, useState } from "react";
import { settingsService } from "@/services/settings.service";
import { errorMessage } from "@/lib/api/errors";
import { SETTING_LIMITS, changedSettings, validateSettings, type NumericSetting } from "@/lib/settings-rules";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/stores/toast-store";
import { formatBytes } from "@/utils/format";
import type { PlatformSettings as Settings } from "@/types/api";
import { Banner, ErrorState, Spinner } from "@/components/ui/feedback";
import { Button } from "@/components/ui/Button";
import { Switch, TextField } from "@/components/ui/fields";

const SWITCHES: { key: keyof Settings; label: string; hint: string }[] = [
  { key: "allowRegistration", label: "Allow new sign ups", hint: "Turn off to pause registration." },
  { key: "allowComments", label: "Allow comments", hint: "Existing comments stay stored." },
  { key: "allowLikes", label: "Allow likes", hint: "Existing likes stay stored." },
  { key: "allowSharing", label: "Allow sharing", hint: "Hides the share button." },
  { key: "defaultCategoryPostingAllowed", label: "Writers may post in every category by default", hint: "You can still block a writer from a category." },
  { key: "maintenanceMode", label: "Maintenance mode", hint: "Only staff can use the app while this is on." },
];

export function PlatformSettings() {
  const toast = useToast();
  const loaded = useApi((s) => settingsService.get(s), []);
  const [saved, setSaved] = useState<Settings | null>(null);
  const [form, setForm] = useState<Settings | null>(null);
  const [text, setText] = useState<Record<NumericSetting, string> | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = loaded.data?.settings;
    if (!s) return;
    setSaved(s);
    setForm(s);
    setText(Object.fromEntries((Object.keys(SETTING_LIMITS) as NumericSetting[]).map((k) => [k, String(s[k])])) as Record<NumericSetting, string>);
  }, [loaded.data]);

  if (loaded.loading) return <Spinner label="Loading settings" />;
  if (loaded.error != null) return <ErrorState error={loaded.error} onRetry={loaded.reload} />;
  if (!form || !saved || !text) return null;

  const parsed = { ...form, ...Object.fromEntries((Object.keys(text) as NumericSetting[]).map((k) => [k, text[k].trim() === "" ? NaN : Number(text[k])])) } as Settings;
  const errors = validateSettings(parsed);
  const patch = changedSettings(saved, parsed);
  const dirty = Object.keys(patch).length > 0;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length || !dirty) return;
    setBusy(true);
    try {
      const res = await settingsService.update(patch);
      setSaved(res.settings);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} noValidate style={{ display: "grid", gap: 28, maxWidth: 640 }}>
      {parsed.maintenanceMode && <Banner tone="warn" title="Maintenance mode is on">Regular users are locked out until you turn it off.</Banner>}

      <section style={{ display: "grid", gap: 14 }}>
        <h2 className="h3">Limits</h2>
        {(Object.keys(SETTING_LIMITS) as NumericSetting[]).map((k) => (
          <TextField
            key={k}
            label={SETTING_LIMITS[k].label}
            inputMode="numeric"
            value={text[k]}
            onChange={(e) => setText({ ...text, [k]: e.target.value })}
            error={errors[k]}
            hint={k === "contentChunkThresholdBytes" || k === "maxWorkSizeBytes" ? `About ${Number.isFinite(parsed[k]) ? formatBytes(parsed[k]) : "?"}. Text is split into pieces of this size before it is stored.` : undefined}
          />
        ))}
      </section>

      <section style={{ display: "grid", gap: 4 }}>
        <h2 className="h3">Features</h2>
        <div className="perm-grid">
          {SWITCHES.map((s) => (
            <div key={s.key} className="perm-row">
              <div>
                <div className="perm-row__name">{s.label}</div>
                <div className="perm-row__hint">{s.hint}</div>
              </div>
              <Switch label={s.label} checked={Boolean(form[s.key])} onChange={(v) => setForm({ ...form, [s.key]: v })} />
            </div>
          ))}
        </div>
      </section>

      <div>
        <Button type="submit" loading={busy} disabled={!dirty || Object.keys(errors).length > 0}>
          Save settings
        </Button>
      </div>
    </form>
  );
}
