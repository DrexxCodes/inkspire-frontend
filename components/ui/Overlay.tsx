"use client";

import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";
import { overlayFor, type OverlayKind } from "@/lib/breakpoints";
import { useBreakpoint } from "@/hooks/useMediaQuery";
import { useOverlay } from "@/hooks/useOverlay";
import { IconButton } from "./Button";

export interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

/** The single dialog implementation. The three exported wrappers only choose how it appears. */
function Overlay({ kind, open, onClose, title, children, footer, wide }: OverlayProps & { kind: OverlayKind }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useOverlay(open, ref, onClose);
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="overlay">
      <div className="overlay__scrim" onClick={onClose} aria-hidden="true" />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={cn("panel", `panel--${kind}`, wide && "panel--wide")}>
        <div className="panel__handle" aria-hidden="true" />
        <div className="panel__header">
          <h2 className="panel__title" id={titleId}>
            {title}
          </h2>
          <IconButton icon="x" label="Close" size="sm" plain onClick={onClose} />
        </div>
        <div className="panel__body">{children}</div>
        {footer && <div className="panel__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export const BottomSheet = (p: OverlayProps) => <Overlay kind="sheet" {...p} />;
export const Drawer = (p: OverlayProps) => <Overlay kind="drawer" {...p} />;
export const Modal = (p: OverlayProps) => <Overlay kind="modal" {...p} />;

/**
 * Dialog that adapts to the screen: bottom sheet on mobile, side drawer on tablet, centred
 * modal on laptop and larger.
 */
export function ResponsiveSheet(p: OverlayProps) {
  const kind = overlayFor(useBreakpoint(), "dialog");
  return <Overlay kind={kind} {...p} />;
}

/**
 * Contextual panel (details, history, filters). A right hand drawer wherever there is room,
 * and a bottom sheet on mobile.
 */
export function ResponsiveDrawer(p: OverlayProps) {
  const kind = overlayFor(useBreakpoint(), "panel");
  return <Overlay kind={kind} {...p} />;
}
