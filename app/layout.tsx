import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { LayoutContent } from "@/components/LayoutContent";
import { NotificationCenter } from "@/components/NotificationCenter";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DoXcia - Patient Management",
  description: "Patient Management System for DoXcia",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white min-h-screen`}>
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
          <NotificationCenter />
        </AuthProvider>
      </body>
    </html>
  );
}