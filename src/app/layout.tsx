import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PriceLock — Autonomous Price-Drop Sniper, Dark-Pattern Surgeon & PayPal Hold Studio",
  description:
    "Never overpay at checkout again. PriceLock finds the lowest verified price across 25,000 stores via Channel3, strips checkout dark patterns live, and holds your PayPal money until the price drops.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="warm">
      <body className="antialiased">{children}</body>
    </html>
  );
}
