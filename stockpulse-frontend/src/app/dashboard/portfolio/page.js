'use client';

import { Briefcase, Activity } from 'lucide-react';
import ActivePositions from '../../../components/dashboard/ActivePositions';

export default function PortfolioPage() {
  return (
    <div style={{ padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)',
          background: 'var(--accent-gradient)', display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <Briefcase size={20} color="white" />
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Portfolio Command Center</h1>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.95rem' }}>
        Manage your active positions and track live P&L in real-time.
      </p>

      {/* Warning/Info banner */}
      <div style={{
        background: 'rgba(41, 98, 255, 0.05)',
        border: '1px solid rgba(41, 98, 255, 0.2)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: 'var(--accent-light)'
      }}>
        <Activity size={20} />
        <div style={{ fontSize: '0.9rem' }}>
          <strong>Pro Tip:</strong> Enter your trades from Groww or Zerodha here. This tracker will monitor your Stop Loss and Target levels live without you needing to constantly check your broker app.
        </div>
      </div>

      {/* Render the Active Positions component we built earlier */}
      <ActivePositions />
    </div>
  );
}
