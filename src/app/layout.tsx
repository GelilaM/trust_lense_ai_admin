import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/layouts/dashboard-layout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrustLens AI | Admin Portal",
  description: "Macro-level intelligence and operational KPIs for TrustLens AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full", "antialiased", inter.variable)} suppressHydrationWarning>
      <body className="font-sans min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
