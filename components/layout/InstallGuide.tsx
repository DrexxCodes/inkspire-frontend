"use client";

import { useId, useState } from "react";
import { INSTALL_OS_LABELS, installGuide, type InstallOs } from "@/lib/install";
import { useInstall } from "@/stores/install-store";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SegmentedControl } from "@/components/ui/Tabs";

const OS_ITEMS: { id: InstallOs; label: string }[] = (Object.keys(INSTALL_OS_LABELS) as InstallOs[]).map((id) => ({ id, label: INSTALL_OS_LABELS[id] }));

/**
 * Collapsible "Install Inkspire" card. Opens on the steps for the device and browser the reader is on,
 * with a switcher in case detection is wrong or they want to install somewhere else. Renders nothing
 * until the browser has been inspected (so server and client markup match) and nothing once the app is
 * already installed.
 */
export function InstallGuide() {
  const { env, installed, canPrompt, promptInstall } = useInstall();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<InstallOs | null>(null);
  const panelId = useId();

  if (!env || installed) return null;

  const os = picked ?? env.os;
  // Browser specific steps only apply on the device the reader is actually using.
  const guide = os === env.os ? installGuide(os, env.browser) : installGuide(os);
  const showNative = canPrompt && os === env.os;

  return (
    <section className="install" aria-label="Install Inkspire">
      <button type="button" className="install__toggle" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)}>
        <span className="install__badge" aria-hidden="true">
          <Icon name="download" size={20} />
        </span>
        <span className="install__text">
          <span className="install__title">Install Inkspire</span>
          <span className="install__sub">Add it to your home screen and open it like an app</span>
        </span>
        <Icon name="chevronDown" size={20} className="install__chev" />
      </button>

      <div id={panelId} className="install__panel" hidden={!open}>
        <SegmentedControl items={OS_ITEMS} value={os} onChange={setPicked} label="Choose your device" />

        {showNative && (
          <div className="install__native">
            <Button icon="download" onClick={() => void promptInstall()}>
              Install app
            </Button>
            <span className="muted small">Or follow the steps below.</span>
          </div>
        )}

        {guide.steps.length > 0 && (
          <ol className="install__steps">
            {guide.steps.map((step, i) => (
              <li key={i} className="install__step">
                <span className="install__num" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="install__step-text">
                  {step.text}
                  {step.icon && (
                    <span className="install__glyph" aria-hidden="true">
                      <Icon name={step.icon} size={16} />
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        )}

        {guide.note && <p className="install__note">{guide.note}</p>}
      </div>
    </section>
  );
}
