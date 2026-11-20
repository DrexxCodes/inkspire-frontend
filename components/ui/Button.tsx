import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "blue" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface Common {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  icon?: IconName;
  children?: ReactNode;
  className?: string;
}

const classes = ({ variant = "primary", size = "md", block, className }: Common) =>
  cn("btn", `btn--${variant}`, size !== "md" && `btn--${size}`, block && "btn--block", className);

interface ButtonProps extends Common, Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  loading?: boolean;
}

export function Button({ variant, size, block, icon, children, className, loading, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={classes({ variant, size, block, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="spinner" aria-hidden="true" />}
      {icon && <Icon name={icon} size={18} />}
      {children}
      {loading && <span className="visually-hidden">Loading</span>}
    </button>
  );
}

interface ButtonLinkProps extends Common {
  href: string;
}

export function ButtonLink({ href, variant, size, block, icon, children, className }: ButtonLinkProps) {
  return (
    <Link href={href} className={classes({ variant, size, block, className })}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </Link>
  );
}

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: IconName;
  /** Required: icon only buttons need an accessible name. */
  label: string;
  size?: "sm" | "md";
  plain?: boolean;
}

export function IconButton({ icon, label, size = "md", plain, className, type = "button", ...rest }: IconButtonProps) {
  return (
    <button type={type} aria-label={label} title={label} className={cn("icon-btn", size === "sm" && "icon-btn--sm", plain && "icon-btn--plain", className)} {...rest}>
      <Icon name={icon} size={size === "sm" ? 18 : 20} />
    </button>
  );
}
