'use client';

import { motion } from 'framer-motion';
import { UserPlus, Search, TrendingUp } from 'lucide-react';

const steps = [
  {
    icon: <UserPlus size={24} />,
    step: '01',
    title: 'Create Your Account',
    desc: 'Sign up in 30 seconds. No credit card needed. Get instant access to all features with our free plan.',
    color: '#2962FF',
  },
  {
    icon: <Search size={24} />,
    step: '02',
    title: 'Search & Analyze',
    desc: 'Search any NSE stock and get real-time technical analysis, AI-powered signals, and TradingView-style gauges.',
    color: '#00BCD4',
  },
  {
    icon: <TrendingUp size={24} />,
    step: '03',
    title: 'Trade with Confidence',
    desc: 'Execute trades with precise entry, stop-loss, and target levels. Track your portfolio P&L in real time.',
    color: '#00E676',
  },
];

export default function HowItWorks() {
  return (
    <section style={{
      padding: '100px 0',
      background: 'var(--bg-surface)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>
            Get Started in{' '}
            <span className="text-gradient">3 Simple Steps</span>
          </h2>
          <p>From sign-up to your first trade — it takes less than 2 minutes.</p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '32px',
          position: 'relative',
        }}>
          {/* Connecting Line */}
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '16.5%',
            right: '16.5%',
            height: '2px',
            background: 'linear-gradient(90deg, var(--accent), var(--accent-cyan), var(--green))',
            opacity: 0.3,
            zIndex: 0,
            display: 'var(--show-line, block)',
          }} />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              style={{
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: `${step.color}10`,
                border: `2px solid ${step.color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                position: 'relative',
                color: step.color,
                transition: 'all 0.3s ease',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: -4,
                  borderRadius: '50%',
                  background: `${step.color}08`,
                  animation: 'pulse 3s ease-in-out infinite',
                  animationDelay: `${i * 0.5}s`,
                }} />
                {step.icon}
              </div>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: step.color,
                letterSpacing: '0.1em',
                marginBottom: 8,
                textTransform: 'uppercase',
              }}>
                Step {step.step}
              </div>
              <h3 style={{ marginBottom: 10, fontSize: '1.2rem' }}>{step.title}</h3>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          div[style*="--show-line"] {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
