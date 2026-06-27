import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inspector — AI Car Listing Analyzer",
  description: "Paste a car listing URL or VIN to get an AI-powered defect report, 3D reference model, and expert buy advice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0a] text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
