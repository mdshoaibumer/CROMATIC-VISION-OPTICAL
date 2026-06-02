import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "@/components/layout/client-layout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cromatic Vision Optical | Premium Eyewear & Vision Care",
  description:
    "Discover premium eyeglasses, sunglasses & contact lenses at Cromatic Vision Optical. Free eye tests, 50+ brands, expert care. Your Vision, Our Care.",
  keywords: [
    "eyeglasses",
    "sunglasses",
    "contact lenses",
    "eye test",
    "optical store",
    "premium eyewear",
    "luxury frames",
    "designer eyewear",
  ],
  openGraph: {
    title: "Cromatic Vision Optical | Premium Eyewear & Vision Care",
    description:
      "Discover premium eyeglasses, sunglasses & contact lenses. Free eye tests, 50+ brands, expert care.",
    type: "website",
    locale: "en_IN",
    siteName: "Cromatic Vision Optical",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cromatic Vision Optical",
    description: "Premium Eyewear & Vision Care. Your Vision, Our Care.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full antialiased scroll-smooth`}>
      <body className="min-h-full flex flex-col font-sans bg-[#fafafa]">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
