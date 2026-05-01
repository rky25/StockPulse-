'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Target, Activity, Plus, X, Trash2, Clock, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function ActivePositions() {
  const [positions, setPositions] = useState([]);
  const [completedTrades, setCompletedTrades] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [newTrade, setNewTrade] = useState({
    symbol: '',
    type: 'BUY',
    entry: '',
    qty: '',
    target: '',
    sl: ''
  });

  // Load from local storage on mount
  useEffect(() => {
    const savedActive = localStorage.getItem('stockpulse_active_trades');
    const savedCompleted = localStorage.getItem('stockpulse_completed_trades');
    if (savedActive) {
      try { setPositions(JSON.parse(savedActive)); } catch (e) {}
    }
    if (savedCompleted) {
      try { setCompletedTrades(JSON.parse(savedCompleted)); } catch (e) {}
    }
    setLoading(false);
  }, []);

  // Save to local storage whenever positions change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('stockpulse_active_trades', JSON.stringify(positions));
      localStorage.setItem('stockpulse_completed_trades', JSON.stringify(completedTrades));
    }
  }, [positions, completedTrades, loading]);

  // Ultra-Fast Live Polling Loop (Every 2 seconds)
  useEffect(() => {
    if (positions.length === 0) return;

    let isMounted = true;
    
    const fetchLivePrices = async () => {
      const symbols = [...new Set(positions.map(p => p.symbol))];
      const newPrices = { ...livePrices };

      await Promise.all(symbols.map(async (sym) => {
        try {
          const res = await fetch(`/api/proxy/chart/${sym}?interval=1d&range=1d`);
          const data = await res.json();
          const meta = data?.chart?.result?.[0]?.meta;
          if (meta && meta.regularMarketPrice) {
            newPrices[sym] = meta.regularMarketPrice;
          }
        } catch (err) {}
      }));

      if (!isMounted) return;
      
      setLivePrices(newPrices);

      // Auto-Resolution Engine: Check for SL / Target Hits
      setPositions(prevPositions => {
        const remaining = [];
        const newlyCompleted = [];

        prevPositions.forEach(trade => {
          const currentPrice = newPrices[trade.symbol] || trade.entry;
          let isHit = false;
          let hitType = '';
          let exitPrice = currentPrice;
          
          if (trade.target || trade.sl) {
            if (trade.type === 'BUY') {
              if (trade.target && currentPrice >= trade.target) { isHit = true; hitType = 'TARGET'; exitPrice = trade.target; }
              else if (trade.sl && currentPrice <= trade.sl) { isHit = true; hitType = 'STOPLOSS'; exitPrice = trade.sl; }
            } else { // SELL
              if (trade.target && currentPrice <= trade.target) { isHit = true; hitType = 'TARGET'; exitPrice = trade.target; }
              else if (trade.sl && currentPrice >= trade.sl) { isHit = true; hitType = 'STOPLOSS'; exitPrice = trade.sl; }
            }
          }

          if (isHit) {
            newlyCompleted.push({ ...trade, exitPrice, hitType, closeTimestamp: Date.now() });
          } else {
            remaining.push(trade);
          }
        });

        if (newlyCompleted.length > 0) {
          setCompletedTrades(prev => [...newlyCompleted, ...prev]);
        }
        return remaining;
      });
    };

    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 2000); // 2-SECOND POLLING

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [positions]);

  const handleAddTrade = (e) => {
    e.preventDefault();
    if (!newTrade.symbol || !newTrade.entry || !newTrade.qty) return;

    const trade = {
      id: Date.now().toString(),
      symbol: newTrade.symbol.toUpperCase().includes('.NS') ? newTrade.symbol.toUpperCase() : newTrade.symbol.toUpperCase() + '.NS',
      type: newTrade.type,
      entry: parseFloat(newTrade.entry),
      qty: parseInt(newTrade.qty),
      target: parseFloat(newTrade.target) || 0,
      sl: parseFloat(newTrade.sl) || 0,
      timestamp: Date.now()
    };

    setPositions([...positions, trade]);
    setShowAddForm(false);
    setNewTrade({ symbol: '', type: 'BUY', entry: '', qty: '', target: '', sl: '' });
    setLivePrices(prev => ({ ...prev, [trade.symbol]: trade.entry }));
  };

  const removeActiveTrade = (id) => {
    setPositions(positions.filter(p => p.id !== id));
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear your trade history?")) {
      setCompletedTrades([]);
    }
  };

  const renderProgressBar = (trade, currentPrice) => {
    if (!trade.target || !trade.sl || !currentPrice) return null;
    
    let min = Math.min(trade.sl, trade.target);
    let max = Math.max(trade.sl, trade.target);
    let clampedPrice = Math.max(min, Math.min(max, currentPrice));
    
    let percent = ((clampedPrice - min) / (max - min)) * 100;
    if (trade.type === 'SELL') {
      percent = ((max - clampedPrice) / (max - min)) * 100;
    }

    const isNearSL = percent < 15;
    const isNearTarget = percent > 85;

    return (
      <div style={{ marginTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
          <span style={{ color: trade.type === 'BUY' ? 'var(--red)' : 'var(--green)' }}>SL: ₹{trade.sl}</span>
          <span style={{ color: trade.type === 'BUY' ? 'var(--green)' : 'var(--red)' }}>TGT: ₹{trade.target}</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: `${percent}%`,
            background: isNearSL ? 'var(--red)' : isNearTarget ? 'var(--green)' : 'var(--accent)',
            transition: 'width 0.5s ease-in-out, background 0.3s ease', borderRadius: '4px'
          }} />
        </div>
      </div>
    );
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ACTIVE TRADES SECTION */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--accent)" /> Live Trade Tracker
          </h3>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              background: showAddForm ? 'rgba(255, 82, 82, 0.1)' : 'rgba(41, 98, 255, 0.1)',
              color: showAddForm ? 'var(--red)' : 'var(--accent-light)',
              border: 'none', borderRadius: 'var(--radius-sm)', padding: '6px 12px',
              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            {showAddForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Trade</>}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddTrade} style={{ padding: '20px', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Symbol</label>
                <input required value={newTrade.symbol} onChange={e => setNewTrade({...newTrade, symbol: e.target.value})} placeholder="RELIANCE" style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Type</label>
                <select value={newTrade.type} onChange={e => setNewTrade({...newTrade, type: e.target.value})} style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: '#fff' }}>
                  <option value="BUY" style={{ background: '#0F172A', color: '#fff' }}>BUY</option>
                  <option value="SELL" style={{ background: '#0F172A', color: '#fff' }}>SELL</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Entry Price</label>
                <input required type="number" step="0.05" value={newTrade.entry} onChange={e => setNewTrade({...newTrade, entry: e.target.value})} placeholder="1400" style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Quantity</label>
                <input required type="number" value={newTrade.qty} onChange={e => setNewTrade({...newTrade, qty: e.target.value})} placeholder="50" style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Target</label>
                <input type="number" step="0.05" value={newTrade.target} onChange={e => setNewTrade({...newTrade, target: e.target.value})} placeholder="1420" style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Stop Loss</label>
                <input type="number" step="0.05" value={newTrade.sl} onChange={e => setNewTrade({...newTrade, sl: e.target.value})} placeholder="1380" style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: '#fff' }} />
              </div>
            </div>
            <button type="submit" style={{ marginTop: '16px', background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
              Start Tracking Position
            </button>
          </form>
        )}

        {positions.length === 0 && !showAddForm ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Target size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>No active trades being tracked.</p>
          </div>
        ) : (
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {positions.map(trade => {
              const currentPrice = livePrices[trade.symbol] || trade.entry;
              let pnl = (trade.type === 'BUY' ? (currentPrice - trade.entry) : (trade.entry - currentPrice)) * trade.qty;
              const pnlPct = (pnl / (trade.entry * trade.qty)) * 100;
              const isProfit = pnl >= 0;

              return (
                <div key={trade.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', position: 'relative' }}>
                  <button onClick={() => removeActiveTrade(trade.id)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.5 }}>
                    <Trash2 size={16} />
                  </button>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <Link href={`/dashboard/stock/${trade.symbol}`} style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', textDecoration: 'none' }}>
                        {trade.symbol.replace('.NS','')}
                      </Link>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        <span style={{ color: trade.type === 'BUY' ? 'var(--blue)' : 'var(--red)' }}>{trade.type}</span>
                        <span style={{ color: 'var(--text-muted)' }}>• {trade.qty} Qty</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: isProfit ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)' }}>
                        {isProfit ? '+' : ''}₹{Math.abs(pnl).toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: isProfit ? 'var(--green)' : 'var(--red)' }}>
                        {isProfit ? '+' : ''}{pnlPct.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '8px' }}>
                    <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Entry</div><div style={{ fontSize: '0.9rem', fontWeight: 600 }}>₹{trade.entry}</div></div>
                    <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={10} /> Live</div><div style={{ fontSize: '0.9rem', fontWeight: 600 }}>₹{currentPrice.toFixed(2)}</div></div>
                  </div>
                  {renderProgressBar(trade, currentPrice)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* COMPLETED TRADES HISTORY */}
      {completedTrades.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--text-muted)" /> Trade Journal (Completed)
            </h3>
            <button onClick={clearHistory} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Trash2 size={14} /> Clear History
            </button>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Date', 'Symbol', 'Type', 'Entry', 'Exit', 'Result', 'P&L'].map((h, i) => (
                    <th key={i} style={{ padding: '14px 20px', textAlign: i === 6 ? 'right' : 'left', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {completedTrades.map(trade => {
                  const dateStr = new Date(trade.closeTimestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
                  const isTarget = trade.hitType === 'TARGET';
                  let pnl = (trade.type === 'BUY' ? (trade.exitPrice - trade.entry) : (trade.entry - trade.exitPrice)) * trade.qty;
                  const isProfit = pnl >= 0;

                  return (
                    <tr key={trade.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{dateStr}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 700 }}>{trade.symbol.replace('.NS','')}</td>
                      <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: trade.type === 'BUY' ? 'var(--blue)' : 'var(--red)', fontWeight: 600 }}>{trade.type}</td>
                      <td style={{ padding: '14px 20px', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>₹{trade.entry}</td>
                      <td style={{ padding: '14px 20px', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>₹{trade.exitPrice.toFixed(2)}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', background: isTarget ? 'rgba(0,200,83,0.1)' : 'rgba(255,82,82,0.1)', color: isTarget ? 'var(--green)' : 'var(--red)' }}>
                          {isTarget ? <CheckCircle2 size={12} /> : <AlertOctagon size={12} />}
                          {trade.hitType}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 700, color: isProfit ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)' }}>
                        {isProfit ? '+' : ''}₹{Math.abs(pnl).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
