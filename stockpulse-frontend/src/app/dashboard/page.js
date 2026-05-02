'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, ArrowRight, Bell, Zap, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { SkeletonCard, SkeletonRow } from '@/components/Skeleton';
import styles from './dashboard.module.css';

const DEFAULT_WATCHLIST = ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS'];

async function fetchQuote(symbol) {
  try {
    const res = await fetch(`/api/proxy/chart/${symbol}?interval=1d&range=1d`);
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const change = meta.regularMarketPrice - meta.chartPreviousClose;
    return {
      symbol: symbol.replace('.NS', ''),
      fullSymbol: symbol,
      name: meta.shortName || meta.symbol?.replace('.NS', ''),
      price: meta.regularMarketPrice,
      change: +change.toFixed(2),
      changePct: +((change / meta.chartPreviousClose) * 100).toFixed(2),
    };
  } catch { return null; }
}

export default function DashboardOverview() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nifty, setNifty] = useState(null);
  const [bankNifty, setBankNifty] = useState(null);
  const [movers, setMovers] = useState([]);
  const [portfolioStats, setPortfolioStats] = useState({ value: 100000, pnl: 0 });

  useEffect(() => {
    const userDataStr = localStorage.getItem('stockpulse_user') || sessionStorage.getItem('stockpulse_user');
    if (userDataStr) setUser(JSON.parse(userDataStr));

    // Calculate portfolio from completed trades
    try {
      const completed = JSON.parse(localStorage.getItem('stockpulse_completed_trades') || '[]');
      const active = JSON.parse(localStorage.getItem('stockpulse_active_trades') || '[]');
      let totalPnl = 0;
      completed.forEach(t => {
        const pnl = (t.type === 'BUY' ? (t.exitPrice - t.entry) : (t.entry - t.exitPrice)) * t.qty;
        totalPnl += pnl;
      });
      setPortfolioStats({ value: 100000 + totalPnl, pnl: totalPnl, activeCount: active.length });
    } catch {}

    // Fetch live index & stock data
    const fetchAll = async () => {
      const [n, bn, ...stockData] = await Promise.all([
        fetchQuote('^NSEI'),
        fetchQuote('^NSEBANK'),
        ...DEFAULT_WATCHLIST.map(s => fetchQuote(s))
      ]);
      if (n) setNifty(n);
      if (bn) setBankNifty(bn);
      setMovers(stockData.filter(Boolean).sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)));
      setLoading(false);
    };
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const IndexCard = ({ data, label, delay }) => {
    if (!data) return <SkeletonCard />;
    const isUp = data.change >= 0;
    return (
      <motion.div className={styles.statCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>{label}</div>
          <div style={{ color: isUp ? 'var(--green)' : 'var(--red)', background: isUp ? 'var(--green-bg)' : 'var(--red-bg)', padding: '3px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600 }}>
            {isUp ? '+' : ''}{data.changePct}%
          </div>
        </div>
        <div style={{ fontSize: '1.7rem', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 6 }}>
          {data.price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: isUp ? 'var(--green)' : 'var(--red)', fontSize: '0.82rem' }}>
          {isUp ? <TrendingUp size={15} /> : <TrendingDown size={15} />} {isUp ? '+' : ''}{data.change} today
        </div>
      </motion.div>
    );
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1>{getGreeting()}, {user?.name?.split(' ')[0] || 'Trader'}</h1>
          <p>Here is your market overview for today.</p>
        </motion.div>
      </div>

      <div className={styles.statsGrid}>
        <IndexCard data={nifty} label="NIFTY 50" delay={0.1} />
        <IndexCard data={bankNifty} label="BANK NIFTY" delay={0.2} />
        <motion.div className={styles.statCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Portfolio Value</div>
            <div style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600 }}>Paper</div>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 6 }}>
            ₹{portfolioStats.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: portfolioStats.pnl >= 0 ? 'var(--green)' : 'var(--red)', fontSize: '0.82rem' }}>
            {portfolioStats.pnl >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
            {portfolioStats.pnl >= 0 ? '+' : ''}₹{Math.abs(portfolioStats.pnl).toFixed(0)} ({((portfolioStats.pnl / 100000) * 100).toFixed(2)}%)
          </div>
        </motion.div>
        <motion.div className={styles.statCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Active Trades</div>
            <Activity size={17} color="var(--accent-light)" />
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 6 }}>
            {portfolioStats.activeCount || 0}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Being tracked live</div>
        </motion.div>
      </div>

      <div className={styles.dashboardGrid}>
        {/* Top Movers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={16} color="#FF9800" /> Top Movers</h3>
            <Link href="/dashboard/watchlist" style={{ fontSize: '0.82rem', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: 4 }}>View All <ArrowRight size={13} /></Link>
          </div>
          {loading ? <div><SkeletonRow /><SkeletonRow /><SkeletonRow /></div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {movers.slice(0, 5).map((s, i) => (
                <Link key={i} href={`/dashboard/stock/${s.fullSymbol}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit', transition: 'border-color 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>{s.symbol.slice(0, 2)}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.symbol}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.name}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>₹{s.price?.toFixed(2)}</div>
                    <div style={{ fontSize: '0.78rem', color: s.changePct >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>{s.changePct > 0 ? '+' : ''}{s.changePct}%</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><BarChart3 size={16} color="var(--accent)" /> Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Stock Scanner', desc: 'Scan NIFTY stocks for signals', href: '/dashboard/scanner', icon: <Zap size={18} color="#FF9800" /> },
              { label: 'Watchlist', desc: 'Your tracked stocks', href: '/dashboard/watchlist', icon: <Activity size={18} color="#00C853" /> },
              { label: 'Portfolio', desc: 'Trade journal & P&L', href: '/dashboard/portfolio', icon: <BarChart3 size={18} color="#448AFF" /> },
            ].map((item, i) => (
              <Link key={i} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', borderRadius: 8, border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
                <ArrowRight size={16} color="var(--text-muted)" />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
