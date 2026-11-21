"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/stores/auth-store";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { cn } from "@/utils/cn";
import { isOwnProfilePath } from "@/lib/nav";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { NotificationsDrawer } from "./NotificationsDrawer";

interface NavEntry {
  href: string;
  label: string;
  icon: IconName;
  match: (p: string) => boolean;
}

const NAV: NavEntry[] = [
  { href: "/discover", label: "Discover", icon: "compass", match: (p) => p === "/discover" || p.startsWith("/works") },
  { href: "/write", label: "My works", icon: "pen", match: (p) => p.startsWith("/write") },
  { href: "/settings", label: "Settings", icon: "sliders", match: (p) => p.startsWith("/settings") },
];

interface Props {
  children: ReactNode;
  rail?: ReactNode;
  wide?: boolean;
}

export function AppShell({ children, rail, wide }: Props) {
  const pathname = usePathname();
  const { status, profile, isStaff, signOut } = useAuth();
  const unread = useUnreadCount();
  const [notifOpen, setNotifOpen] = useState(false);
  const signedIn = status === "ready" && !!profile;
  const profileHref = profile ? `/profile/${profile.username}` : "/auth/login";
  // Only the signed in user's own profile lights up the menu, not every profile they browse.
  const onOwnProfile = isOwnProfilePath(pathname, profile?.username);

  const items = NAV.filter((n) => signedIn || n.href === "/discover");

  const bell = signedIn && (
    <button type="button" className="nav__item" onClick={() => setNotifOpen(true)}>
      <Icon name="bell" size={22} />
      <span>Notifications</span>
      {unread.count > 0 && <span className="nav__count">{unread.count > 99 ? "99+" : unread.count}</span>}
    </button>
  );

  return (
    <div className={cn("shell", rail && "shell--rail")}>
      <header className="topbar">
        <Link href="/discover" className="brand" aria-label="Inkspire home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Inkspire" />
        </Link>
        <span className="spacer" />
        {signedIn && isStaff && (
          <Link href="/admin" className="icon-btn" aria-label="Admin portal" title="Admin portal">
            <Icon name="shield" size={22} />
          </Link>
        )}
        {signedIn ? (
          <button type="button" className="icon-btn" onClick={() => setNotifOpen(true)} aria-label={`Notifications${unread.count ? `, ${unread.count} unread` : ""}`}>
            <Icon name="bell" size={22} />
            {unread.count > 0 && <span className="icon-btn__badge" aria-hidden="true">{unread.count > 9 ? "9+" : unread.count}</span>}
          </button>
        ) : (
          <ButtonLink href="/auth/login" size="sm">
            Sign in
          </ButtonLink>
        )}
      </header>

      <aside className="shell__sidebar" aria-label="Main">
        <Link href="/discover" className="brand" aria-label="Inkspire home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Inkspire" />
        </Link>
        <nav className="nav" aria-label="Primary">
          {items.map((n) => (
            <Link key={n.href} href={n.href} className="nav__item" aria-current={n.match(pathname) ? "page" : undefined}>
              <Icon name={n.icon} size={22} />
              <span>{n.label}</span>
            </Link>
          ))}
          {signedIn && (
            <Link href={profileHref} className="nav__item" aria-current={onOwnProfile ? "page" : undefined}>
              <Icon name="user" size={22} />
              <span>Profile</span>
            </Link>
          )}
          {bell}
          {signedIn && isStaff && (
            <Link href="/admin" className="nav__item">
              <Icon name="shield" size={22} />
              <span>Admin</span>
            </Link>
          )}
        </nav>
        <div className="sidebar__me">
          {signedIn ? (
            <>
              <ButtonLink href="/write/new" icon="plus" block>
                Write
              </ButtonLink>
              <Link href={profileHref} className="sidebar__user">
                <Avatar name={profile.displayName} seed={profile.username} src={profile.profilePhotoUrl} size={40} squircle />
                <span style={{ minWidth: 0 }}>
                  <div className="sidebar__user-name">
                    <span>{profile.displayName}</span>
                    {profile.verified && <VerifiedBadge name={profile.displayName} size={16} interactive={false} />}
                  </div>
                  <div className="sidebar__user-sub">@{profile.username}</div>
                </span>
              </Link>
              <button type="button" className="nav__item" onClick={() => signOut()}>
                <Icon name="logout" size={22} />
                <span>Sign out</span>
              </button>
            </>
          ) : (
            <>
              <ButtonLink href="/auth/login" block>
                Sign in
              </ButtonLink>
              <ButtonLink href="/auth/register" variant="secondary" block>
                Create account
              </ButtonLink>
            </>
          )}
        </div>
      </aside>

      <main id="main" className="shell__main">
        <div className={cn("shell__content", wide && "shell__content--wide")}>
          {children}
        </div>
      </main>

      {rail && (
        <aside className="shell__rail" aria-label="Suggestions">
          {rail}
        </aside>
      )}

      <nav className="tabbar" aria-label="Primary">
        <Link href="/discover" className="tabbar__item" aria-current={NAV[0]!.match(pathname) ? "page" : undefined}>
          <span className="tabbar__icon">
            <Icon name="compass" size={22} />
          </span>
          <span className="tabbar__label">Discover</span>
        </Link>
        {signedIn ? (
          <>
            <Link href="/write" className="tabbar__item" aria-current={pathname === "/write" || (pathname.startsWith("/write/") && pathname !== "/write/new") ? "page" : undefined}>
              <span className="tabbar__icon">
                <Icon name="book" size={22} />
              </span>
              <span className="tabbar__label">My works</span>
            </Link>
            <Link href="/write/new" className="tabbar__item tabbar__item--write" aria-label="Write something new">
              <span className="tabbar__fab">
                <Icon name="plus" size={26} />
              </span>
              <span className="tabbar__label">Write</span>
            </Link>
            <Link href="/settings" className="tabbar__item" aria-current={pathname.startsWith("/settings") ? "page" : undefined}>
              <span className="tabbar__icon">
                <Icon name="sliders" size={22} />
              </span>
              <span className="tabbar__label">Settings</span>
            </Link>
            <Link href={profileHref} className="tabbar__item" aria-current={onOwnProfile ? "page" : undefined}>
              <span className="tabbar__icon">
                <Icon name="user" size={22} />
              </span>
              <span className="tabbar__label">Profile</span>
            </Link>
          </>
        ) : (
          <Link href="/auth/login" className="tabbar__item">
            <span className="tabbar__icon">
              <Icon name="user" size={22} />
            </span>
            <span className="tabbar__label">Sign in</span>
          </Link>
        )}
      </nav>

      {signedIn && <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} onUnreadChange={unread.set} />}
    </div>
  );
}
