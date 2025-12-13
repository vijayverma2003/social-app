import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { SocketContextProvider } from "@/providers/SocketContextProvider";
import { UserContextProvider } from "@/providers/UserContextProvider";
import { Toaster } from "sonner";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
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
      <html lang="en">
        <body
          className={`${openSans.variable} antialiased h-screen overflow-hidden`}
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
