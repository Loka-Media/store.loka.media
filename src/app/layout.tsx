import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { GuestCartProvider } from "@/contexts/GuestCartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { Toaster } from "react-hot-toast";
import Navigation from "@/components/Navigation";
import StickyHeader from "@/components/StickyHeader";
import Footer from "@/components/home/Footer";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Loka Media - Premium Design Marketplace | Custom Products",
  description:
    "Discover curated designs from top creators worldwide. Shop premium custom products, print-on-demand items, and exclusive designs from independent artists. Support creators and find your unique style on Loka Media.",
  keywords:
    "design marketplace, print-on-demand, custom products, independent creators, premium designs",
  authors: [{ name: "Loka Media" }],
  creator: "Loka Media",
  publisher: "Loka Media",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://store.loka.media",
    siteName: "Loka Media",
    title: "Loka Media - Premium Design Marketplace",
    description: "Discover curated designs from top creators worldwide",
    images: [
      {
        url: "https://store.loka.media/og-image.png",
        width: 1200,
        height: 630,
        alt: "Loka Media Marketplace",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-clash">
        <AuthProvider>
          {/* <CartProvider> - Disabled to prevent duplicate API calls */}
          <GuestCartProvider>
            <WishlistProvider>
              <Navigation />
              {/* <StickyHeader /> */}
              <div className="pt-16">
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
