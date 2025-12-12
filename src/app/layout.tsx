import type { Metadata } from "next";
import { Geist, Geist_Mono, Fredoka, Rubik_Bubbles } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const rubikBubbles = Rubik_Bubbles({
  variable: "--font-rubik-bubbles",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quoridor Online",
  description: "Play Quoridor locally or online with friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} ${rubikBubbles.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
