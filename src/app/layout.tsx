import type { Metadata } from "next";
import { Geist, Geist_Mono, Fascinate_Inline } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { GuestCartProvider } from "@/contexts/GuestCartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fascinateInline = Fascinate_Inline({
  variable: "--font-fascinate-inline",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Custom Catalog",
  description: "Custom Catalog Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fascinateInline.variable} antialiased`}
      >
        <AuthProvider>
          <CartProvider>
            <GuestCartProvider>
              <WishlistProvider>
                {children}
                <Toaster position="top-right" />
              </WishlistProvider>
            </GuestCartProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
