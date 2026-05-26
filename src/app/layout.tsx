import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
