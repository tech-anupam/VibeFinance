import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tip Court",
  description: "Verify stock tips before you act. Education, not investment advice.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="min-h-screen bg-bg text-text-primary antialiased">
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        <footer className="border-t border-border px-4 py-4 text-center text-xs text-text-muted">
          For educational purposes only. This is not investment advice.
          Consult a qualified financial advisor before making investment decisions.
        </footer>
      </body>
    </html>
  );
}
