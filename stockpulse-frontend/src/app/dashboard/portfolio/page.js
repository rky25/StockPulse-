'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, TrendingUp, TrendingDown, Clock, Activity, Target, CheckCircle2, AlertOctagon, Trash2 } from 'lucide-react';
import { SkeletonCard, SkeletonRow } from '@/components/Skeleton';
import Link from 'next/link';
import styles from '../dashboard.module.css';
import ActivePositions from '@/components/dashboard/ActivePositions';

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('positions');
  const [completedTrades, setCompletedTrades] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load real trade data from localStorage
    try {
      const completed = JSON.parse(localStorage.getItem('stockpulse_completed_trades') || '[]');
      setCompletedTrades(completed);

      // Calculate real stats
      if (completed.length > 0) {
        const trades = completed.map(t => {
          const pnl = (t.type === 'BUY' ? (t.exitPrice - t.entry) : (t.entry - t.exitPrice)) * t.qty;
          return { ...t, pnl };
        });
        const wins = trades.filter(t => t.pnl > 0);
        const losses = trades.filter(t => t.pnl <= 0);
        const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
        const avgWin = wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
        const avgLoss = losses.length ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0;
        setStats({
          totalPnl: +totalPnl.toFixed(2),
          winRate: +(wins.length / trades.length * 100).toFixed(1),
          avgWin: +avgWin.toFixed(2),
          avgLoss: +avgLoss.toFixed(2),
          totalTrades: trades.length,
          wins: wins.length,
          losses: losses.length,
        });
      }
    } catch {}
    setLoading(false);
  }, [activeTab]); // Re-read when switching tabs in case trades resolved

  const statCards = stats ? [
    { label: 'Total P&L', value: `${stats.totalPnl >= 0 ? '+' : ''}₹${Math.abs(stats.totalPnl).toFixed(2)}`, sub: `${stats.totalTrades} trades`, color: stats.totalPnl >= 0 ? '#00E676' : '#FF1744', up: stats.totalPnl >= 0 },
    { label: 'Win Rate', value: `${stats.winRate}%`, sub: `${stats.wins}W / ${stats.losses}L`, color: '#00BCD4', up: true },
    { label: 'Avg Win', value: `₹${stats.avgWin.toFixed(2)}`, sub: 'Per winning trade', color: '#2962FF', up: true },
    { label: 'Avg Loss', value: `₹${Math.abs(stats.avgLoss).toFixed(2)}`, sub: 'Per losing trade', color: '#FF1744', up: false },
  ] : [
    { label: 'Total P&L', value: '₹0.00', sub: 'No trades yet', color: '#9E9E9E', up: true },
    { label: 'Win Rate', value: '--', sub: 'Start trading', color: '#9E9E9E', up: true },
    { label: 'Avg Win', value: '--', sub: '--', color: '#9E9E9E', up: true },
    { label: 'Avg Loss', value: '--', sub: '--', color: '#9E9E9E', up: false },
  ];

  return (
    <div>
      <div className={styles.pageHeader}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1>Trade Portfolio & Journal</h1>
          <p>Track your performance and manage active positions.</p>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {statCards.map((stat, i) => (
          <motion.div key={i} className={styles.statCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }}
            style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 90, height: 90, background: `radial-gradient(circle at top right, ${stat.color}15, transparent 70%)`, borderRadius: '50%' }} />
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 6, color: stat.up ? stat.color : 'var(--text-primary)' }}>{stat.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              {stat.up ? <TrendingUp size={13} color={stat.color} /> : <TrendingDown size={13} color={stat.color} />} {stat.sub}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {[
          { key: 'positions', label: 'Live Positions' },
          { key: 'journal', label: `Trade Journal (${completedTrades.length})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '10px 0', color: activeTab === tab.key ? 'var(--accent-light)' : 'var(--text-secondary)', borderBottom: activeTab === tab.key ? '2px solid var(--accent-light)' : '2px solid transparent', fontWeight: 600, fontSize: '0.92rem', background: 'none', border: 'none', borderBottomWidth: 2, borderBottomStyle: 'solid', cursor: 'pointer' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'positions' && <ActivePositions />}

      {activeTab === 'journal' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {completedTrades.length === 0 ? (
            <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Briefcase size={40} strokeWidth={1} style={{ opacity: 0.3, marginBottom: 10 }} />
              <p>No completed trades yet. Add positions in Live Positions tab.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Date', 'Symbol', 'Type', 'Entry', 'Exit', 'Result', 'P&L'].map((h, i) => (
                      <th key={i} style={{ padding: '12px 16px', textAlign: i === 6 ? 'right' : 'left', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {completedTrades.map((trade, idx) => {
                    const dateStr = new Date(trade.closeTimestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    const isTarget = trade.hitType === 'TARGET';
                    const pnl = (trade.type === 'BUY' ? (trade.exitPrice - trade.entry) : (trade.entry - trade.exitPrice)) * trade.qty;
                    const isProfit = pnl >= 0;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{dateStr}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: '0.88rem' }}>
                          <Link href={`/dashboard/stock/${trade.symbol}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>{trade.symbol.replace('.NS', '')}</Link>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: trade.type === 'BUY' ? '#448AFF' : 'var(--red)', fontWeight: 600 }}>{trade.type}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>₹{trade.entry}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>₹{trade.exitPrice?.toFixed(2)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: isTarget ? 'rgba(0,200,83,0.1)' : 'rgba(255,82,82,0.1)', color: isTarget ? '#00C853' : '#FF5252' }}>
                            {isTarget ? <CheckCircle2 size={11} /> : <AlertOctagon size={11} />} {trade.hitType}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: isProfit ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}>
                          {isProfit ? '+' : ''}₹{Math.abs(pnl).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
