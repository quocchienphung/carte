import type { ReactNode } from "react";

import type { PartnerId } from "@/lib/roco-bank/content";

// Simplified, monochrome approximations of the third-party marks visible in the reference strip
// (sized to the measured ink widths, f000/f085). Replace with official brand-kit SVGs before
// production use — these are placeholders for layout fidelity, not the companies' artwork.

type Mark = { w: number; title: string; body: ReactNode };

const T = ({ x, children, size = 17, weight = 700, ls = -0.02 }: { x: number; children: string; size?: number; weight?: number; ls?: number }) => (
  <text x={x} y={16} fontSize={size} fontWeight={weight} letterSpacing={`${ls}em`} fontFamily="var(--roco-font-sans)">
    {children}
  </text>
);

export const PARTNER_MARKS: Record<PartnerId, Mark> = {
  mercury: { w: 84, title: "Mercury", body: <T x={0} size={12.5} weight={500} ls={0.32}>MERCURY</T> },
  retool: {
    w: 76,
    title: "Retool",
    body: (
      <>
        <rect x="0" y="4" width="13" height="3.2" rx="1.2" />
        <rect x="0" y="8.5" width="9" height="3.2" rx="1.2" />
        <rect x="0" y="13" width="13" height="3.2" rx="1.2" />
        <T x={19}>Retool</T>
      </>
    ),
  },
  remote: {
    w: 78,
    title: "remote",
    body: (
      <>
        <path d="M1 18V4.5C1 2.6 2.4 1.5 4.3 1.5h3.3c3 0 4.8 1.8 4.8 4.2 0 2-1.2 3.3-2.9 3.8L13 18H9.3L6.6 10.2H4.4V18z" />
        <T x={17}>remote</T>
      </>
    ),
  },
  arc: {
    w: 62,
    title: "ARC",
    body: (
      <>
        <path d="M2 16 9 2l7 14M4.5 11h9M1 9c4-3 12-3 16 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <T x={28} size={13} weight={600} ls={0.18}>ARC</T>
      </>
    ),
  },
  raycast: {
    w: 86,
    title: "Raycast",
    body: (
      <>
        <path d="M4 9.5 9.5 4 17 11.5 11.5 17zM2 7.5 7.5 2M2 12 12 2M5 16 16 5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <T x={25} size={16} weight={600}>Raycast</T>
      </>
    ),
  },
  runway: {
    w: 86,
    title: "runway",
    body: (
      <>
        <rect x="1" y="2" width="15" height="15" rx="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5.5 14V6h3.5a2.3 2.3 0 0 1 0 4.6H5.5M9 10.6 12 14" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <T x={22}>runway</T>
      </>
    ),
  },
  ramp: {
    w: 76,
    title: "ramp",
    body: (
      <>
        <T x={0} size={19} weight={600}>ramp</T>
        <path d="M58 15c3-1 8-6 12-12-2 6-4 10-8 13z" />
      </>
    ),
  },
  hex: { w: 46, title: "HEX", body: <T x={0} size={21} weight={900} ls={-0.04}>HEX</T> },
  vercel: {
    w: 76,
    title: "Vercel",
    body: (
      <>
        <path d="M9 2 18 17H0z" />
        <T x={20} size={18} weight={600}>Vercel</T>
      </>
    ),
  },
  descript: {
    w: 76,
    title: "descript",
    body: (
      <>
        <rect x="0" y="3" width="10" height="2.6" rx="1" />
        <rect x="3" y="7.5" width="9" height="2.6" rx="1" />
        <rect x="0" y="12" width="12" height="2.6" rx="1" />
        <rect x="3" y="16" width="6" height="2" rx="1" />
        <T x={16} size={16.5} weight={600}>descript</T>
      </>
    ),
  },
  cashapp: {
    w: 84,
    title: "Cash App",
    body: (
      <>
        <rect x="0" y="1" width="17" height="17" rx="4.5" />
        <text x="8.5" y="14.5" fontSize="13" fontWeight="700" textAnchor="middle" fill="#fff" fontFamily="var(--roco-font-sans)">$</text>
        <T x={22} size={15.5} weight={500}>Cash App</T>
      </>
    ),
  },
  supercell: {
    w: 36,
    title: "Supercell",
    body: (
      <g fontFamily="var(--roco-font-sans)" fontWeight={900} fontSize={9.6} letterSpacing="-0.05em">
        <text x="0" y="7">SUP</text>
        <text x="0" y="14.5">ERC</text>
        <text x="0" y="22">ELL</text>
      </g>
    ),
  },
};
