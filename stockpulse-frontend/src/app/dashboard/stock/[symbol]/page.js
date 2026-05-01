'use client';

import { useState, useEffect, use } from 'react';
import { TrendingUp, TrendingDown, Clock, BarChart3, Activity as ActivityIcon } from 'lucide-react';
import MasterVerdictPanel from '../../../../components/dashboard/MasterVerdictPanel';
import TradingChart from '../../../../components/dashboard/TradingChart';
import { RSI, MACD, SMA, EMA, ADX, CCI, Stochastic, AwesomeOscillator } from 'technicalindicators';

/* ── SVG Gauge Component ── */
function TechnicalGauge({ title, value, verdict, sell, neutral, buy, size = 180 }) {
  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = size / 2 - 16;
  const needleAngle = Math.PI - (value / 100) * Math.PI;

  const zones = [
    { start: Math.PI, end: Math.PI * 0.8, color: '#FF1744' },
    { start: Math.PI * 0.8, end: Math.PI * 0.6, color: '#FF5252' },
    { start: Math.PI * 0.6, end: Math.PI * 0.4, color: '#9E9E9E' },
    { start: Math.PI * 0.4, end: Math.PI * 0.2, color: '#448AFF' },
    { start: Math.PI * 0.2, end: 0.01, color: '#2962FF' },
  ];

  const arcPath = (s, e) => {
    const x1 = cx + r * Math.cos(s), y1 = cy - r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy - r * Math.sin(e);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 0 ${x2} ${y2}`;
  };

  const needleLen = r - 20;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy - needleLen * Math.sin(needleAngle);

  const verdictColor = {
    'Strong Buy': '#00C853', 'Buy': '#448AFF', 'Neutral': '#9E9E9E',
    'Sell': '#FF5252', 'Strong Sell': '#FF1744',
  }[verdict] || '#9E9E9E';

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '28px 20px 22px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>{title}</div>
      <svg width={size} height={size / 2 + 25} viewBox={`0 0 ${size} ${size / 2 + 25}`} style={{ margin: '0 auto', display: 'block' }}>
        {zones.map((z, i) => (
          <path key={i} d={arcPath(z.start, z.end)} fill="none" stroke={z.color} strokeWidth={10} strokeLinecap="round" opacity={0.7} />
        ))}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="white" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={5} fill="white" />
        <text x={8} y={cy - 8} fill="#9E9E9E" fontSize="7">Strong sell</text>
        <text x={22} y={18} fill="#9E9E9E" fontSize="7">Sell</text>
        <text x={cx - 12} y={8} fill="#9E9E9E" fontSize="7">Neutral</text>
        <text x={size - 36} y={18} fill="#9E9E9E" fontSize="7">Buy</text>
        <text x={size - 64} y={cy - 8} fill="#9E9E9E" fontSize="7">Strong buy</text>
      </svg>
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: verdictColor, margin: '4px 0 14px' }}>{verdict}</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 28 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Sell</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#FF5252' }}>{sell}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Neutral</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#9E9E9E' }}>{neutral}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Buy</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#448AFF' }}>{buy}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Indicator Table ── */
function IndicatorTable({ title, data }) {
  const actionColor = (a) => {
    if (a === 'Buy' || a === 'Strong Buy') return '#448AFF';
    if (a === 'Sell' || a === 'Strong Sell') return '#FF5252';
    return '#9E9E9E';
  };

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '0.95rem' }}>
        {title}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Name', 'Value', 'Action'].map((h, i) => (
                <th key={i} style={{
                  padding: '10px 20px', textAlign: i === 0 ? 'left' : 'right',
                  fontSize: '0.72rem', color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '11px 20px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{row.name}</td>
                <td style={{ padding: '11px 20px', fontSize: '0.88rem', textAlign: 'right', fontFamily: 'var(--font-mono, monospace)' }}>{row.value}</td>
                <td style={{ padding: '11px 20px', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600, color: actionColor(row.action) }}>{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
  const [activeTab, setActiveTab] = useState('technicals');
  const [realCandles, setRealCandles] = useState([]);

  useEffect(() => {
    fetch(`/api/proxy/chart/${symbol}?interval=1d&range=5d`)
      .then(r => r.json())
      .then(d => {
        // Chart API: data in chart.result[0].meta
        const meta = d?.chart?.result?.[0]?.meta;
        if (meta) {
          setQuote({
            regularMarketPrice: meta.regularMarketPrice,
            regularMarketChange: (meta.regularMarketPrice - meta.chartPreviousClose).toFixed(2) * 1,
            regularMarketChangePercent: (((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100).toFixed(2) * 1,
            regularMarketPreviousClose: meta.chartPreviousClose,
            regularMarketDayHigh: meta.regularMarketDayHigh || meta.regularMarketPrice * 1.01,
            regularMarketDayLow: meta.regularMarketDayLow || meta.regularMarketPrice * 0.99,
            regularMarketOpen: meta.regularMarketPrice * 0.998,
            regularMarketVolume: meta.regularMarketVolume,
            fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
            shortName: meta.shortName || meta.symbol?.replace('.NS',''),
            longName: meta.longName || meta.symbol?.replace('.NS',''),
            marketCap: meta.marketCap,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [symbol]);

  const price = quote?.regularMarketPrice || (realCandles.length > 0 ? realCandles[realCandles.length - 1].close : 0);
  const change = quote?.regularMarketChange || 0;
  const changePct = quote?.regularMarketChangePercent || 0;
  const isUp = change >= 0;
  const companyName = quote?.shortName || quote?.longName || displaySymbol;

  // Compute REAL technical indicators from live candle data
  const computeIndicators = () => {
    const p = price || 1430;
    
    // If we don't have enough candles yet, return neutral placeholders
    if (realCandles.length < 50) {
      return { 
        oscillators: [{ name: 'Gathering live data...', value: '--', action: 'Neutral', weight: 0 }], 
        movingAvgs: [{ name: 'Gathering live data...', value: '--', action: 'Neutral', weight: 0 }],
        regime: { isChoppy: false, lowVolume: false }
      };
    }

    const closePrices = realCandles.map(c => c.close);
    const highPrices = realCandles.map(c => c.high);
    const lowPrices = realCandles.map(c => c.low);
    const volumes = realCandles.map(c => c.volume);

    // Regime Filters
    const recentVols = volumes.slice(-20);
    const avgVol = recentVols.reduce((a, b) => a + b, 0) / 20;
    const currentVol = volumes[volumes.length - 1];
    // Intraday current candle is forming, so we check if it's at least 60% of average to not trigger false alarms constantly
    const lowVolume = currentVol < (avgVol * 0.6);

    const adx14 = ADX.calculate({ period: 14, high: highPrices, low: lowPrices, close: closePrices }).pop() || { adx: 20 };
    const isChoppy = adx14.adx < 20;

    // Real Oscillators
    const rsi14 = RSI.calculate({ period: 14, values: closePrices }).pop() || 50;
    const macd12_26 = MACD.calculate({ fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false, values: closePrices }).pop() || { MACD: 0, signal: 0 };
    const stoch = Stochastic.calculate({ period: 14, signalPeriod: 3, high: highPrices, low: lowPrices, close: closePrices }).pop() || { k: 50, d: 50 };
    const cci20 = CCI.calculate({ period: 20, high: highPrices, low: lowPrices, close: closePrices }).pop() || 0;
    const ao = AwesomeOscillator.calculate({ high: highPrices, low: lowPrices, fastPeriod: 5, slowPeriod: 34 }).pop() || 0;

    const getOscAction = (val, buyThresh, sellThresh, inverse = false) => {
      if (!inverse) {
        if (val > buyThresh) return 'Buy';
        if (val < sellThresh) return 'Sell';
        return 'Neutral';
      } else {
        if (val < buyThresh) return 'Buy';
        if (val > sellThresh) return 'Sell';
        return 'Neutral';
      }
    };

    const oscillators = [
      { name: 'Relative Strength Index (14)', value: rsi14.toFixed(2), action: getOscAction(rsi14, 60, 40), weight: 2 },
      { name: 'Stochastic %K (14,3,3)', value: stoch.k.toFixed(2), action: getOscAction(stoch.k, 20, 80, true), weight: 1 },
      { name: 'Commodity Channel Index (20)', value: cci20.toFixed(2), action: getOscAction(cci20, 100, -100), weight: 1 },
      { name: 'Average Directional Index (14)', value: adx14.adx.toFixed(2), action: adx14.adx > 25 ? 'Buy' : 'Neutral', weight: 2 },
      { name: 'Awesome Oscillator', value: ao.toFixed(2), action: ao > 0 ? 'Buy' : 'Sell', weight: 1 },
      { name: 'MACD Level (12, 26)', value: macd12_26.MACD.toFixed(2), action: macd12_26.MACD > macd12_26.signal ? 'Buy' : 'Sell', weight: 2 },
    ];

    // Real Moving Averages
    const ema10 = EMA.calculate({ period: 10, values: closePrices }).pop() || p;
    const sma10 = SMA.calculate({ period: 10, values: closePrices }).pop() || p;
    const ema20 = EMA.calculate({ period: 20, values: closePrices }).pop() || p;
    const sma20 = SMA.calculate({ period: 20, values: closePrices }).pop() || p;
    const ema50 = EMA.calculate({ period: 50, values: closePrices }).pop() || p;
    const sma50 = SMA.calculate({ period: 50, values: closePrices }).pop() || p;
    const ema200 = EMA.calculate({ period: 200, values: closePrices }).pop() || p;
    
    const getMaAction = (maValue) => p > maValue ? 'Buy' : 'Sell';

    const movingAvgs = [
      { name: 'Exponential Moving Average (10)', value: ema10.toFixed(2), action: getMaAction(ema10), weight: 1 },
      { name: 'Simple Moving Average (10)', value: sma10.toFixed(2), action: getMaAction(sma10), weight: 1 },
      { name: 'Exponential Moving Average (20)', value: ema20.toFixed(2), action: getMaAction(ema20), weight: 1 },
      { name: 'Simple Moving Average (20)', value: sma20.toFixed(2), action: getMaAction(sma20), weight: 1 },
      { name: 'Exponential Moving Average (50)', value: ema50.toFixed(2), action: getMaAction(ema50), weight: 2 },
      { name: 'Simple Moving Average (50)', value: sma50.toFixed(2), action: getMaAction(sma50), weight: 2 },
      { name: 'Exponential Moving Average (200)', value: ema200.toFixed(2), action: getMaAction(ema200), weight: 3 },
    ];

    return { oscillators, movingAvgs, regime: { isChoppy, lowVolume } };
  };

  const { oscillators, movingAvgs, regime } = computeIndicators();
  
  // Weighted Voting Logic
  const calculateWeights = (data) => {
    let buy = 0, sell = 0, neutral = 0;
    data.forEach(ind => {
      if (ind.action === 'Buy') buy += ind.weight;
      else if (ind.action === 'Sell') sell += ind.weight;
      else neutral += ind.weight;
    });
    return { buy, sell, neutral };
  };

  const oscWeights = calculateWeights(oscillators);
  const maWeights = calculateWeights(movingAvgs);
  const totalBuy = oscWeights.buy + maWeights.buy;
  const totalSell = oscWeights.sell + maWeights.sell;
  const totalNeutral = oscWeights.neutral + maWeights.neutral;

  // Confidence Score Calculation: BuyWeight / (BuyWeight + SellWeight)
  const calculateConfidence = (b, s) => {
    if (b === 0 && s === 0) return 50;
    return Math.round((b / (b + s)) * 100);
  };

  const getVerdict = (b, s, n) => {
    const confidence = calculateConfidence(b, s);
    let verdict = 'Neutral';
    let value = confidence; // Gauge value represents confidence

    if (b === 0 && s === 0 && n === 0) {
       verdict = 'Neutral'; value = 50;
    } else if (b > s * 1.5) {
       verdict = 'Strong Buy';
    } else if (b > s) {
       verdict = 'Buy';
    } else if (s > b * 1.5) {
       verdict = 'Strong Sell'; value = 100 - confidence; // Inverse for gauge
    } else if (s > b) {
       verdict = 'Sell'; value = 100 - confidence;
    }

    return { verdict, value, confidence };
  };

  const summary = getVerdict(totalBuy, totalSell, totalNeutral);
  const oscVerdict = getVerdict(oscWeights.buy, oscWeights.sell, oscWeights.neutral);
  const maVerdict = getVerdict(maWeights.buy, maWeights.sell, maWeights.neutral);

  const tabs = ['technicals', 'overview', 'news'];

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--radius-md)',
          background: 'var(--accent-gradient)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', fontWeight: 700, color: 'white',
        }}>
          {displaySymbol.slice(0, 2)}
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2 }}>{companyName}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{
              padding: '2px 8px', borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.06)', fontSize: '0.75rem',
              fontWeight: 600, color: 'var(--text-muted)',
            }}>
              {displaySymbol}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• NSE</span>
          </div>
        </div>
      </div>

      {/* Price */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
          {loading ? '...' : `₹${typeof price === 'number' ? price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : price}`}
        </span>
        {!loading && (
          <span style={{
            fontSize: '1rem', fontWeight: 600,
            color: isUp ? 'var(--green)' : 'var(--red)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {isUp ? '+' : ''}{typeof change === 'number' ? change.toFixed(2) : change}
            ({isUp ? '+' : ''}{typeof changePct === 'number' ? changePct.toFixed(2) : changePct}%)
          </span>
        )}
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={12} /> At close
        </span>
      </div>

      {/* Master Verdict Panel & Risk Calculator */}
      {!loading && (
        <MasterVerdictPanel 
          price={price} 
          technicalSummary={{...summary, regime}} 
          displaySymbol={displaySymbol} 
        />
      )}

      {/* Intraday Chart with ORB & VWAP */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ActivityIcon size={18} color="var(--accent)" /> Intraday Pro Chart (5m) & Live Feed
        </div>
        <TradingChart symbol={symbol} onDataReady={(data) => {
          setRealCandles(data);
          // If quote isn't loaded or is stale, we can optionally update price here
          if (data && data.length > 0) {
            const latest = data[data.length - 1];
            if (!quote || quote.regularMarketPrice !== latest.close) {
               setQuote(prev => prev ? { ...prev, regularMarketPrice: latest.close } : null);
            }
          }
        }} />
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 28,
        overflowX: 'auto',
      }}>
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 20px', fontSize: '0.9rem', fontWeight: 600,
            color: activeTab === tab ? 'var(--accent-light)' : 'var(--text-muted)',
            borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
            background: 'none', border: 'none', cursor: 'pointer',
            textTransform: 'capitalize', transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Technicals Tab */}
      {activeTab === 'technicals' && (
        <>
          {/* Gauges */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20, marginBottom: 32,
          }}>
            <TechnicalGauge title="Oscillators" value={oscVerdict.value} verdict={oscVerdict.verdict} sell={oscWeights.sell} neutral={oscWeights.neutral} buy={oscWeights.buy} />
            <TechnicalGauge title="Summary" value={summary.value} verdict={summary.verdict} sell={totalSell} neutral={totalNeutral} buy={totalBuy} />
            <TechnicalGauge title="Moving Averages" value={maVerdict.value} verdict={maVerdict.verdict} sell={maWeights.sell} neutral={maWeights.neutral} buy={maWeights.buy} />
          </div>

          {/* Tables */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: 20,
          }}>
            <IndicatorTable title="Oscillators" data={oscillators} />
            <IndicatorTable title="Moving Averages" data={movingAvgs} />
          </div>
        </>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}>
          {[
            { label: 'Open', value: quote?.regularMarketOpen || (price * 0.998).toFixed(2) },
            { label: 'High', value: quote?.regularMarketDayHigh || (price * 1.01).toFixed(2) },
            { label: 'Low', value: quote?.regularMarketDayLow || (price * 0.99).toFixed(2) },
            { label: 'Prev Close', value: quote?.regularMarketPreviousClose || (price - change).toFixed(2) },
            { label: 'Volume', value: quote?.regularMarketVolume?.toLocaleString('en-IN') || '12,45,678' },
            { label: '52W High', value: quote?.fiftyTwoWeekHigh || (price * 1.15).toFixed(2) },
            { label: '52W Low', value: quote?.fiftyTwoWeekLow || (price * 0.72).toFixed(2) },
            { label: 'Market Cap', value: quote?.marketCap ? `₹${(quote.marketCap / 1e12).toFixed(2)}T` : '₹9.68T' },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '18px 20px',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                {item.label}
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                {typeof item.value === 'number' ? `₹${item.value.toLocaleString('en-IN')}` : item.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* News Tab */}
      {activeTab === 'news' && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '32px', textAlign: 'center',
          color: 'var(--text-muted)',
        }}>
          <BarChart3 size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ fontSize: '0.95rem' }}>News feed will connect to your backend&apos;s /api/news endpoint.</p>
          <p style={{ fontSize: '0.85rem', marginTop: 8 }}>Start your Express server on port 8080 to see live news.</p>
        </div>
      )}
    </div>
  );
}
