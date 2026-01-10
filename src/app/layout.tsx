import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { auth } from "@/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "AuraGen Studio | AI Image Generator",
  description: "Create stunning AI-generated artwork with our premium image generation studio. Powered by ComfyUI.",
  keywords: ["AI", "image generator", "art", "anime", "ComfyUI"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-grid`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
