import type { Metadata } from "next";
import { Hanken_Grotesk, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Dodo CRM — Lead Tracker",
  description: "Track and manage Dodo Payments product demo leads",
};

// Inline script that runs BEFORE React hydration to set the data-theme attribute
// This prevents any flash of wrong theme
const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('dodo-theme');
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${hanken.variable} ${dmSans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${hanken.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
