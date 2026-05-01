'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, BarChart3, ArrowRight } from 'lucide-react';
import ActivePositions from '../../components/dashboard/ActivePositions';

export default function DashboardPage() {
  return (
    <div style={{ padding: '28px' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 8 }}>Dashboard</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '0.95rem' }}>
        Welcome back! Here&apos;s your market overview.
      </p>

      {/* Market Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 36,
      }}>
        {[
          { label: 'NIFTY 50', value: '23,997.55', change: '-0.74%', up: false },
          { label: 'SENSEX', value: '76,913.50', change: '-0.75%', up: false },
          { label: 'NIFTY BANK', value: '52,145.20', change: '+0.32%', up: true },
          { label: 'INDIA VIX', value: '14.82', change: '-2.15%', up: false },
        ].map((item, i) => (
          <div key={i} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              {item.value}
            </div>
            <div style={{
              fontSize: '0.85rem', fontWeight: 600, marginTop: 4,
              color: item.up ? 'var(--green)' : 'var(--red)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {item.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {item.change}
            </div>
          </div>
        ))}
      </div>

      <ActivePositions />
    </div>
  );
}
