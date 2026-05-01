'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries, CrosshairMode, LineStyle } from 'lightweight-charts';

export default function TradingChart({ symbol, onDataReady }) {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const seriesRefs = useRef({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let chart, candleSeries, vwapSeries, orbHighSeries, orbLowSeries;
    let isInitialRender = true;

    const fetchDataAndDraw = async () => {
      try {
        if (isInitialRender) setLoading(true);
        // Fetch 5-minute intraday data
        const res = await fetch(`/api/proxy/chart/${symbol}?interval=5m&range=5d`);
        const data = await res.json();
        
        const result = data?.chart?.result?.[0];
        if (!result || !result.timestamp) {
          throw new Error("No data available");
        }

        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];
        
        // Parse raw data into cleanly formatted objects
        let candles = [];
        for (let i = 0; i < timestamps.length; i++) {
          if (quotes.open[i] !== null && quotes.close[i] !== null) {
            // lightweight-charts needs time in seconds
            // Adjust to IST timezone if necessary, but Unix timestamp is standard
            candles.push({
              time: timestamps[i] + 19800, // + 5.5 hours for IST offset (if backend is raw UTC)
              open: quotes.open[i],
              high: quotes.high[i],
              low: quotes.low[i],
              close: quotes.close[i],
              volume: quotes.volume[i] || 0
            });
          }
        }
        
        if (candles.length === 0) throw new Error("Empty candle data");

        // --- CALCULATION LOGIC ---
        // Group by day to calculate VWAP and ORB correctly
        let dailyVWAP = [];
        let orbData = { high: [], low: [] };
        
        // We need to identify days. A day changes when the date string changes.
        let currentDay = null;
        let cumVol = 0;
        let cumVolPrice = 0;
        let dayCandleCount = 0;
        let currentOrbHigh = null;
        let currentOrbLow = null;

        for (let i = 0; i < candles.length; i++) {
          const c = candles[i];
          const dateStr = new Date(c.time * 1000).toDateString();
          
          if (dateStr !== currentDay) {
            // New Day Reset
            currentDay = dateStr;
            cumVol = 0;
            cumVolPrice = 0;
            dayCandleCount = 0;
            currentOrbHigh = -Infinity;
            currentOrbLow = Infinity;
          }
          
          // VWAP Calculation
          const typPrice = (c.high + c.low + c.close) / 3;
          cumVol += c.volume;
          cumVolPrice += typPrice * c.volume;
          const vwapVal = cumVol > 0 ? cumVolPrice / cumVol : c.close;
          dailyVWAP.push({ time: c.time, value: vwapVal });
          
          // ORB Calculation (First 15 mins = first 3 candles of 5m timeframe)
          if (dayCandleCount < 3) {
            if (c.high > currentOrbHigh) currentOrbHigh = c.high;
            if (c.low < currentOrbLow) currentOrbLow = c.low;
          }
          orbData.high.push({ time: c.time, value: currentOrbHigh });
          orbData.low.push({ time: c.time, value: currentOrbLow });
          
          dayCandleCount++;
        }

        // --- CHART INITIALIZATION OR UPDATE ---
        if (chartContainerRef.current) {
          if (!chartRef.current) {
            chartRef.current = createChart(chartContainerRef.current, {
              width: chartContainerRef.current.clientWidth,
              height: 400,
              layout: {
                background: { type: 'solid', color: 'transparent' },
                textColor: '#9E9E9E',
              },
              grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
              },
              crosshair: {
                mode: CrosshairMode.Normal,
              },
              rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
              },
              timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                timeVisible: true,
                secondsVisible: false,
              },
            });

            // Price Candlesticks
            seriesRefs.current.candle = chartRef.current.addSeries(CandlestickSeries, {
              upColor: '#00C853',
              downColor: '#FF5252',
              borderVisible: false,
              wickUpColor: '#00C853',
              wickDownColor: '#FF5252',
            });

            // VWAP Line
            seriesRefs.current.vwap = chartRef.current.addSeries(LineSeries, {
              color: '#FF9800',
              lineWidth: 2,
              title: 'VWAP',
              crosshairMarkerVisible: true,
            });

            // ORB High Line
            seriesRefs.current.orbHigh = chartRef.current.addSeries(LineSeries, {
              color: 'rgba(0, 200, 83, 0.6)',
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              title: 'ORB High',
              crosshairMarkerVisible: false,
            });

            // ORB Low Line
            seriesRefs.current.orbLow = chartRef.current.addSeries(LineSeries, {
              color: 'rgba(255, 82, 82, 0.6)',
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              title: 'ORB Low',
              crosshairMarkerVisible: false,
            });
          }

          // Update Data
          seriesRefs.current.candle.setData(candles);
          seriesRefs.current.vwap.setData(dailyVWAP);
          seriesRefs.current.orbHigh.setData(orbData.high);
          seriesRefs.current.orbLow.setData(orbData.low);

          // Auto scale to the most recent day only on first load
          if (isInitialRender) {
             chartRef.current.timeScale().fitContent();
             isInitialRender = false;
          }
        }
        
        if (onDataReady) {
           onDataReady(candles);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Chart Error:", err);
        if (isInitialRender) setError("Failed to load chart data");
        setLoading(false);
      }
    };

    fetchDataAndDraw();
    const intervalId = setInterval(fetchDataAndDraw, 2000);

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [symbol]);

  if (error) return <div style={{ padding: '20px', color: '#FF5252' }}>{error}</div>;

  return (
    <div style={{ position: 'relative', width: '100%', height: '400px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', zIndex: 10 }}>
          <div className="spinner" style={{ width: 30, height: 30, border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
      )}
      <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
