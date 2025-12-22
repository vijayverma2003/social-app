import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { SocketContextProvider } from "@/providers/SocketContextProvider";
import { UserContextProvider } from "@/providers/UserContextProvider";
import { Toaster } from "sonner";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

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
      <html lang="en" className={outfit.variable}>
        <body
          className={`${outfit.variable} antialiased h-screen overflow-hidden dark`}
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
