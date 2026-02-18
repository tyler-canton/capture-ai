import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Capture.ai - Data Processing Platform",
  description: "CSV processing with S3, SQS, and Saga patterns",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100">{children}</body>
    </html>
  );
}
