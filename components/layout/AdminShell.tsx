"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/stores/auth-store";
import { visibleAdminNav } from "@/lib/admin-nav";
import { Icon } from "@/components/ui/Icon";

export function AdminShell({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  const pathname = usePathname();
  const { permissions } = useAuth();
  const items = visibleAdminNav(permissions);
  const isCurrent = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav className="nav" aria-label="Admin">
      {items.map((e) => (
        <Link key={e.href} href={e.href} className="nav__item" aria-current={isCurrent(e.href) ? "page" : undefined} title={e.label}>
          <Icon name={e.icon} size={22} />
          <span className="nav__label">{e.label}</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="admin">
      <aside className="admin__side">
        <Link href="/discover" className="brand brand--mark" aria-label="Back to Inkspire">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mark.png" alt="" />
        </Link>
        {nav}
        <Link href="/discover" className="nav__item admin__exit-link" title="Back to Inkspire">
          <Icon name="home" size={22} />
          <span className="nav__label">Back to app</span>
        </Link>
      </aside>
      <div className="admin__body">
        <header className="admin__top">
          <Link href="/discover" className="admin__exit" aria-label="Back to Inkspire">
            <Icon name="chevronLeft" size={18} />
            <span>App</span>
          </Link>
          <div className="scroll-x" style={{ display: "flex", gap: 6, overflowX: "auto" }}>
            {items.map((e) => (
              <Link key={e.href} href={e.href} className="chip" aria-current={isCurrent(e.href) ? "page" : undefined}>
                {e.label}
              </Link>
            ))}
          </div>
        </header>
        <main id="main" className="admin__main">
          <div className="admin__content">
            <div className="page-head">
              <h1 className="admin__title">{title}</h1>
              <span className="spacer" />
              {actions}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
