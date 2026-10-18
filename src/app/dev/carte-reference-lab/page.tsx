import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReferenceLab } from "@/components/sites/carte/lab/ReferenceLab";

export const metadata: Metadata = {
  title: "Carte reference lab (dev)",
  robots: { index: false, follow: false },
};

/** Dev-only: Affect UI sources next to their Carte adapters. 404 in production builds. */
export default function CarteReferenceLabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ReferenceLab />;
}
