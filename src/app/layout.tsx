import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WHOOP Dashboard",
  description: "Personal WHOOP recovery, strain, and sleep dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-whoop-bg text-white antialiased">
        {children}
      </body>
    </html>
  );
}
