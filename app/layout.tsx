import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'E-Sabong Live',
  description: 'Online Cockfighting Arena - Live Betting',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
