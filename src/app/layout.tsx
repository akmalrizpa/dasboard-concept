import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BeautyLoka — Toko Kecantikan No. 1 Indonesia",
  description:
    "Belanja skincare, makeup, perawatan rambut & tubuh, dan parfum 100% original dengan harga terbaik. Gratis ongkir min. Rp300.000.",
  keywords: [
    "BeautyLoka",
    "toko kecantikan online",
    "skincare",
    "makeup",
    "beauty e-commerce Indonesia",
  ],
  openGraph: {
    title: "BeautyLoka — Toko Kecantikan No. 1 Indonesia",
    description:
      "Belanja produk kecantikan 100% original dengan harga terbaik.",
    type: "website",
    siteName: "BeautyLoka",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
