'use client';

import { Plus, Bell, Menu } from 'lucide-react';

interface HeaderProps {
  onNovaAposta: () => void;
  onMenuToggle?: () => void;
}

export default function Header({ onNovaAposta, onMenuToggle }: HeaderProps) {
  const now = new Date();
  const greeting = () => {
    const h = now.getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <header className="h-[72px] bg-transparent flex items-center justify-between px-4 md:px-7 sticky top-0 z-20">
      {/* Esquerda: (No screenshot logo is here, assuming left side is empty on mobile if logo is outside, but let's keep empty space if logo is in sidebar) */}
      <div className="flex items-center gap-3">
        {/* Placeholder for left side if needed */}
      </div>

      {/* Direita: Avatar e Menu */}
      <div className="flex items-center gap-4">
        {/* Avatar Simulando o da imagem */}
        <div className="w-10 h-10 rounded-full bg-gray-600 border border-[rgba(255,255,255,0.1)] overflow-hidden">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User Avatar" className="w-full h-full object-cover" />
        </div>

        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden text-[var(--text-primary)] p-1"
          >
            <Menu size={24} />
          </button>
        )}
      </div>
    </header>
  );
}
