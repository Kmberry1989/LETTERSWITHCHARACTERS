import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { cn } from '@/lib/utils';
import { FirebaseProvider } from '@/firebase/provider';
import { BerriesProvider } from '@/hooks/use-berries';
import { AudioProvider } from '@/hooks/use-audio';

export const metadata: Metadata = {
  title: 'Letters with Characters',
  description: 'A multiplayer Scrabble clone with customizable avatars and more.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased', 'min-h-screen bg-background font-sans')}>
        <FirebaseProvider>
          <BerriesProvider>
            <AudioProvider>
              {children}
            </AudioProvider>
          </BerriesProvider>
        </FirebaseProvider>
        <Toaster />
      </body>
    </html>
  );
}
