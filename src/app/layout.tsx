import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Aid.me",
  description: "Can you hear me now? Closed captions for your life.",
  keywords: [
    "accessibility",
    "captions",
    "transcription",
    "hearing assistance",
  ],
  authors: [{ name: "Aid.me Team" }],
  openGraph: {
    title: "Aid.me - Closed captions for your life",
    description:
      "Real-time speech transcription to help you hear the world around you.",
    url: "https://aid.me",
    siteName: "Aid.me",
    locale: "en_US",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/logo192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <div className="flex flex-col w-full h-full bg-black">
          <Header />
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}
