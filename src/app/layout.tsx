import type { Metadata } from "next";
import { Geist, Geist_Mono, Fascinate_Inline, Michroma, Delius } from "next/font/google";

// Custom font import for Sansation since it might not be in next/font/google
const sansationFont = {
  variable: "--font-sansation",
};
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { GuestCartProvider } from "@/contexts/GuestCartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { Toaster } from "react-hot-toast";
import Navigation from "@/components/Navigation";
import StickyHeader from "@/components/StickyHeader";
import { Footer } from "@/components/home/Footer";

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

const michroma = Michroma({
  variable: "--font-michroma",
  subsets: ["latin"],
  weight: "400",
});

const delius = Delius({
  variable: "--font-delius",
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
        className={`${geistSans.variable} ${geistMono.variable} ${fascinateInline.variable} ${michroma.variable} ${delius.variable} ${sansationFont.variable} antialiased`}
      >
        <AuthProvider>
          {/* <CartProvider> - Disabled to prevent duplicate API calls */}
            <GuestCartProvider>
              <WishlistProvider>
                <Navigation />
                <StickyHeader />
                <div className="bg-black text-white pt-20">
                  {children}
                  <Footer />
                </div>
                <Toaster position="top-right" />
              </WishlistProvider>
            </GuestCartProvider>
          {/* </CartProvider> */}
        </AuthProvider>
      </body>
    </html>
  );
}
