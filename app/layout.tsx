import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';

export const metadata: Metadata = {
  title: 'Workflow Builder - Visual Workflow Design Tool',
  description: 'A visual workflow builder with interactive node-based editing',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={GeistSans.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
