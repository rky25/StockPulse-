'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import styles from './TechnicalShowcase.module.css';

const indicators = [
  { label: 'RSI (14)', value: 58.4, verdict: 'Neutral', color: '#FFD740' },
  { label: 'MACD', value: 72, verdict: 'Buy', color: '#00E676' },
  { label: 'Stochastic', value: 45.2, verdict: 'Neutral', color: '#FFD740' },
  { label: 'CCI (20)', value: 82, verdict: 'Buy', color: '#00E676' },
  { label: 'ADX (14)', value: 34.8, verdict: 'Trending', color: '#2962FF' },
  { label: 'Williams %R', value: 28, verdict: 'Sell', color: '#FF1744' },
];

const movingAverages = [
  { label: 'SMA (20)', action: 'Buy', price: '₹1,418.30', color: '#00E676' },
  { label: 'EMA (20)', action: 'Buy', price: '₹1,421.50', color: '#00E676' },
  { label: 'SMA (50)', action: 'Buy', price: '₹1,385.60', color: '#00E676' },
  { label: 'EMA (50)', action: 'Sell', price: '₹1,442.10', color: '#FF1744' },
  { label: 'SMA (200)', action: 'Buy', price: '₹1,310.80', color: '#00E676' },
];

function GaugeMeter({ value, inView }) {
  const angle = (value / 100) * 180 - 90;
  return (
    <svg width="200" height="110" viewBox="0 0 200 110">
      {/* Background arc */}
      <path
        d="M 20 100 A 80 80 0 0 1 180 100"
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* Colored segments */}
      <path d="M 20 100 A 80 80 0 0 1 55 35" fill="none" stroke="#FF1744" strokeWidth="8" strokeLinecap="round" opacity="0.4" />
      <path d="M 55 35 A 80 80 0 0 1 100 20" fill="none" stroke="#FF9100" strokeWidth="8" strokeLinecap="round" opacity="0.4" />
      <path d="M 100 20 A 80 80 0 0 1 145 35" fill="none" stroke="#FFD740" strokeWidth="8" strokeLinecap="round" opacity="0.4" />
      <path d="M 145 35 A 80 80 0 0 1 180 100" fill="none" stroke="#00E676" strokeWidth="8" strokeLinecap="round" opacity="0.4" />
      {/* Needle */}
      <motion.line
        x1="100"
        y1="100"
        x2="100"
        y2="30"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ rotate: -90 }}
        animate={inView ? { rotate: angle } : { rotate: -90 }}
        transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 }}
        style={{ transformOrigin: '100px 100px' }}
      />
      {/* Center dot */}
      <circle cx="100" cy="100" r="5" fill="white" />
      <circle cx="100" cy="100" r="3" fill="var(--accent)" />
    </svg>
  );
}

export default function TechnicalShowcase() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section style={{
      padding: '100px 0',
      background: 'var(--bg-surface)',
    }}>
      <div className="container" ref={ref}>
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>
            TradingView-Style{' '}
            <span className="text-gradient">Technical Analysis</span>
          </h2>
          <p>See at a glance whether to buy, sell, or hold. Our gauges aggregate oscillators and moving averages into clear, actionable verdicts.</p>
        </motion.div>

        <div className={styles.showcaseGrid}>
          {/* Gauge Panel */}
          <motion.div
            className={styles.gaugePanel}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.gaugePanelHeader}>
              <h3>Master Verdict</h3>
              <span className={styles.verdictBadge} style={{ background: 'rgba(0, 230, 118, 0.1)', color: '#00E676', border: '1px solid rgba(0, 230, 118, 0.2)' }}>
                BUY
              </span>
            </div>
            <div className={styles.gaugeCenter}>
              <GaugeMeter value={68} inView={isInView} />
              <div className={styles.gaugeLabel}>
                <span style={{ color: '#00E676', fontWeight: 700, fontSize: '1.1rem' }}>BUY</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>68/100 Confidence</span>
              </div>
            </div>
            <div className={styles.gaugeScale}>
              <span style={{ color: '#FF1744' }}>Strong Sell</span>
              <span style={{ color: '#FFD740' }}>Neutral</span>
              <span style={{ color: '#00E676' }}>Strong Buy</span>
            </div>
          </motion.div>

          {/* Indicators Panel */}
          <motion.div
            className={styles.indicatorsPanel}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <h3 style={{ marginBottom: 16 }}>Oscillators</h3>
            <div className={styles.indicatorsList}>
              {indicators.map((ind, i) => (
                <motion.div
                  key={i}
                  className={styles.indicatorRow}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                >
                  <span className={styles.indLabel}>{ind.label}</span>
                  <div className={styles.indBar}>
                    <motion.div
                      className={styles.indFill}
                      initial={{ width: 0 }}
                      animate={isInView ? { width: `${ind.value}%` } : { width: 0 }}
                      transition={{ duration: 0.8, delay: 0.4 + i * 0.08 }}
                      style={{ background: ind.color }}
                    />
                  </div>
                  <span className={styles.indVerdict} style={{ color: ind.color }}>{ind.verdict}</span>
                </motion.div>
              ))}
            </div>

            <h3 style={{ marginTop: 24, marginBottom: 16 }}>Moving Averages</h3>
            <div className={styles.maList}>
              {movingAverages.map((ma, i) => (
                <motion.div
                  key={i}
                  className={styles.maRow}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.6 + i * 0.06 }}
                >
                  <span>{ma.label}</span>
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{ma.price}</span>
                  <span className={styles.maAction} style={{ color: ma.color, background: `${ma.color}15` }}>
                    {ma.action}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
