import type { Metadata } from "next";
import PlausibleProvider from "next-plausible";
import "./globals.css";

let title = "Ollama Coder – AI Code Generator";
let description = "Generate your next app with Ollama";
let url = "https://ollamacoder.io/";
let ogimage = "https://llamacoder.io/og-image.png";
let sitename = "ollamacoder.io";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title,
  description,
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    images: [ogimage],
    title,
    description,
    url: url,
    siteName: sitename,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: [ogimage],
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-gray-100">
      <head>
        <PlausibleProvider domain="ollamacoder.io" />
      </head>
      <body className="h-full antialiased">
        {children}
      </body>
    </html>
  );
}
