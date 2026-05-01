const https = require('https');
const fs = require('fs');
const { Trading } = require('./trading');

// NIFTY 50 top constituents
const STOCKS = [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'INFY.NS',
    'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'HINDUNILVR.NS', 'LT.NS',
    'BAJFINANCE.NS', 'AXISBANK.NS', 'KOTAKBANK.NS', 'MARUTI.NS', 'TATAMOTORS.NS',
    'SUNPHARMA.NS', 'TITAN.NS', 'ASIANPAINT.NS', 'ULTRACEMCO.NS', 'HCLTECH.NS'
];

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try { resolve(JSON.parse(data)); }
                    catch (e) { reject(e); }
                } else {
                    reject(new Error(`Status Code: ${res.statusCode} for ${url}`));
                }
            });
        }).on('error', reject);
        
        req.setTimeout(10000, () => {
            req.abort();
            reject(new Error('Timeout'));
        });
    });
}

async function getChartData(symbol, range, interval) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const json = await fetchJson(url);
            if (json && json.chart && json.chart.result && json.chart.result[0]) {
                return json.chart.result[0];
            }
            throw new Error('Invalid data format');
        } catch (e) {
            if (i === maxRetries - 1) {
                console.warn(`Failed to fetch data for ${symbol} after ${maxRetries} attempts:`, e.message);
                return null;
            }
            await new Promise(r => setTimeout(r, 1000 * (i + 1))); // exponential backoff
        }
    }
}

async function runBacktest() {
    console.log(`Starting Phase 1 Backtest Runner...`);
    console.log(`Testing across ${STOCKS.length} stocks using 60-day range.`);
    
    // 1. Fetch market context data
    console.log(`Fetching NIFTY and VIX context data...`);
    const [rawNifty, rawVix] = await Promise.all([
        getChartData('%5ENSEI', '60d', '15m'),
        getChartData('%5EINDIAVIX', '60d', '5m') // Use 5m so we have enough history
    ]);

    if (!rawNifty || !rawVix) {
        console.error("Failed to fetch market context (Nifty/VIX). Aborting backtest.");
        return;
    }

    const results = [];
    let totalGrossPnl = 0;
    let totalNetPnl = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let totalTrades = 0;
    let totalSampleDays = 0;
    const setupStats = {};
    
    // 2. Iterate through stocks
    for (const sym of STOCKS) {
        console.log(`Processing ${sym}...`);
        console.log(`  -> Fetching 5m and 15m data for ${sym}`);
        const [raw5m, raw15m] = await Promise.all([
            getChartData(sym, '60d', '5m'),
            getChartData(sym, '60d', '15m')
        ]);

        if (!raw5m || !raw15m) {
            console.warn(`  -> Skipping ${sym} due to missing data.`);
            continue;
        }

        console.log(`  -> Data fetched. Running backtestStrategy...`);
        const result = Trading.backtestStrategy(raw5m, raw15m, rawNifty, rawVix);
        console.log(`  -> backtestStrategy finished.`);
        if (result && result.summary.trades > 0) {
            results.push({ symbol: sym, summary: result.summary });
            
            totalTrades += result.summary.trades;
            totalWins += result.summary.wins;
            totalLosses += result.summary.losses;
            totalGrossPnl += result.summary.grossPnl;
            totalNetPnl += result.summary.netPnl;
            totalSampleDays = Math.max(totalSampleDays, result.summary.sampleDays);
            
            // Accumulate setup stats
            for (const trade of result.trades) {
                const name = trade.setupName || 'Unknown Setup';
                if (!setupStats[name]) setupStats[name] = { trades: 0, wins: 0, netPnl: 0 };
                setupStats[name].trades++;
                if (trade.netPnl > 0) setupStats[name].wins++;
                setupStats[name].netPnl += trade.netPnl;
            }

            console.log(`  -> ${result.summary.trades} trades | Win Rate: ${result.summary.winRate}% | Net: Rs ${result.summary.netPnl.toFixed(2)}`);
        } else {
            console.log(`  -> No valid trades found for ${sym}.`);
        }
    }

    // 3. Aggregate metrics
    const winRate = totalTrades > 0 ? (totalWins / totalTrades * 100).toFixed(1) : 0;
    const expectancy = totalTrades > 0 ? (totalNetPnl / totalTrades).toFixed(2) : 0;
    
    const overallSummary = {
        timestamp: new Date().toISOString(),
        description: "Phase 1: Validate the Edge (60d sample with realistic NSE costs + 2bps slippage)",
        stocksTested: STOCKS.length,
        maxSampleDays: totalSampleDays,
        totalTrades,
        totalWins,
        totalLosses,
        winRate: Number(winRate),
        totalGrossPnl: Number(totalGrossPnl.toFixed(2)),
        totalNetPnl: Number(totalNetPnl.toFixed(2)),
        expectancyPerTrade: Number(expectancy),
        setupStats
    };

    console.log(`\n========================================`);
    console.log(`BACKTEST COMPLETE`);
    console.log(`Total Trades : ${overallSummary.totalTrades}`);
    console.log(`Win Rate     : ${overallSummary.winRate}%`);
    console.log(`Gross P&L    : Rs ${overallSummary.totalGrossPnl}`);
    console.log(`Net P&L      : Rs ${overallSummary.totalNetPnl}`);
    console.log(`Expectancy   : Rs ${overallSummary.expectancyPerTrade} per trade`);
    console.log(`Gate Status  : ${overallSummary.expectancyPerTrade >= 0 ? 'PASSED (>= Rs 0)' : 'FAILED (< Rs 0)'}`);
    console.log(`\n--- SETUP PERFORMANCE ---`);
    for (const [name, stats] of Object.entries(setupStats).sort((a,b) => b[1].netPnl - a[1].netPnl)) {
        const wr = stats.trades > 0 ? (stats.wins / stats.trades * 100).toFixed(1) : 0;
        const exp = stats.trades > 0 ? (stats.netPnl / stats.trades).toFixed(2) : 0;
        console.log(`${name.padEnd(25)}: ${String(stats.trades).padStart(4)} trades | WR: ${String(wr).padStart(5)}% | Net: Rs ${stats.netPnl.toFixed(2).padStart(8)} | Exp: Rs ${exp}`);
    }
    console.log(`========================================\n`);

    // 4. Save history
    const historyFile = 'backtest_history.json';
    let history = [];
    if (fs.existsSync(historyFile)) {
        try {
            history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
        } catch(e) {}
    }
    
    const runData = {
        summary: overallSummary,
        details: results
    };
    
    history.push(runData);
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
    console.log(`Results saved to ${historyFile}`);
}

runBacktest().catch(console.error);
