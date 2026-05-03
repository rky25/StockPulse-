'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
export default function CTASection() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 6 }).map((_, i) => ({
        id: i,
        width: 4 + Math.random() * 4,
        height: 4 + Math.random() * 4,
        background: i % 2 === 0 ? 'var(--accent)' : 'var(--accent-cyan)',
        opacity: 0.15 + Math.random() * 0.15,
        left: `${10 + Math.random() * 80}%`,
        top: `${10 + Math.random() * 80}%`,
        animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 3}s`,
      }))
    );
  }, []);

  return (
    <section style={{
      padding: '100px 0',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--bg-surface)',
    }}>
      {/* Animated gradient background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(41, 98, 255, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Floating particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              width: p.width,
              height: p.height,
              borderRadius: '50%',
              background: p.background,
              opacity: p.opacity,
              left: p.left,
              top: p.top,
              animation: p.animation,
              animationDelay: p.animationDelay,
            }}
          />
        ))}
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{
            textAlign: 'center',
            maxWidth: '650px',
            margin: '0 auto',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(41, 98, 255, 0.1)',
              border: '1px solid rgba(41, 98, 255, 0.2)',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--accent-light)',
              marginBottom: 24,
            }}
          >
            <Sparkles size={14} /> No credit card required
          </motion.div>

          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: 16 }}>
            Ready to Trade{' '}
            <span className="text-gradient">Smarter</span>?
          </h2>

          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            marginBottom: 36,
            lineHeight: 1.7,
          }}>
            Join thousands of Indian traders using institutional-grade analysis tools.
            Start free — upgrade anytime.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <Link href="/signup" className="btn btn-primary btn-lg" style={{ position: 'relative' }}>
              Get Started Free <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
