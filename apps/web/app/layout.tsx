import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "I Hate Form — Modern Form Automation Platform",
  description: "Autonomous, privacy-first job application autofill and profile sync assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        {children}
      </body>
    </html>
  );
}
