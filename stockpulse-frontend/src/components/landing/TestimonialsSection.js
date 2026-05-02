'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Arun Sharma',
    role: 'Day Trader, Mumbai',
    avatar: 'AS',
    stars: 5,
    text: 'StockPulse transformed my trading. The AI signals are incredibly accurate, and the real-time gauges save me hours of manual analysis.',
    color: '#2962FF',
  },
  {
    name: 'Priya Patel',
    role: 'Swing Trader, Bangalore',
    avatar: 'PP',
    stars: 5,
    text: 'The best stock analysis platform I\'ve used for Indian markets. The TradingView-style charts and backtesting tools are world-class.',
    color: '#00BCD4',
  },
  {
    name: 'Vikram Singh',
    role: 'Portfolio Manager, Delhi',
    avatar: 'VS',
    stars: 5,
    text: 'We use StockPulse for our institutional desk. The multi-stock scanner and signal confidence scoring is exactly what professional traders need.',
    color: '#7C4DFF',
  },
  {
    name: 'Meera Joshi',
    role: 'Retail Investor, Pune',
    avatar: 'MJ',
    stars: 4,
    text: 'As a beginner, the AI advisor helped me understand market dynamics. The interface is intuitive and the paper trading feature is invaluable.',
    color: '#00E676',
  },
  {
    name: 'Rajesh Kumar',
    role: 'Options Trader, Chennai',
    avatar: 'RK',
    stars: 5,
    text: 'The signal engine\'s accuracy on NIFTY 50 stocks is outstanding. I\'ve improved my win rate significantly since switching to StockPulse.',
    color: '#FFD740',
  },
  {
    name: 'Anita Desai',
    role: 'Financial Analyst, Hyderabad',
    avatar: 'AD',
    stars: 5,
    text: 'StockPulse\'s technical analysis tools rival Bloomberg Terminal. The fact that this is free for retail traders is incredible.',
    color: '#FF9100',
  },
];

export default function TestimonialsSection() {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let animFrame;
    let scrollPos = 0;
    const speed = 0.5;

    const scroll = () => {
      if (!isPaused) {
        scrollPos += speed;
        const halfWidth = container.scrollWidth / 2;
        if (scrollPos >= halfWidth) scrollPos = 0;
        container.scrollLeft = scrollPos;
      }
      animFrame = requestAnimationFrame(scroll);
    };

    animFrame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animFrame);
  }, [isPaused]);

  const allTestimonials = [...testimonials, ...testimonials];

  return (
    <section style={{
      padding: '100px 0',
      background: 'var(--bg-primary)',
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
            Trusted by{' '}
            <span className="text-gradient">Traders Across India</span>
          </h2>
          <p>See what our community says about StockPulse.</p>
        </motion.div>
      </div>

      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          display: 'flex',
          gap: '20px',
          overflow: 'hidden',
          padding: '10px 20px',
          cursor: 'default',
        }}
      >
        {allTestimonials.map((t, i) => (
          <div
            key={i}
            style={{
              minWidth: '360px',
              maxWidth: '360px',
              padding: '28px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
              border: '1px solid var(--border)',
              flexShrink: 0,
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${t.color}30`;
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 8px 30px rgba(0,0,0,0.2), 0 0 30px ${t.color}08`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Quote icon */}
            <div style={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: t.color,
              opacity: 0.15,
            }}>
              <Quote size={40} />
            </div>

            {/* Stars */}
            <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
              {Array.from({ length: t.stars }).map((_, si) => (
                <Star key={si} size={16} fill="#FFD740" color="#FFD740" />
              ))}
              {Array.from({ length: 5 - t.stars }).map((_, si) => (
                <Star key={si} size={16} color="var(--text-muted)" />
              ))}
            </div>

            <p style={{
              fontSize: '0.92rem',
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
              marginBottom: 20,
              position: 'relative',
              zIndex: 1,
            }}>
              &ldquo;{t.text}&rdquo;
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${t.color}, ${t.color}80)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#fff',
              }}>
                {t.avatar}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
