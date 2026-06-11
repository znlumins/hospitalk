import type { Metadata } from "next";
import Script from "next/script";
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
      <head>
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" strategy="beforeInteractive" crossOrigin="anonymous" />
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" strategy="beforeInteractive" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
