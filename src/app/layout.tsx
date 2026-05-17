import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme';
import { StoreProvider } from '@/lib/store-context';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Kiosk ERP',
  description: 'ERP para quiosque de alimentação e bebidas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body bg-stone-50 dark:bg-neutral-950 text-stone-900 dark:text-stone-100 min-h-screen transition-colors duration-300">
        <ThemeProvider>
          <StoreProvider>
            <Navbar />
            <main className="pt-16">{children}</main>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
