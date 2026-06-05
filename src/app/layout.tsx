import type { Metadata } from 'next';
import './globals.css';

import { Outfit } from 'next/font/google';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'ProBank - Inteligência em Gestão Esportiva',
  description:
    'ProBank - Inteligência em Gestão Esportiva. Dashboard completo com KPIs, gráficos e histórico.',
  keywords: 'apostas esportivas, gestão de banca, ROI, análise de apostas, futebol, NBA',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' }
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${outfit.variable}`}>
      <body className="font-sans antialiased bg-neutral-950 text-white">
        {children}
      </body>
    </html>
  );
}
