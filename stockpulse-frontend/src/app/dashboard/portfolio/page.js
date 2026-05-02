'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Briefcase, TrendingUp, TrendingDown, Clock, Activity, Target } from 'lucide-react';
import { SkeletonCard, SkeletonRow } from '@/components/Skeleton';
import styles from '../dashboard.module.css';

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('journal');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { label: 'Total P&L', value: '+₹4,250.00', sub: '+4.25% All Time', trend: 'up', color: '#00E676' },
    { label: 'Win Rate', value: '68%', sub: 'Based on 25 trades', trend: 'up', color: '#00BCD4' },
    { label: 'Avg Win', value: '₹450.00', sub: 'Per profitable trade', trend: 'up', color: '#2962FF' },
    { label: 'Avg Loss', value: '₹-120.00', sub: 'Per losing trade', trend: 'down', color: '#FF1744' },
  ];

  const trades = [
    { id: 'TRD-001', date: '2024-05-02 10:15', symbol: 'RELIANCE', type: 'LONG', entry: 1420.50, exit: 1430.80, qty: 50, pnl: 515.00, status: 'Closed' },
    { id: 'TRD-002', date: '2024-05-02 11:30', symbol: 'TCS', type: 'SHORT', entry: 3850.00, exit: 3842.15, qty: 20, pnl: 157.00, status: 'Closed' },
    { id: 'TRD-003', date: '2024-05-02 14:05', symbol: 'HDFCBANK', type: 'LONG', entry: 1680.00, exit: 1678.30, qty: 100, pnl: -170.00, status: 'Closed' },
    { id: 'TRD-004', date: '2024-05-01 09:45', symbol: 'INFY', type: 'LONG', entry: 1550.00, exit: 1567.90, qty: 40, pnl: 716.00, status: 'Closed' },
  ];

  return (
    <div>
      <div className={styles.pageHeader}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Trade Portfolio & Journal</h1>
          <p>Track your performance and analyze past trades.</p>
        </motion.div>
      </div>

      {loading ? (
        <div className={styles.statsGrid}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className={styles.statsGrid}>
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              className={styles.statCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 100,
                height: 100,
                background: `radial-gradient(circle at top right, ${stat.color}15, transparent 70%)`,
                borderRadius: '50%'
              }} />
              
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500, marginBottom: 8 }}>{stat.label}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 8, color: stat.trend === 'up' ? stat.color : 'var(--text-primary)' }}>{stat.value}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {stat.trend === 'up' ? <TrendingUp size={14} color={stat.color} /> : <TrendingDown size={14} color={stat.color} />} 
                {stat.sub}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', minHeight: '400px' }}
      >
        <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
          <button 
            style={{ 
              padding: '12px 0', 
              color: activeTab === 'journal' ? 'var(--accent-light)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'journal' ? '2px solid var(--accent-light)' : '2px solid transparent',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}
            onClick={() => setActiveTab('journal')}
          >
            Trade Journal
          </button>
          <button 
            style={{ 
              padding: '12px 0', 
              color: activeTab === 'open' ? 'var(--accent-light)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'open' ? '2px solid var(--accent-light)' : '2px solid transparent',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}
            onClick={() => setActiveTab('open')}
          >
            Open Positions (0)
          </button>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
             <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <SkeletonRow />
               <SkeletonRow />
               <SkeletonRow />
               <SkeletonRow />
             </motion.div>
          ) : activeTab === 'journal' ? (
            <motion.div 
              key="journal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '12px 8px', fontWeight: 500 }}>ID / Date</th>
                      <th style={{ padding: '12px 8px', fontWeight: 500 }}>Symbol</th>
                      <th style={{ padding: '12px 8px', fontWeight: 500 }}>Type</th>
                      <th style={{ padding: '12px 8px', fontWeight: 500 }}>Entry/Exit</th>
                      <th style={{ padding: '12px 8px', fontWeight: 500 }}>Qty</th>
                      <th style={{ padding: '12px 8px', fontWeight: 500, textAlign: 'right' }}>P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.95rem', transition: 'background 0.2s' }}>
                        <td style={{ padding: '16px 8px' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{trade.id}</div>
                          <div style={{ fontSize: '0.85rem' }}>{trade.date.split(' ')[0]}</div>
                        </td>
                        <td style={{ padding: '16px 8px', fontWeight: 600 }}>{trade.symbol}</td>
                        <td style={{ padding: '16px 8px' }}>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '12px', 
                            fontSize: '0.75rem', 
                            fontWeight: 700,
                            background: trade.type === 'LONG' ? 'var(--green-bg)' : 'var(--red-bg)',
                            color: trade.type === 'LONG' ? 'var(--green)' : 'var(--red)'
                          }}>
                            {trade.type}
                          </span>
                        </td>
                        <td style={{ padding: '16px 8px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                          ₹{trade.entry.toFixed(2)} <ArrowRight size={12} style={{ margin: '0 4px', color: 'var(--text-muted)' }} /> ₹{trade.exit.toFixed(2)}
                        </td>
                        <td style={{ padding: '16px 8px' }}>{trade.qty}</td>
                        <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: 700, color: trade.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {trade.pnl >= 0 ? '+' : ''}₹{trade.pnl.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="open"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--text-muted)' }}
            >
              <Briefcase size={48} strokeWidth={1} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>No Open Positions</h3>
              <p style={{ fontSize: '0.9rem' }}>You don't have any active trades running right now.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
