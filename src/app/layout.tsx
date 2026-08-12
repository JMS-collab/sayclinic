import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAY CLINIC | CRM & Ambulantný Systém",
  description: "Plastická chirurgia & Dermatológia Banská Bystrica",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Montserrat:wght@200;300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#FBF9F6] text-[#2C2A29] font-sans antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
