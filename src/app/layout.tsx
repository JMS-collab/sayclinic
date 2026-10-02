import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NextAuthProvider from "../components/NextAuthProvider";
import GlobalContextMenu from "../components/GlobalContextMenu";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SAY CLINIC",
  description: "Plastická chirurgia & Dermatológia - SAY CLINIC IS",
  openGraph: {
    title: "SAY CLINIC",
    description: "Plastická chirurgia & Dermatológia - SAY CLINIC IS",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <NextAuthProvider>
          <GlobalContextMenu>
            {children}
          </GlobalContextMenu>
        </NextAuthProvider>
      </body>
    </html>
  );
}