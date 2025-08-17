import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/shared/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InsightLoop - Find Auto MCP's",
  description: "Discover, deploy, and orchestrate MCP servers with AI-powered automation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900`}>
        <div className="relative min-h-screen">
          {/* Background effects */}
          <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          <div className="fixed inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          </div>
          
          {/* Content */}
          <div className="relative z-10 container mx-auto px-4 py-8">
            <Navigation />
            <main>{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
