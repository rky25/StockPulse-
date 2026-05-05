'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart3, Shield, Zap, TrendingUp, ArrowRight } from 'lucide-react';
import styles from './HeroSection.module.css';

const words = ['AI-Powered Signals', 'Real-Time Charts', 'Technical Analysis', 'Smart Trading'];

const DEFAULT_TICKER = [
  { symbol: 'RELIANCE', price: '₹1,430.80', change: '+0.38%', up: true },
  { symbol: 'TCS', price: '₹3,842.15', change: '+1.24%', up: true },
  { symbol: 'HDFCBANK', price: '₹1,678.30', change: '-0.15%', up: false },
  { symbol: 'INFY', price: '₹1,567.90', change: '-0.52%', up: false },
  { symbol: 'ICICIBANK', price: '₹1,245.60', change: '+0.89%', up: true },
  { symbol: 'SBIN', price: '₹812.45', change: '+1.12%', up: true },
  { symbol: 'ITC', price: '₹442.30', change: '+0.67%', up: true },
  { symbol: 'BHARTIARTL', price: '₹1,654.20', change: '-0.33%', up: false },
];

async function fetchQuote(symbol) {
  try {
    const res = await fetch(`/api/proxy/chart/${symbol}.NS?interval=1d&range=1d`);
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const change = meta.regularMarketPrice - meta.chartPreviousClose;
    const changePct = +((change / meta.chartPreviousClose) * 100).toFixed(2);
    return {
      symbol: symbol,
      price: `₹${meta.regularMarketPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `${changePct >= 0 ? '+' : ''}${changePct}%`,
      up: change >= 0
    };
  } catch { return null; }
}

export default function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [stocks, setStocks] = useState(DEFAULT_TICKER);

  useEffect(() => {
    let mounted = true;
    const fetchLive = async () => {
      try {
        const promises = DEFAULT_TICKER.map(s => fetchQuote(s.symbol));
        const results = await Promise.all(promises);
        if (!mounted) return;
        const newStocks = DEFAULT_TICKER.map((def, i) => results[i] || def);
        setStocks(newStocks);
      } catch {}
    };
    fetchLive();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const current = words[wordIndex];
    let timeout;

    if (!isDeleting && displayed.length < current.length) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 80);
    } else if (!isDeleting && displayed.length === current.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length - 1)), 40);
    } else if (isDeleting && displayed.length === 0) {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
    }

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, wordIndex]);

  const barHeights = [30, 55, 40, 70, 50, 85, 60, 75, 90, 65, 80, 55, 70, 45, 60];
  const rel = stocks.find(s => s.symbol === 'RELIANCE') || stocks[0];
  const tcs = stocks.find(s => s.symbol === 'TCS') || stocks[1];
  const infy = stocks.find(s => s.symbol === 'INFY') || stocks[3];

  return (
    <section className={styles.hero}>
      {/* Animated Background */}
      <div className={styles.heroBg}>
        <div className={styles.gridBg} />
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={`${styles.orb} ${styles.orb3}`} />
      </div>

      <div className="container">
        <div className={styles.heroContent}>
          <motion.div
            className={styles.heroBadge}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className={styles.liveDot} />
            Live Market Data • NSE & BSE
          </motion.div>

          <motion.h1
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Track. Analyze.{' '}
            <br />
            <span className="text-gradient">{displayed}</span>
            <span className={styles.cursor}>|</span>
          </motion.h1>

          <motion.p
            className={styles.heroSubtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Professional-grade stock analysis for Indian markets. Real-time signals, 
            TradingView-style technical gauges, and AI-powered insights — all in one 
            beautiful terminal.
          </motion.p>

          <motion.div
            className={styles.heroCTAs}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Link href="/signin" className={`btn btn-primary btn-lg ${styles.ctaPrimary}`}>
              Start Free <ArrowRight size={18} />
            </Link>
            <a href="#features" className="btn btn-secondary btn-lg">
              Explore Features
            </a>
          </motion.div>

          <motion.div
            className={styles.trustRow}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <span className={styles.trustItem}>
              <BarChart3 size={16} className={styles.trustIcon} />
              50+ NSE Stocks
            </span>
            <span className={styles.trustDivider} />
            <span className={styles.trustItem}>
              <Zap size={16} className={styles.trustIcon} />
              3-Sec Updates
            </span>
            <span className={styles.trustDivider} />
            <span className={styles.trustItem}>
              <Shield size={16} className={styles.trustIcon} />
              85%+ Confidence
            </span>
          </motion.div>

          {/* Terminal Preview */}
          <motion.div
            className={styles.heroPreview}
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.5, ease: 'easeOut' }}
          >
            <div className={styles.previewGlow} />
            <div className={styles.previewFrame}>
              <div className={styles.previewBar}>
                <div className={styles.previewDots}>
                  <div className={styles.previewDot} style={{ background: '#FF5F57' }} />
                  <div className={styles.previewDot} style={{ background: '#FEBC2E' }} />
                  <div className={styles.previewDot} style={{ background: '#28C840' }} />
                </div>
                <span className={styles.previewTitle}>
                  StockPulse Terminal — RELIANCE.NS
                </span>
                <div className={styles.previewLive}>
                  <span className={styles.liveDotSmall} /> LIVE
                </div>
              </div>
              <div className={styles.previewContent}>
                <div className={styles.miniCard}>
                  <div className={styles.miniCardHeader}>
                    <div className={styles.miniCardLabel}>{rel.symbol}</div>
                    <div className={`${styles.miniCardChange} ${rel.up ? styles.changeUp : styles.changeDown}`}>{rel.change}</div>
                  </div>
                  <div className={styles.miniCardValue}>{rel.price}</div>
                  <div className={styles.miniChart}>
                    {barHeights.map((h, i) => (
                      <div key={i} className={`${styles.miniBar} ${!rel.up ? styles.miniBarRed : ''}`} style={{ height: `${h}%`, animationDelay: `${i * 0.05}s` }} />
                    ))}
                  </div>
                </div>
                <div className={styles.miniCard}>
                  <div className={styles.miniCardHeader}>
                    <div className={styles.miniCardLabel}>{tcs.symbol}</div>
                    <div className={`${styles.miniCardChange} ${tcs.up ? styles.changeUp : styles.changeDown}`}>{tcs.change}</div>
                  </div>
                  <div className={styles.miniCardValue}>{tcs.price}</div>
                  <div className={styles.miniChart}>
                    {barHeights.slice().reverse().map((h, i) => (
                      <div key={i} className={`${styles.miniBar} ${!tcs.up ? styles.miniBarRed : ''}`} style={{ height: `${h}%`, animationDelay: `${i * 0.05}s` }} />
                    ))}
                  </div>
                </div>
                <div className={styles.miniCard}>
                  <div className={styles.miniCardHeader}>
                    <div className={styles.miniCardLabel}>{infy.symbol}</div>
                    <div className={`${styles.miniCardChange} ${infy.up ? styles.changeUp : styles.changeDown}`}>{infy.change}</div>
                  </div>
                  <div className={styles.miniCardValue}>{infy.price}</div>
                  <div className={styles.miniChart}>
                    {barHeights.map((h, i) => (
                      <div key={i} className={`${styles.miniBar} ${!infy.up ? styles.miniBarRed : ''}`} style={{ height: `${(h + i * 3) % 100}%`, animationDelay: `${i * 0.05}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stock Ticker */}
      <div className={styles.tickerWrap}>
        <div className={styles.ticker}>
          {[...stocks, ...stocks].map((stock, i) => (
            <div key={i} className={styles.tickerItem}>
              <span className={styles.tickerSymbol}>{stock.symbol}</span>
              <span className={styles.tickerPrice}>{stock.price}</span>
              <span className={stock.up ? styles.tickerUp : styles.tickerDown}>
                {stock.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
