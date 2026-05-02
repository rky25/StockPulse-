'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, BarChart3, Zap, TrendingUp } from 'lucide-react';

const stats = [
  { icon: <Users size={22} />, value: 500, suffix: '+', label: 'Active Traders', color: '#2962FF' },
  { icon: <BarChart3 size={22} />, value: 50, suffix: '+', label: 'NSE Stocks Tracked', color: '#00BCD4' },
  { icon: <Zap size={22} />, value: 3, suffix: 's', label: 'Data Refresh Rate', color: '#7C4DFF' },
  { icon: <TrendingUp size={22} />, value: 85, suffix: '%+', label: 'Signal Accuracy', color: '#00E676' },
];

function AnimatedNumber({ value, suffix, inView }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = value / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [inView, value]);

  return <>{count}{suffix}</>;
}

export default function StatsCounter() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="markets" style={{
      padding: '60px 0',
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      position: 'relative',
    }}>
      <div className="container" ref={ref}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '24px',
        }}>
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                textAlign: 'center',
                padding: '32px 20px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px solid var(--border)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                cursor: 'default',
              }}
              whileHover={{
                y: -4,
                borderColor: 'rgba(41, 98, 255, 0.2)',
                boxShadow: `0 8px 30px rgba(0,0,0,0.2), 0 0 30px ${stat.color}15`,
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `${stat.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: stat.color,
                border: `1px solid ${stat.color}25`,
              }}>
                {stat.icon}
              </div>
              <div style={{
                fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
                marginBottom: 4,
                background: `linear-gradient(135deg, ${stat.color}, #fff)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                <AnimatedNumber value={stat.value} suffix={stat.suffix} inView={isInView} />
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
