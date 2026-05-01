'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Activity, Check, ArrowLeft } from 'lucide-react';
import styles from '../auth.module.css';

export default function SignUpPage() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getStrength = (pw) => {
    if (!pw) return { level: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 25, label: 'Weak', color: 'var(--red)' };
    if (score === 2) return { level: 50, label: 'Fair', color: 'var(--orange)' };
    if (score === 3) return { level: 75, label: 'Good', color: 'var(--gold)' };
    return { level: 100, label: 'Strong', color: 'var(--green)' };
  };

  const strength = getStrength(password);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !email) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/auth/verify-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, otp, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');
      
      // Verification successful, redirect to login
      window.location.href = '/signin?registered=true';
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

          <h1 className={styles.authTitle}>Create your account</h1>
          <p className={styles.authSubtitle}>Start trading smarter in 30 seconds</p>

            {error && <div style={{ color: 'var(--red)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

            {step === 1 ? (
              <form className={styles.form} onSubmit={handleSendOtp}>
                <div className={styles.formField}>
                  <label htmlFor="name">Full Name</label>
                  <input type="text" id="name" placeholder="Rajesh Kumar" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </form>
            ) : (
              <form className={styles.form} onSubmit={handleVerifyOtp}>
                <div className={styles.formField}>
                  <label htmlFor="otp">Verification Code (sent to {email})</label>
                  <input type="text" id="otp" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} required />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {password && (
                    <>
                      <div className={styles.strengthBar}>
                        <div className={styles.strengthFill} style={{ width: `${strength.level}%`, background: strength.color }} />
                      </div>
                      <div className={styles.strengthText} style={{ color: strength.color }}>{strength.label}</div>
                    </>
                  )}
                </div>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Verifying...' : 'Complete Sign Up'}
                </button>
              </form>
            )}

            <div className={styles.authFooter}>
              Already have an account? <Link href="/signin">Sign in</Link>
            </div>
        </div>
      </div>

      <div className={styles.authRight}>
        <div className={styles.brandPanel}>
          <h2>Join <span className="text-gradient">500+</span> traders</h2>
          <p>Access the most powerful stock analysis platform built for Indian markets.</p>

          <div className={styles.featureList}>
            {[
              'No credit card required — start free',
              '50+ NSE stocks with real-time data',
              'AI-powered analysis in seconds',
              'Mobile-friendly responsive design',
              'Paper trade risk-free',
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
