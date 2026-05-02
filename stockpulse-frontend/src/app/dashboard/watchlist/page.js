'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, TrendingUp, TrendingDown, Trash2, Search, ArrowRight, Activity, Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { SkeletonRow } from '@/components/Skeleton';
import styles from '../dashboard.module.css';

const STORAGE_KEY = 'stockpulse_watchlist';
const DEFAULT_LIST = ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS'];

async function fetchLiveQuote(symbol) {
  try {
    const res = await fetch(`/api/proxy/chart/${symbol}?interval=1d&range=1d`);
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const change = meta.regularMarketPrice - meta.chartPreviousClose;
    return {
      symbol: symbol.replace('.NS', ''),
      fullSymbol: symbol,
      name: meta.shortName || symbol.replace('.NS', ''),
      price: meta.regularMarketPrice,
      change: +change.toFixed(2),
      changePct: +((change / meta.chartPreviousClose) * 100).toFixed(2),
    };
  } catch { return null; }
}

export default function WatchlistPage() {
  const [symbols, setSymbols] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addInput, setAddInput] = useState('');

  // Load symbols from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const syms = saved ? JSON.parse(saved) : DEFAULT_LIST;
    setSymbols(syms);
  }, []);

  // Fetch live data
  useEffect(() => {
    if (symbols.length === 0) { setLoading(false); return; }
    const fetchAll = async () => {
      const results = await Promise.all(symbols.map(s => fetchLiveQuote(s)));
      setWatchlist(results.filter(Boolean));
      setLoading(false);
      setRefreshing(false);
    };
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, [symbols]);

  // Save to localStorage
  useEffect(() => {
    if (symbols.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols));
  }, [symbols]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!addInput.trim()) return;
    const sym = addInput.trim().toUpperCase();
    const full = sym.includes('.NS') ? sym : sym + '.NS';
    if (!symbols.includes(full)) {
      setSymbols([...symbols, full]);
    }
    setAddInput('');
  };

  const handleRemove = (fullSymbol) => {
    setSymbols(symbols.filter(s => s !== fullSymbol));
    setWatchlist(watchlist.filter(w => w.fullSymbol !== fullSymbol));
  };

  const handleRefresh = () => { setRefreshing(true); setSymbols([...symbols]); };

  return (
    <div>
      <div className={styles.pageHeader}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>Watchlist</h1>
            <p>Track your favorite stocks with live prices.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={handleRefresh} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500 }}>
              <RefreshCw size={14} className={refreshing ? 'spin' : ''} /> Refresh
            </button>
            <form onSubmit={handleAdd} style={{ display: 'flex', gap: 6 }}>
              <input value={addInput} onChange={e => setAddInput(e.target.value)} placeholder="e.g. SBIN" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '0.85rem', width: 120 }} />
              <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                <Plus size={14} /> Add
              </button>
            </form>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', minHeight: 300 }}>
        {loading ? (
          <div><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
        ) : watchlist.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
            <Star size={44} strokeWidth={1} style={{ marginBottom: 14, opacity: 0.5 }} />
            <h3 style={{ marginBottom: 6, color: 'var(--text-primary)' }}>Your Watchlist is Empty</h3>
            <p style={{ fontSize: '0.88rem' }}>Add stocks using the input above.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                  <th style={{ padding: '10px 8px', fontWeight: 500 }}>Symbol</th>
                  <th style={{ padding: '10px 8px', fontWeight: 500, textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '10px 8px', fontWeight: 500, textAlign: 'right' }}>Change</th>
                  <th style={{ padding: '10px 8px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {watchlist.map(stock => (
                    <motion.tr key={stock.fullSymbol} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '14px 8px' }}>
                        <Link href={`/dashboard/stock/${stock.fullSymbol}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{stock.symbol.slice(0, 2)}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{stock.symbol}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stock.name}</div>
                          </div>
                        </Link>
                      </td>
                      <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>₹{stock.price?.toFixed(2)}</td>
                      <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 600, color: stock.changePct >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, fontSize: '0.88rem' }}>
                          {stock.changePct >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                          {stock.changePct > 0 ? '+' : ''}{stock.changePct}%
                        </div>
                      </td>
                      <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          <Link href={`/dashboard/stock/${stock.fullSymbol}`} style={{ padding: 5, color: 'var(--text-secondary)' }}><ArrowRight size={16} /></Link>
                          <button onClick={() => handleRemove(stock.fullSymbol)} style={{ padding: 5, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
