import type { Metadata } from "next";
import { helveticaNowDisplay } from "@/app/fonts";
import { getThemeScript } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "DJ Mr Jay - Mixes",
  description: "DJ mix streaming platform showcasing the best of DJ Mr Jay's mixes, featuring a wide range of genres and styles. Explore my collection of expertly crafted mixes, perfect for all occasions.",
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
