'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react';
import styles from '../auth.module.css';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Reset code sent to your email!');
        setStep(2);
      } else {
        setError(data.message || 'Failed to send reset code');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const otpCode = otp.join('');

    try {
      const res = await fetch(`${backendUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode, newPassword: password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Password reset successfully!');
        setStep(3);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const next = document.getElementById(`reset-otp-${index + 1}`);
      if (next) next.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`reset-otp-${index - 1}`);
      if (prev) prev.focus();
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authBg}>
        <div className={styles.authOrb1} />
        <div className={styles.authOrb2} />
      </div>

      <motion.div
        className={styles.authCard}
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <Link href="/signin" className={styles.backLink}>
          ← Back to Sign In
        </Link>

        <div className={styles.authHeader}>
          <Link href="/" className={styles.authLogo}>
            <div className={styles.authLogoIcon}>
              <Activity size={20} color="white" />
            </div>
            Stock <span className={styles.logoAccent}>Pulse</span>
          </Link>

          <h1>{step === 3 ? 'Password Reset!' : 'Reset Password'}</h1>
          <p>{step === 3 ? 'You can now sign in with your new password.' : 'Enter your email to receive a reset code.'}</p>
        </div>

        {error && (
          <motion.div className={styles.errorMsg} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div className={styles.successMsg} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Check size={16} /> {success}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form
              key="step1"
              onSubmit={handleSendResetOtp}
              className={styles.authForm}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className={styles.inputGroup}>
                <label>Email</label>
                <div className={styles.inputWrap}>
                  <Mail size={18} className={styles.inputIcon} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={styles.authInput}
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? (
                  <><Loader2 size={18} className={styles.spinner} /> Sending...</>
                ) : (
                  <>Send Reset Code <ArrowRight size={18} /></>
                )}
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form
              key="step2"
              onSubmit={handleResetPassword}
              className={styles.authForm}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 20, textAlign: 'center' }}>
                Enter the code sent to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
              </p>

              <div className={styles.otpGroup}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`reset-otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={styles.otpInput}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              <div className={styles.inputGroup}>
                <label>New Password</label>
                <div className={styles.inputWrap}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className={styles.authInput}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.togglePassword}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading || password.length < 6 || otp.join('').length < 6}>
                {loading ? (
                  <><Loader2 size={18} className={styles.spinner} /> Resetting...</>
                ) : (
                  <>Reset Password <ArrowRight size={18} /></>
                )}
              </button>
            </motion.form>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '20px 0' }}
            >
              <div style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'var(--green-bg)',
                border: '2px solid var(--green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <Check size={28} color="var(--green)" />
              </div>
              <Link href="/signin" className={styles.submitBtn} style={{ display: 'flex', textDecoration: 'none' }}>
                Go to Sign In <ArrowRight size={18} />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
