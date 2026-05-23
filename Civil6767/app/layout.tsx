import type { Metadata } from 'next';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { ToastProvider } from '@/components/layout/ToastProvider';

export const metadata: Metadata = {
  title: 'HydrOS | Powódź',
  description:
    'System zarządzania kryzysem medycznym w warunkach powodzi — monitoring szpitali, predykcja zagrożeń, planowanie ewakuacji.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
