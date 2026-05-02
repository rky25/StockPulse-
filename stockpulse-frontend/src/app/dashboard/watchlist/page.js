'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, TrendingUp, TrendingDown, Trash2, Search, ArrowRight, Activity } from 'lucide-react';
import Link from 'next/link';
import { SkeletonRow } from '@/components/Skeleton';
import styles from '../dashboard.module.css';

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setWatchlist([
        { symbol: 'RELIANCE', name: 'Reliance Industries', price: 1430.80, change: 2.45, signal: 'BUY' },
        { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3842.15, change: 1.80, signal: 'BUY' },
        { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', price: 1678.30, change: -1.20, signal: 'SELL' },
        { symbol: 'INFY', name: 'Infosys Ltd.', price: 1567.90, change: -0.52, signal: 'SELL' },
        { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', price: 1245.60, change: 0.89, signal: 'BUY' },
      ]);
      setLoading(false);
    }, 1200);
    
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = (symbol) => {
    setWatchlist(watchlist.filter(item => item.symbol !== symbol));
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <div>
            <h1>Watchlist</h1>
            <p>Track your favorite stocks and their current signals.</p>
          </div>
          
          <button className="btn btn-primary" onClick={() => document.getElementById('global-search')?.focus()}>
            <Search size={16} /> Add Stock
          </button>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', minHeight: '400px' }}
      >
        {loading ? (
          <div>
             <SkeletonRow />
             <SkeletonRow />
             <SkeletonRow />
             <SkeletonRow />
             <SkeletonRow />
          </div>
        ) : watchlist.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <Star size={48} strokeWidth={1} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Your Watchlist is Empty</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '24px' }}>Search for stocks to add them to your watchlist.</p>
            <button className="btn btn-outline" onClick={() => document.getElementById('global-search')?.focus()}>
              <Search size={16} /> Search Stocks
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '12px 8px', fontWeight: 500 }}>Symbol</th>
                  <th style={{ padding: '12px 8px', fontWeight: 500, textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '12px 8px', fontWeight: 500, textAlign: 'right' }}>Change %</th>
                  <th style={{ padding: '12px 8px', fontWeight: 500, textAlign: 'center' }}>Signal</th>
                  <th style={{ padding: '12px 8px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {watchlist.map((stock) => (
                    <motion.tr 
                      key={stock.symbol}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0, backgroundColor: 'rgba(255,0,0,0.1)' }}
                      transition={{ duration: 0.3 }}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                    >
                      <td style={{ padding: '16px 8px' }}>
                        <Link href={`/dashboard/stock/${stock.symbol}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {stock.symbol.substring(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', transition: 'color 0.2s' }} className="hover:text-accent-light">{stock.symbol}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stock.name}</div>
                          </div>
                        </Link>
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        ₹{stock.price.toFixed(2)}
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: 600, color: stock.change >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                          {stock.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}%
                        </div>
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: 700,
                          background: stock.signal === 'BUY' ? 'var(--green-bg)' : 'var(--red-bg)',
                          color: stock.signal === 'BUY' ? 'var(--green)' : 'var(--red)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <Activity size={12} /> {stock.signal}
                        </span>
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          <Link href={`/dashboard/stock/${stock.symbol}`} style={{ padding: '6px', color: 'var(--text-secondary)', transition: 'color 0.2s' }}>
                            <ArrowRight size={18} />
                          </Link>
                          <button 
                            onClick={() => handleRemove(stock.symbol)}
                            style={{ padding: '6px', color: 'var(--text-muted)', transition: 'color 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--red)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                          >
                            <Trash2 size={18} />
                          </button>
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
