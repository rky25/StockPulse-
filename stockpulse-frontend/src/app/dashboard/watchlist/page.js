'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, TrendingUp, TrendingDown, Plus, Trash2, ArrowRight, Search } from 'lucide-react';

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState(['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS']);
  const [stockData, setStockData] = useState({});
  const [newSymbol, setNewSymbol] = useState('');
  const [loading, setLoading] = useState(true);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('stockpulse_watchlist');
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved watchlist");
      }
    }
    setLoading(false);
  }, []);

  // Save to local storage whenever watchlist changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('stockpulse_watchlist', JSON.stringify(watchlist));
    }
  }, [watchlist, loading]);

  // Live Price Polling Loop (Every 15 seconds)
  useEffect(() => {
    if (watchlist.length === 0) return;

    let isMounted = true;
    
    const fetchLivePrices = async () => {
      const newData = { ...stockData };

      await Promise.all(watchlist.map(async (sym) => {
        try {
          const res = await fetch(`/api/proxy/chart/${sym}?interval=1d&range=5d`);
          const data = await res.json();
          const meta = data?.chart?.result?.[0]?.meta;
          if (meta) {
            newData[sym] = {
              price: meta.regularMarketPrice,
              prevClose: meta.chartPreviousClose,
              change: meta.regularMarketPrice - meta.chartPreviousClose,
              changePct: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100,
              name: meta.shortName || sym.replace('.NS', '')
            };
          }
        } catch (err) {
          console.error(`Failed to fetch live price for ${sym}`, err);
        }
      }));

      if (isMounted) {
        setStockData(newData);
      }
    };

    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [watchlist]); // Dependency on watchlist to refetch when new symbol is added

  const handleAddSymbol = (e) => {
    e.preventDefault();
    if (!newSymbol.trim()) return;
    
    let formattedSymbol = newSymbol.toUpperCase().trim();
    if (!formattedSymbol.endsWith('.NS') && !formattedSymbol.endsWith('.BO')) {
      formattedSymbol += '.NS';
    }

    if (!watchlist.includes(formattedSymbol)) {
      setWatchlist([...watchlist, formattedSymbol]);
    }
    setNewSymbol('');
  };

  const removeSymbol = (symbolToRemove) => {
    setWatchlist(watchlist.filter(sym => sym !== symbolToRemove));
    
    // Optional: cleanup stockData
    const newData = { ...stockData };
    delete newData[symbolToRemove];
    setStockData(newData);
  };

  if (loading) return <div style={{ padding: '28px', color: 'var(--text-muted)' }}>Loading watchlist...</div>;

  return (
    <div style={{ padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)',
          background: 'var(--accent-gradient)', display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <Star size={20} color="white" />
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Custom Watchlist</h1>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.95rem' }}>
        Track your favorite stocks with real-time market polling.
      </p>

      {/* Add Symbol Bar */}
      <div style={{ marginBottom: '24px', maxWidth: '500px' }}>
        <form onSubmit={handleAddSymbol} style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input 
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              placeholder="Add symbol (e.g., RELIANCE, TCS)"
              style={{
                width: '100%', padding: '10px 12px 10px 36px',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', color: 'white', outline: 'none'
              }}
            />
          </div>
          <button type="submit" style={{
            background: 'var(--accent-gradient)', color: 'white',
            border: 'none', borderRadius: 'var(--radius-sm)',
            padding: '0 20px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <Plus size={16} /> Add
          </button>
        </form>
      </div>

      {/* Watchlist Table */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        {watchlist.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Star size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>Your watchlist is empty.</p>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Add some symbols above to start tracking them.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Symbol', 'Company', 'Live Price', 'Change', '', ''].map((h, i) => (
                    <th key={i} style={{
                      padding: '14px 20px', textAlign: i === 5 ? 'right' : 'left',
                      fontSize: '0.75rem', color: 'var(--text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {watchlist.map((symbol) => {
                  const data = stockData[symbol];
                  const isUp = data?.change >= 0;
                  
                  return (
                    <tr key={symbol} style={{
                      borderBottom: '1px solid var(--border)',
                      transition: 'background 0.15s',
                    }}>
                      <td style={{ padding: '16px 20px', fontWeight: 700, fontSize: '0.95rem' }}>
                        {symbol.replace('.NS', '')}
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {data?.name || 'Loading...'}
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
                        {data ? `₹${data.price.toFixed(2)}` : '--'}
                      </td>
                      <td style={{
                        padding: '16px 20px', fontWeight: 600, fontSize: '0.85rem',
                        color: data ? (isUp ? 'var(--green)' : 'var(--red)') : 'var(--text-muted)',
                      }}>
                        {data ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {isUp ? '+' : ''}{data.change.toFixed(2)} ({isUp ? '+' : ''}{data.changePct.toFixed(2)}%)
                          </div>
                        ) : '--'}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <Link
                          href={`/dashboard/stock/${symbol}`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            fontSize: '0.85rem', color: 'var(--accent-light)', fontWeight: 600,
                            padding: '6px 12px', background: 'rgba(41, 98, 255, 0.1)',
                            borderRadius: '4px', textDecoration: 'none'
                          }}
                        >
                          Analyze <ArrowRight size={14} />
                        </Link>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <button 
                          onClick={() => removeSymbol(symbol)}
                          style={{
                            background: 'none', border: 'none', color: 'var(--text-muted)',
                            cursor: 'pointer', padding: '6px', borderRadius: '4px',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'rgba(255,82,82,0.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
