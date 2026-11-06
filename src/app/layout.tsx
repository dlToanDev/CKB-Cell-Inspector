import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CKB Cell Inspector — Developer Transaction & Cell Model Explorer",
  description:
    "An educational, interactive transaction explorer for the Nervos CKB ecosystem. Inspect Cell Model state transitions, resolved input/output cells, Lock & Type scripts, capacities, and CKB-VM cycles.",
  keywords: [
    "Nervos",
    "CKB",
    "Common Knowledge Base",
    "Cell Model",
    "UTXO",
    "Blockchain Explorer",
    "CKB-VM",
    "RISC-V",
    "Shannons",
    "Omnilock",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full font-sans">
        {children}
      </body>
    </html>
  );
}
