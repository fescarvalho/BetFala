import type { Metadata } from 'next';
import './globals.css';

import { Outfit } from 'next/font/google';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'BetFala — Gestão de Banca de Apostas',
  description:
    'Gerencie sua banca de apostas esportivas com inteligência. Dashboard completo com KPIs, gráficos e histórico de apostas.',
  keywords: 'apostas esportivas, gestão de banca, ROI, análise de apostas, futebol, NBA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${outfit.variable}`}>
      <body className="font-sans antialiased bg-[#050816] text-[#FFFFFF]">
        {children}
      </body>
    </html>
  );
}
