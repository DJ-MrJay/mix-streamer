import type { Metadata } from "next";
import { helveticaNowDisplay } from "@/app/fonts";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/site-url";
import { getThemeScript } from "@/lib/theme";
import "./globals.css";

import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;

const defaultShareImage = toAbsoluteUrl("/android-chrome-512x512.png");

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "DJ Mr. Jay Mixtapes",
  description:
    "DJ mix streaming platform showcasing the best of DJ Mr Jay's mixes, featuring a wide range of genres and styles. Explore my collection of expertly crafted mixes, perfect for all occasions.",
  openGraph: {
    title: "DJ Mr. Jay Mixtapes",
    description:
      "DJ mix streaming platform showcasing the best of DJ Mr Jay's mixes, featuring a wide range of genres and styles. Explore my collection of expertly crafted mixes, perfect for all occasions.",
    type: "website",
    url: "/",
    siteName: "DJ Mr. Jay Mixtapes",
    images: [
      {
        url: defaultShareImage,
        width: 512,
        height: 512,
        alt: "DJ Mr. Jay Mixtapes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DJ Mr. Jay Mixtapes",
    description:
      "DJ mix streaming platform showcasing the best of DJ Mr Jay's mixes, featuring a wide range of genres and styles. Explore my collection of expertly crafted mixes, perfect for all occasions.",
    images: [defaultShareImage],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${helveticaNowDisplay.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <script dangerouslySetInnerHTML={{ __html: getThemeScript() }} />
        {children}
      </body>
    </html>
  );
}
