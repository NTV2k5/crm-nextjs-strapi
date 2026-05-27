import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { Providers } from './providers';
import '../index.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'CRM NEXT',
  description: 'Hệ thống quản lý quan hệ khách hàng tinh gọn, hiện đại và bảo mật.',
};

import { AppLayout } from '@/components/layout/AppLayout';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className={`${outfit.variable} font-sans bg-background text-foreground antialiased min-h-screen flex`}>
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}