import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { getSettings } from "@/lib/settings";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

/** Metadata dinamis — nama toko & deskripsi diambil dari pengaturan admin (database) */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSettings();
    const metaTitle = (settings["site.metaTitle"] as string) || "BeautyLoka";
    const metaDescription =
      (settings["site.metaDescription"] as string) ||
      "Belanja produk kecantikan 100% original dengan harga terbaik.";
    return {
      title: metaTitle,
      description: metaDescription,
      keywords: [
        "toko kecantikan online",
        "skincare",
        "makeup",
        "beauty e-commerce Indonesia",
      ],
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        type: "website",
        siteName: (settings["site.name"] as string) || "BeautyLoka",
      },
    };
  } catch {
    return {
      title: "BeautyLoka",
      description: "Toko kecantikan online.",
    };
  }
}

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
