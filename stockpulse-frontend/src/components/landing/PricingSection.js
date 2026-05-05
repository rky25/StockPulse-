'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    desc: 'Perfect for getting started with stock analysis',
    features: [
      '10 stock searches per day',
      'Basic technical indicators',
      'Real-time price data',
      'Community support',
      'Paper trading (demo)',
    ],
    cta: 'Get Started Free',
    popular: false,
    color: '#64748B',
  },
  {
    name: 'Pro',
    price: '₹499',
    period: '/month',
    desc: 'For serious traders who want an edge',
    features: [
      'Unlimited stock searches',
      'All technical indicators & gauges',
      'AI Trading Advisor (Llama 3.1)',
      'Multi-stock scanner',
      'Advanced backtesting',
      'Real-time signal alerts',
      'Priority support',
    ],
    cta: 'Start 7-Day Free Trial',
    popular: true,
    color: '#2962FF',
  },
  {
    name: 'Institutional',
    price: '₹1,999',
    period: '/month',
    desc: 'For teams and professional trading desks',
    features: [
      'Everything in Pro',
      'API access for automation',
      'Custom signal strategies',
      'Multi-user dashboard',
      'Dedicated account manager',
      'SLA guarantee',
      'White-label options',
    ],
    cta: 'Contact Sales',
    popular: false,
    color: '#7C4DFF',
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" style={{
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
            Simple, Transparent{' '}
            <span className="text-gradient">Pricing</span>
          </h2>
          <p>Start free, upgrade when you need more power.</p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          maxWidth: '1000px',
          margin: '0 auto',
          alignItems: 'stretch',
        }}>
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                padding: plan.popular ? '36px 28px' : '32px 28px',
                borderRadius: 'var(--radius-xl)',
                background: plan.popular
                  ? 'linear-gradient(135deg, rgba(41, 98, 255, 0.08) 0%, rgba(0, 188, 212, 0.04) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                border: `1px solid ${plan.popular ? 'rgba(41, 98, 255, 0.25)' : 'var(--border)'}`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.3), 0 0 40px ${plan.color}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'var(--accent-gradient)',
                }} />
              )}

              {plan.popular && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(41, 98, 255, 0.15)',
                  color: 'var(--accent-light)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  marginBottom: 16,
                  alignSelf: 'flex-start',
                  textTransform: 'uppercase',
                }}>
                  <Sparkles size={12} /> Most Popular
                </div>
              )}

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>{plan.name}</h3>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span style={{
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  background: `linear-gradient(135deg, ${plan.color}, #fff)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {plan.price}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{plan.period}</span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 24 }}>{plan.desc}</p>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                marginBottom: 28,
                flex: 1,
              }}>
                {plan.features.map((f, fi) => (
                  <motion.div
                    key={fi}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.3 + fi * 0.05 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', color: 'var(--text-secondary)' }}
                  >
                    <div style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: `${plan.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Check size={11} color={plan.color} strokeWidth={3} />
                    </div>
                    {f}
                  </motion.div>
                ))}
              </div>

              <Link
                href="/signin"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '14px 24px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  transition: 'all 0.3s ease',
                  background: plan.popular ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.05)',
                  color: plan.popular ? '#fff' : 'var(--text-primary)',
                  border: plan.popular ? 'none' : '1px solid var(--border-light)',
                  boxShadow: plan.popular ? '0 4px 15px var(--accent-glow)' : 'none',
                  textDecoration: 'none',
                }}
              >
                {plan.cta} <ArrowRight size={16} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: 1fr !important;
            max-width: 400px !important;
          }
        }
      `}</style>
    </section>
  );
}
