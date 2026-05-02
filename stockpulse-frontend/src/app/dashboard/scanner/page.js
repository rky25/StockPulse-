'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zap, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Activity, Filter, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { SkeletonRow } from '@/components/Skeleton';
import styles from '../dashboard.module.css';
import { Trading } from '../../../lib/tradingEngine';

const NIFTY_STOCKS = [
  'RELIANCE.NS','TCS.NS','HDFCBANK.NS','INFY.NS','ICICIBANK.NS',
  'HINDUNILVR.NS','SBIN.NS','BHARTIARTL.NS','KOTAKBANK.NS','WIPRO.NS',
  'AXISBANK.NS','TATAMOTORS.NS','MARUTI.NS','TECHM.NS','HCLTECH.NS',
  'ONGC.NS','BPCL.NS','LT.NS','ASIANPAINT.NS','TITAN.NS'
];

async function fetchAndAnalyze(symbol) {
  try {
    const [res5m, res15m] = await Promise.all([
      fetch(`/api/proxy/chart/${symbol}?interval=5m&range=5d`),
      fetch(`/api/proxy/chart/${symbol}?interval=15m&range=5d`),
    ]);
    const [data5m, data15m] = await Promise.all([res5m.json(), res15m.json()]);
    const r5 = data5m?.chart?.result?.[0];
    if (!r5?.timestamp) return null;
    const q = r5.indicators.quote[0];
    const meta = r5.meta;
    const closes5m = q.close || [], highs5m = q.high || [], lows5m = q.low || [], vols5m = q.volume || [];
    const timestamps = r5.timestamp;
    const n = timestamps.length;
    if (n < 30) return null;

    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose;
    const change = price - prevClose;
    const changePct = (change / prevClose) * 100;

    // 15m trend
    const c15 = (data15m?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []).filter(v => v != null);
    const trend15m = Trading.get15mTrend(c15);

    // Previous day
    const prevDayData = Trading.getPrevDayDataAt(timestamps, highs5m, lows5m, closes5m, n - 1);

    const analysis = Trading.analyze(timestamps, closes5m, highs5m, lows5m, vols5m, price, trend15m, null, prevDayData, 15, {});

    return {
      symbol: symbol.replace('.NS', ''),
      fullSymbol: symbol,
      name: meta.shortName || symbol.replace('.NS', ''),
      price, change: +change.toFixed(2), changePct: +changePct.toFixed(2),
      signal: analysis?.overall || 'NEUTRAL',
      confidence: analysis?.confidence || 0,
      setup: analysis?.setup?.name || '--',
      regime: analysis?.regime || '--',
      adx: analysis?.adxValue?.toFixed(0) || '--',
    };
  } catch { return null; }
}

export default function ScannerPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [lastScan, setLastScan] = useState(null);

  const runScan = useCallback(async () => {
    setScanning(true);
    // Scan in batches of 5 to avoid rate limiting
    const allResults = [];
    for (let i = 0; i < NIFTY_STOCKS.length; i += 5) {
      const batch = NIFTY_STOCKS.slice(i, i + 5);
      const batchResults = await Promise.all(batch.map(s => fetchAndAnalyze(s)));
      allResults.push(...batchResults.filter(Boolean));
    }
    // Sort by confidence descending
    allResults.sort((a, b) => b.confidence - a.confidence);
    setResults(allResults);
    setLoading(false);
    setScanning(false);
    setLastScan(new Date());
  }, []);

  useEffect(() => { runScan(); }, [runScan]);

  const filtered = filter === 'ALL' ? results
    : filter === 'BUY' ? results.filter(r => r.signal.includes('BUY'))
    : filter === 'SELL' ? results.filter(r => r.signal.includes('SELL'))
    : results.filter(r => r.signal === 'NEUTRAL');

  const signalColor = (s) => {
    if (s.includes('STRONG BUY')) return '#00C853';
    if (s.includes('BUY')) return '#448AFF';
    if (s.includes('STRONG SELL')) return '#FF1744';
    if (s.includes('SELL')) return '#FF5252';
    return '#9E9E9E';
  };

  const buyCount = results.filter(r => r.signal.includes('BUY')).length;
  const sellCount = results.filter(r => r.signal.includes('SELL')).length;
  const neutralCount = results.filter(r => r.signal === 'NEUTRAL').length;

  return (
    <div>
      <div className={styles.pageHeader}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Zap size={24} color="#FF9800" /> Sniper Scanner
            </h1>
            <p>Scanning {NIFTY_STOCKS.length} NIFTY stocks with the full signal engine.</p>
          </div>
          <button onClick={runScan} disabled={scanning}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: scanning ? 'rgba(255,255,255,0.05)' : 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', cursor: scanning ? 'wait' : 'pointer', fontSize: '0.85rem', fontWeight: 600, opacity: scanning ? 0.7 : 1 }}>
            <RefreshCw size={15} /> {scanning ? 'Scanning...' : 'Scan Now'}
          </button>
        </motion.div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'BUY Signals', count: buyCount, color: '#00C853', filter: 'BUY' },
          { label: 'SELL Signals', count: sellCount, color: '#FF1744', filter: 'SELL' },
          { label: 'NEUTRAL', count: neutralCount, color: '#9E9E9E', filter: 'NEUTRAL' },
          { label: 'All', count: results.length, color: 'var(--accent-light)', filter: 'ALL' },
        ].map((item, i) => (
          <button key={i} onClick={() => setFilter(item.filter)}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: filter === item.filter ? `2px solid ${item.color}` : '1px solid var(--border)', background: filter === item.filter ? `${item.color}15` : 'rgba(255,255,255,0.03)', color: item.color, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {item.label} <span style={{ fontWeight: 800, fontSize: '1rem' }}>{item.count}</span>
          </button>
        ))}
        {lastScan && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: 'auto' }}>Last scan: {lastScan.toLocaleTimeString('en-IN')}</span>}
      </div>

      {/* Results Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 20 }}><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /></div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Stock', 'Price', 'Change', 'Signal', 'Confidence', 'Setup', 'Regime', ''].map((h, i) => (
                    <th key={i} style={{ padding: '12px 14px', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, textAlign: i >= 1 && i <= 6 ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>{r.symbol.slice(0, 2)}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{r.symbol}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}>₹{r.price?.toFixed(2)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: r.changePct >= 0 ? 'var(--green)' : 'var(--red)', fontSize: '0.85rem' }}>
                      {r.changePct > 0 ? '+' : ''}{r.changePct}%
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700, background: `${signalColor(r.signal)}18`, color: signalColor(r.signal), border: `1px solid ${signalColor(r.signal)}40`, whiteSpace: 'nowrap' }}>
                        {r.signal}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <div style={{ width: 40, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${r.confidence}%`, background: r.confidence > 70 ? '#00C853' : r.confidence > 40 ? '#FF9800' : '#FF5252', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, minWidth: 28 }}>{r.confidence}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.setup}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.78rem', color: r.regime === 'TRENDING' ? '#00C853' : r.regime === 'WEAK' ? '#FF9800' : '#FF5252' }}>{r.regime}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <Link href={`/dashboard/stock/${r.fullSymbol}`} style={{ color: 'var(--accent-light)', display: 'flex', alignItems: 'center' }}><ArrowRight size={16} /></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
