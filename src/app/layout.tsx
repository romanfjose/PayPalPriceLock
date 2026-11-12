import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PriceLock — Autonomous Checkout Protection & PayPal Price-Floor Holds",
  description:
    "Stop paying the checkout tax. PriceLock strips hidden warranty traps, compares 25,000 stores via Channel3, and holds your PayPal money until the true price floor hits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="warm" className={`${jakarta.variable} ${jetbrains.variable}`}>
      <body className="antialiased selection:bg-emerald-500/20">{children}</body>
    </html>
  );
}
