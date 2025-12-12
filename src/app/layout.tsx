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
  title: {
    default: "Quoridor Online - Strategy Board Game",
    template: "%s | Quoridor Online",
  },
  description: "Play Quoridor locally or online with friends. A beautiful, animated implementation of the classic strategy board game where you build walls and find paths.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Quoridor Online - Strategy Board Game",
    description: "Play Quoridor locally or online with friends. Build walls, find paths, and race to the other side!",
    url: "https://quoridor.vrandagarg.in/", // Replace with your actual deployment URL if known
    siteName: "Quoridor Online",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "Quoridor Online Game Board",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quoridor Online - Strategy Board Game",
    description: "Play Quoridor locally or online with friends. Build walls, find paths, and race to the other side!",
    images: ["/banner.png"],
    creator: "@VrandaaGarg", // Optional: Update if you have a handle
  },
  metadataBase: new URL("https://quoridor.vrandagarg.in/"), // Replace with your actual deployment URL
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
