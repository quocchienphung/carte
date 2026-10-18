// Carte security glyphs: stroke paths on a 24 × 24 grid (1.6 stroke, round caps). Plain path strings
// so the DOM (<path d>) and the device's canvas textures (new Path2D(d)) draw the exact same marks.
export const GLYPHS = {
  card: "M3 6.5h18v11H3zM3 10h18M6.5 14.5h3",
  device: "M7.5 2.5h9v19h-9zM10.5 18.5h3",
  store:
    "M4.5 10.5V20h15v-9.5M3 9.5 4.6 4h14.8L21 9.5M3 9.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 3 0M10 20v-5h4v5",
  shield: "M12 2.8 19.5 5.6v5.9c0 4.6-3.2 8.1-7.5 9.8-4.3-1.7-7.5-5.2-7.5-9.8V5.6z",
  shieldCheck: "M12 2.8 19.5 5.6v5.9c0 4.6-3.2 8.1-7.5 9.8-4.3-1.7-7.5-5.2-7.5-9.8V5.6zM8.7 12.1l2.3 2.3 4.4-4.6",
  check: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12.2l2.7 2.7L16 9.6",
  receipt: "M6 2.8h12v18.4l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4zM9 8h6M9 11.5h6M9 15h3.5",
  lock: "M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5M5 10.5h14v10H5zM12 14.5V17",
  unlock: "M7.5 10.5V8a4.5 4.5 0 0 1 8.7-1.7M5 10.5h14v10H5zM12 14.5V17",
  snowflake: "M12 2.5v19M3.8 7.25l16.4 9.5M3.8 16.75l16.4-9.5M9 3.8 12 6l3-2.2M9 20.2 12 18l3 2.2",
  pulse: "M3 12h4l2.5-6 5 12 2.5-6h4",
  pin: "M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11zM12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4",
  amount:
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM14.6 9.2c-.5-.9-1.5-1.4-2.6-1.4-1.6 0-2.7.8-2.7 2s1 1.7 2.7 2.1 2.8 1 2.8 2.2-1.2 2.1-2.8 2.1c-1.2 0-2.2-.5-2.8-1.5M12 6.3v1.5M12 16.2v1.5",
  bell: "M6 16.5V11a6 6 0 0 1 12 0v5.5l1.8 2.2H4.2zM9.8 21a2.4 2.4 0 0 0 4.4 0",
  alert: "M10.3 3.9a2 2 0 0 1 3.4 0l7.5 13a2 2 0 0 1-1.7 3H4.5a2 2 0 0 1-1.7-3zM12 9.5v4M12 16.8v.2",
  reset: "M4 12a8 8 0 1 0 2.4-5.7M4 4.5v4h4",
  play: "M8 5.5v13l10.5-6.5z",
} as const;

export type GlyphName = keyof typeof GLYPHS;
