import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarNav } from "@/components/sidebar-nav";
import { TopBar } from "@/components/top-bar";
import { ToastProvider } from "@/components/toast";
import { CommandPalette } from "@/components/command-palette";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TerraFusion | Benton County Mass Appraisal Intelligence",
  description:
    "IAAO-compliant assessment analytics platform for Benton County, WA. Ratio studies (COD, PRD, PRB), neighborhood equity analysis, and multi-agent property intelligence across Kennewick, Richland, and Pasco.",
  keywords: ["mass appraisal", "IAAO", "ratio study", "Benton County", "property assessment", "COD", "PRD", "PRB"],
};

export const viewport: Viewport = {
  themeColor: "#0d1b2a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-background">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:outline-none"
        >
          Skip to main content
        </a>
        <ToastProvider>
          <CommandPalette />
          <div className="flex h-screen overflow-hidden">
            <SidebarNav />
            <div className="flex flex-1 flex-col overflow-hidden">
              <TopBar />
              <main id="main-content" className="flex-1 overflow-y-auto" role="main">
                {children}
              </main>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
