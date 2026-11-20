import Link from "next/link";
import type { ReactNode } from "react";

export function AuthFrame({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <main id="main" className="auth">
      <div className="auth__card">
        <div className="auth__brand">
          <Link href="/discover" aria-label="Inkspire home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Inkspire" />
          </Link>
          <h1 className="auth__title">{title}</h1>
          {subtitle && <p className="auth__sub">{subtitle}</p>}
        </div>
        {children}
        {footer && <p className="auth__alt">{footer}</p>}
      </div>
    </main>
  );
}
