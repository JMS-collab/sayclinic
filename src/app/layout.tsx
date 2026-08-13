import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// OPRAVENÁ CESTA:
import NextAuthProvider from "../components/NextAuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SAY CLINIC",
  description: "Plastická chirurgia & Dermatológia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk">
      <body className={inter.className}>
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  );
}