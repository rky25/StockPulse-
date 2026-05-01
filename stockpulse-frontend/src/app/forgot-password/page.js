'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowLeft } from 'lucide-react';
import styles from '../auth.module.css';

export default function ForgotPasswordPage() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset link');
      setSuccess('Reset code sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp || !newPassword) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      
      // Success
      setSuccess('Password reset successfully!');
      setTimeout(() => {
        window.location.href = '/signin';
      }, 2000);
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

      <div className={styles.authLeft} style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
        <div className={styles.authFormWrap}>
          <Link href="/" className={styles.backButton}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <Link href="/" className={styles.authLogo} style={{ justifyContent: 'center' }}>
            <div className={styles.authLogoIcon}>
              <Activity size={20} color="white" />
            </div>
            Stock<span className="text-gradient">Pulse</span>
          </Link>

          <h1 className={styles.authTitle} style={{ textAlign: 'center' }}>Reset Password</h1>
          <p className={styles.authSubtitle} style={{ textAlign: 'center' }}>
            {step === 1 ? "Enter your email to receive a reset code." : "Enter your reset code and new password."}
          </p>

            {error && <div style={{ color: 'var(--red)', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
            {success && <div style={{ color: 'var(--green)', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>{success}</div>}

            {step === 1 ? (
              <form className={styles.form} onSubmit={handleSendOtp}>
                <div className={styles.formField}>
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </button>
              </form>
            ) : (
              <form className={styles.form} onSubmit={handleResetPassword}>
                <div className={styles.formField}>
                  <label htmlFor="otp">Reset Code</label>
                  <input type="text" id="otp" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} required />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="newPassword">New Password</label>
                  <input type="password" id="newPassword" placeholder="Min 8 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                </div>
                <button type="submit" className={styles.submitBtn} disabled={loading || success}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}

            <div className={styles.authFooter} style={{ justifyContent: 'center' }}>
              Remembered your password? <Link href="/signin">Sign in</Link>
            </div>
        </div>
      </div>
    </div>
  );
}
