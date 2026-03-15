import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KTU Report Formatter",
  description: "Compose and format APJ KTU-style academic project reports with live A4 preview and PDF export",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
