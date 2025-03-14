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
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, viewport-fit=contain user-scalable=no maximum-scale=1"
        />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/logo192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <div className={`flex flex-col w-full h-full bg-black`}>
          <Header />
          <div className="flex flex-col h-container w-full overflow-y-scroll">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
