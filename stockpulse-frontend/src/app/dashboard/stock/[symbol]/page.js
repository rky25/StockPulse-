'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { TrendingUp, TrendingDown, Clock, Activity as ActivityIcon, ShieldAlert, Target, Crosshair, AlertTriangle, Zap, BarChart3, Eye } from 'lucide-react';
import TradingChart from '../../../../components/dashboard/TradingChart';
import { Trading, CONFIG } from '../../../../lib/tradingEngine';

/* ── Helper: fetch Yahoo chart data ── */
async function fetchChart(symbol, interval, range) {
  try {
    const res = await fetch(`/api/proxy/chart/${symbol}?interval=${interval}&range=${range}`);
    return await res.json();
  } catch { return null; }
}

function extractCloses(data) {
  const r = data?.chart?.result?.[0];
  if (!r) return [];
  return (r.indicators?.quote?.[0]?.close || []).filter(v => v != null);
}

function extractOHLCV(data) {
  const r = data?.chart?.result?.[0];
  if (!r || !r.timestamp) return null;
  const q = r.indicators.quote[0];
  return { timestamps: r.timestamp, opens: q.open||[], highs: q.high||[], lows: q.low||[], closes: q.close||[], volumes: q.volume||[] };
}

/* ── Signal Color Helper ── */
const signalColor = (s) => {
  if (!s) return 'var(--text-muted)';
  if (s.includes('BUY')) return '#00C853';
  if (s.includes('SELL')) return '#FF1744';
  return '#9E9E9E';
};

const signalBg = (s) => {
  if (!s) return 'rgba(255,255,255,0.05)';
  if (s.includes('BUY')) return 'rgba(0,200,83,0.1)';
  if (s.includes('SELL')) return 'rgba(255,23,68,0.1)';
  return 'rgba(255,255,255,0.05)';
};

/* ── Regime Badge ── */
function RegimeBadge({ regime, desc }) {
  const colors = { TRENDING: '#00C853', WEAK: '#FF9800', RANGING: '#FF5252' };
  const c = colors[regime] || '#9E9E9E';
  return (
    <span style={{ padding: '4px 10px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700, background: `${c}18`, color: c, border: `1px solid ${c}40`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <ActivityIcon size={12} /> {desc || regime}
    </span>
  );
}

/* ── Time Zone Badge ── */
function TimeZoneBadge({ zone }) {
  const map = {
    PRE: { color: '#9E9E9E', label: '⏳ PRE-MARKET' }, TRAP: { color: '#FF9800', label: '⚠️ TRAP ZONE' },
    SAFE: { color: '#00C853', label: '✅ SAFE ZONE' }, LATE: { color: '#FF9800', label: '⏰ LATE — Close Soon' },
    CLOSE: { color: '#FF1744', label: '🔴 CLOSING' }, CLOSED: { color: '#9E9E9E', label: '🔒 MARKET CLOSED' }
  };
  const m = map[zone] || map.CLOSED;
  return (
    <span style={{ padding: '4px 10px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700, background: `${m.color}18`, color: m.color, border: `1px solid ${m.color}40` }}>
      {m.label}
    </span>
  );
}

/* ── Core Indicator Vote Row ── */
function VoteRow({ indicator }) {
  const c = signalColor(indicator.signal);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
        <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{indicator.name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{indicator.value}</span>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: c, minWidth: 50, textAlign: 'right' }}>{indicator.signal}</span>
      </div>
    </div>
  );
}

/* ── Main Stock Page ── */
export default function StockPage({ params }) {
  const { symbol } = use(params);
  const displaySymbol = symbol.replace('.NS', '').replace('.BO', '');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [entryExit, setEntryExit] = useState(null);
  const [realCandles, setRealCandles] = useState([]);
  const [capital, setCapital] = useState(100000);
  const [riskPct, setRiskPct] = useState(1);

  /* Fetch all data and run analysis */
  const runAnalysis = useCallback(async () => {
    try {
      // Fetch 5m, 15m, Nifty, VIX data in parallel
      const [data5m, data15m, dataNifty, dataVix] = await Promise.all([
        fetchChart(symbol, '5m', '5d'),
        fetchChart(symbol, '15m', '5d'),
        fetchChart('^NSEI', '5m', '5d'),
        fetchChart('^INDIAVIX', '5m', '1d'),
      ]);

      // Extract quote from 5m meta
      const meta = data5m?.chart?.result?.[0]?.meta;
      if (meta) {
        setQuote({
          regularMarketPrice: meta.regularMarketPrice,
          regularMarketChange: +(meta.regularMarketPrice - meta.chartPreviousClose).toFixed(2),
          regularMarketChangePercent: +(((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100).toFixed(2),
          regularMarketPreviousClose: meta.chartPreviousClose,
          regularMarketDayHigh: meta.regularMarketDayHigh,
          regularMarketDayLow: meta.regularMarketDayLow,
          regularMarketVolume: meta.regularMarketVolume,
          fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
          shortName: meta.shortName || displaySymbol,
        });
      }

      // Extract OHLCV
      const d5 = extractOHLCV(data5m);
      if (!d5 || d5.closes.length < 30) { setLoading(false); return; }

      // 15m trend
      const closes15m = extractCloses(data15m);
      const trend15m = Trading.get15mTrend(closes15m);

      // Nifty trend
      const niftyCloses = extractCloses(dataNifty);
      const niftyTrend = Trading.getNiftyTrend(niftyCloses);

      // VIX value
      const vixCloses = extractCloses(dataVix);
      const vixValue = vixCloses.length > 0 ? vixCloses[vixCloses.length - 1] : 15;

      // Previous day data
      const n = d5.timestamps.length;
      const prevDayData = Trading.getPrevDayDataAt(d5.timestamps, d5.highs, d5.lows, d5.closes, n - 1);
      const price = meta?.regularMarketPrice || d5.closes[n - 1];

      // Run the FULL analysis engine
      const result = Trading.analyze(
        d5.timestamps, d5.closes, d5.highs, d5.lows, d5.volumes,
        price, trend15m, niftyTrend, prevDayData, vixValue, {}
      );

      if (result) {
        setAnalysis(result);
        // Calculate entry/exit
        const prevClose = meta?.regularMarketPreviousClose || null;
        const ee = Trading.calcEntryExit(price, result.atr, result.overall, result.pivots, capital, riskPct, vixValue, prevClose);
        setEntryExit(ee);
      }

      setLoading(false);
    } catch (err) {
      console.error('Analysis error:', err);
      setLoading(false);
    }
  }, [symbol, capital, riskPct, displaySymbol]);

  /* Fast quote refresh (every 3s) */
  const fetchFastQuote = useCallback(async () => {
    try {
      const data = await fetchChart(symbol, '1m', '1d');
      const meta = data?.chart?.result?.[0]?.meta;
      if (meta) {
        setQuote(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            regularMarketPrice: meta.regularMarketPrice,
            regularMarketChange: +(meta.regularMarketPrice - meta.chartPreviousClose).toFixed(2),
            regularMarketChangePercent: +(((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100).toFixed(2),
            regularMarketDayHigh: meta.regularMarketDayHigh,
            regularMarketDayLow: meta.regularMarketDayLow,
            regularMarketVolume: meta.regularMarketVolume,
          };
        });
      }
    } catch (err) {
      // silent fail for fast refresh
    }
  }, [symbol]);

  useEffect(() => { 
    runAnalysis(); 
    
    // Set intervals exactly like the legacy vanilla app
    const fastTimer = setInterval(fetchFastQuote, 3000); // 3 seconds fast quote refresh
    const slowTimer = setInterval(runAnalysis, 60000);   // 60 seconds full analysis refresh

    return () => {
      clearInterval(fastTimer);
      clearInterval(slowTimer);
    };
  }, [runAnalysis, fetchFastQuote]);

  const price = quote?.regularMarketPrice || 0;
  const change = quote?.regularMarketChange || 0;
  const changePct = quote?.regularMarketChangePercent || 0;
  const isUp = change >= 0;

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
          {displaySymbol.slice(0, 2)}
        </div>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.2 }}>{quote?.shortName || displaySymbol}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.06)', fontSize: '0.73rem', fontWeight: 600, color: 'var(--text-muted)' }}>{displaySymbol}</span>
            <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>• NSE</span>
            {analysis && <RegimeBadge regime={analysis.regime} desc={analysis.regimeDesc} />}
            {analysis && <TimeZoneBadge zone={analysis.timeZone} />}
          </div>
        </div>
      </div>

      {/* ── Price ── */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
          {loading ? '...' : `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
        </span>
        {!loading && (
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: isUp ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}>
            {isUp ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
            {isUp ? '+' : ''}{change.toFixed(2)} ({isUp ? '+' : ''}{changePct.toFixed(2)}%)
          </span>
        )}
      </div>

      {/* ── MASTER VERDICT PANEL ── */}
      {analysis && !loading && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {/* Left: Verdict */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span>Signal Engine Verdict</span>
                <span style={{ fontWeight: 700, color: analysis.confidence > 70 ? '#00C853' : analysis.confidence < 30 ? '#FF1744' : 'var(--accent-light)' }}>{analysis.confidence}% CONFIDENCE</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: signalBg(analysis.overall), color: signalColor(analysis.overall), padding: '14px 20px', borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: '1.3rem', border: `1px solid ${signalColor(analysis.overall)}40` }}>
                {analysis.overall.includes('BUY') ? <TrendingUp size={22} /> : analysis.overall.includes('SELL') ? <TrendingDown size={22} /> : <AlertTriangle size={22} />}
                {analysis.overall}
              </div>
              <div style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--text-muted)' }}>{analysis.verdictReason}</div>

              {/* Setup Badge */}
              {analysis.setup && (
                <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(41,98,255,0.08)', border: '1px solid rgba(41,98,255,0.2)', borderRadius: 6, fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--accent-light)' }}>⚡ {analysis.setup.name}</span>
                  <div style={{ color: 'var(--text-muted)', marginTop: 2, fontSize: '0.75rem' }}>{analysis.setup.description}</div>
                </div>
              )}

              {/* Warnings */}
              {analysis.warnings?.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {analysis.warnings.slice(0, 3).map((w, i) => (
                    <span key={i} style={{ background: 'rgba(255,152,0,0.1)', color: '#FF9800', border: '1px solid rgba(255,152,0,0.3)', padding: '3px 8px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 600 }}>{w}</span>
                  ))}
                </div>
              )}

              {/* SL / Targets */}
              {entryExit && (
                <div style={{ marginTop: 14, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}><ShieldAlert size={12} /> Stop Loss</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#FF5252' }}>₹{entryExit.sl}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}><Target size={12} /> T1 (1.5x)</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#00C853' }}>₹{entryExit.target1}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}><Target size={12} /> T2 (2.5x)</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#448AFF' }}>₹{entryExit.target2}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Position Calculator */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}><Crosshair size={15} color="var(--accent)" /> Position Calculator</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Capital (₹)</label>
                  <input type="number" value={capital} onChange={e => setCapital(+e.target.value)} style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'white', outline: 'none', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Risk %</label>
                  <input type="number" value={riskPct} step="0.1" onChange={e => setRiskPct(+e.target.value)} style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'white', outline: 'none', fontSize: '0.85rem' }} />
                </div>
              </div>
              {entryExit && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Risk Amount</div><div style={{ fontWeight: 600 }}>₹{entryExit.riskBudget.toLocaleString('en-IN')}</div></div>
                  <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Qty</div><div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--accent-light)' }}>{entryExit.qty} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>shares</span></div></div>
                  <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Position Value</div><div style={{ fontWeight: 600 }}>₹{entryExit.positionValue.toLocaleString('en-IN')}</div></div>
                  <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>VIX Sizing</div><div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#FF9800' }}>{entryExit.vixDesc}</div></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Chart ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ActivityIcon size={16} color="var(--accent)" /> Intraday Chart (5m) with VWAP & ORB
        </div>
        <TradingChart symbol={symbol} onDataReady={setRealCandles} />
      </div>

      {/* ── Core Indicator Votes ── */}
      {analysis && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} color="#FF9800" /> Signal Engine — {analysis.buyVotes} Buy vs {analysis.sellVotes} Sell Votes
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {analysis.strategies?.map((ind, i) => <VoteRow key={i} indicator={ind} />)}
          </div>
        </div>
      )}

      {/* ── Key Levels ── */}
      {analysis?.pivots && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eye size={16} color="var(--accent)" /> Key Levels
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            {[
              { label: 'R2', val: analysis.pivots.r2, color: '#FF1744' },
              { label: 'R1', val: analysis.pivots.r1, color: '#FF5252' },
              { label: 'Pivot', val: analysis.pivots.pivot, color: '#FF9800' },
              { label: 'S1', val: analysis.pivots.s1, color: '#448AFF' },
              { label: 'S2', val: analysis.pivots.s2, color: '#2962FF' },
              { label: 'VWAP', val: analysis.vwap, color: '#FF9800' },
              { label: 'Supertrend', val: analysis.supertrend, color: analysis.supertrendDir === 1 ? '#00C853' : '#FF1744' },
              { label: 'ATR', val: analysis.atr, color: 'var(--text-primary)' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: item.color, fontFamily: 'var(--font-mono)' }}>₹{typeof item.val === 'number' ? item.val.toFixed(2) : '--'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Overview Stats ── */}
      <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <BarChart3 size={16} color="var(--accent)" /> Market Overview
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Day High', value: quote?.regularMarketDayHigh },
          { label: 'Day Low', value: quote?.regularMarketDayLow },
          { label: 'Prev Close', value: quote?.regularMarketPreviousClose },
          { label: 'Volume', value: quote?.regularMarketVolume?.toLocaleString('en-IN') },
          { label: '52W High', value: quote?.fiftyTwoWeekHigh },
          { label: '52W Low', value: quote?.fiftyTwoWeekLow },
          { label: 'ADX', value: analysis?.adxValue?.toFixed(1) },
          { label: 'Vol Ratio', value: analysis?.volRatio?.toFixed(1) + 'x' },
        ].map((item, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              {typeof item.value === 'number' ? `₹${item.value.toLocaleString('en-IN')}` : item.value || '--'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
