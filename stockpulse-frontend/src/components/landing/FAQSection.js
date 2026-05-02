'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Is StockPulse really free?',
    a: 'Yes! Our free plan gives you access to real-time price data, basic technical indicators, and paper trading. No credit card required to get started.',
  },
  {
    q: 'Which exchanges do you support?',
    a: 'StockPulse currently supports NSE (National Stock Exchange) and BSE (Bombay Stock Exchange). We track 50+ major stocks including all NIFTY 50 companies.',
  },
  {
    q: 'How accurate are the trading signals?',
    a: 'Our signal engine uses a multi-indicator confluence system (VWAP, RSI, Supertrend, ADX, Bollinger Bands) and achieves 85%+ confidence on high-conviction signals. We always recommend using proper risk management.',
  },
  {
    q: 'Can I use StockPulse for live trading?',
    a: 'StockPulse provides analysis and signals — it does not execute trades directly. You can use our signals alongside your broker (Zerodha, Groww, Angel One, etc.) to make informed trading decisions.',
  },
  {
    q: 'Is my data secure?',
    a: 'Absolutely. We use industry-standard encryption, JWT authentication, and never store sensitive financial data. Your portfolio and watchlist data is stored securely and only accessible by you.',
  },
  {
    q: 'Do you offer mobile apps?',
    a: 'StockPulse is a fully responsive web application that works beautifully on all devices. Our PWA (Progressive Web App) can be installed on your phone for a native app-like experience.',
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState(null);

  return (
    <section id="faq" style={{
      padding: '100px 0',
      background: 'var(--bg-primary)',
    }}>
      <div className="container" style={{ maxWidth: '780px' }}>
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>
            Frequently Asked{' '}
            <span className="text-gradient">Questions</span>
          </h2>
          <p>Everything you need to know about StockPulse.</p>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              style={{
                borderRadius: 'var(--radius-lg)',
                background: open === i
                  ? 'linear-gradient(135deg, rgba(41, 98, 255, 0.06) 0%, rgba(0, 188, 212, 0.03) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                border: `1px solid ${open === i ? 'rgba(41, 98, 255, 0.2)' : 'var(--border)'}`,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
              }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20px 24px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                }}
              >
                {faq.q}
                <motion.div
                  animate={{ rotate: open === i ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ flexShrink: 0, color: 'var(--text-muted)' }}
                >
                  <ChevronDown size={18} />
                </motion.div>
              </button>

              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <div style={{
                      padding: '0 24px 20px',
                      fontSize: '0.92rem',
                      lineHeight: 1.7,
                      color: 'var(--text-secondary)',
                    }}>
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
