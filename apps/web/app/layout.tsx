import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { SocketContextProvider } from "@/providers/SocketContextProvider";

const quicksand = Quicksand({
  variable: "--font-quicksand",
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
          className={`${quicksand.variable} antialiased h-screen overflow-hidden`}
        >
          <SocketContextProvider>{children}</SocketContextProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
