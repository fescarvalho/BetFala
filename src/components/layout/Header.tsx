'use client';

import { Bell, Menu, WalletCards } from 'lucide-react';
import { formatarMoeda } from '@/lib/calculations';

interface HeaderProps {
  onNovaAposta: () => void;
  onMenuToggle?: () => void;
  activeBancaNome?: string;
  activeBancaSaldo?: number;
  isDataLoaded?: boolean;
}

export default function Header({
  onMenuToggle,
  activeBancaNome = 'Banca Principal',
  activeBancaSaldo = 0,
  isDataLoaded = true,
}: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 md:hidden"
      style={{
        height: '68px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '24px',
        paddingRight: '16px',
        background: 'rgba(5,8,22,0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Left — wallet icon + name + balance */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <div
          style={{
            height: '38px',
            width: '38px',
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '14px',
            background: 'rgba(0,255,136,0.1)',
            color: '#00FF88',
          }}
        >
          <WalletCards size={17} strokeWidth={2} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: '#94A3B8',
              lineHeight: '1',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '130px',
            }}
          >
            {activeBancaNome}
          </p>
          <p
            style={{
              marginTop: '3px',
              fontFamily: 'monospace',
              fontSize: '17px',
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: '1',
            }}
          >
            {isDataLoaded ? formatarMoeda(activeBancaSaldo) : '...'}
          </p>
        </div>
      </div>

      {/* Right — actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          style={{
            height: '40px',
            width: '40px',
            display: 'grid',
            placeItems: 'center',
            borderRadius: '14px',
            color: '#94A3B8',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          aria-label="Notificações"
        >
          <Bell size={17} strokeWidth={1.8} />
        </button>
        <button
          onClick={onMenuToggle}
          style={{
            height: '40px',
            width: '40px',
            display: 'grid',
            placeItems: 'center',
            borderRadius: '14px',
            color: '#94A3B8',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          aria-label="Menu"
        >
          <Menu size={18} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}
