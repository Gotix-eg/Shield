import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shield Advocates - Legal Management System',
  description: 'Professional legal case management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
