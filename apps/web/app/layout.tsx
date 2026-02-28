import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { SocketContextProvider } from "@/providers/SocketContextProvider";
import { UserContextProvider } from "@/providers/UserContextProvider";
import { Toaster } from "sonner";
import localFont from "next/font/local";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

const satoshi = localFont({
  src: "../public/fonts/satoshi/Satoshi-Variable.woff2",
  display: "swap",
  variable: "--font-satoshi",
  weight: "300 900",
});

export const metadata: Metadata = {
  title: "The Social App",
  description: "The Social App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${satoshi.variable}`}>
        <body
          className={`${satoshi.variable} antialiased h-screen overflow-hidden dark`}
        >
          <UserContextProvider>
            <SocketContextProvider>{children}</SocketContextProvider>
          </UserContextProvider>
          <Toaster position="top-center" />
        </body>
      </html>
    </ClerkProvider>
  );
}
