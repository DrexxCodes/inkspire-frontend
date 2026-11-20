import type { SVGProps } from "react";

type Shape = string | ["c", number, number, number] | ["r", number, number, number, number, number];

/** Small stroke icon set (24px grid). Local on purpose: no icon package, no network. */
const ICONS = {
  home: ["M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"],
  compass: [["c", 12, 12, 10], "m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"],
  pen: ["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"],
  user: ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", ["c", 12, 7, 4]],
  users: ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", ["c", 9, 7, 4], "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  heart: ["M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"],
  comment: ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"],
  share: [["c", 18, 5, 3], ["c", 6, 12, 3], ["c", 18, 19, 3], "m8.59 13.51 6.83 3.98", "m15.41 6.51-6.82 3.98"],
  eye: ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z", ["c", 12, 12, 3]],
  bell: ["M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9", "M13.73 21a2 2 0 0 1-3.46 0"],
  search: [["c", 11, 11, 8], "m21 21-4.35-4.35"],
  plus: ["M12 5v14M5 12h14"],
  x: ["M18 6 6 18M6 6l12 12"],
  check: ["M20 6 9 17l-5-5"],
  chevronDown: ["m6 9 6 6 6-6"],
  chevronRight: ["m9 18 6-6-6-6"],
  chevronLeft: ["m15 18-6-6 6-6"],
  sliders: ["M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"],
  history: [["c", 12, 12, 10], "M12 6v6l4 2"],
  flag: ["M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z", "M4 22v-7"],
  trash: ["M3 6h18", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"],
  shield: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"],
  layout: [["r", 3, 3, 7, 7, 1], ["r", 14, 3, 7, 7, 1], ["r", 14, 14, 7, 7, 1], ["r", 3, 14, 7, 7, 1]],
  chart: ["M12 20V10M18 20V4M6 20v-4"],
  book: ["M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z", "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"],
  file: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6M16 13H8M16 17H8"],
  image: [["r", 3, 3, 18, 18, 2], ["c", 8.5, 8.5, 1.5], "m21 15-5-5L5 21"],
  link: ["M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71", "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"],
  menu: ["M3 12h18M3 6h18M3 18h18"],
  more: [["c", 12, 12, 1], ["c", 19, 12, 1], ["c", 5, 12, 1]],
  alert: ["M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z", "M12 9v4M12 17h.01"],
  refresh: ["M23 4v6h-6M1 20v-6h6", "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"],
  upload: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m17 8-5-5-5 5", "M12 3v12"],
  columns: [["r", 3, 3, 18, 18, 2], "M12 3v18"],
  lock: [["r", 3, 11, 18, 11, 2], "M7 11V7a5 5 0 0 1 10 0v4"],
  tag: ["M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z", "M7 7h.01"],
  arrowUp: ["M12 19V5M5 12l7-7 7 7"],
} satisfies Record<string, Shape[]>;

export type IconName = keyof typeof ICONS;

interface Props extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, strokeWidth = 2, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {(ICONS[name] as Shape[]).map((s, i) => {
        if (typeof s === "string") return <path key={i} d={s} />;
        if (s[0] === "c") return <circle key={i} cx={s[1]} cy={s[2]} r={s[3]} />;
        return <rect key={i} x={s[1]} y={s[2]} width={s[3]} height={s[4]} rx={s[5]} />;
      })}
    </svg>
  );
}
