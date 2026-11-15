import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { settings } from "@/lib/settings";
import { SiteHeader } from "@/components/ui/SiteHeader";

// The app's one font. Only the three weights the design uses are loaded.
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

export const metadata: Metadata = {
  title: { default: settings.appName, template: `%s · ${settings.appName}` },
  description: settings.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={hanken.variable}>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only rounded-control bg-card px-4 py-3 font-bold focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
        >
          Skip to the content
        </a>
        <SiteHeader />
        {/* The one <main> for every screen. It owns the page gutter and the content width. */}
        <main id="main" className="mx-auto w-full max-w-[1040px] px-4 pb-16 pt-6 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
