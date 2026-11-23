import React from "react";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./global.css";
import Header from "./shared/widgets/header/Header";
import Providers from "./providers";
import Footer from "./shared/widgets/footer/Footer";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arj-body",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-arj-display",
  display: "swap",
});

export const metadata = {
  title: "ARJ GROUP | Curated Commerce",
  description:
    "Discover considered essentials and trusted independent sellers at ARJ GROUP.",
};

export const viewport = {
  themeColor: "#070b14",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${plusJakartaSans.variable}`}
      >
        <Providers>
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
