/* =============================================
   TRADING ENGINE v4 — Enhanced Signal System
   ============================================= */

// ===== NAMED CONSTANTS (no more magic numbers) =====
const CONFIG = {
  // ADX Regime Thresholds
  ADX_STRONG_TREND: 25,
  ADX_WEAK_TREND: 15,
  ADX_TRADE_GATE: 20,        // was 25 — relaxed to allow weak trends

  // RSI Thresholds
  RSI_TREND_BUY: 55,
  RSI_TREND_SELL: 45,
  RSI_RANGE_OVERSOLD: 30,
  RSI_RANGE_OVERBOUGHT: 70,
  RSI_BLOCK_OVERBOUGHT: 72,  // was 65 — relaxed
  RSI_BLOCK_OVERSOLD: 28,    // was 35 — relaxed

  // Volume
  VOL_CONFIRM_RATIO: 1.2,
  VOL_TRADE_GATE: 0.8,       // was 1.0 — relaxed
  VOL_SPIKE_MULTIPLIER: 3,

  // Confidence Thresholds
  CONF_STRONG: 75,           // was 80
  CONF_NORMAL: 60,           // was 65
  VOTES_STRONG: 4,           // out of 5 now
  VOTES_NORMAL: 3,           // out of 5 now

  // Targets (Risk multiples)
  TARGET_1_MULT: 1.5,
  TARGET_2_MULT: 2.5,        // was 4.0 (same as T3!) — FIXED
  TARGET_3_MULT: 4.0,

  // Stop Loss
  SL_ATR_MULT: 1.0,

  // VIX
  VIX_WARNING: 17,
  VIX_HIGH: 20,
  VIX_EXTREME: 25,

  // VWAP proximity
  VWAP_NEAR_PCT: 0.003,
  PIVOT_NEAR_PCT: 0.003,

  // ORB
  ORB_VOL_MULT: 1.5,
  ORB_START_HOUR: 9, ORB_START_MIN: 15,
  ORB_END_HOUR: 9, ORB_END_MIN: 30,

  // Sector alignment
  SECTOR_MAP: {
    'HDFCBANK.NS': '^NSEBANK', 'ICICIBANK.NS': '^NSEBANK', 'AXISBANK.NS': '^NSEBANK',
    'KOTAKBANK.NS': '^NSEBANK', 'SBIN.NS': '^NSEBANK',
    'INFY.NS': '^CNXIT', 'TCS.NS': '^CNXIT', 'WIPRO.NS': '^CNXIT',
    'TECHM.NS': '^CNXIT', 'HCLTECH.NS': '^CNXIT',
    'RELIANCE.NS': '^CNXENERGY', 'BPCL.NS': '^CNXENERGY', 'ONGC.NS': '^CNXENERGY',
    'MARUTI.NS': '^CNXAUTO', 'TATAMOTORS.NS': '^CNXAUTO', 'M&M.NS': '^CNXAUTO',
  },
};

const IST_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

const dayKeyCache = new Map();

const Trading = {
  getISTParts(timestampMs) {
    const parts = IST_FORMATTER.formatToParts(new Date(timestampMs));
    const map = {};
    parts.forEach(part => { if (part.type !== 'literal') map[part.type] = part.value; });
    return {
      year: +map.year,
      month: +map.month,
      day: +map.day,
      hour: +map.hour,
      minute: +map.minute,
      dayKey: `${map.year}-${map.month}-${map.day}`
    };
  },

  getISTDayKey(timestampSec) {
    if (dayKeyCache.has(timestampSec)) return dayKeyCache.get(timestampSec);
    const key = this.getISTParts(timestampSec * 1000).dayKey;
    dayKeyCache.set(timestampSec, key);
    return key;
  },

  // ===== CORE CALCULATIONS =====
  calcATR(highs, lows, closes, period=14) {
    const tr = [];
    for (let i = 0; i < closes.length; i++) {
      if (i === 0) { tr.push(highs[i] - lows[i]); continue; }
      tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i-1]), Math.abs(lows[i] - closes[i-1])));
    }
    const atr = [];
    for (let i = 0; i < tr.length; i++) {
      if (i < period - 1) { atr.push(null); continue; }
      if (i === period - 1) { let s = 0; for (let j = 0; j < period; j++) s += tr[j]; atr.push(s / period); continue; }
      atr.push((atr[i-1] * (period - 1) + tr[i]) / period);
    }
    return atr;
  },

  calcSMA(data, period) {
    const r = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) { r.push(null); continue; }
      let s = 0; for (let j = i - period + 1; j <= i; j++) s += data[j]; r.push(s / period);
    }
    return r;
  },

  calcEMA(data, period) {
    const r = [], k = 2 / (period + 1); let prev = null;
    for (let i = 0; i < data.length; i++) {
      if (data[i] == null) { r.push(null); continue; }
      if (prev === null) { prev = data[i]; r.push(prev); }
      else { prev = data[i] * k + prev * (1 - k); r.push(prev); }
    }
    return r;
  },

  calcRSI(data, period=14) {
    const r = []; let gains = 0, losses = 0;
    for (let i = 0; i < data.length; i++) {
      if (i === 0) { r.push(null); continue; }
      const diff = data[i] - data[i-1];
      if (i <= period) {
        if (diff > 0) gains += diff; else losses -= diff;
        if (i === period) { gains /= period; losses /= period; r.push(losses === 0 ? 100 : 100 - 100 / (1 + gains / losses)); }
        else r.push(null);
      } else {
        const g = diff > 0 ? diff : 0, l = diff < 0 ? -diff : 0;
        gains = (gains * (period - 1) + g) / period; losses = (losses * (period - 1) + l) / period;
        r.push(losses === 0 ? 100 : 100 - 100 / (1 + gains / losses));
      }
    }
    return r;
  },

  calcVWAP(timestamps, closes, volumes, highs, lows) {
    let cumVol = 0, cumTP = 0; const r = [];
    let currentDay = null;
    for (let i = 0; i < closes.length; i++) {
      if (closes[i] == null || volumes[i] == null || timestamps[i] == null) { r.push(null); continue; }
      const dayKey = this.getISTDayKey(timestamps[i]);
      if (dayKey !== currentDay) {
        cumVol = 0; cumTP = 0; currentDay = dayKey;
      }
      const tp = ((highs[i] || closes[i]) + (lows[i] || closes[i]) + closes[i]) / 3;
      cumTP += tp * volumes[i]; cumVol += volumes[i]; r.push(cumVol ? cumTP / cumVol : null);
    }
    return r;
  },

  calcBollinger(data, period=20) {
    const sma = this.calcSMA(data, period), upper = [], lower = [];
    for (let i = 0; i < data.length; i++) {
      if (sma[i] === null) { upper.push(null); lower.push(null); continue; }
      let sum = 0; for (let j = i - period + 1; j <= i; j++) sum += Math.pow(data[j] - sma[i], 2);
      const std = Math.sqrt(sum / period); upper.push(sma[i] + 2 * std); lower.push(sma[i] - 2 * std);
    }
    return { middle: sma, upper, lower };
  },

  calcSupertrend(highs, lows, closes, period=10, multiplier=3) {
    const atr = this.calcATR(highs, lows, closes, period);
    const st = [], dir = [];
    for (let i = 0; i < closes.length; i++) {
      if (atr[i] === null) { st.push(null); dir.push(0); continue; }
      const hl2 = (highs[i] + lows[i]) / 2, up = hl2 - multiplier * atr[i], dn = hl2 + multiplier * atr[i];
      if (i === 0 || st[i-1] === null) { st.push(closes[i] > dn ? up : dn); dir.push(closes[i] > dn ? 1 : -1); continue; }
      if (dir[i-1] === 1) { const n = Math.max(up, st[i-1]); if (closes[i] < n) { st.push(dn); dir.push(-1); } else { st.push(n); dir.push(1); } }
      else { const n = Math.min(dn, st[i-1]); if (closes[i] > n) { st.push(up); dir.push(1); } else { st.push(n); dir.push(-1); } }
    }
    return { values: st, direction: dir };
  },

  // NEW: ADX (replaces redundant EMA crossover)
  calcADX(highs, lows, closes, period=14) {
    if (closes.length < period * 2) return { adx: 20, pdi: 0, mdi: 0 };
    const pdm = [], mdm = [], tr = [];
    for (let i = 1; i < closes.length; i++) {
      const upMove = highs[i] - highs[i-1], downMove = lows[i-1] - lows[i];
      pdm.push(upMove > downMove && upMove > 0 ? upMove : 0);
      mdm.push(downMove > upMove && downMove > 0 ? downMove : 0);
      tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i-1]), Math.abs(lows[i] - closes[i-1])));
    }
    // Smooth
    const smooth = (arr, p) => { let s = arr.slice(0, p).reduce((a, b) => a + b, 0); const r = [s]; for (let i = p; i < arr.length; i++) { s = s - s / p + arr[i]; r.push(s); } return r; };
    const strP = smooth(pdm, period), strM = smooth(mdm, period), strT = smooth(tr, period);
    const dx = [];
    for (let i = 0; i < strT.length; i++) {
      const pdi = strT[i] ? (strP[i] / strT[i]) * 100 : 0;
      const mdi = strT[i] ? (strM[i] / strT[i]) * 100 : 0;
      dx.push(pdi + mdi ? Math.abs(pdi - mdi) / (pdi + mdi) * 100 : 0);
    }
    const adx = dx.length >= period ? dx.slice(-period).reduce((a, b) => a + b, 0) / period : 20;
    const lastPDI = strT.length ? (strP[strP.length-1] / strT[strT.length-1]) * 100 : 0;
    const lastMDI = strT.length ? (strM[strM.length-1] / strT[strT.length-1]) * 100 : 0;
    return { adx, pdi: lastPDI, mdi: lastMDI };
  },

  // NEW: Pivot Points (S/R levels)
  calcPivotPoints(prevHigh, prevLow, prevClose) {
    const pivot = (prevHigh + prevLow + prevClose) / 3;
    return {
      r2: pivot + (prevHigh - prevLow), r1: 2 * pivot - prevLow,
      pivot,
      s1: 2 * pivot - prevHigh, s2: pivot - (prevHigh - prevLow)
    };
  },

  classifySetup(price, vwapVal, emaFast, emaSlow, rsi, regime, dominantSide, pivots) {
    const distFromVWAP = vwapVal ? Math.abs(price - vwapVal) / vwapVal : 0;
    const nearVWAP = distFromVWAP <= 0.003;
    const nearPivot = pivots && Math.abs(price - pivots.pivot) / price <= 0.003;

    if (regime === 'TRENDING' && dominantSide === 'BUY' && price > vwapVal && emaFast > emaSlow) {
      return {
        name: nearVWAP ? 'Trend Pullback Long' : 'Trend Continuation Long',
        description: nearVWAP ? 'Price is holding near VWAP inside an uptrend.' : 'Momentum is aligned for trend continuation on the long side.'
      };
    }
    if (regime === 'TRENDING' && dominantSide === 'SELL' && price < vwapVal && emaFast < emaSlow) {
      return {
        name: nearVWAP ? 'Trend Pullback Short' : 'Trend Continuation Short',
        description: nearVWAP ? 'Price is rejecting VWAP inside a downtrend.' : 'Momentum is aligned for trend continuation on the short side.'
      };
    }
    if (regime === 'RANGING' && nearPivot) {
      return {
        name: dominantSide === 'BUY' ? 'Support Reversal' : 'Resistance Reversal',
        description: 'Price is near the pivot zone in a sideways market, so mean-reversion matters more than trend.'
      };
    }
    if (regime === 'RANGING' && ((dominantSide === 'BUY' && rsi < 35) || (dominantSide === 'SELL' && rsi > 65))) {
      return {
        name: dominantSide === 'BUY' ? 'Oversold Bounce' : 'Overbought Fade',
        description: 'Range conditions and RSI extremes suggest a short-term reversal setup.'
      };
    }

    // ORB Breakout setup (after 9:30)
    if (regime === 'TRENDING' && dominantSide === 'BUY' && price > vwapVal) {
      return {
        name: 'ORB Breakout Long',
        description: 'Price broke above the opening range with momentum. Trend + ORB alignment.'
      };
    }
    if (regime === 'TRENDING' && dominantSide === 'SELL' && price < vwapVal) {
      return {
        name: 'ORB Breakdown Short',
        description: 'Price broke below the opening range with momentum. Trend + ORB alignment.'
      };
    }

    return {
      name: dominantSide === 'BUY' ? 'Breakout Watch' : 'Breakdown Watch',
      description: 'Momentum is leaning one way, but the move still needs confirmation.'
    };
  },

  // NEW: Volume gate check
  checkVolume(volumes) {
    const valid = volumes.filter(v => v != null && v > 0);
    if (valid.length < 20) return { ok: false, ratio: 0, avg: 0, current: 0 };
    // 20-period SMA to prevent morning spikes from permanently skewing the baseline
    const recent = valid[valid.length - 1];
    let sum = 0;
    for(let i = valid.length - 21; i < valid.length - 1; i++) {
      if(i >= 0) sum += valid[i];
    }
    const avg = sum / 20;
    return { ok: recent > avg * 1.2, ratio: avg > 0 ? recent / avg : 0, avg, current: recent };
  },

  // NEW: Time of day check
  checkTime(timestampSec=null) {
    const refMs = timestampSec != null ? timestampSec * 1000 : Date.now();
    const ist = this.getISTParts(refMs);
    const mins = ist.hour * 60 + ist.minute;
    if (mins < 555) return { zone: 'PRE', warn: 'Market not open yet', safe: false };         // Before 9:15
    if (mins < 570) return { zone: 'TRAP', warn: '9:15-9:30 danger zone — avoid new trades', safe: false }; // 9:15-9:30
    if (mins < 870) return { zone: 'SAFE', warn: '', safe: true };                              // 9:30-2:30
    if (mins < 900) return { zone: 'LATE', warn: 'Avoid new trades — close positions before 3:00', safe: false }; // 2:30-3:00
    if (mins <= 930) return { zone: 'CLOSE', warn: 'Market closing — exit all intraday positions', safe: false }; // 3:00-3:30
    return { zone: 'CLOSED', warn: 'Market is closed', safe: false };
  },

  // ===== NIFTY REGIME CLASSIFIER (Phase 4) =====
  classifyMarketRegime(niftyCloses) {
    if (!niftyCloses || niftyCloses.length < 25) return { regime: 'UNKNOWN', desc: 'Insufficient data' };
    const ema21 = this.calcEMA(niftyCloses, 21);
    const adx = this.calcADX(
      niftyCloses.map((c, i) => i > 0 ? Math.max(c, niftyCloses[i-1]) : c), // approx highs
      niftyCloses.map((c, i) => i > 0 ? Math.min(c, niftyCloses[i-1]) : c), // approx lows
      niftyCloses, 14
    );
    const lastAdx = adx.adx;
    const e21 = ema21.filter(v => v != null);
    const emaSlope = e21.length >= 6 ? e21[e21.length - 1] - e21[e21.length - 6] : 0;

    if (lastAdx > 25 && emaSlope > 0) return { regime: 'TRENDING_UP', desc: `Nifty trending UP (ADX ${lastAdx.toFixed(0)})` };
    if (lastAdx > 25 && emaSlope < 0) return { regime: 'TRENDING_DOWN', desc: `Nifty trending DOWN (ADX ${lastAdx.toFixed(0)})` };
    return { regime: 'CHOPPY', desc: `Nifty choppy/sideways (ADX ${lastAdx.toFixed(0)})` };
  },

  // ===== VIX DYNAMIC POSITION SIZING (Phase 4) =====
  getVixAdjustment(vixValue) {
    if (vixValue > CONFIG.VIX_EXTREME) return { sizeMult: 0, atrMult: 0, blocked: true, desc: 'VIX > 25 — NO TRADE' };
    if (vixValue > CONFIG.VIX_HIGH) return { sizeMult: 0.5, atrMult: 2.0, blocked: false, desc: 'VIX 20-25 — 50% size, 2x ATR stop' };
    if (vixValue > CONFIG.VIX_WARNING) return { sizeMult: 0.7, atrMult: 1.5, blocked: false, desc: 'VIX 17-20 — 70% size, 1.5x ATR stop' };
    if (vixValue > 13) return { sizeMult: 1.0, atrMult: 1.2, blocked: false, desc: 'VIX 13-17 — Normal size, 1.2x ATR stop' };
    return { sizeMult: 1.0, atrMult: 1.0, blocked: false, desc: 'VIX < 13 — Normal conditions' };
  },

  // ===== OPENING RANGE BREAKOUT (Phase 4) =====
  calcOpeningRange(timestamps1m, highs1m, lows1m, vols1m) {
    if (!timestamps1m || timestamps1m.length < 5) return null;
    let orbHigh = -Infinity, orbLow = Infinity, totalVol = 0, orbCount = 0;
    for (let i = 0; i < timestamps1m.length; i++) {
      const ist = this.getISTParts(timestamps1m[i] * 1000);
      if (ist.hour === 9 && ist.minute >= 15 && ist.minute < 30) {
        if (highs1m[i] != null) orbHigh = Math.max(orbHigh, highs1m[i]);
        if (lows1m[i] != null) orbLow = Math.min(orbLow, lows1m[i]);
        if (vols1m[i] != null) totalVol += vols1m[i];
        orbCount++;
      }
    }
    if (orbCount < 3 || !isFinite(orbHigh) || !isFinite(orbLow)) return null;
    return { high: orbHigh, low: orbLow, avgVol: totalVol / orbCount, range: orbHigh - orbLow };
  },

  // ===== MAIN ANALYSIS — v5 Regime-Aware =====
  analyze(timestamps, closes5m, highs5m, lows5m, vols5m, price, trend15m, niftyTrend, prevDayData, vixValue, opts={}) {
    const n = closes5m.length;
    if (n < 30) return null;

    const warnings = [];
    const analysisTime = opts.timestamp != null ? opts.timestamp : timestamps[n - 1];
    const timeCheck = this.checkTime(analysisTime);
    if (!timeCheck.safe) warnings.push(timeCheck.warn);

    const volCheck = this.checkVolume(vols5m);
    if (!volCheck.ok) warnings.push('Low volume (' + volCheck.ratio.toFixed(1) + 'x avg) — signals unreliable');

    if (trend15m === 'DOWN') warnings.push('15-min trend BEARISH');
    else if (trend15m === 'UP') warnings.push('15-min trend BULLISH');
    if (niftyTrend === 'DOWN') warnings.push('NIFTY 50 falling');
    else if (niftyTrend === 'UP') warnings.push('NIFTY 50 rising');
    if (vixValue > 20) warnings.push('VIX > 20 — High fear, reduce size');

    // === INDICATORS ===
    const vwap = this.calcVWAP(timestamps, closes5m, vols5m, highs5m, lows5m);
    const vwapVal = vwap.filter(v => v != null).pop() || price;
    const vwapSignal = price > vwapVal ? 'BUY' : 'SELL';
    const vwapDesc = price > vwapVal ? 'Above VWAP — buyers control' : 'Below VWAP — sellers control';

    const rsiArr = this.calcRSI(closes5m, 14);
    const rsi = rsiArr.filter(v => v != null).pop() || 50;

    const st = this.calcSupertrend(highs5m, lows5m, closes5m);
    const stDir = st.direction.filter(v => v !== 0).pop() || 0;
    const stVal = st.values.filter(v => v != null).pop() || 0;
    const stSignal = stDir === 1 ? 'BUY' : 'SELL';
    let stDesc = stDir === 1 ? 'Supertrend bullish' : 'Supertrend bearish';

    const boll = this.calcBollinger(closes5m);
    const bU = boll.upper.filter(v => v != null).pop() || 0;
    const bL = boll.lower.filter(v => v != null).pop() || 0;

    const adx = this.calcADX(highs5m, lows5m, closes5m);

    // EMA 9/21 crossover
    const ema9 = this.calcEMA(closes5m, 9);
    const ema21 = this.calcEMA(closes5m, 21);
    const e9 = ema9.filter(v => v != null).pop() || 0;
    const e21 = ema21.filter(v => v != null).pop() || 0;
    const emaSignal = e9 > e21 ? 'BUY' : 'SELL';
    const emaDesc = e9 > e21 ? 'EMA9 > EMA21 — momentum up' : 'EMA9 < EMA21 — momentum down';

    // === 3-ZONE ADX REGIME ===
    let regime, regimeDesc;
    if (adx.adx > CONFIG.ADX_STRONG_TREND) { regime = 'TRENDING'; regimeDesc = 'Strong Trend (ADX ' + adx.adx.toFixed(0) + ')'; }
    else if (adx.adx >= CONFIG.ADX_WEAK_TREND) { regime = 'WEAK'; regimeDesc = 'Weak Trend (ADX ' + adx.adx.toFixed(0) + ')'; }
    else { regime = 'RANGING'; regimeDesc = 'Sideways (ADX ' + adx.adx.toFixed(0) + ')'; }

    // === SCORE SYSTEM (0-5) — 5 Core Indicators, each +1 ===
    let buyVotes = 0, sellVotes = 0;
    const indicators = [];

    // 1. VWAP (+1)
    if (vwapSignal === 'BUY') buyVotes++; else sellVotes++;
    indicators.push({ name: 'VWAP', value: '\u20B9' + vwapVal.toFixed(2), signal: vwapSignal, desc: vwapDesc, vote: vwapSignal });

    // 2. RSI(14) (+1)
    let rsiSignal = 'NEUTRAL', rsiDesc = 'RSI neutral zone';
    if (regime === 'TRENDING' || regime === 'WEAK') {
      if (rsi > CONFIG.RSI_TREND_BUY) { rsiSignal = 'BUY'; rsiDesc = 'RSI > ' + CONFIG.RSI_TREND_BUY + ' confirms up'; buyVotes++; }
      else if (rsi < CONFIG.RSI_TREND_SELL) { rsiSignal = 'SELL'; rsiDesc = 'RSI < ' + CONFIG.RSI_TREND_SELL + ' confirms down'; sellVotes++; }
    } else {
      if (rsi < CONFIG.RSI_RANGE_OVERSOLD) { rsiSignal = 'BUY'; rsiDesc = 'Oversold — bounce likely'; buyVotes++; }
      else if (rsi > CONFIG.RSI_RANGE_OVERBOUGHT) { rsiSignal = 'SELL'; rsiDesc = 'Overbought — drop likely'; sellVotes++; }
    }
    indicators.push({ name: 'RSI (14)', value: rsi.toFixed(1), signal: rsiSignal, desc: rsiDesc, vote: rsiSignal });

    // 3. Supertrend (+1) — NEW: promoted from context to core vote
    if (stSignal === 'BUY') buyVotes++; else sellVotes++;
    indicators.push({ name: 'Supertrend', value: '\u20B9' + stVal.toFixed(2), signal: stSignal, desc: stDesc, vote: stSignal });

    // 4. 15-Min Trend (+1)
    let t15Signal = 'NEUTRAL', t15Desc = 'No 15m trend data';
    if (trend15m === 'UP') { t15Signal = 'BUY'; t15Desc = '15m trend UP'; buyVotes++; }
    else if (trend15m === 'DOWN') { t15Signal = 'SELL'; t15Desc = '15m trend DOWN'; sellVotes++; }
    indicators.push({ name: '15m Trend', value: trend15m || '--', signal: t15Signal, desc: t15Desc, vote: t15Signal });

    // 5. Nifty Alignment (+1)
    let niftySignal = 'NEUTRAL', niftyDesc = 'No Nifty data';
    if (niftyTrend === 'UP') { niftySignal = 'BUY'; niftyDesc = 'Nifty rising'; buyVotes++; }
    else if (niftyTrend === 'DOWN') { niftySignal = 'SELL'; niftyDesc = 'Nifty falling'; sellVotes++; }
    indicators.push({ name: 'Nifty 50', value: niftyTrend || '--', signal: niftySignal, desc: niftyDesc, vote: niftySignal });

    // 6. Sector Index Alignment (+1 bonus vote) — Phase 4
    const sectorTrend = opts.sectorTrend || null;
    let sectorSignal = 'NEUTRAL', sectorDesc = 'No sector data';
    if (sectorTrend === 'UP') { sectorSignal = 'BUY'; sectorDesc = 'Sector index rising'; buyVotes++; }
    else if (sectorTrend === 'DOWN') { sectorSignal = 'SELL'; sectorDesc = 'Sector index falling'; sellVotes++; }
    if (sectorTrend) indicators.push({ name: 'Sector', value: sectorTrend, signal: sectorSignal, desc: sectorDesc, vote: sectorSignal });

    // Context Indicators (Not Votes — supplementary info)
    let bollSignal = 'NEUTRAL', bollDesc = 'Within bands';
    if (regime === 'RANGING') {
      if (price <= bL * 1.005) { bollSignal = 'BUY'; bollDesc = 'At lower band — bounce'; }
      else if (price >= bU * 0.995) { bollSignal = 'SELL'; bollDesc = 'At upper band — reversal'; }
    }
    indicators.push({ name: 'Bollinger', value: '\u20B9' + bL.toFixed(0) + ' - ' + bU.toFixed(0), signal: bollSignal, desc: bollDesc, vote: bollSignal });

    // === CONFIDENCE SCORE (0-100) ===
    const totalVotes = buyVotes + sellVotes;
    const dominantSide = buyVotes >= sellVotes ? 'BUY' : 'SELL';
    const dominantVotes = Math.max(buyVotes, sellVotes);

    let confidence = 0;
    // Base: agreement ratio (max 35 pts)
    confidence += totalVotes > 0 ? (dominantVotes / totalVotes) * 35 : 0;
    // ADX clarity (max 15 pts)
    if (adx.adx > 30) confidence += 15;
    else if (adx.adx > CONFIG.ADX_STRONG_TREND) confidence += 12;
    else if (adx.adx < CONFIG.ADX_WEAK_TREND) confidence += 8;
    else confidence += 5;
    // Volume confirmation (max 15 pts)
    if (volCheck.ratio >= 2) confidence += 15;
    else if (volCheck.ratio >= CONFIG.VOL_CONFIRM_RATIO) confidence += 12;
    else if (volCheck.ratio >= CONFIG.VOL_TRADE_GATE) confidence += 6;
    else confidence += 3;
    // Nifty/15m alignment (max 20 pts)
    if ((dominantSide === 'BUY' && niftyTrend === 'UP') || (dominantSide === 'SELL' && niftyTrend === 'DOWN')) confidence += 10;
    else if (niftyTrend === null) confidence += 5;
    if ((dominantSide === 'BUY' && trend15m === 'UP') || (dominantSide === 'SELL' && trend15m === 'DOWN')) confidence += 10;
    else if (trend15m === null) confidence += 5;
    // Supertrend alignment bonus (max 5 pts)
    if ((dominantSide === 'BUY' && stSignal === 'BUY') || (dominantSide === 'SELL' && stSignal === 'SELL')) confidence += 5;
    // Time safety (max 10 pts)
    if (timeCheck.safe) confidence += 10;
    else if (timeCheck.zone === 'LATE') confidence += 5;

    // VIX penalty (graduated)
    if (vixValue > CONFIG.VIX_EXTREME) confidence = Math.max(0, confidence - 25);
    else if (vixValue > CONFIG.VIX_HIGH) confidence = Math.max(0, confidence - 15);
    else if (vixValue > CONFIG.VIX_WARNING) confidence = Math.max(0, confidence - 5);

    confidence = Math.min(100, Math.round(confidence));

    // === FINAL VERDICT (5-indicator system) ===
    let overall, overallClass, verdictReason;
    if (confidence >= CONFIG.CONF_STRONG && dominantVotes >= CONFIG.VOTES_STRONG) {
      overall = dominantSide === 'BUY' ? 'STRONG BUY' : 'STRONG SELL';
      overallClass = dominantSide === 'BUY' ? 'strong-buy' : 'strong-sell';
      verdictReason = dominantVotes + '/5 core indicators agree. Very high confidence.';
    } else if (confidence >= CONFIG.CONF_NORMAL && dominantVotes >= CONFIG.VOTES_NORMAL) {
      overall = dominantSide;
      overallClass = dominantSide.toLowerCase();
      verdictReason = dominantVotes + '/5 core indicators agree. Good confidence.';
    } else {
      overall = 'NEUTRAL';
      overallClass = 'neutral';
      verdictReason = 'Only ' + dominantVotes + '/5 agree (confidence ' + confidence + '%). WAIT.';
    }

    // Pivots
    let pivots = null;
    if (prevDayData) pivots = this.calcPivotPoints(prevDayData.high, prevDayData.low, prevDayData.close);

    const atr = this.calcATR(highs5m, lows5m, closes5m);
    const atrVal = atr.filter(v => v != null).pop() || (price * 0.005);
    const setup = this.classifySetup(price, vwapVal, e9, e21, rsi, regime, dominantSide, pivots);

    // === HARD FILTERS (relaxed, data-driven) ===
    if (overall !== 'NEUTRAL') {
      if (adx.adx < CONFIG.ADX_TRADE_GATE) {
        overall = 'NEUTRAL';
        overallClass = 'neutral';
        verdictReason = 'BLOCKED: ADX < ' + CONFIG.ADX_TRADE_GATE + ' (' + adx.adx.toFixed(1) + '). No clear trend.';
      } else if (overall.includes('BUY') && rsi > CONFIG.RSI_BLOCK_OVERBOUGHT) {
        overall = 'NEUTRAL';
        overallClass = 'neutral';
        verdictReason = 'BLOCKED: RSI > ' + CONFIG.RSI_BLOCK_OVERBOUGHT + ' (' + rsi.toFixed(1) + '). Overbought.';
      } else if (overall.includes('SELL') && rsi < CONFIG.RSI_BLOCK_OVERSOLD) {
        overall = 'NEUTRAL';
        overallClass = 'neutral';
        verdictReason = 'BLOCKED: RSI < ' + CONFIG.RSI_BLOCK_OVERSOLD + ' (' + rsi.toFixed(1) + '). Oversold.';
      } else if (volCheck.ratio < CONFIG.VOL_TRADE_GATE) {
        overall = 'NEUTRAL';
        overallClass = 'neutral';
        verdictReason = 'BLOCKED: Low volume (' + volCheck.ratio.toFixed(1) + 'x). Need >= ' + CONFIG.VOL_TRADE_GATE + 'x avg.';
      }
    }

    // VIX extreme block (Phase 4 — dynamic)
    const vixAdj = this.getVixAdjustment(vixValue);
    if (vixAdj.blocked && overall !== 'NEUTRAL') {
      overall = 'NEUTRAL';
      overallClass = 'neutral';
      verdictReason = 'BLOCKED: ' + vixAdj.desc;
    }

    // Nifty Regime Filter (Phase 4) — gate counter-trend setups
    const niftyRegime = opts.niftyRegime || null;
    if (niftyRegime && overall !== 'NEUTRAL') {
      if (niftyRegime.regime === 'CHOPPY') {
        const allowed = ['Support Reversal', 'Resistance Reversal'];
        // In classifySetup we already computed the setup — check it after
      }
    }

    // Both BUY/SELL and STRONG BUY/SELL now generate trade plans
    const shouldTrade = overall !== 'NEUTRAL';
    const action = shouldTrade ? overall.replace('STRONG ', '') : 'NO TRADE';
    const invalidation = shouldTrade
      ? dominantSide === 'BUY'
        ? Math.min(vwapVal, stVal || price, pivots?.pivot ?? price - atrVal)
        : Math.max(vwapVal, stVal || price, pivots?.pivot ?? price + atrVal)
      : null;
    const invalidationLabel = shouldTrade ? (dominantSide === 'BUY' ? 'Invalid below' : 'Invalid above') : null;

    return {
      overall, overallClass, confidence, verdictReason,
      buyVotes, sellVotes, dominantSide, regime, regimeDesc,
      strategies: indicators,
      warnings, atr: atrVal, vwap: vwapVal, supertrend: stVal, supertrendDir: stDir,
      volumeOk: volCheck.ok, volRatio: volCheck.ratio, timeZone: timeCheck.zone, adxValue: adx.adx, pivots,
      action, shouldTrade, setup, invalidation, invalidationLabel
    };
  },

  // ===== ENTRY/EXIT CALCULATOR (1.5:1 and 3:1 R:R) — Phase 4: VIX-aware =====
  calcEntryExit(price, atr, signal, pivots, capital=100000, riskPct=1, vixValue=0, prevClose=null) {
    if (signal !== 'BUY' && signal !== 'STRONG BUY' && signal !== 'SELL' && signal !== 'STRONG SELL') return null;
    const isBuy = signal === 'BUY' || signal === 'STRONG BUY';

    // Define circuit boundaries (assuming a standard 20% max circuit if prevClose exists)
    // You can adjust the 0.20 if specific stocks have 5% or 10% circuits.
    const upperCircuit = prevClose ? prevClose * 1.20 : Infinity;
    const lowerCircuit = prevClose ? prevClose * 0.80 : 0;

    // VIX-dynamic ATR multiplier for stop loss
    const vixAdj = this.getVixAdjustment(vixValue);
    const atrMult = CONFIG.SL_ATR_MULT * vixAdj.atrMult;

    let sl = isBuy ? price - atrMult * atr : price + atrMult * atr;
    if (pivots) {
      if (isBuy && price > pivots.pivot && price - pivots.pivot < 2.5 * atr) sl = Math.min(sl, pivots.pivot - atr * 0.5);
      else if (!isBuy && price < pivots.pivot && pivots.pivot - price < 2.5 * atr) sl = Math.max(sl, pivots.pivot + atr * 0.5);
    }

    // Apply circuit limit ceilings to Stop Loss before risk calculation
    if (isBuy) {
      sl = Math.max(sl, lowerCircuit);
    } else {
      sl = Math.min(sl, upperCircuit);
    }

    const risk = Math.abs(price - sl);
    const riskBudget = capital * (riskPct / 100);
    // VIX-dynamic position sizing
    let qty = Math.max(1, Math.floor(riskBudget / Math.max(risk, 0.01)));
    qty = Math.max(1, Math.round(qty * vixAdj.sizeMult));

    let t1 = isBuy ? price + CONFIG.TARGET_1_MULT * risk : price - CONFIG.TARGET_1_MULT * risk;
    let t2 = isBuy ? price + CONFIG.TARGET_2_MULT * risk : price - CONFIG.TARGET_2_MULT * risk;
    let t3 = isBuy ? price + CONFIG.TARGET_3_MULT * risk : price - CONFIG.TARGET_3_MULT * risk;
    if (pivots) {
      if (isBuy) {
        if (t1 < pivots.r1 && price < pivots.r1) t1 = pivots.r1;
        if (t2 < pivots.r2 && price < pivots.r2) t2 = pivots.r2;
      } else {
        if (t1 > pivots.s1 && price > pivots.s1) t1 = pivots.s1;
        if (t2 > pivots.s2 && price > pivots.s2) t2 = pivots.s2;
      }
    }

    // Apply circuit limit ceilings to Targets
    if (isBuy) {
      t1 = Math.min(t1, upperCircuit);
      t2 = Math.min(t2, upperCircuit);
      t3 = Math.min(t3, upperCircuit);
    } else {
      t1 = Math.max(t1, lowerCircuit);
      t2 = Math.max(t2, lowerCircuit);
      t3 = Math.max(t3, lowerCircuit);
    }

    return {
      type: isBuy ? 'BUY' : 'SELL', entry: price, sl: +sl.toFixed(2), risk: +risk.toFixed(2),
      target1: +t1.toFixed(2), target2: +t2.toFixed(2), target3: +t3.toFixed(2),
      bookProfit: +t1.toFixed(2), stretchTarget: +t2.toFixed(2),
      qty, capital, riskPct, riskBudget: +riskBudget.toFixed(2), positionValue: +(qty * price).toFixed(2),
      vixDesc: vixAdj.desc, vixSizeMult: vixAdj.sizeMult
    };
  },

  // ===== 15-MIN TREND =====
  get15mTrend(closes15m) {
    if (!closes15m || closes15m.length < 20) return null;
    const sma20 = this.calcSMA(closes15m, 20);
    const s20 = sma20.filter(v => v != null).pop();
    const current = closes15m[closes15m.length - 1];
    if (!s20 || !current) return null;
    return current > s20 ? 'UP' : 'DOWN';
  },

  // ===== NIFTY TREND =====
  getNiftyTrend(closes) {
    if (!closes || closes.length < 25) return null;
    const ema9 = this.calcEMA(closes, 9), ema21 = this.calcEMA(closes, 21);
    const e9 = ema9.filter(v => v != null).pop(), e21 = ema21.filter(v => v != null).pop();
    if (!e9 || !e21) return null;
    return e9 > e21 ? 'UP' : 'DOWN';
  },

  // ===== IMMEDIATE ACTION ENGINE (1-Min Data) =====
  analyzeImmediateAction(timestamps1m, opens1m, closes1m, highs1m, lows1m, vols1m, currentPrice, vwap, pivots, dayHigh, dayLow) {
    if (!closes1m || closes1m.length < 5) return null;
    const n = closes1m.length;
    
    // Use the real candle open when available; fall back to prior close.
    const c0 = closes1m[n-1], o0 = opens1m?.[n-1] ?? closes1m[n-2], h0 = highs1m[n-1], l0 = lows1m[n-1], v0 = vols1m[n-1] || 0;
    const isBullishCandle = c0 > o0;
    const isBearishCandle = c0 < o0;
    
    // 1. Volume Anomaly (Spike Detection)
    let avgVol = 0;
    const volPeriod = Math.min(20, n);
    for(let i = n - volPeriod; i < n - 1; i++) avgVol += (vols1m[i] || 0);
    avgVol = avgVol / (volPeriod - 1) || 1;
    const isVolumeSpike = v0 > avgVol * 3; // 300% volume spike
    
    // 2. Proximity to Key Levels (0.1% buffer)
    const buffer = currentPrice * 0.001;
    let nearLevel = null;
    let bounceType = null; // 'SUPPORT' or 'RESISTANCE'
    
    if (dayHigh && Math.abs(currentPrice - dayHigh) <= buffer) {
      nearLevel = 'DAY HIGH';
      bounceType = 'RESISTANCE';
    } else if (dayLow && Math.abs(currentPrice - dayLow) <= buffer) {
      nearLevel = 'DAY LOW';
      bounceType = 'SUPPORT';
    } else if (vwap && Math.abs(currentPrice - vwap) <= buffer) {
      nearLevel = 'VWAP';
      bounceType = currentPrice >= vwap ? 'SUPPORT' : 'RESISTANCE';
    } else if (pivots) {
      const levels = [
        {name: 'Pivot', val: pivots.pivot}, {name: 'R1', val: pivots.r1}, {name: 'R2', val: pivots.r2},
        {name: 'S1', val: pivots.s1}, {name: 'S2', val: pivots.s2}
      ];
      for (const lvl of levels) {
        if (Math.abs(currentPrice - lvl.val) <= buffer) {
          nearLevel = lvl.name;
          bounceType = currentPrice >= lvl.val ? 'SUPPORT' : 'RESISTANCE';
          break;
        }
      }
    }

    // 3. Evaluate Setup
    let action = 'WAIT';
    let msg = 'Price is floating. Wait for a setup at key levels.';
    let intensity = 0; // 0: None, 1: Info, 2: Alert, 3: Action

    if (nearLevel) {
      if (isVolumeSpike) {
        if (nearLevel === 'DAY HIGH' && isBullishCandle) {
          action = 'BUY TRIGGER';
          msg = `🚀 DAY HIGH BREAKOUT: Massive volume pushing through the high of the day!`;
          intensity = 3;
        } else if (nearLevel === 'DAY LOW' && isBearishCandle) {
          action = 'SELL TRIGGER';
          msg = `🩸 DAY LOW BREAKDOWN: Massive volume crashing through the low of the day!`;
          intensity = 3;
        } else if (isBullishCandle && bounceType === 'SUPPORT') {
          action = 'BUY TRIGGER';
          msg = `🔥 BUYERS STEPPING IN: Strong volume rejection at ${nearLevel} support.`;
          intensity = 3;
        } else if (isBearishCandle && bounceType === 'RESISTANCE') {
          action = 'SELL TRIGGER';
          msg = `🚨 SELLERS STEPPING IN: Strong volume rejection at ${nearLevel} resistance.`;
          intensity = 3;
        } else if (isBullishCandle && bounceType === 'RESISTANCE') {
          action = 'ALERT';
          msg = `⚡ BREAKOUT ATTEMPT: High volume pushing against ${nearLevel} resistance. Watch for close above.`;
          intensity = 2;
        } else if (isBearishCandle && bounceType === 'SUPPORT') {
          action = 'ALERT';
          msg = `⚠️ BREAKDOWN WARNING: High volume pushing against ${nearLevel} support. Watch for close below.`;
          intensity = 2;
        }
      } else {
        msg = `👀 Watching ${nearLevel}: Price is testing ${nearLevel} ${bounceType}. Wait for volume confirmation.`;
        intensity = 1;
      }
    } else if (isVolumeSpike) {
      action = 'ALERT';
      msg = `💨 SUDDEN MOMENTUM: Volume spike detected (${(v0/avgVol).toFixed(1)}x avg), but not at a key level. Scalp with caution.`;
      intensity = 2;
    }

    return { action, msg, intensity, isVolumeSpike, nearLevel };
  },

  getSeriesSliceAtOrBefore(raw, timestampSec) {
    if (!raw || !raw.timestamp || !raw.indicators || !raw.indicators.quote || !raw.indicators.quote[0]) return [];
    const closes = raw.indicators.quote[0].close || [];
    const out = [];
    for (let i = 0; i < raw.timestamp.length; i++) {
      if (raw.timestamp[i] > timestampSec) break;
      if (closes[i] != null) out.push(closes[i]);
    }
    return out;
  },

  getValueAtOrBefore(raw, timestampSec) {
    if (!raw || !raw.timestamp || !raw.indicators || !raw.indicators.quote || !raw.indicators.quote[0]) return 0;
    const closes = raw.indicators.quote[0].close || [];
    let value = 0;
    for (let i = 0; i < raw.timestamp.length; i++) {
      if (raw.timestamp[i] > timestampSec) break;
      if (closes[i] != null) value = closes[i];
    }
    return value || 0;
  },

  getPrevDayDataAt(timestamps, highs, lows, closes, index) {
    if (!timestamps || index <= 0) return null;
    const currentDay = this.getISTDayKey(timestamps[index]);
    let prevDay = null;
    let high = -Infinity, low = Infinity, close = null;
    for (let i = index - 1; i >= 0; i--) {
      const dayKey = this.getISTDayKey(timestamps[i]);
      if (dayKey === currentDay) continue;
      if (prevDay === null) prevDay = dayKey;
      if (dayKey !== prevDay) break;
      if (highs[i] != null) high = Math.max(high, highs[i]);
      if (lows[i] != null) low = Math.min(low, lows[i]);
      if (close == null && closes[i] != null) close = closes[i];
    }
    if (prevDay === null || !isFinite(high) || !isFinite(low) || close == null) return null;
    return { high, low, close };
  },

  calcTradingCosts(entry, exit, qty=1, slippageBps=2) {
    // Slippage (retained for realism, typically 2bps)
    const slippage = ((entry + exit) * qty * slippageBps) / 10000;
    
    // NSE Intraday Cost Model
    const buyVal = entry * qty;
    const sellVal = exit * qty;
    const turnover = buyVal + sellVal;

    // 1. Brokerage: Rs 20 or 0.03% whichever is lower (per side)
    const buyBrokerage = Math.min(20, buyVal * 0.0003);
    const sellBrokerage = Math.min(20, sellVal * 0.0003);
    const totalBrokerage = buyBrokerage + sellBrokerage;

    // 2. STT: 0.025% on sell side only for intraday
    const stt = Math.round(sellVal * 0.00025);

    // 3. Exchange Transaction Charges (NSE): 0.00325% on turnover
    const excChg = turnover * 0.0000325;

    // 4. GST: 18% on (Brokerage + Exchange Charges)
    const gst = (totalBrokerage + excChg) * 0.18;

    // 5. SEBI Levy: Rs 10 per crore (0.0001%) on turnover
    const sebi = turnover * 0.000001;

    // 6. Stamp Duty: 0.003% on buy side only
    const stamp = Math.round(buyVal * 0.00003);

    const exactFees = totalBrokerage + stt + excChg + gst + sebi + stamp;
    
    return +(slippage + exactFees).toFixed(2);
  },

  backtestStrategy(raw5m, raw15m, rawNifty, rawVix) {
    if (!raw5m || !raw5m.timestamp || !raw5m.indicators || !raw5m.indicators.quote || !raw5m.indicators.quote[0]) return null;
    const q5 = raw5m.indicators.quote[0];
    const timestamps = raw5m.timestamp || [];
    const opens = q5.open || [];
    const highs = q5.high || [];
    const lows = q5.low || [];
    const closes = q5.close || [];
    const volumes = q5.volume || [];
    if (timestamps.length < 60) return null;

    const trades = [];
    let equity = 0, peak = 0, maxDrawdown = 0;

    for (let i = 30; i < timestamps.length - 1; i++) {
      const candleTime = timestamps[i];
      if (!this.checkTime(candleTime).safe) continue;

      const prevDayData = this.getPrevDayDataAt(timestamps, highs, lows, closes, i);
      if (!prevDayData) continue;

      const trend15m = this.get15mTrend(this.getSeriesSliceAtOrBefore(raw15m, candleTime));
      const niftyTrend = this.getNiftyTrend(this.getSeriesSliceAtOrBefore(rawNifty, candleTime));
      const vixValue = this.getValueAtOrBefore(rawVix, candleTime);
      const analysis = this.analyze(
        timestamps.slice(0, i + 1),
        closes.slice(0, i + 1),
        highs.slice(0, i + 1),
        lows.slice(0, i + 1),
        volumes.slice(0, i + 1),
        closes[i],
        trend15m,
        niftyTrend,
        prevDayData,
        vixValue,
        { timestamp: candleTime }
      );

      if (!analysis || !['BUY', 'SELL', 'STRONG BUY', 'STRONG SELL'].includes(analysis.overall)) continue;

      const entryPrice = opens[i + 1] ?? closes[i + 1];
      if (entryPrice == null) continue;
      const setup = this.calcEntryExit(entryPrice, analysis.atr, analysis.overall, analysis.pivots, 100000, 1, vixValue);
      if (!setup) continue;

      const entryDay = this.getISTDayKey(timestamps[i + 1]);
      let exitPrice = closes[i + 1] ?? entryPrice;
      let exitReason = 'EOD';
      let exitIndex = i + 1;

      for (let j = i + 1; j < timestamps.length; j++) {
        const dayKey = this.getISTDayKey(timestamps[j]);
        if (dayKey !== entryDay) {
          exitIndex = Math.max(i + 1, j - 1);
          exitPrice = closes[exitIndex] ?? opens[exitIndex] ?? setup.entry;
          exitReason = 'EOD';
          break;
        }

        const candleHigh = highs[j] ?? closes[j];
        const candleLow = lows[j] ?? closes[j];
        const candleClose = closes[j] ?? opens[j] ?? setup.entry;
        const timeState = this.checkTime(timestamps[j]);

        if (setup.type === 'BUY') {
          if (candleLow <= setup.sl) {
            exitPrice = setup.sl;
            exitReason = 'SL';
            exitIndex = j;
            break;
          }
          if (candleHigh >= setup.bookProfit) {
            exitPrice = setup.bookProfit;
            exitReason = 'TARGET';
            exitIndex = j;
            break;
          }
        } else {
          if (candleHigh >= setup.sl) {
            exitPrice = setup.sl;
            exitReason = 'SL';
            exitIndex = j;
            break;
          }
          if (candleLow <= setup.bookProfit) {
            exitPrice = setup.bookProfit;
            exitReason = 'TARGET';
            exitIndex = j;
            break;
          }
        }

        if (timeState.zone === 'LATE' || timeState.zone === 'CLOSE') {
          exitPrice = candleClose;
          exitReason = 'TIME';
          exitIndex = j;
          break;
        }

        exitPrice = candleClose;
        exitIndex = j;
      }

      const grossPnl = setup.type === 'BUY' ? exitPrice - setup.entry : setup.entry - exitPrice;
      const costs = this.calcTradingCosts(setup.entry, exitPrice, 1);
      const netPnl = +(grossPnl - costs).toFixed(2);
      equity += netPnl;
      peak = Math.max(peak, equity);
      maxDrawdown = Math.max(maxDrawdown, peak - equity);

      trades.push({
        side: setup.type,
        setupName: analysis.setup.name,
        entryTime: timestamps[i + 1],
        exitTime: timestamps[exitIndex],
        entry: +setup.entry.toFixed(2),
        exit: +(+exitPrice).toFixed(2),
        sl: setup.sl,
        target: setup.bookProfit,
        confidence: analysis.confidence,
        reason: exitReason,
        grossPnl: +grossPnl.toFixed(2),
        costs,
        netPnl
      });

      i = exitIndex;
    }

    const sampleDays = new Set(timestamps.map(ts => this.getISTDayKey(ts))).size;
    if (!trades.length) {
      return {
        summary: {
          trades: 0, wins: 0, losses: 0, winRate: 0, grossPnl: 0, netPnl: 0, avgWin: 0, avgLoss: 0,
          profitFactor: 0, expectancy: 0, maxDrawdown: 0, targetsHit: 0, stopsHit: 0, timedExits: 0,
          longTrades: 0, shortTrades: 0, sampleDays
        },
        trades: []
      };
    }

    const wins = trades.filter(t => t.netPnl > 0);
    const losses = trades.filter(t => t.netPnl <= 0);
    const grossProfit = wins.reduce((sum, trade) => sum + trade.netPnl, 0);
    const grossLoss = losses.reduce((sum, trade) => sum + Math.abs(trade.netPnl), 0);

    return {
      summary: {
        trades: trades.length,
        wins: wins.length,
        losses: losses.length,
        winRate: +(wins.length / trades.length * 100).toFixed(1),
        grossPnl: +trades.reduce((sum, trade) => sum + trade.grossPnl, 0).toFixed(2),
        netPnl: +trades.reduce((sum, trade) => sum + trade.netPnl, 0).toFixed(2),
        avgWin: +(wins.length ? wins.reduce((sum, trade) => sum + trade.netPnl, 0) / wins.length : 0).toFixed(2),
        avgLoss: +(losses.length ? losses.reduce((sum, trade) => sum + trade.netPnl, 0) / losses.length : 0).toFixed(2),
        profitFactor: +(grossLoss ? grossProfit / grossLoss : grossProfit).toFixed(2),
        expectancy: +(trades.reduce((sum, trade) => sum + trade.netPnl, 0) / trades.length).toFixed(2),
        maxDrawdown: +maxDrawdown.toFixed(2),
        targetsHit: trades.filter(t => t.reason === 'TARGET').length,
        stopsHit: trades.filter(t => t.reason === 'SL').length,
        timedExits: trades.filter(t => t.reason === 'TIME' || t.reason === 'EOD').length,
        longTrades: trades.filter(t => t.side === 'BUY').length,
        shortTrades: trades.filter(t => t.side === 'SELL').length,
        sampleDays
      },
      trades
    };
  }
};

// ===== POSITION MANAGER =====
const Positions = {
  KEY: 'stockpulse_positions',
  getAll() { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; } },
  save(p) { localStorage.setItem(this.KEY, JSON.stringify(p)); },
  add(pos) { const all = this.getAll(); pos.id = Date.now().toString(36); pos.time = new Date().toISOString(); pos.status = 'OPEN'; pos.trailSL = pos.sl; all.push(pos); this.save(all); return pos; },
  remove(id) { this.save(this.getAll().filter(p => p.id !== id)); },
  getForSymbol(sym) { return this.getAll().filter(p => p.symbol === sym && p.status === 'OPEN'); },
  updateTrailSL(id, sl) { const a = this.getAll(), p = a.find(x => x.id === id); if (p) { p.trailSL = sl; this.save(a); } },
  close(id, exitPrice) { const a = this.getAll(), p = a.find(x => x.id === id); if (p) { p.status = 'CLOSED'; p.exitPrice = exitPrice; p.closedAt = new Date().toISOString(); this.save(a); } }
};

// ===== TRADE LOG =====
const TradeLog = {
  KEY: 'stockpulse_tradelog',
  getAll() { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; } },
  save(l) { localStorage.setItem(this.KEY, JSON.stringify(l)); },
  log(entry) { const all = this.getAll(); entry.timestamp = new Date().toISOString(); all.push(entry); if (all.length > 500) all.shift(); this.save(all); },
  getStats() {
    const all = this.getAll().filter(t => t.pnl !== undefined);
    if (!all.length) return null;
    const wins = all.filter(t => t.pnl > 0), losses = all.filter(t => t.pnl <= 0);
    const totalPnl = all.reduce((a, t) => a + t.pnl, 0);
    const avgWin = wins.length ? wins.reduce((a, t) => a + t.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length ? losses.reduce((a, t) => a + t.pnl, 0) / losses.length : 0;
    return { total: all.length, wins: wins.length, losses: losses.length, winRate: (wins.length / all.length * 100).toFixed(1), totalPnl: totalPnl.toFixed(2), avgWin: avgWin.toFixed(2), avgLoss: avgLoss.toFixed(2), logs: this.getAll() };
  }
};

export { Trading, CONFIG };
