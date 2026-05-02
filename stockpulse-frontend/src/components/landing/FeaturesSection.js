'use client';

import { motion } from 'framer-motion';
import {
  Activity, BarChart3, Brain, Target, LineChart, Search
} from 'lucide-react';
import styles from './FeaturesSection.module.css';

const features = [
  {
    icon: <Activity size={24} />,
    title: 'Real-Time Signals',
    desc: 'AI-powered BUY/SELL signals with 85%+ confidence scoring. Get instant entry, stop-loss, and target levels for every trade.',
    color: '#2962FF',
  },
  {
    icon: <LineChart size={24} />,
    title: 'Live Candlestick Charts',
    desc: 'TradingView-powered interactive charts with 1-minute to monthly timeframes. Draw, annotate, and analyze price action.',
    color: '#00BCD4',
  },
  {
    icon: <Brain size={24} />,
    title: 'AI Trading Advisor',
    desc: 'Ask questions, get context-aware analysis powered by Llama 3.1 70B. Your personal institutional-grade research assistant.',
    color: '#7C4DFF',
  },
  {
    icon: <Target size={24} />,
    title: 'Smart Backtesting',
    desc: 'Validate your strategies on historical data before risking real capital. Test across multiple stocks and timeframes.',
    color: '#00E676',
  },
  {
    icon: <BarChart3 size={24} />,
    title: 'Technical Gauges',
    desc: 'TradingView-style oscillator and moving average gauges showing Strong Buy to Strong Sell verdicts at a glance.',
    color: '#FFD740',
  },
  {
    icon: <Search size={24} />,
    title: 'Multi-Stock Scanner',
    desc: 'Scan NIFTY 50 and sector stocks for breakout opportunities. Momentum, volume, and volatility strategies built-in.',
    color: '#FF9100',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
};

export default function FeaturesSection() {
  return (
    <section id="features" className={styles.features}>
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>
            Everything You Need to{' '}
            <span className="text-gradient">Trade Smarter</span>
          </h2>
          <p>
            Institutional-grade tools built for Indian markets. From signal generation 
            to AI-powered analysis — all in one platform.
          </p>
        </motion.div>

        <motion.div
          className={styles.grid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {features.map((f, i) => (
            <motion.div key={i} className={styles.featureCard} variants={itemVariants}>
              <div className={styles.cardGlow} style={{ background: `radial-gradient(circle at 30% 30%, ${f.color}08, transparent 70%)` }} />
              <div className={styles.iconWrap} style={{ background: `${f.color}12`, color: f.color, borderColor: `${f.color}25` }}>
                {f.icon}
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <div className={styles.cardLine} style={{ background: `linear-gradient(90deg, ${f.color}, transparent)` }} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
