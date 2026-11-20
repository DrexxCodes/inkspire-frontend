import Link from "next/link";
import { cn } from "@/utils/cn";
import { formatCount } from "@/utils/format";

interface Props {
  label: string;
  value: number;
  href?: string;
  attention?: boolean;
}

export function MetricCard({ label, value, href, attention }: Props) {
  const body = (
    <>
      <div className="metric__label">{label}</div>
      <div className="metric__value">{formatCount(value)}</div>
    </>
  );
  const cls = cn("metric", attention && value > 0 && "metric--attention", href && "metric--link");
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
