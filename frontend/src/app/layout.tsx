import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HOSPITALK — Komunikasi Medis Inklusif",
  description:
    "Platform komunikasi medis berbasis AI untuk pasien disabilitas. Menerjemahkan bahasa isyarat dan suara secara real-time.",
  keywords: ["hospitalk", "medical", "sign language", "accessibility", "healthcare"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
