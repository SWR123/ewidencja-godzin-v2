import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ModernSidebar } from "@/components/modern-sidebar";
import { SidebarProvider } from "@/components/sidebar-provider";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: "Ewidencja Godzin - System zarządzania",
  description: "System do ewidencji godzin pracy społecznej",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Ewidencja Godzin",
    description: "System do ewidencji godzin pracy społecznej",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js"></script>
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <SidebarProvider>
            <div className="flex min-h-screen bg-[#f5f6f8] relative">
              {/* Modern Sidebar */}
              <ModernSidebar />

              {/* Main Content */}
              <main className="flex-1 p-8 transition-all duration-300">
                <div className="max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
