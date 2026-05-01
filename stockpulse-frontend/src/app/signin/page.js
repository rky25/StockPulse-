'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, Check, ArrowLeft } from 'lucide-react';
import styles from '../auth.module.css';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Auto-login check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('stockpulse_token') || sessionStorage.getItem('stockpulse_token');
      if (token) {
        window.location.href = '/dashboard';
      }
    }
  }, []);

  // Check for registration success in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('registered') === 'true') {
        setSuccess('Account verified successfully! Please log in.');
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      // Save token based on Remember Me preference
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('stockpulse_token', data.token);
      storage.setItem('stockpulse_user', JSON.stringify(data.user));
      
      // Clear the other storage just to be safe
      if (rememberMe) {
        sessionStorage.removeItem('stockpulse_token');
        sessionStorage.removeItem('stockpulse_user');
      } else {
        localStorage.removeItem('stockpulse_token');
        localStorage.removeItem('stockpulse_user');
      }
      
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authOrbs}>
        <div className={`${styles.authOrb} ${styles.authOrb1}`} />
        <div className={`${styles.authOrb} ${styles.authOrb2}`} />
      </div>

      <div className={styles.authLeft}>
        <div className={styles.authFormWrap}>
          <Link href="/" className={styles.backButton}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <Link href="/" className={styles.authLogo}>
            <div className={styles.authLogoIcon}>
              <Activity size={20} color="white" />
            </div>
            Stock<span className="text-gradient">Pulse</span>
          </Link>

          <h1 className={styles.authTitle}>Welcome back</h1>
          <p className={styles.authSubtitle}>Sign in to access your trading dashboard</p>

            {error && <div style={{ color: 'var(--red)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
            {success && <div style={{ color: 'var(--green)', marginBottom: '1rem', fontSize: '0.9rem' }}>{success}</div>}

            <form className={styles.form} onSubmit={handleLogin}>
              <div className={styles.formField}>
                <label htmlFor="email">Email</label>
                <input type="email" id="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div className={styles.formField}>
                <label htmlFor="password">Password</label>
                <input type="password" id="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>

              <div className={styles.formRow}>
                <label>
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> Remember me
                </label>
                <Link href="/forgot-password">Forgot password?</Link>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

          <div className={styles.authFooter}>
            Don&apos;t have an account? <Link href="/signup">Sign up free</Link>
          </div>
        </div>
      </div>

      <div className={styles.authRight}>
        <div className={styles.brandPanel}>
          <h2>Your trading <span className="text-gradient">edge</span> starts here</h2>
          <p>Access institutional-grade analysis tools built for the Indian stock market.</p>

          <div className={styles.featureList}>
            {[
              'Real-time NSE signals with 85%+ confidence',
              'TradingView-style technical gauges',
              'AI-powered trading advisor (Llama 3.1)',
              'Paper trading with P&L tracking',
            ].map((f, i) => (
              <div key={i} className={styles.featureItem}>
                <div className={styles.featureCheck}><Check size={14} /></div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
