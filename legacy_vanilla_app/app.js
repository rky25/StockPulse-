let currentSymbol='',refreshTimer=null,fastRefreshTimer=null,lastPrice=0,chartType='candle';
let selectedTimeframe = 1;
let rawData=null,raw5m=null,raw15m=null,rawNifty=null,rawVix=null,vixValue=0;
let analysisResult=null,calcResult=null,backtestResult=null;
let rawSector=null, orbData=null, niftyRegime=null;
let tvChart=null, tvCandleSeries=null, tvVolumeSeries=null, tvVwapLine=null;
let paperMode=false;
let activePriceLines = [];

// ===== CONNECTION STATUS =====
const MARKET_SECTORS = {
    'NIFTY 50': ['RELIANCE.NS','TCS.NS','HDFCBANK.NS','ICICIBANK.NS','INFY.NS','SBIN.NS','BHARTIARTL.NS','ITC.NS','HINDUNILVR.NS','LT.NS','BAJFINANCE.NS','AXISBANK.NS','KOTAKBANK.NS','MARUTI.NS','TATAMOTORS.NS','SUNPHARMA.NS','TITAN.NS','ASIANPAINT.NS','ULTRACEMCO.NS','HCLTECH.NS'],
    'Banking': ['HDFCBANK.NS','ICICIBANK.NS','SBIN.NS','AXISBANK.NS','KOTAKBANK.NS','INDUSINDBK.NS','PNB.NS','BANKBARODA.NS','FEDERALBNK.NS','IDFCFIRSTB.NS','AUBANK.NS'],
    'IT': ['TCS.NS','INFY.NS','HCLTECH.NS','WIPRO.NS','TECHM.NS','LTIM.NS','PERSISTENT.NS','COFORGE.NS','MPHASIS.NS'],
    'Auto': ['MARUTI.NS','TATAMOTORS.NS','M&M.NS','BAJAJ-AUTO.NS','HEROMOTOCO.NS','EICHERMOT.NS','TVSMOTOR.NS','ASHOKLEY.NS','BOSCHLTD.NS','MRF.NS'],
    'FMCG': ['ITC.NS','HINDUNILVR.NS','NESTLEIND.NS','BRITANNIA.NS','TATACONSUM.NS','GODREJCP.NS','DABUR.NS','MARICO.NS','COLPAL.NS','UBL.NS'],
    'Energy': ['RELIANCE.NS','ONGC.NS','NTPC.NS','POWERGRID.NS','COALINDIA.NS','TATAPOWER.NS','BPCL.NS','IOC.NS','GAIL.NS'],
    'Pharma': ['SUNPHARMA.NS','CIPLA.NS','DRREDDY.NS','DIVISLAB.NS','APOLLOHOSP.NS','LUPIN.NS','TORNTPHARM.NS','AUROPHARMA.NS','BIOCON.NS'],
    'Metal': ['TATASTEEL.NS','HINDALCO.NS','JSWSTEEL.NS','VEDL.NS','COALINDIA.NS','NMDC.NS','SAIL.NS','NATIONALUM.NS'],
    'Realty': ['DLF.NS','MACROTECH.NS','GODREJPROP.NS','OBEROIRLTY.NS','PRESTIGE.NS','PHOENIXLTD.NS'],
    'Media': ['ZEEL.NS','SUNTV.NS','PVRINOX.NS','NETWORK18.NS','TV18BRDCST.NS'],
    'Infra': ['LT.NS','ADANIPORTS.NS','GMRINFRA.NS','IRB.NS','KNRCON.NS','GRINFRA.NS','PNCINFRA.NS'],
    'PSU Bank': ['SBIN.NS','BANKBARODA.NS','PNB.NS','CANBK.NS','UNIONBANK.NS','INDIANB.NS','BANKINDIA.NS'],
    'FinSrv': ['BAJFINANCE.NS','BAJAJFINSV.NS','CHOLAFIN.NS','MUTHOOTFIN.NS','SHRIRAMFIN.NS','RECLTD.NS','PFC.NS','HDFCAMC.NS'],
    'Consumer': ['TITAN.NS','DIXON.NS','VOLTAS.NS','HAVELLS.NS','WHIRLPOOL.NS','BLUESTARCO.NS','CROMPTON.NS','KALYANKJIL.NS'],
    'Telecom': ['BHARTIARTL.NS','IDEA.NS','INDUSTOWER.NS','TATACOMM.NS','MTNL.NS','ROUTE.NS'],
    'Power': ['NTPC.NS','POWERGRID.NS','TATAPOWER.NS','JSWENERGY.NS','ADANIPOWER.NS','NHPC.NS','SJVN.NS','TORNTPOWER.NS']
};
let currentAppView = 'chart'; // 'chart', 'screener', 'scanner'
let allSymbolsList = [];
let analysisQueue = [];
let masterQuoteTimer = null;
let sniperTimer = null;
let scannerResults = { buys: [], sells: [] };
let scannerNiftyRaw = null;
let scannerContextPromise = null;

const dataStatus = { price: false, nifty: false, vix: false };
function updateStatusDot(source, ok) {
  dataStatus[source] = ok;
  const allOk = Object.values(dataStatus).every(Boolean);
  const someOk = Object.values(dataStatus).some(Boolean);
  const dot = document.getElementById('statusDot');
  const txt = document.getElementById('statusText');
  if (!dot || !txt) return;
  if (allOk) { dot.className = 'status-dot live'; txt.textContent = 'Live'; }
  else if (someOk) { dot.className = 'status-dot degraded'; txt.textContent = 'Degraded'; }
  else { dot.className = 'status-dot'; txt.textContent = 'Offline'; }
  const el = document.getElementById('dataStatus');
  if (el) el.title = `Price: ${dataStatus.price ? '✓' : '✗'} | Nifty: ${dataStatus.nifty ? '✓' : '✗'} | VIX: ${dataStatus.vix ? '✓' : '✗'}`;
}

// ===== PAPER TRADING MANAGER =====
const PaperTrade = {
  KEY: 'stockpulse_positions',
  getAll() { return typeof Positions !== 'undefined' ? Positions.getAll() : []; },
  save(t) { if (typeof Positions !== 'undefined') Positions.save(t); },
  add(trade) {
    const all = this.getAll();
    trade.id = Date.now().toString(36);
    trade.openedAt = new Date().toISOString();
    trade.status = 'OPEN';
    all.unshift(trade);
    if (all.length > 200) all.length = 200;
    this.save(all);
    return trade;
  },
  closeOpen(currentPrice) {
    const all = this.getAll();
    let changed = false;
    all.forEach(t => {
      if (t.status !== 'OPEN') return;
      const isBuy = t.type === 'BUY';
      // Check SL
      if ((isBuy && currentPrice <= t.sl) || (!isBuy && currentPrice >= t.sl)) {
        t.exitPrice = t.sl; t.exitReason = 'SL'; t.status = 'CLOSED'; t.closedAt = new Date().toISOString(); changed = true;
      }
      // Book profit at T1. T2/T3 stay as stretch targets for manual runners.
      else if ((isBuy && currentPrice >= t.target1) || (!isBuy && currentPrice <= t.target1)) {
        t.exitPrice = t.target1; t.exitReason = 'BOOK PROFIT'; t.status = 'CLOSED'; t.closedAt = new Date().toISOString(); changed = true;
      }
    });
    if (changed) this.save(all);
  },
  getStats() {
    const all = this.getAll();
    const closed = all.filter(t => t.status === 'CLOSED');
    if (!closed.length) return { total: 0, wins: 0, losses: 0, winRate: 0, netPnl: 0, expectancy: 0, maxDD: 0, openCount: all.filter(t => t.status === 'OPEN').length };
    let equity = 0, peak = 0, maxDD = 0;
    const wins = [], losses = [];
    closed.forEach(t => {
      const pnl = t.type === 'BUY' ? (t.exitPrice - t.entry) * (t.qty||1) : (t.entry - t.exitPrice) * (t.qty||1);
      t.pnl = pnl;
      pnl > 0 ? wins.push(pnl) : losses.push(pnl);
      equity += pnl; peak = Math.max(peak, equity); maxDD = Math.max(maxDD, peak - equity);
    });
    const netPnl = closed.reduce((s,t) => s + (t.pnl||0), 0);
    return {
      total: closed.length, wins: wins.length, losses: losses.length,
      winRate: closed.length ? (wins.length / closed.length * 100).toFixed(1) : 0,
      netPnl: netPnl.toFixed(2),
      avgWin: wins.length ? (wins.reduce((a,b)=>a+b,0)/wins.length).toFixed(2) : 0,
      avgLoss: losses.length ? (losses.reduce((a,b)=>a+b,0)/losses.length).toFixed(2) : 0,
      expectancy: closed.length ? (netPnl / closed.length).toFixed(2) : 0,
      maxDD: maxDD.toFixed(2),
      openCount: all.filter(t => t.status === 'OPEN').length
    };
  },
  clear() { localStorage.removeItem(this.KEY); }
};

function togglePaperMode() {
  paperMode = document.getElementById('paperModeToggle')?.checked || false;
  localStorage.setItem('stockpulse_paper_mode', paperMode);
  renderPaperDashboard();
}

// ===== SIGNAL HISTORY =====
const SignalHistory = {
  KEY: 'stockpulse_signal_history',
  getAll() { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; } },
  save(h) { localStorage.setItem(this.KEY, JSON.stringify(h)); },
  add(signal) {
    const all = this.getAll();
    signal.id = Date.now().toString(36);
    signal.timestamp = new Date().toISOString();
    all.unshift(signal);
    if (all.length > 50) all.length = 50;
    this.save(all);
    return signal;
  },
  getRecent(n=10) { return this.getAll().slice(0, n); },
  markOutcome(id, outcome) {
    const all = this.getAll();
    const s = all.find(x => x.id === id);
    if (s) { s.outcome = outcome; this.save(all); }
  },
  getStats() {
    const all = this.getAll().filter(s => s.outcome);
    if (!all.length) return null;
    const wins = all.filter(s => s.outcome === 'WIN').length;
    const losses = all.filter(s => s.outcome === 'LOSS').length;
    return { total: all.length, wins, losses, winRate: all.length ? (wins/all.length*100).toFixed(1) : '0' };
  }
};

function getRiskSettings(){
  const capital = parseFloat(document.getElementById('capitalInput')?.value) || 100000;
  const riskPct = parseFloat(document.getElementById('riskPctInput')?.value) || 1;
  return { capital, riskPct };
}

/* THEME */
function toggleTheme(){
  const d=document.documentElement,isDark=d.getAttribute('data-theme')==='dark';
  d.setAttribute('data-theme',isDark?'':'dark');
  document.getElementById('themeIcon').textContent=isDark?'\u263E':'\u2600';
  localStorage.setItem('theme',isDark?'light':'dark');
  if(rawData)renderAll(rawData,true);
}
(function(){if(localStorage.getItem('theme')==='dark'){document.documentElement.setAttribute('data-theme','dark');document.addEventListener('DOMContentLoaded',()=>{document.getElementById('themeIcon').textContent='\u2600'})}})();

/* MARKET STATUS */
function updateMkt(){
  const n=new Date(),ist=new Date(n.toLocaleString('en-US',{timeZone:'Asia/Kolkata'})),h=ist.getHours(),m=ist.getMinutes(),d=ist.getDay();
  const o=d>=1&&d<=5&&(h>9||(h===9&&m>=15))&&(h<15||(h===15&&m<=30));
  document.getElementById('mktDot').className='mkt-dot '+(o?'open':'closed');
  document.getElementById('mktLabel').textContent=o?'Open':'Closed';
}

/* THEME */
function toggleTheme(){
  const d=document.documentElement,isDark=d.getAttribute('data-theme')==='dark';
  d.setAttribute('data-theme',isDark?'':'dark');
  document.getElementById('themeIcon').textContent=isDark?'\u263E':'\u2600';
  localStorage.setItem('theme',isDark?'light':'dark');
  if(rawData)renderAll(rawData,true);
}
(function(){if(localStorage.getItem('theme')==='dark'){document.documentElement.setAttribute('data-theme','dark');document.addEventListener('DOMContentLoaded',()=>{document.getElementById('themeIcon').textContent='\u2600'})}})();

/* MARKET STATUS */
function updateMkt(){
  const n=new Date(),ist=new Date(n.toLocaleString('en-US',{timeZone:'Asia/Kolkata'})),h=ist.getHours(),m=ist.getMinutes(),d=ist.getDay();
  const o=d>=1&&d<=5&&(h>9||(h===9&&m>=15))&&(h<15||(h===15&&m<=30));
  document.getElementById('mktDot').className='mkt-dot '+(o?'open':'closed');
  document.getElementById('mktLabel').textContent=o?'Open':'Closed';
}
document.addEventListener('DOMContentLoaded',()=>{
  paperMode = localStorage.getItem('stockpulse_paper_mode') === 'true';
  updateMkt();
  renderPaperDashboard();
  renderSignalHistory();
  renderTradeJournal();
  setInterval(updateMkt,30000);
});

/* UI Helpers */

/* SEARCH & LOAD */
async function loadStock(sym) {
  switchAppView('chart');
  const inp=document.getElementById('searchInput');
  if(inp) inp.value=sym.replace('.NS','').replace('.BO','');
  currentSymbol=sym;lastPrice=0;if(refreshTimer)clearInterval(refreshTimer);if(fastRefreshTimer)clearInterval(fastRefreshTimer);
  show('loadingView');hide('welcomeView','stockView','errorView', 'actionBanner', 'immediateActionBox', 'orbCard', 'regimeBar', 'posTracker');
  try{
    await fetchContextData(sym);
    document.querySelectorAll('.range-tab').forEach(t=>t.classList.remove('active'));
    document.querySelector('.range-tab[data-range="1d"]')?.classList.add('active');
    refreshTimer=setInterval(()=>fetchContextData(sym,true),60000); // 1-minute full refresh
    fastRefreshTimer=setInterval(()=>fetchFastQuote(sym), 3000); // 3-second rapid price refresh
  }catch(e){hide('loadingView');document.getElementById('errorView').textContent='Error: '+(e.message||'Failed');show('errorView')}
}

let sto;
document.addEventListener('DOMContentLoaded', () => {
  const inp=document.getElementById('searchInput'), dd=document.getElementById('dropdown');
  if(!inp || !dd) return;
  
  inp.addEventListener('input', (e) => {
    clearTimeout(sto);
    const q = e.target.value.trim();
    if(q.length < 2) { dd.style.display='none'; return; }
    sto = setTimeout(async () => {
      try {
        const r = await fetch('http://localhost:8080/api/search/' + encodeURIComponent(q));
        if(!r.ok) throw new Error('Search failed');
        const data = await r.json();
        const quotes = data.quotes || [];
        if(quotes.length) {
          dd.innerHTML = quotes.map(x => `<div class="dd-item" onclick="loadStock('${x.symbol}');document.getElementById('dropdown').style.display='none'">${x.shortname || x.longname || x.symbol} <span style="font-size:10px;color:var(--text3)">${x.symbol}</span></div>`).join('');
          dd.style.display = 'block';
        } else {
          dd.style.display = 'none';
        }
      } catch(err) {
        console.error('Search error:', err);
      }
    }, 400);
  });
  
  document.addEventListener('click', (e) => {
    if(!inp.contains(e.target) && !dd.contains(e.target)) {
      dd.style.display = 'none';
    }
  });
});

// ===== LOCAL PROXY ROUTING =====
async function fetchYahoo(yahooUrl, maxRetries = 3) {
  let proxyUrl = yahooUrl;
  if (yahooUrl.includes('/v8/finance/chart/')) {
      const parts = yahooUrl.split('/v8/finance/chart/')[1];
      proxyUrl = 'http://localhost:8080/api/chart/' + parts;
  } else if (yahooUrl.includes('/v7/finance/quote?symbols=')) {
      const parts = yahooUrl.split('/v7/finance/quote?symbols=')[1];
      proxyUrl = 'http://localhost:8080/api/quote/' + parts;
  } else if (yahooUrl.includes('/v1/finance/search?q=')) {
      const parts = yahooUrl.split('/v1/finance/search?q=')[1];
      proxyUrl = 'http://localhost:8080/api/search/' + parts;
  }
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const r = await fetch(proxyUrl);
      if (!r.ok) throw new Error('Proxy ' + r.status);
      return await r.json();
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      const banner = document.getElementById('actionBanner');
      if (banner) {
        banner.style.display = 'flex';
        banner.className = 'action-banner neutral';
        const abSignal = document.getElementById('abSignal');
        if (abSignal) abSignal.innerHTML = 'DATA FEED RETRY (' + (i+1) + '/' + maxRetries + ') ⏳';
      }
      await new Promise(res => setTimeout(res, 800 * (i + 1)));
    }
  }
}

async function fetchContextData(sym, silent=false) {
  try {
    const baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/';
    const sectorSymbol = CONFIG.SECTOR_MAP[sym] || null;
    const sectorPromise = sectorSymbol
      ? fetchYahoo(`${baseUrl}${encodeURIComponent(sectorSymbol)}?range=5d&interval=15m`).catch(() => null)
      : Promise.resolve(null);
    const [res1m, res5m, res15m, resNifty, resVix, resSector] = await Promise.all([
      fetchYahoo(`${baseUrl}${sym}?range=1d&interval=1m`),
      fetchYahoo(`${baseUrl}${sym}?range=5d&interval=5m`),
      fetchYahoo(`${baseUrl}${sym}?range=1mo&interval=15m`),
      fetchYahoo(`${baseUrl}%5ENSEI?range=5d&interval=15m`),
      fetchYahoo(`${baseUrl}%5EINDIAVIX?range=1d&interval=1m`).catch(() => null),
      sectorPromise
    ]);
    if(!res1m.chart||!res1m.chart.result) throw new Error('No 1m data');
    rawData = res1m.chart.result[0];
    updateStatusDot('price', true);
    if(res5m.chart && res5m.chart.result) raw5m = res5m.chart.result[0];
    if(res15m.chart && res15m.chart.result) raw15m = res15m.chart.result[0];
    if(resNifty && resNifty.chart && resNifty.chart.result) {
      rawNifty = resNifty.chart.result[0];
      updateStatusDot('nifty', true);
      const nCloses = rawNifty.indicators.quote[0]?.close?.filter(v => v != null) || [];
      niftyRegime = Trading.classifyMarketRegime(nCloses);
    } else { updateStatusDot('nifty', false); niftyRegime = null; }
    if(resVix && resVix.chart && resVix.chart.result) {
      rawVix = resVix.chart.result[0];
      vixValue = rawVix.meta.regularMarketPrice || 0;
      updateStatusDot('vix', true);
    } else { updateStatusDot('vix', false); }
    if(resSector && resSector.chart && resSector.chart.result) rawSector = resSector.chart.result[0];
    else rawSector = null;
    const q1m = rawData.indicators.quote[0] || {};
    orbData = Trading.calcOpeningRange(rawData.timestamp||[], q1m.high||[], q1m.low||[], q1m.volume||[]);
    renderAll(rawData, silent);
  } catch (e) {
    updateStatusDot('price', false);
    if(!silent) throw e;
    console.error('Background fetch failed:', e);
  }
}

async function fetchRawData(sym,range,interval,silent){
  const baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/';
  const d = await fetchYahoo(`${baseUrl}${sym}?range=${range}&interval=${interval}`);
  if(!d.chart||!d.chart.result)throw new Error('No data');
  rawData=d.chart.result[0];renderAll(rawData,silent);
}

async function fetchFastQuote(sym) {
    if (!sym) return;
    try {
        const d = await fetchYahoo(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=1d&interval=1m`);
        if(d && d.chart && d.chart.result && d.chart.result.length > 0) {
            const q = d.chart.result[0].meta;
            const price = q.regularMarketPrice;
            const prev = q.chartPreviousClose || q.previousClose;
            
            if (price && price !== lastPrice) {
                // Flash animation
                const pe = document.getElementById('sPrice');
                if (pe) {
                    pe.classList.remove('flash-green','flash-red');
                    void pe.offsetWidth; // trigger reflow
                    pe.classList.add(price > lastPrice ? 'flash-green' : 'flash-red');
                    pe.textContent = fmt(price);
                }
                
                lastPrice = price;
                
                // Update change
                if (prev) {
                    const chg = price - prev;
                    const pct = (chg / prev) * 100;
                    const up = chg >= 0;
                    const ce = document.getElementById('sChange');
                    if (ce) {
                        ce.className = 'ph-change ' + (up ? 'up' : 'down');
                        ce.textContent = (up ? '▲ ' : '▼ ') + (up ? '+' : '') + chg.toFixed(2) + ' (' + (up ? '+' : '') + pct.toFixed(2) + '%)';
                    }
                }
                
                // Update Action Banner Price
                const abPrice = document.getElementById('abPrice');
                if (abPrice) abPrice.textContent = fmt(price);
                
                // Update Position Tracker PnL live
                renderPositions(price);
                
                // Paper trade management — auto-exit on SL/Target
                if (paperMode) {
                    PaperTrade.closeOpen(price);
                    renderPaperDashboard();
                }
                
                // --- REAL-TIME CANDLE UPDATE ---
                if (rawData && rawData.indicators && rawData.indicators.quote[0] && document.getElementById('stockView')?.style.display !== 'none') {
                    const rq = rawData.indicators.quote[0];
                    if (rq.close && rq.close.length > 0) {
                        const lastIdx = rq.close.length - 1;
                        
                        // Update the last candle's data
                        rq.close[lastIdx] = price;
                        if (price > rq.high[lastIdx]) rq.high[lastIdx] = price;
                        if (price < rq.low[lastIdx]) rq.low[lastIdx] = price;
                        
                        // Update the OHLC text bar
                        const meta = rawData.meta;
                        const o = meta.regularMarketOpen || rq.open.find(v=>v!=null) || 0;
                        const vh = rq.high.filter(v=>v!=null);
                        const vl = rq.low.filter(v=>v!=null);
                        const h = Math.max(meta.regularMarketDayHigh || 0, ...vh);
                        const l = Math.min(meta.regularMarketDayLow || Infinity, ...vl);
                        
                        const ohlc = document.getElementById('ohlcBar');
                        if (ohlc) {
                            ohlc.innerHTML = `<div class="ohlc-item">O<span>${fmt(o)}</span></div><div class="ohlc-item">H<span style="color:var(--green)">${fmt(h)}</span></div><div class="ohlc-item">L<span style="color:var(--red)">${fmt(l)}</span></div><div class="ohlc-item">C<span>${fmt(price)}</span></div><div class="ohlc-item">Vol<span>${shortNum(meta.regularMarketVolume||0)}</span></div>`;
                        }
                        
                        // Redraw the chart immediately
                        if (typeof updateTVChartTick === 'function') {
                            updateTVChartTick(rawData.timestamp, rq, price);
                        } else if (typeof drawChart === 'function') {
                            drawChart(rawData.timestamp || [], rq.open || [], rq.high || [], rq.low || [], rq.close || [], rq.volume || [], prev);
                        }
                    }
                }
            }
        }
    } catch(e) {
        // silently ignore fast fetch errors
    }
}

/* RENDER ALL */
function renderAll(res,silent){
  const meta=res.meta,q=res.indicators.quote[0]||{};
  const closes=q.close||[],opens=q.open||[],highs=q.high||[],lows=q.low||[],vols=q.volume||[];
  if(!silent)hide('loadingView');
  const vc=closes.filter(v=>v!=null),vh=highs.filter(v=>v!=null),vl=lows.filter(v=>v!=null),vv=vols.filter(v=>v!=null);

  // Price header
  document.getElementById('sName').textContent=meta.shortName||meta.symbol||currentSymbol;
  document.getElementById('sSub').textContent=(meta.symbol||'')+' \u2022 '+(meta.exchangeName||'NSE');
  const price=meta.regularMarketPrice,prev=meta.chartPreviousClose||meta.previousClose||price;
  const chg=price-prev,pct=chg/prev*100,up=chg>=0;
  const pe=document.getElementById('sPrice');
  if(lastPrice&&lastPrice!==price){pe.classList.remove('flash-green','flash-red');void pe.offsetWidth;pe.classList.add(price>lastPrice?'flash-green':'flash-red')}
  pe.textContent=fmt(price);lastPrice=price;
  const ce=document.getElementById('sChange');ce.className='ph-change '+(up?'up':'down');
  ce.textContent=(up?'\u25B2':'\u25BC')+' '+(up?'+':'')+chg.toFixed(2)+' ('+(up?'+':'')+pct.toFixed(2)+'%)';

  // OHLC
  const o=meta.regularMarketOpen||opens.find(v=>v!=null)||0;
  const h=meta.regularMarketDayHigh||Math.max(...vh);
  const l=meta.regularMarketDayLow||Math.min(...vl);
  document.getElementById('ohlcBar').innerHTML=
    `<div class="ohlc-item">O<span>${fmt(o)}</span></div><div class="ohlc-item">H<span style="color:var(--green)">${fmt(h)}</span></div><div class="ohlc-item">L<span style="color:var(--red)">${fmt(l)}</span></div><div class="ohlc-item">C<span>${fmt(price)}</span></div><div class="ohlc-item">Vol<span>${shortNum(meta.regularMarketVolume||0)}</span></div>`;

  // --- ENHANCED SIGNAL ENGINE (v4) ---

  // --- DATA STALENESS PROTECTION ---
  const now = Date.now();
  const lastTime = (res.timestamp && res.timestamp.length > 0) ? res.timestamp[res.timestamp.length - 1] * 1000 : now;
  const isStale = (now - lastTime > 120000);
  const isMarketOpen = document.getElementById('mktDot')?.classList.contains('open');

  if (isMarketOpen && isStale) {
      const banner = document.getElementById('actionBanner');
      if (banner) {
          banner.style.display = 'flex';
          banner.className = 'action-banner neutral';
          document.getElementById('abPrice').textContent = fmt(lastPrice);
          document.getElementById('abSignal').innerHTML = 'DATA STALE — WAITING FOR FRESH CANDLE ⌛';
      }
      analysisResult = null;
      document.getElementById('signalOverall').innerHTML = '<div style="padding:20px;text-align:center;color:var(--text3)">Data delayed by over 2 minutes. Waiting for fresh exchange data.</div>';
      renderCalc(null);
  } else if(raw5m && raw15m && rawNifty) {


    // 1. Get 15m trend
    const q15=raw15m.indicators.quote[0]||{};
    const trend15m = Trading.get15mTrend(q15.close||[]);

    // 2. Get NIFTY trend
    const qNifty=rawNifty.indicators.quote[0]||{};
    const niftyTrend = Trading.getNiftyTrend(qNifty.close||[]);

    // 3. Extract Prev Day Data for Pivot Points
    let prevDayData = null;
    const t5 = raw5m.timestamp || [];
    const q5 = raw5m.indicators.quote[0] || {};
    if (t5.length > 0) {
        const today = new Date(t5[t5.length - 1] * 1000).getDate();
        let pHigh = -Infinity, pLow = Infinity, pClose = null;
        for (let i = t5.length - 1; i >= 0; i--) {
            const day = new Date(t5[i] * 1000).getDate();
            if (day !== today) {
                pClose = q5.close[i]; // Last close of previous day
                const targetDay = day;
                for (let j = i; j >= 0; j--) {
                    if (new Date(t5[j] * 1000).getDate() === targetDay) {
                        if (q5.high[j] > pHigh) pHigh = q5.high[j];
                        if (q5.low[j] < pLow) pLow = q5.low[j];
                    } else {
                        break;
                    }
                }
                prevDayData = { high: pHigh, low: pLow, close: pClose };
                break;
            }
        }
    }

    // 4. Analyze on 5m data (with VIX)
    analysisResult = Trading.analyze(
      t5, q5.close||[], q5.high||[], q5.low||[], q5.volume||[], 
      price, trend15m, niftyTrend, prevDayData, vixValue
    );

    // 5. Immediate Action on 1m data
    let immediateAction = null;
    if (analysisResult) {
       const t1m = res.timestamp || [];
       const q1m = res.indicators.quote[0] || {};
       immediateAction = Trading.analyzeImmediateAction(
          t1m, q1m.open||[], q1m.close||[], q1m.high||[], q1m.low||[], q1m.volume||[],
          price, analysisResult.vwap, analysisResult.pivots, h, l
       );
    }

    if(analysisResult){
      renderSignals(analysisResult, trend15m, niftyTrend, immediateAction);
      const { capital, riskPct } = getRiskSettings();
      calcResult=Trading.calcEntryExit(price,analysisResult.atr,analysisResult.overall,analysisResult.pivots,capital,riskPct);
      renderCalc(calcResult);
      // Log signal to history
      if(!silent && analysisResult.shouldTrade){
         TradeLog.log({type:'SIGNAL', symbol:currentSymbol, action:analysisResult.overall, price, time:new Date().toISOString()});
         SignalHistory.add({
           symbol: currentSymbol,
           signal: analysisResult.overall,
           setup: analysisResult.setup.name,
           confidence: analysisResult.confidence,
           price: price,
           entry: calcResult?.entry,
           sl: calcResult?.sl,
           t1: calcResult?.target1,
           t2: calcResult?.target2
         });
      }
    }

    backtestResult = Trading.backtestStrategy(raw5m, raw15m, rawNifty, rawVix);
    renderBacktest(backtestResult);
  }

  // Position tracker
  renderPositions(price);

  // Chart
  updateTVChart(res.timestamp||[],opens,highs,lows,closes,vols, analysisResult?.vwapArray);

  // Phase 4 UI Updates
  renderOrb();
  renderRegimeBar();
  if (paperMode) renderPaperDashboard();

  // Signal History & Trade Journal
  renderSignalHistory();
  renderTradeJournal();

  // Stats
  const vol=meta.regularMarketVolume||0;
  document.getElementById('statsBox').innerHTML=[
    ['Open',fmt(o)],['Prev Close',fmt(prev)],['Day High',fmt(h)],['Day Low',fmt(l)],
    ['Volume',vol.toLocaleString('en-IN')],['52W High',fmt(meta.fiftyTwoWeekHigh||0)],
    ['52W Low',fmt(meta.fiftyTwoWeekLow||0)],['Day Range',fmt(l)+' - '+fmt(h)]
  ].map(s=>`<div class="stat-row"><span class="sl">${s[0]}</span><span class="sv">${s[1]}</span></div>`).join('');

  show('stockView');
}

/* SIGNALS */
function renderSignals(a, trend15m, niftyTrend, immediateAction){
  const icons={buy:'\u2705','strong-buy':'\u{1F525}',sell:'\u274C','strong-sell':'\u26D4',neutral:'\u26A0\uFE0F'};
  
  // --- ACTION BANNER with CONFIDENCE ---
  const banner = document.getElementById('actionBanner');
  const abPrice = document.getElementById('abPrice');
  const abSignal = document.getElementById('abSignal');
  
  if (banner && abPrice && abSignal) {
      banner.style.display = 'flex';
      banner.className = 'action-banner ' + a.overallClass;
      abPrice.textContent = fmt(lastPrice);
      
      let actionText = 'WAIT \u2014 NOT CONFIDENT';
      if(a.overallClass === 'strong-buy') actionText = 'STRONG BUY';
      else if(a.overallClass === 'buy') actionText = 'BUY';
      else if(a.overallClass === 'strong-sell') actionText = 'STRONG SELL';
      else if(a.overallClass === 'sell') actionText = 'SELL';
      
      abSignal.innerHTML = actionText + ' <span style="font-size:18px;opacity:0.8">(' + a.confidence + '%)</span>';
  }
  
  // --- IMMEDIATE ACTION BOX ---
  const immBox = document.getElementById('immediateActionBox');
  if (immBox && immediateAction) {
    immBox.style.display = 'block';
    immBox.className = 'imm-box intensity-' + immediateAction.intensity;
    let icon = '\u23F3';
    if(immediateAction.intensity === 3) icon = '\u{1F6A8}';
    else if(immediateAction.intensity === 2) icon = '\u26A0\uFE0F';
    
    immBox.innerHTML = `
      <div class="imm-header">
        <span class="imm-icon">${icon}</span>
        <span class="imm-title">Live 1-Min Trigger</span>
        <span class="imm-action ${immediateAction.action === 'WAIT' ? 'wait' : 'act'}">${immediateAction.action}</span>
      </div>
      <div class="imm-msg">${immediateAction.msg}</div>
    `;
  } else if (immBox) {
    immBox.style.display = 'none';
  }

  // --- CONFIDENCE METER ---
  const confColor = a.confidence >= 85 ? 'var(--green)' : a.confidence >= 70 ? 'var(--accent)' : a.confidence >= 55 ? 'var(--yellow)' : 'var(--red)';
  const confLabel = a.confidence >= 85 ? 'VERY HIGH' : a.confidence >= 70 ? 'HIGH' : a.confidence >= 55 ? 'MODERATE' : 'LOW';

  // Render overall verdict with confidence
  document.getElementById('signalOverall').className='signal-overall '+a.overallClass;
  document.getElementById('signalOverall').innerHTML=`
    <span class="so-icon">${icons[a.overallClass]||'\u26A0\uFE0F'}</span>
    <div class="so-text">
      <div class="so-verdict">${a.overall}</div>
      <div class="so-sub">${a.verdictReason}</div>
      <div class="decision-copy">
        <strong>Setup:</strong> ${a.setup.name} | <strong>Action:</strong> ${a.action}
        ${a.invalidation ? `| <strong>${a.invalidationLabel}:</strong> ${fmt(a.invalidation)}` : ''}
      </div>
      <div class="decision-note">${a.setup.description}</div>
    </div>
    <div style="text-align:center;min-width:70px">
      <div style="font-size:24px;font-weight:900;color:${confColor}">${a.confidence}%</div>
      <div style="font-size:9px;font-weight:700;color:${confColor};letter-spacing:0.5px">${confLabel}</div>
    </div>`;

  // Confidence bar
  const confBarHTML = `<div style="height:6px;background:var(--border2);border-radius:3px;margin-bottom:12px;overflow:hidden">
    <div style="height:100%;width:${a.confidence}%;background:${confColor};border-radius:3px;transition:width 0.5s"></div>
  </div>
  <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text3);margin-bottom:12px">
    <span>${a.regimeDesc}</span>
    <span>BUY ${a.buyVotes} vs SELL ${a.sellVotes} votes</span>
    <span>VIX: ${vixValue ? vixValue.toFixed(1) : '--'}</span>
  </div>`;
  
  // Render Warnings
  const ctxDiv = document.getElementById('signalContext');
  if(a.warnings && a.warnings.length > 0) {
    ctxDiv.innerHTML = confBarHTML + a.warnings.map(w => `<div class="warn-pill"><span class="warn-icon">\u26A0\uFE0F</span>${w}</div>`).join('');
    ctxDiv.style.display = 'flex';
  } else {
    ctxDiv.innerHTML = confBarHTML + `<div class="warn-pill safe"><span class="warn-icon">\u2705</span>All clear: Good volume, trend aligned, safe time</div>`;
    ctxDiv.style.display = 'flex';
  }

  // Render indicator cards (votes)
  document.getElementById('stratGrid').innerHTML=a.strategies.map(s=>`<div class="strat-card"><div class="strat-top"><span class="strat-name">${s.name}</span><span class="strat-sig ${s.signal}">${s.signal === 'SKIP' ? 'SKIP' : s.signal}</span></div><div class="strat-val">${s.value}</div><div class="strat-desc">${s.desc}</div></div>`).join('');
}

/* CALCULATOR */
function renderCalc(c){
  if(!c){
    document.getElementById('calcBody').innerHTML='<div style="padding:10px 0;color:var(--text2);font-size:12px">No trade setup right now. The engine is correctly waiting for a valid BUY or SELL signal.</div>';
    document.getElementById('calcType').textContent='Suggested: WAIT';
    document.getElementById('calcType').className='pos-badge';
    document.getElementById('tfPrice').value='';
    document.getElementById('tfSL').value='';
    document.getElementById('tfT1').value='';
    document.getElementById('tfBtn').disabled=true;
    document.getElementById('tfBtn').textContent='Wait For Setup';
    document.getElementById('tfBtn').className='btn-trade';
    checkRisk();
    return;
  }
  const prices=[c.sl,c.entry,c.target1,c.target2,c.target3];
  const mn=Math.min(...prices),mx=Math.max(...prices),rng=mx-mn||1;
  const pct=v=>((v-mn)/rng*100).toFixed(0);
  const rows=[
    {cls:'sl',label:'SL',price:c.sl,pos:pct(c.sl)},
    {cls:'entry',label:'Entry',price:c.entry,pos:pct(c.entry)},
    {cls:'t1',label:'Book',price:c.bookProfit || c.target1,pos:pct(c.bookProfit || c.target1)},
    {cls:'t2',label:'T2',price:c.target2,pos:pct(c.target2)},
    {cls:'t3',label:'T3',price:c.target3,pos:pct(c.target3)}
  ];
  if(c.type==='SELL')rows.reverse();
  let html=rows.map(r=>`<div class="calc-row ${r.cls}"><span class="calc-label">${r.label}</span><div class="calc-bar"><div class="calc-marker" style="left:${r.pos}%"></div></div><span class="calc-price">${fmt(r.price)}</span></div>`).join('');
  html+=`<div class="calc-rr"><div class="rr-item">Risk/Share<strong>${fmt(c.risk)}</strong></div><div class="rr-item">Book Profit<strong>${fmt(c.bookProfit || c.target1)}</strong></div><div class="rr-item">Stretch T2<strong>${fmt(c.target2)}</strong></div><div class="rr-item">Runner T3<strong>${fmt(c.target3)}</strong></div></div>`;
  html+=`<div class="plan-grid">
    <div class="plan-card"><span>Suggested Qty</span><strong>${c.qty}</strong><small>Based on ${c.riskPct}% risk</small></div>
    <div class="plan-card"><span>Risk Budget</span><strong>${fmt(c.riskBudget)}</strong><small>Capital ${fmt(c.capital)}</small></div>
    <div class="plan-card"><span>Position Value</span><strong>${fmt(c.positionValue)}</strong><small>Entry x quantity</small></div>
  </div>`;
  document.getElementById('calcBody').innerHTML=html;
  document.getElementById('calcType').textContent=c.type==='BUY'?'Suggested: BUY':'Suggested: SELL';
  document.getElementById('calcType').className='pos-badge '+(c.type==='BUY'?'buy':'sell');
  
  // Pre-fill trade form
  document.getElementById('tfType').value=c.type.toLowerCase();
  document.getElementById('tfPrice').value=c.entry.toFixed(2);
  document.getElementById('tfSL').value=c.sl;
  document.getElementById('tfT1').value=c.target1;
  document.getElementById('tfBtn').disabled=false;
  updateTradeBtn();
}

function rerenderDecisionEngine(){
  if(rawData) renderAll(rawData,true);
}

function renderBacktest(result) {
  const box = document.getElementById('backtestSection');
  if (!box) return;
  if (!result || !result.summary) {
    box.style.display = 'none';
    return;
  }

  box.style.display = 'block';
  const s = result.summary;
  const profitable = s.netPnl >= 0;
  const recentTrades = result.trades.slice(-5).reverse();
  const pfText = Number.isFinite(s.profitFactor) ? s.profitFactor.toFixed(2) : '--';

  box.innerHTML = `
    <div class="backtest-head">
      <div>
        <h3>Strategy Backtest</h3>
        <p>${s.sampleDays} trading days, 5-minute entries, next-candle fills, stop/target/time exits, with simple costs.</p>
      </div>
      <div class="bt-badge ${profitable ? 'good' : 'bad'}">${profitable ? 'Net Positive' : 'Needs Work'}</div>
    </div>
    <div class="bt-grid">
      <div class="bt-card">
        <span class="bt-label">Trades</span>
        <strong>${s.trades}</strong>
        <small>${s.longTrades} long / ${s.shortTrades} short</small>
      </div>
      <div class="bt-card">
        <span class="bt-label">Win Rate</span>
        <strong>${s.winRate}%</strong>
        <small>${s.wins}W / ${s.losses}L</small>
      </div>
      <div class="bt-card">
        <span class="bt-label">Net P&L</span>
        <strong class="${profitable ? 'profit' : 'loss'}">${profitable ? '+' : ''}${fmtAbs(s.netPnl)}</strong>
        <small>Gross ${s.grossPnl >= 0 ? '+' : ''}${fmtAbs(s.grossPnl)}</small>
      </div>
      <div class="bt-card">
        <span class="bt-label">Expectancy</span>
        <strong class="${s.expectancy >= 0 ? 'profit' : 'loss'}">${s.expectancy >= 0 ? '+' : ''}${fmtAbs(s.expectancy)}</strong>
        <small>per trade after costs</small>
      </div>
      <div class="bt-card">
        <span class="bt-label">Profit Factor</span>
        <strong>${pfText}</strong>
        <small>Avg win ${fmtAbs(s.avgWin)} / Avg loss ${fmtAbs(Math.abs(s.avgLoss))}</small>
      </div>
      <div class="bt-card">
        <span class="bt-label">Max Drawdown</span>
        <strong class="loss">${fmtAbs(s.maxDrawdown)}</strong>
        <small>${s.targetsHit} target hits, ${s.stopsHit} stops</small>
      </div>
    </div>
    <div class="bt-note">
      This is a fast sanity-check backtest, not broker-grade execution. Use it to judge whether the idea has edge before trusting live signals.
    </div>
    <div class="bt-table">
      <div class="bt-row head">
        <span>Side</span><span>Entry</span><span>Exit</span><span>Reason</span><span>P&L</span>
      </div>
      ${recentTrades.length ? recentTrades.map(t => `
        <div class="bt-row">
          <span class="${t.side === 'BUY' ? 'profit' : 'loss'}">${t.side}</span>
          <span>${fmtAbs(t.entry)}</span>
          <span>${fmtAbs(t.exit)}</span>
          <span>${t.reason}</span>
          <span class="${t.netPnl >= 0 ? 'profit' : 'loss'}">${t.netPnl >= 0 ? '+' : ''}${fmtAbs(t.netPnl)}</span>
        </div>
      `).join('') : '<div class="bt-empty">No simulated trades found for this sample.</div>'}
    </div>
  `;
}

/* TRADE FORM */
function updateTradeBtn(){
  const btn=document.getElementById('tfBtn');
  const type=document.getElementById('tfType').value;
  btn.textContent=type==='buy'?'Add BUY Position':'Add SELL Position';
  btn.className='btn-trade '+(type==='buy'?'buy-btn':'sell-btn');
  checkRisk();
}

function checkRisk() {
  const price=parseFloat(document.getElementById('tfPrice').value);
  const qty=parseInt(document.getElementById('tfQty').value)||0;
  const sl=parseFloat(document.getElementById('tfSL').value);
  const warnDiv = document.getElementById('riskWarning');
  
  if(!price || !qty || !sl) { warnDiv.style.display='none'; return; }
  
  const risk = Math.abs(price - sl) * qty;
  const totalValue = price * qty;
  
  if (risk > 5000 || totalValue > 100000) { // Arbitrary high risk thresholds for demo
    warnDiv.textContent = `\u26A0\uFE0F High Risk Warning: You are risking \u20B9${risk.toFixed(0)} on a \u20B9${(totalValue/1000).toFixed(1)}k position. Max recommended risk per trade is 1-2% of capital.`;
    warnDiv.style.display = 'block';
  } else {
    warnDiv.style.display = 'none';
  }
}

// Add listeners to check risk
document.getElementById('tfPrice').addEventListener('input', checkRisk);
document.getElementById('tfQty').addEventListener('input', checkRisk);
document.getElementById('tfSL').addEventListener('input', checkRisk);
document.getElementById('capitalInput')?.addEventListener('input', rerenderDecisionEngine);
document.getElementById('riskPctInput')?.addEventListener('input', rerenderDecisionEngine);

function addPosition(){
  const type=document.getElementById('tfType').value.toUpperCase();
  const price=parseFloat(document.getElementById('tfPrice').value);
  const qty=parseInt(document.getElementById('tfQty').value)||1;
  const sl=parseFloat(document.getElementById('tfSL').value);
  const t1=parseFloat(document.getElementById('tfT1').value);
  if(!price||!sl||!t1){alert('Fill all fields');return}
  const risk=Math.abs(price-sl);
  
  const pos = Positions.add({symbol:currentSymbol,type,entry:price,qty,sl,trailSL:sl,
    target1:t1,target2:+(type==='BUY'?price+2*risk:price-2*risk).toFixed(2),
    target3:+(type==='BUY'?price+3*risk:price-3*risk).toFixed(2)});
    
  TradeLog.log({type:'ENTRY', symbol:currentSymbol, action:type, price, qty, time:new Date().toISOString()});
  
  document.getElementById('tfQty').value='';
  renderPositions(lastPrice);
  if(rawData)renderAll(rawData,true); // Re-draw to show lines
}

/* POSITION TRACKER */
function renderPositions(price){
  const box=document.getElementById('posTracker');
  const positions=Positions.getForSymbol(currentSymbol);
  if(!positions.length){box.style.display='none';return}
  box.style.display='block';
  let html='';
  positions.forEach(p=>{
    const isBuy=p.type==='BUY';
    const pnl=isBuy?(price-p.entry)*p.qty:(p.entry-price)*p.qty;
    const pnlPct=isBuy?(price-p.entry)/p.entry*100:(p.entry-price)/p.entry*100;
    const isProfit=pnl>=0;
    // Trailing SL update
    if(isBuy&&price>p.entry){const newSL=Math.max(p.trailSL,price-1.5*(p.entry-p.sl));if(newSL>p.trailSL)Positions.updateTrailSL(p.id,newSL);p.trailSL=Math.max(p.trailSL,newSL)}
    if(!isBuy&&price<p.entry){const newSL=Math.min(p.trailSL,price+1.5*(p.sl-p.entry));if(newSL<p.trailSL)Positions.updateTrailSL(p.id,newSL);p.trailSL=Math.min(p.trailSL,newSL)}
    
    // Status
    let status='HOLD',statusClass='hold',statusMsg='Trend is intact, hold your position';
    if(isBuy&&price<=p.trailSL){status='EXIT NOW';statusClass='exit';statusMsg='Stop loss hit! Close position'}
    else if(!isBuy&&price>=p.trailSL){status='EXIT NOW';statusClass='exit';statusMsg='Stop loss hit! Close position'}
    else if(isBuy&&price>=p.target1&&price<p.target2){status='BOOK PROFIT';statusClass='watch';statusMsg='T1 reached. Book profit or trail only a small runner'}
    else if(!isBuy&&price<=p.target1&&price>p.target2){status='BOOK PROFIT';statusClass='watch';statusMsg='T1 reached. Book profit or trail only a small runner'}
    else if((isBuy&&price>=p.target2)||((!isBuy)&&price<=p.target2)){status='RUNNER TARGET';statusClass='hold';statusMsg='T2 reached. Tighten trailing stop'}
    const elapsed=Math.round((Date.now()-new Date(p.time).getTime())/60000);

    html+=`<div style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--border2)">
      <div class="pos-head"><span class="pos-title">${p.type} Position</span><span class="pos-badge ${p.type.toLowerCase()}">${p.type} \u2022 ${p.qty} shares \u2022 ${elapsed}min</span></div>
      <div class="pos-pnl ${isProfit?'profit':'loss'}"><div class="pnl-amount">${isProfit?'+':''}\u20B9${pnl.toFixed(2)}</div><div class="pnl-pct">${isProfit?'+':''}${pnlPct.toFixed(2)}% on \u20B9${(p.entry*p.qty).toFixed(0)} invested</div></div>
      <div class="pos-status ${statusClass}">${status} \u2014 ${statusMsg}</div>
      <div class="pos-levels"><div class="lv"><div class="lv-label">SL</div><div class="lv-val sl">${fmt(p.trailSL)}</div></div><div class="lv"><div class="lv-label">Entry</div><div class="lv-val">${fmt(p.entry)}</div></div><div class="lv"><div class="lv-label">Book</div><div class="lv-val t1">${fmt(p.target1)}</div></div><div class="lv"><div class="lv-label">T2</div><div class="lv-val t2">${fmt(p.target2)}</div></div><div class="lv"><div class="lv-label">T3</div><div class="lv-val t3">${fmt(p.target3)}</div></div></div>
      <div class="pos-actions"><button class="btn-close-pos" onclick="closePosition('${p.id}', ${p.qty})">Close Position</button></div></div>`;
  });
  box.querySelector('.pos-content').innerHTML=html;
}

function closePosition(id, qty){
  const p = Positions.getAll().find(x => x.id === id);
  if(p) {
      const isBuy = p.type === 'BUY';
      const pnl = isBuy ? (lastPrice - p.entry)*qty : (p.entry - lastPrice)*qty;
      TradeLog.log({type:'EXIT', symbol:currentSymbol, action:isBuy?'SELL':'BUY', price:lastPrice, qty, pnl, time:new Date().toISOString()});
  }
  Positions.close(id, lastPrice);
  renderPositions(lastPrice);
  renderTradeLog();
  if(rawData)renderAll(rawData,true);
}

/* TRADE LOG DISPLAY */
function renderTradeLog() {
    const stats = TradeLog.getStats();
    if(!stats) return;
    
    // Create or update log section
    let logSec = document.getElementById('tradeLogSection');
    if(!logSec) {
        logSec = document.createElement('div');
        logSec.id = 'tradeLogSection';
        logSec.className = 'section-card';
        logSec.style.marginTop = '12px';
        document.querySelector('.two-col').parentElement.appendChild(logSec);
    }
    
    const isProfitable = parseFloat(stats.totalPnl) >= 0;
    
    logSec.innerHTML = `
      <h3>Performance Stats</h3>
      <div style="display:flex;gap:10px;margin-bottom:10px;">
        <div style="flex:1;background:var(--bg);padding:10px;border-radius:var(--radius-sm);text-align:center;">
           <div style="font-size:10px;color:var(--text3);text-transform:uppercase;">Win Rate</div>
           <div style="font-size:18px;font-weight:700;color:${stats.winRate > 50 ? 'var(--green)' : 'var(--text)'}">${stats.winRate}%</div>
        </div>
        <div style="flex:1;background:var(--bg);padding:10px;border-radius:var(--radius-sm);text-align:center;">
           <div style="font-size:10px;color:var(--text3);text-transform:uppercase;">Total P&L</div>
           <div style="font-size:18px;font-weight:700;color:${isProfitable ? 'var(--green)' : 'var(--red)'}">${isProfitable?'+':''}\u20B9${stats.totalPnl}</div>
        </div>
      </div>
      <div style="font-size:11px;color:var(--text2);display:flex;justify-content:space-between;">
        <span>Trades: ${stats.total} (${stats.wins}W / ${stats.losses}L)</span>
        <span>Avg W: \u20B9${stats.avgWin} | Avg L: \u20B9${Math.abs(stats.avgLoss)}</span>
      </div>
    `;
}


/* SIGNAL HISTORY */
function renderSignalHistory() {
  const box = document.getElementById('signalHistoryBox');
  if (!box) return;
  const signals = SignalHistory.getRecent(8);
  const stats = SignalHistory.getStats();

  if (!signals.length) {
    box.innerHTML = '<p style="color:var(--text3);font-size:11px;text-align:center;padding:16px">No signals logged yet. Trade signals will appear here automatically.</p>';
    return;
  }

  let h = '';
  if (stats) {
    h += `<div class="sh-stats"><span class="sh-stat">Tracked: <strong>${stats.total}</strong></span><span class="sh-stat">Wins: <strong class="profit">${stats.wins}</strong></span><span class="sh-stat">WR: <strong>${stats.winRate}%</strong></span></div>`;
  }
  h += '<div class="sh-table">';
  h += '<div class="sh-row head"><span>Time</span><span>Stock</span><span>Signal</span><span>Setup</span><span>Conf</span><span>Price</span><span>Result</span></div>';
  signals.forEach(s => {
    const time = new Date(s.timestamp);
    const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateStr = time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const isBuy = s.signal.includes('BUY');
    const sigClass = isBuy ? 'profit' : 'loss';
    const outcomeHtml = s.outcome
      ? `<span class="${s.outcome === 'WIN' ? 'profit' : 'loss'}">${s.outcome}</span>`
      : `<span class="sh-actions"><button class="sh-btn win" onclick="markSignal('${s.id}','WIN')">W</button><button class="sh-btn lose" onclick="markSignal('${s.id}','LOSS')">L</button></span>`;
    h += `<div class="sh-row"><span>${dateStr} ${timeStr}</span><span>${(s.symbol||'').replace('.NS','')}</span><span class="${sigClass}">${s.signal}</span><span>${s.setup||'--'}</span><span>${s.confidence||'--'}%</span><span>${s.price ? fmt(s.price) : '--'}</span>${outcomeHtml}</div>`;
  });
  h += '</div>';
  box.innerHTML = h;
}

function markSignal(id, outcome) {
  SignalHistory.markOutcome(id, outcome);
  renderSignalHistory();
  renderTradeLog();
}

/* TRADE JOURNAL */
function renderTradeJournal() {
  const box = document.getElementById('tradeJournalBox');
  if (!box) return;
  const positions = Positions.getAll().filter(p => p.status === 'CLOSED').slice(-10).reverse();
  if (!positions.length) {
    box.innerHTML = '<p style="color:var(--text3);font-size:11px;text-align:center;padding:16px">Closed positions will appear here. Place and close trades to build your journal.</p>';
    return;
  }
  let totalPnl = 0;
  let h = '<div class="sh-table">';
  h += '<div class="sh-row head"><span>Stock</span><span>Side</span><span>Entry</span><span>Exit</span><span>Qty</span><span>P&L</span><span>Duration</span></div>';
  positions.forEach(p => {
    const pnl = p.type === 'BUY' ? (p.exitPrice - p.entry) * p.qty : (p.entry - p.exitPrice) * p.qty;
    totalPnl += pnl;
    const duration = p.closedAt ? Math.round((new Date(p.closedAt) - new Date(p.time)) / 60000) : '--';
    h += `<div class="sh-row"><span>${(p.symbol||'').replace('.NS','')}</span><span class="${p.type==='BUY'?'profit':'loss'}">${p.type}</span><span>${fmt(p.entry)}</span><span>${p.exitPrice ? fmt(p.exitPrice) : '--'}</span><span>${p.qty}</span><span class="${pnl>=0?'profit':'loss'}">${pnl>=0?'+':''}${fmt(Math.abs(pnl))}</span><span>${duration}min</span></div>`;
  });
  h += '</div>';
  h += `<div style="text-align:center;margin-top:8px;font-size:13px;font-weight:700">Total: <span class="${totalPnl>=0?'profit':'loss'}">${totalPnl>=0?'+':''}${fmt(Math.abs(totalPnl))}</span></div>`;
  box.innerHTML = h;
}

/* === PHASE 4: ORB & REGIME RENDERERS === */
function renderOrb() {
  const card = document.getElementById('orbCard');
  if (!card) return;
  if (!orbData) { card.style.display = 'none'; return; }
  card.style.display = 'block';
  document.getElementById('orbLevels').innerHTML = `
    <div class="orb-level"><span class="orb-label">High</span><span class="orb-val high">${fmt(orbData.high)}</span></div>
    <div class="orb-level"><span class="orb-label">Range</span><span class="orb-val range">${fmt(orbData.range)}</span></div>
    <div class="orb-level"><span class="orb-label">Low</span><span class="orb-val low">${fmt(orbData.low)}</span></div>
  `;
}

function renderRegimeBar() {
  const bar = document.getElementById('regimeBar');
  if (!bar) return;
  bar.style.display = 'flex';
  
  let h = '';
  // Nifty Regime
  if (niftyRegime) {
      const cls = niftyRegime.regime === 'TRENDING_UP' ? 'trending-up' : 
                  niftyRegime.regime === 'TRENDING_DOWN' ? 'trending-down' : 
                  niftyRegime.regime === 'CHOPPY' ? 'choppy' : 'unknown';
      h += `<div class="regime-pill ${cls}">NIFTY: ${niftyRegime.regime.replace('_', ' ')}</div>`;
  }
  // VIX
  if (vixValue > 0) {
      const vixAdj = Trading.getVixAdjustment(vixValue);
      h += `<div class="regime-pill vix" title="${vixAdj.desc}">VIX: ${vixValue.toFixed(2)} (${vixAdj.sizeMult*100}% Size)</div>`;
  }
  // Sector
  if (rawSector) {
      const sPrice = rawSector.meta.regularMarketPrice;
      const sPrev = rawSector.meta.chartPreviousClose || sPrice;
      const sChg = ((sPrice - sPrev) / sPrev) * 100;
      const sCls = sChg >= 0 ? 'trending-up' : 'trending-down';
      h += `<div class="regime-pill ${sCls}">${rawSector.meta.shortName}: ${sChg>0?'+':''}${sChg.toFixed(1)}%</div>`;
  }
  bar.innerHTML = h;
}

/* === PHASE 5: PAPER TRADING DASHBOARD === */
function renderPaperDashboard() {
  const dash = document.getElementById('paperDashboard');
  const tog = document.getElementById('paperModeToggle');
  if (!dash || !tog) return;
  
  tog.checked = paperMode;
  
  if (!paperMode) {
      dash.style.display = 'none';
      return;
  }
  
  dash.style.display = 'block';
  const s = PaperTrade.getStats();
  document.getElementById('paperDashContent').innerHTML = `
    <div class="paper-dash-grid">
      <div class="paper-dash-card">
        <span class="pd-label">Net P&L</span>
        <span class="pd-value ${s.netPnl >= 0 ? 'profit' : 'loss'}">${s.netPnl >= 0 ? '+' : ''}₹${Math.abs(s.netPnl)}</span>
        <span class="pd-sub">Expectancy: ₹${s.expectancy}</span>
      </div>
      <div class="paper-dash-card">
        <span class="pd-label">Win Rate</span>
        <span class="pd-value ${s.winRate > 50 ? 'profit' : 'loss'}">${s.winRate}%</span>
        <span class="pd-sub">${s.wins}W / ${s.losses}L</span>
      </div>
      <div class="paper-dash-card">
        <span class="pd-label">Open Trades</span>
        <span class="pd-value">${s.openCount}</span>
        <span class="pd-sub">Total Executed: ${s.total}</span>
      </div>
    </div>
  `;
}

/* === TRADINGVIEW CHART INTEGRATION === */
function initTVChart() {
    const container = document.getElementById('tvChartContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = isDark ? '#1e2130' : '#ffffff';
    const text = isDark ? '#8b8fa3' : '#6b7280';
    const grid = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    const upColor = isDark ? '#00d09c' : '#00b386';
    const downColor = isDark ? '#ff5252' : '#eb4d4b';
    
    tvChart = LightweightCharts.createChart(container, {
        width: container.clientWidth,
        height: container.clientHeight,
        layout: { background: { type: 'solid', color: bg }, textColor: text },
        grid: { vertLines: { color: grid }, horzLines: { color: grid } },
        rightPriceScale: { borderColor: grid },
        timeScale: { borderColor: grid, timeVisible: true, secondsVisible: false },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal }
    });
    
    tvCandleSeries = tvChart.addCandlestickSeries({
        upColor: upColor, downColor: downColor, borderVisible: false,
        wickUpColor: upColor, wickDownColor: downColor,
    });
    
    tvVolumeSeries = tvChart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: '',
        scaleMargins: { top: 0.8, bottom: 0 }
    });
    
    tvVwapLine = tvChart.addLineSeries({
        color: '#f59e0b', lineWidth: 2, lineStyle: LightweightCharts.LineStyle.Dashed, title: 'VWAP'
    });
}

function aggregateCandles(ts, opens, highs, lows, closes, vols, timeframe) {
    if (!ts || ts.length === 0 || timeframe <= 1) return { ts, opens, highs, lows, closes, vols };
    
    const aggTs = [], aggO = [], aggH = [], aggL = [], aggC = [], aggV = [];
    let currentCandle = null;
    
    for (let i = 0; i < ts.length; i++) {
        if (closes[i] == null) continue;
        
        const istTime = new Date(ts[i] * 1000 + 19800 * 1000);
        const hours = istTime.getUTCHours();
        const minutes = istTime.getUTCMinutes();
        const minutesSinceOpen = (hours - 9) * 60 + (minutes - 15);
        const bucketIdx = Math.floor(minutesSinceOpen / timeframe);
        
        if (!currentCandle || currentCandle.bucketIdx !== bucketIdx) {
            if (currentCandle) {
                aggTs.push(currentCandle.ts); aggO.push(currentCandle.o); aggH.push(currentCandle.h);
                aggL.push(currentCandle.l); aggC.push(currentCandle.c); aggV.push(currentCandle.v);
            }
            currentCandle = {
                bucketIdx: bucketIdx, ts: ts[i],
                o: opens[i], h: highs[i], l: lows[i], c: closes[i], v: vols[i] || 0
            };
        } else {
            currentCandle.h = Math.max(currentCandle.h, highs[i]);
            currentCandle.l = Math.min(currentCandle.l, lows[i]);
            currentCandle.c = closes[i];
            currentCandle.v += (vols[i] || 0);
        }
    }
    if (currentCandle) {
        aggTs.push(currentCandle.ts); aggO.push(currentCandle.o); aggH.push(currentCandle.h);
        aggL.push(currentCandle.l); aggC.push(currentCandle.c); aggV.push(currentCandle.v);
    }
    return { ts: aggTs, opens: aggO, highs: aggH, lows: aggL, closes: aggC, vols: aggV };
}

function updateTVChart(tsRaw, opensRaw, highsRaw, lowsRaw, closesRaw, volumesRaw, vwapArr) {
    if (!tvChart) initTVChart();
    if (!tsRaw || tsRaw.length === 0) return;
    
    let ts = tsRaw, opens = opensRaw, highs = highsRaw, lows = lowsRaw, closes = closesRaw, volumes = volumesRaw;
    if (selectedTimeframe > 1 && tsRaw.length > 0) {
        const agg = aggregateCandles(tsRaw, opensRaw, highsRaw, lowsRaw, closesRaw, volumesRaw, selectedTimeframe);
        ts = agg.ts; opens = agg.opens; highs = agg.highs; lows = agg.lows; closes = agg.closes; volumes = agg.vols;
        vwapArr = null; // Hide VWAP for aggregated timeframes
    }
    
    const candleData = [];
    const volData = [];
    const vwapData = [];
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    for (let i = 0; i < ts.length; i++) {
        if (closes[i] == null || opens[i] == null) continue;
        const time = ts[i] + 19800; // IST offset
        
        candleData.push({ time, open: opens[i], high: highs[i], low: lows[i], close: closes[i] });
        
        const isUp = closes[i] >= opens[i];
        const color = isUp ? (isDark ? 'rgba(0,208,156,0.3)' : 'rgba(0,179,134,0.2)') : (isDark ? 'rgba(255,82,82,0.3)' : 'rgba(235,77,75,0.2)');
        volData.push({ time, value: volumes[i] || 0, color });
        
        if (vwapArr && vwapArr[i] != null) {
            vwapData.push({ time, value: vwapArr[i] });
        }
    }
    
    tvCandleSeries.setData(candleData);
    tvVolumeSeries.setData(volData);
    if (vwapData.length > 0) {
        tvVwapLine.setData(vwapData);
    } else {
        tvVwapLine.setData([]);
    }
    
    const positions = Positions.getForSymbol(currentSymbol);
    if (activePriceLines) activePriceLines.forEach(line => tvCandleSeries.removePriceLine(line));
    activePriceLines = [];
    positions.forEach(p => {
        activePriceLines.push(tvCandleSeries.createPriceLine({ price: p.entry, color: '#5367ff', lineWidth: 2, lineStyle: LightweightCharts.LineStyle.Solid, axisLabelVisible: true, title: 'Entry' }));
        activePriceLines.push(tvCandleSeries.createPriceLine({ price: p.trailSL, color: '#eb4d4b', lineWidth: 1, lineStyle: LightweightCharts.LineStyle.Dashed, axisLabelVisible: true, title: 'SL' }));
        activePriceLines.push(tvCandleSeries.createPriceLine({ price: p.target1, color: '#00b386', lineWidth: 1, lineStyle: LightweightCharts.LineStyle.Dashed, axisLabelVisible: true, title: 'T1' }));
    });
}

function updateTVChartTick(tsArr, quoteArr, currentPrice) {
    if (!tvCandleSeries || !tsArr || tsArr.length === 0) return;
    
    let ts = tsArr, opens = quoteArr.open, highs = quoteArr.high, lows = quoteArr.low, closes = quoteArr.close;
    if (selectedTimeframe > 1) {
        const agg = aggregateCandles(tsArr, quoteArr.open, quoteArr.high, quoteArr.low, quoteArr.close, quoteArr.volume, selectedTimeframe);
        if (!agg || agg.ts.length === 0) return;
        ts = agg.ts; opens = agg.opens; highs = agg.highs; lows = agg.lows; closes = agg.closes;
    }
    
    const idx = ts.length - 1;
    const time = ts[idx] + 19800;
    tvCandleSeries.update({
        time,
        open: opens[idx],
        high: highs[idx],
        low: lows[idx],
        close: currentPrice // currentPrice is the exact live close
    });
}

/* CHART CONTROLS */
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.range-tab').forEach(t=>{t.addEventListener('click',function(){
    document.querySelectorAll('.range-tab').forEach(b=>b.classList.remove('active'));this.classList.add('active');
    
    if (this.dataset.tf) {
        selectedTimeframe = parseInt(this.dataset.tf);
        if (rawData) {
            const q = rawData.indicators.quote[0] || {};
            updateTVChart(rawData.timestamp || [], q.open || [], q.high || [], q.low || [], q.close || [], q.volume || [], analysisResult?.vwapArray);
        }
        return;
    }
    
    selectedTimeframe = 1;
    if(refreshTimer)clearInterval(refreshTimer);
    if(fastRefreshTimer)clearInterval(fastRefreshTimer);
    if(this.dataset.range==='1d') {
        fetchContextData(currentSymbol);
        refreshTimer=setInterval(()=>fetchContextData(currentSymbol,true),60000);
        fastRefreshTimer=setInterval(()=>fetchFastQuote(currentSymbol), 3000);
    } else {
        fetchRawData(currentSymbol,this.dataset.range,this.dataset.interval);
    }
  })});
  document.querySelectorAll('.ct-btn').forEach(b=>{b.addEventListener('click',function(){
    document.querySelectorAll('.ct-btn').forEach(x=>x.classList.remove('active'));this.classList.add('active');
    chartType=this.dataset.type;if(rawData)renderAll(rawData,true);
  })});
});

window.addEventListener('resize',()=>{if(rawData&&document.getElementById('stockView').style.display!=='none')renderAll(rawData,true)});

/* === NAVIGATION & VIEWS === */
function switchAppView(view) {
    currentAppView = view;
    document.querySelectorAll('.mn-btn').forEach(b => b.classList.remove('active'));
    
    hide('welcomeView', 'stockView', 'scannerView', 'errorView', 'loadingView');
    
    if (view === 'chart') {
        document.getElementById('navChart').classList.add('active');
        if (currentSymbol) {
            show('stockView');
            window.dispatchEvent(new Event('resize'));
        } else {
            show('welcomeView');
        }
    } else if (view === 'scanner') {
        document.getElementById('navScanner').classList.add('active');
        show('scannerView');
        initScanner();
    }
}

async function startMasterQuotePoller() {
    if (masterQuoteTimer) clearInterval(masterQuoteTimer);
    
    // Extract unique symbols
    allSymbolsList = [];
    Object.values(MARKET_SECTORS).forEach(list => {
        list.forEach(sym => {
            if (!allSymbolsList.includes(sym)) allSymbolsList.push(sym);
        });
    });
    
    const chunks = [];
    for (let i = 0; i < allSymbolsList.length; i += 25) {
        chunks.push(allSymbolsList.slice(i, i + 25));
    }
    
    const delay = ms => new Promise(r => setTimeout(r, ms));
    
    const fetchAllQuotes = async () => {
        let totalScanned = 0;
        let flagged = 0;
        for (let ci = 0; ci < chunks.length; ci++) {
            const chunk = chunks[ci];
            if (ci > 0) await delay(600); // 600ms gap between batches
            try {
                const res = await fetch(`http://localhost:8080/api/quote/${chunk.join(',')}`);
                if (!res.ok) continue;
                const data = await res.json();
                if (data && data.quoteResponse && data.quoteResponse.result) {
                    data.quoteResponse.result.forEach(q => {
                        totalScanned++;
                        const price = q.regularMarketPrice;
                        const high = q.regularMarketDayHigh;
                        const low = q.regularMarketDayLow;
                        const pct = q.regularMarketChangePercent || 0;
                        const vol = q.regularMarketVolume || 0;
                        const avgVol = q.averageDailyVolume3Month || 1;
                        
                        if (price <= 0 || high <= 0 || low <= 0) return;
                        if (analysisQueue.some(x => x.symbol === q.symbol)) return;
                        
                        let shouldAnalyze = false;
                        let reason = '';
                        
                        // Strategy 1: Breakout Proximity (within 0.5% of Day High/Low)
                        const pctToHigh = (high - price) / price * 100;
                        const pctToLow = (price - low) / price * 100;
                        if (pctToHigh <= 0.5) { shouldAnalyze = true; reason = 'Near Day High'; }
                        else if (pctToLow <= 0.5) { shouldAnalyze = true; reason = 'Near Day Low'; }
                        
                        // Strategy 2: Strong Momentum (>1.5% move either way)
                        if (!shouldAnalyze && Math.abs(pct) >= 1.5) {
                            shouldAnalyze = true;
                            reason = pct > 0 ? 'Strong Rally +' + pct.toFixed(1) + '%' : 'Sharp Drop ' + pct.toFixed(1) + '%';
                        }
                        
                        // Strategy 3: Volume Spike (2x normal volume)
                        if (!shouldAnalyze && avgVol > 0 && vol > avgVol * 2) {
                            shouldAnalyze = true;
                            reason = 'Volume Spike ' + (vol/avgVol).toFixed(1) + 'x';
                        }
                        
                        // Strategy 4: Wide Range Day (day range > 2.5% = volatile stock)
                        if (!shouldAnalyze) {
                            const dayRange = (high - low) / low * 100;
                            if (dayRange >= 2.5) {
                                shouldAnalyze = true;
                                reason = 'Wide Range ' + dayRange.toFixed(1) + '%';
                            }
                        }
                        
                        if (shouldAnalyze && analysisQueue.length < 15) {
                            analysisQueue.push({ symbol: q.symbol, reason: reason, price: price, pct: pct });
                            flagged++;
                        }
                    });
                }
            } catch (e) { console.warn("Quote batch failed, skipping", e.message); }
        }
        
        const scanCurrent = document.getElementById('scanCurrent');
        if (scanCurrent) scanCurrent.textContent = `Scanned ${totalScanned} stocks → ${flagged} flagged → ${analysisQueue.length} in queue`;
    };
    
    fetchAllQuotes();
    masterQuoteTimer = setInterval(fetchAllQuotes, 8000); // 8s between full scans
}

/* === SCANNER MODULE === */
let sniperBusy = false;
function initScanner() {
    if (!masterQuoteTimer) startMasterQuotePoller();
    if (!scannerContextPromise) {
        scannerContextPromise = fetchYahoo('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?range=5d&interval=15m')
            .then(data => {
                scannerNiftyRaw = data?.chart?.result?.[0] || null;
                return scannerNiftyRaw;
            })
            .catch(() => null);
    }
    
    if (sniperTimer) clearInterval(sniperTimer);
    sniperTimer = setInterval(processAnalysisQueue, 3500); // 3.5s between each analysis
}

function scannerAnalyzeChart(chartResult, chart15m, niftyRaw) {
    // Extract arrays from Yahoo chart result and run the real Trading.analyze()
    const q = chartResult.indicators.quote[0];
    const ts = chartResult.timestamp || [];
    const closes = q.close || [];
    const highs = q.high || [];
    const lows = q.low || [];
    const vols = q.volume || [];
    const price = chartResult.meta.regularMarketPrice || closes[closes.length - 1];
    
    if (closes.length < 30) return null;
    
    // Get previous day data for pivots
    const prevDayData = Trading.getPrevDayDataAt(ts, highs, lows, closes, closes.length - 1);
    
    const lastTs = ts[ts.length - 1];
    const trend15m = chart15m ? Trading.get15mTrend(Trading.getSeriesSliceAtOrBefore(chart15m, lastTs)) : null;
    const niftyTrend = niftyRaw ? Trading.getNiftyTrend(Trading.getSeriesSliceAtOrBefore(niftyRaw, lastTs)) : null;
    const result = Trading.analyze(ts, closes, highs, lows, vols, price, trend15m, niftyTrend, prevDayData, 0, {});
    
    if (!result) return null;
    const plan = Trading.calcEntryExit(price, result.atr, result.overall, result.pivots);
    const qualityScore = result.confidence
        + (result.volumeOk ? 8 : 0)
        + (result.regime === 'TRENDING' ? 6 : 0)
        + (result.overall.includes('STRONG') ? 10 : 0)
        + (trend15m === result.dominantSide ? 8 : 0)
        + (niftyTrend === result.dominantSide ? 8 : 0);
    
    return {
        verdict: result.overall,
        confidence: result.confidence,
        qualityScore,
        setupName: result.setup ? result.setup.name : 'Unknown',
        verdictReason: result.verdictReason,
        atr: result.atr,
        vwap: result.vwap,
        regime: result.regime,
        plan,
        trend15m,
        niftyTrend,
        volRatio: result.volRatio
    };
}

async function processAnalysisQueue() {
    if (analysisQueue.length === 0) return;
    if (sniperBusy) return; // Prevent concurrent fetches
    sniperBusy = true;
    const item = analysisQueue.shift();
    const sym = item.symbol;
    
    try {
        const [data, data15m] = await Promise.all([
            fetch(`http://localhost:8080/api/chart/${sym}?range=5d&interval=5m`).then(r => r.json()),
            fetch(`http://localhost:8080/api/chart/${sym}?range=1mo&interval=15m`).then(r => r.json()).catch(() => null),
            scannerContextPromise
        ]);
        if (data.chart && data.chart.result && data.chart.result[0]) {
            const chartData = data.chart.result[0];
            const chart15m = data15m?.chart?.result?.[0] || null;
            const signal = scannerAnalyzeChart(chartData, chart15m, scannerNiftyRaw);
            
            if (!signal) { sniperBusy = false; return; }
            
            // Remove old entry for this stock
            scannerResults.buys = scannerResults.buys.filter(x => x.symbol !== sym);
            scannerResults.sells = scannerResults.sells.filter(x => x.symbol !== sym);
            
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
            
            const entry = {
                symbol: sym,
                signal: signal,
                price: item.price,
                pct: item.pct,
                reason: item.reason,
                time: timeStr,
                timestamp: now.getTime()
            };
            
            if (signal.verdict === 'STRONG BUY' || signal.verdict === 'BUY') {
                scannerResults.buys.push(entry);
                scannerResults.buys.sort((a, b) => b.signal.qualityScore - a.signal.qualityScore);
                if (scannerResults.buys.length > 10) scannerResults.buys.length = 10;
            } else if (signal.verdict === 'STRONG SELL' || signal.verdict === 'SELL') {
                scannerResults.sells.push(entry);
                scannerResults.sells.sort((a, b) => b.signal.qualityScore - a.signal.qualityScore);
                if (scannerResults.sells.length > 10) scannerResults.sells.length = 10;
            }
            renderScannerResults();
        }
    } catch (e) {
        console.error("Sniper failed for " + sym, e);
    }
    sniperBusy = false;
}

function renderScannerResults() {
    const bList = document.getElementById('scanBuysList');
    const sList = document.getElementById('scanSellsList');
    if(!bList || !sList) return;
    
    const renderCard = (item, index) => {
        const isBuy = item.signal.verdict.includes('BUY');
        const isStrong = item.signal.verdict.includes('STRONG');
        const pctColor = item.pct >= 0 ? 'var(--green)' : 'var(--red)';
        const pctText = (item.pct >= 0 ? '+' : '') + item.pct.toFixed(2) + '%';
        const plan = item.signal.plan;
        const planHtml = plan ? `<div class="sc-plan"><span>Entry <b>${fmt(plan.entry)}</b></span><span>SL <b>${fmt(plan.sl)}</b></span><span>Book <b>${fmt(plan.bookProfit || plan.target1)}</b></span></div>` : '';
        const ageMin = Math.max(0, Math.floor((Date.now() - item.timestamp) / 60000));
        const htf = `${item.signal.trend15m || '--'} / ${item.signal.niftyTrend || '--'}`;
        const vol = item.signal.volRatio ? item.signal.volRatio.toFixed(1) + 'x' : '--';
        
        return `<div class="scan-card ${isStrong ? 'strong' : ''}" onclick="loadStock('${item.symbol}')">
            <div class="sc-top">
                <span class="sc-sym"><b class="sc-rank">#${index + 1}</b>${item.symbol.replace('.NS','')}</span>
                <span class="sc-time">${ageMin ? ageMin + 'm ago' : item.time}</span>
            </div>
            <div class="sc-mid">
                <span class="sc-price">${fmt(item.price)}</span>
                <span class="sc-pct" style="color:${pctColor}">${pctText}</span>
            </div>
            <div class="sc-bot">
                <span class="sc-reason">${item.reason}</span>
                <span class="sc-conf" style="color:${isBuy ? 'var(--green)' : 'var(--red)'}">${item.signal.confidence}%</span>
            </div>
            ${planHtml}
            <div class="sc-meta"><span>15m/Nifty ${htf}</span><span>Vol ${vol}</span></div>
            <div class="sc-setup">${item.signal.setupName} · ${item.signal.verdict}</div>
        </div>`;
    };
    
    bList.innerHTML = scannerResults.buys.length > 0 
        ? scannerResults.buys.slice(0, 10).map(renderCard).join('') 
        : '<div class="scan-empty">Scanning for top 10 buy signals...<br><span style="font-size:11px">The scanner checks breakouts, momentum, volume spikes & wide range stocks</span></div>';
    sList.innerHTML = scannerResults.sells.length > 0 
        ? scannerResults.sells.slice(0, 10).map(renderCard).join('') 
        : '<div class="scan-empty">Scanning for top 10 sell signals...<br><span style="font-size:11px">The scanner checks breakdowns, momentum, volume spikes & wide range stocks</span></div>';
}

/* HELPERS */
function fmt(v){return'\u20B9'+Number(v).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}
function fmtAbs(v){return'\u20B9'+Math.abs(Number(v)).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}
function shortNum(n){if(n>=1e7)return(n/1e7).toFixed(2)+'Cr';if(n>=1e5)return(n/1e5).toFixed(2)+'L';if(n>=1e3)return(n/1e3).toFixed(1)+'K';return n.toString()}
function show(id){document.getElementById(id).style.display='block'}
function hide(...ids){ids.forEach(id=>document.getElementById(id).style.display='none')}


// ═══════════════════════════════════════════════════════
// STOCKPULSE AI CHATBOT — Production Module
// ═══════════════════════════════════════════════════════
let chatOpen = false;
let chatNewsCache = {};

function toggleChatbot() {
  chatOpen = !chatOpen;
  const panel = document.getElementById('chatPanel');
  const fab = document.getElementById('chatFab');
  if (chatOpen) {
    panel.classList.add('open');
    fab.classList.add('open');
    document.getElementById('chatInput')?.focus();
    // Update subtitle with current stock
    const sub = document.getElementById('chatSubtitle');
    if (sub) sub.textContent = currentSymbol ? 'Analyzing ' + currentSymbol.replace('.NS','') : 'Llama 3.1 70B \u00B7 Ready';
    // Pre-fetch news for current stock
    if (currentSymbol) fetchStockNews(currentSymbol);
  } else {
    panel.classList.remove('open');
    fab.classList.remove('open');
  }
}

function clearChat() {
  const box = document.getElementById('chatMessages');
  if (!box) return;
  box.innerHTML = `
    <div class="chat-welcome">
      <div class="chat-welcome-icon">\u2728</div>
      <div class="chat-welcome-title">Chat cleared!</div>
      <div class="chat-welcome-desc">Ask me anything about ${currentSymbol ? currentSymbol.replace('.NS','') : 'your stock'}.</div>
    </div>
  `;
}

async function fetchStockNews(symbol) {
  if (chatNewsCache[symbol] && Date.now() - chatNewsCache[symbol].ts < 120000) return chatNewsCache[symbol].data;
  try {
    const r = await fetch('http://localhost:8080/api/news/' + encodeURIComponent(symbol));
    if (!r.ok) throw new Error('News fetch failed');
    const data = await r.json();
    chatNewsCache[symbol] = { data: data.articles || [], ts: Date.now() };
    return chatNewsCache[symbol].data;
  } catch(e) {
    console.error('News fetch error:', e);
    return [];
  }
}

function buildChatContext() {
  const ctx = {
    symbol: currentSymbol || 'None selected',
    price: lastPrice || '--',
    change: '--',
    dayHigh: '--',
    dayLow: '--',
    prevClose: '--',
    volume: '--',
    signal: 'No signal',
    confidence: '--',
    vwap: '--',
    rsi: '--',
    supertrend: '--',
    adx: '--',
    atr: '--',
    setup: 'None',
    regime: niftyRegime ? niftyRegime.regime : 'Unknown',
    vix: vixValue ? vixValue.toFixed(1) : '--',
    sectorTrend: '--',
    entry: '--',
    sl: '--',
    t1: '--',
    t2: '--',
    rr: '--',
    orbHigh: orbData ? orbData.high : '--',
    orbLow: orbData ? orbData.low : '--',
    news: 'No recent news.'
  };

  // Fill from rawData
  if (rawData && rawData.meta) {
    const m = rawData.meta;
    ctx.prevClose = m.chartPreviousClose || m.previousClose || '--';
    ctx.dayHigh = m.regularMarketDayHigh || '--';
    ctx.dayLow = m.regularMarketDayLow || '--';
    ctx.volume = m.regularMarketVolume ? m.regularMarketVolume.toLocaleString('en-IN') : '--';
    const chg = lastPrice - (ctx.prevClose || lastPrice);
    const pct = ctx.prevClose ? ((chg / ctx.prevClose) * 100).toFixed(2) : '0';
    ctx.change = (chg >= 0 ? '+' : '') + chg.toFixed(2) + ' (' + (chg >= 0 ? '+' : '') + pct + '%)';
  }

  // Fill from analysisResult
  if (analysisResult) {
    ctx.signal = analysisResult.overall || 'No signal';
    ctx.confidence = analysisResult.confidence || '--';
    ctx.vwap = analysisResult.vwap ? analysisResult.vwap.toFixed(2) : '--';
    ctx.rsi = analysisResult.rsi ? analysisResult.rsi.toFixed(1) : '--';
    ctx.supertrend = analysisResult.supertrend || '--';
    ctx.adx = analysisResult.adx ? analysisResult.adx.toFixed(1) : '--';
    ctx.atr = analysisResult.atr ? analysisResult.atr.toFixed(2) : '--';
    ctx.setup = analysisResult.setup ? analysisResult.setup.name : 'None';
  }

  // Fill from calcResult
  if (calcResult) {
    ctx.entry = calcResult.entry ? calcResult.entry.toFixed(2) : '--';
    ctx.sl = calcResult.sl ? calcResult.sl.toFixed(2) : '--';
    ctx.t1 = calcResult.target1 ? calcResult.target1.toFixed(2) : '--';
    ctx.t2 = calcResult.target2 ? calcResult.target2.toFixed(2) : '--';
    if (calcResult.risk && calcResult.target1 && calcResult.entry) {
      const reward = Math.abs(calcResult.target1 - calcResult.entry);
      ctx.rr = '1:' + (reward / calcResult.risk).toFixed(1);
    }
  }

  // Fill ORB
  if (orbData && orbData.high) {
    ctx.orbHigh = orbData.high.toFixed(2);
    ctx.orbLow = orbData.low.toFixed(2);
  }

  // Fill news from cache
  if (chatNewsCache[currentSymbol] && chatNewsCache[currentSymbol].data.length) {
    ctx.news = chatNewsCache[currentSymbol].data
      .slice(0, 5)
      .map((a, i) => (i+1) + '. ' + a.title + (a.publisher ? ' (' + a.publisher + ')' : ''))
      .join('\n');
  }

  return ctx;
}

function addMessageBubble(role, text) {
  const box = document.getElementById('chatMessages');
  if (!box) return;

  // Remove welcome if present
  const welcome = box.querySelector('.chat-welcome');
  if (welcome) welcome.remove();

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + role;
  
  // Format AI responses: bold, italic etc.
  if (role === 'ai') {
    text = text
      .replace(/\*\*\[?(BUY|SELL|HOLD)\]?\*\*/gi, '<strong>[$1]</strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
    bubble.innerHTML = text;
  } else {
    bubble.textContent = text;
  }

  // Add timestamp
  const timeEl = document.createElement('div');
  timeEl.className = 'chat-bubble-time';
  timeEl.textContent = new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
  bubble.appendChild(timeEl);

  box.appendChild(bubble);
  box.scrollTop = box.scrollHeight;
}

function addTypingIndicator() {
  const box = document.getElementById('chatMessages');
  if (!box) return;
  const existing = box.querySelector('.chat-typing');
  if (existing) existing.remove();
  
  const el = document.createElement('div');
  el.className = 'chat-typing';
  el.innerHTML = '<div class="chat-typing-dot"></div><div class="chat-typing-dot"></div><div class="chat-typing-dot"></div>';
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

function removeTypingIndicator() {
  const box = document.getElementById('chatMessages');
  if (!box) return;
  const el = box.querySelector('.chat-typing');
  if (el) el.remove();
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const btn = document.getElementById('chatSendBtn');
  if (!input) return;

  const question = input.value.trim();
  if (!question) return;

  // Check if stock is loaded
  if (!currentSymbol) {
    addMessageBubble('error', 'Please select a stock first by clicking a chip or searching above.');
    return;
  }

  // Disable input
  input.value = '';
  input.disabled = true;
  btn.disabled = true;

  // Show user message
  addMessageBubble('user', question);

  // Show typing
  addTypingIndicator();

  // Pre-fetch news silently
  await fetchStockNews(currentSymbol);

  // Build context
  const context = buildChatContext();

  try {
    const r = await fetch('http://localhost:8080/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context })
    });

    removeTypingIndicator();

    if (!r.ok) {
      const errData = await r.json().catch(() => ({}));
      addMessageBubble('error', 'AI Error: ' + (errData.error || 'Service unavailable'));
    } else {
      const data = await r.json();
      addMessageBubble('ai', data.reply || 'No response received.');
    }
  } catch (e) {
    removeTypingIndicator();
    addMessageBubble('error', 'Network error: Could not reach AI service. Is the server running?');
  }

  // Re-enable input
  input.disabled = false;
  btn.disabled = false;
  input.focus();
}

function sendQuickQuestion(q) {
  const input = document.getElementById('chatInput');
  if (input) {
    input.value = q;
    sendChatMessage();
  }
}
