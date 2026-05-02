'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Activity, ArrowRight, Bell } from 'lucide-react';
import Link from 'next/link';
import { SkeletonCard, SkeletonRow } from '@/components/Skeleton';
import styles from './dashboard.module.css';

export default function DashboardOverview() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userDataStr = localStorage.getItem('stockpulse_user') || sessionStorage.getItem('stockpulse_user');
    if (userDataStr) {
      setUser(JSON.parse(userDataStr));
    }
    
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const recentAlerts = [
    { symbol: 'RELIANCE', type: 'Buy', price: '₹1,430.80', time: '10 mins ago', color: '#00E676' },
    { symbol: 'TCS', type: 'Sell', price: '₹3,842.15', time: '1 hour ago', color: '#FF1744' },
    { symbol: 'HDFCBANK', type: 'Buy', price: '₹1,678.30', time: '2 hours ago', color: '#00E676' },
  ];

  return (
    <div>
      <div className={styles.pageHeader}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>{getGreeting()}, {user?.name?.split(' ')[0] || 'Trader'}</h1>
          <p>Here is your market overview for today.</p>
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
          <motion.div 
            className={styles.statCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>NIFTY 50</div>
              <div style={{ color: 'var(--green)', background: 'var(--green-bg)', padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>+0.85%</div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 8 }}>22,453.30</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green)', fontSize: '0.85rem' }}>
              <TrendingUp size={16} /> +185.40 today
            </div>
          </motion.div>

          <motion.div 
            className={styles.statCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>BANK NIFTY</div>
              <div style={{ color: 'var(--red)', background: 'var(--red-bg)', padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>-0.24%</div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 8 }}>47,832.10</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--red)', fontSize: '0.85rem' }}>
              <TrendingDown size={16} /> -115.20 today
            </div>
          </motion.div>

          <motion.div 
            className={styles.statCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Portfolio Value</div>
              <div style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>Paper</div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 8 }}>₹1,04,250</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green)', fontSize: '0.85rem' }}>
              <TrendingUp size={16} /> +₹4,250 (4.25%)
            </div>
          </motion.div>

          <motion.div 
            className={styles.statCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Active Signals</div>
              <Activity size={18} color="var(--accent-light)" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 8 }}>12</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Across watchlist
            </div>
          </motion.div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: '1.1rem' }}>Top Movers</h3>
            <Link href="/dashboard/watchlist" style={{ fontSize: '0.85rem', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          
          {loading ? (
            <div>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>RE</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>RELIANCE</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Reliance Industries</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>₹1,430.80</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: 500 }}>+2.45%</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>TC</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>TCS</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tata Consultancy Services</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>₹3,842.15</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: 500 }}>+1.80%</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>HD</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>HDFCBANK</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>HDFC Bank Ltd.</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>₹1,678.30</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--red)', fontWeight: 500 }}>-1.20%</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: '1.1rem' }}>Recent Alerts</h3>
            <Bell size={16} color="var(--text-muted)" />
          </div>

          {loading ? (
             <div>
               <SkeletonRow />
               <SkeletonRow />
             </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recentAlerts.map((alert, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 16, borderBottom: i !== recentAlerts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    background: `${alert.color}15`, 
                    color: alert.color,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {alert.type === 'Buy' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', marginBottom: 4 }}>
                      <span style={{ color: alert.color, fontWeight: 700 }}>{alert.type}</span> signal for <strong>{alert.symbol}</strong> at {alert.price}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{alert.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      
      <style jsx>{`
        @media (max-width: 1024px) {
          div[style*="grid-template-columns: 2fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
