'use client';

import { Settings, Sliders, Bell, Shield, Cloud } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div style={{ padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)',
          background: 'var(--accent-gradient)', display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <Settings size={20} color="white" />
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Settings</h1>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.95rem' }}>
        Configure your trading terminal preferences and API integrations.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
      }}>
        {[
          { icon: <Sliders size={24} />, title: 'Algorithm Preferences', desc: 'Adjust indicator weights and thresholds for the Master Verdict.' },
          { icon: <Bell size={24} />, title: 'Alerts & Notifications', desc: 'Setup email or SMS alerts when a stock hits a Strong Buy signal.' },
          { icon: <Shield size={24} />, title: 'Risk Management', desc: 'Configure default capital allocation and max drawdown limits.' },
          { icon: <Cloud size={24} />, title: 'Broker API Integrations', desc: 'Connect Zerodha, Upstox, or Groww API keys for live execution.' },
        ].map((setting, i) => (
          <div key={i} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            opacity: 0.7,
            cursor: 'not-allowed'
          }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>{setting.icon}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>{setting.title}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{setting.desc}</div>
            <div style={{ marginTop: '16px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
              Coming Soon
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
