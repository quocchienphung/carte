import type { Metadata, Viewport } from "next";
import { Albert_Sans, DM_Mono, JetBrains_Mono, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

// Albert Sans: closest licensed (OFL) match to the reference headline/body type by rendered-glyph
// correlation (references/FONT_FORENSICS.md). DM Mono approximates the pill amounts.
const albert = Albert_Sans({
  variable: "--font-albert",
  subsets: ["latin", "latin-ext"],
  display: "block",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "block",
});

// Plinth "What actually happens to a request" section type (process column beside the device)
const schibsted = Schibsted_Grotesk({ variable: "--font-schibsted", subsets: ["latin"], display: "swap" });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Roco.bank — Professional bank card",
  description:
    "Roco.bank introduces a bank card crafted for professionals who demand excellence — real-time controls, secure digital payments and contactless pay.",
};

export const viewport: Viewport = {
  themeColor: "#f1f1f1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${albert.variable} ${dmMono.variable} ${schibsted.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
