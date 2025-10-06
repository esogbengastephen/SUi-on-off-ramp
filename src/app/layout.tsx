import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@mysten/dapp-kit/dist/index.css";
import { SuiWalletProvider } from "@/components/providers/wallet-provider";
import { FirebaseProvider } from "@/components/providers/firebase-provider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SwitcherFi - Seamless Crypto-to-Fiat Swaps",
  description: "Your gateway to seamless crypto-to-fiat swaps. Trade SUI, USDC, and USDT for Naira with ease and security.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} antialiased bg-[var(--color-background)] text-[var(--color-text-primary)]`}>
        <ThemeProvider defaultTheme="system" storageKey="switcherfi-theme">
          <FirebaseProvider>
            <SuiWalletProvider>
              {children}
              <Toaster position="top-right" richColors />
            </SuiWalletProvider>
          </FirebaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
