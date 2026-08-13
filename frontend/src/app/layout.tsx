import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nostalgic Moments — Immersive Music Experience Platform",
  description: "Step inside nostalgic Indian environments and stream classic melodies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
