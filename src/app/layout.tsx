import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Aid.me",
  description: "Can you hear me now? Closed captions for your life.",
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
