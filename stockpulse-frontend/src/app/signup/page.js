'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, Check, KeyRound } from 'lucide-react';
import styles from '../auth.module.css';

export default function SignUpPage() {
  const [step, setStep] = useState(1); // 1: name+email, 2: otp, 3: password
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simulate network delay
      await new Promise(r => setTimeout(r, 600));

      const usersStr = localStorage.getItem('stockpulse_users') || '[]';
      const users = JSON.parse(usersStr);
      
      if (users.some(u => u.email === email)) {
        setError('Email already registered');
      } else {
        setSuccess('OTP sent to your email!');
        setStep(2);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    // Move to step 3 to collect password. We will verify the OTP along with the password.
    setStep(3);
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const otpCode = otp.join('');

    try {
      // Simulate network delay
      await new Promise(r => setTimeout(r, 800));

      if (otpCode !== '123456') {
        setError('Invalid or expired OTP. Please use 123456 for testing.');
        setStep(2);
        return;
      }

      const usersStr = localStorage.getItem('stockpulse_users') || '[]';
      const users = JSON.parse(usersStr);
      
      // Save user to localStorage
      users.push({ name, email, password });
      localStorage.setItem('stockpulse_users', JSON.stringify(users));

      setSuccess('Account created! Redirecting...');
      setTimeout(() => router.push('/signin'), 1500);

    } catch (err) {
      setError('An error occurred. Please try again.');
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
      const next = document.getElementById(`otp-${index + 1}`);
      if (next) next.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      if (prev) prev.focus();
    }
  };

  const passwordStrength = () => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColors = ['', '#FF1744', '#FF9100', '#FFD740', '#00E676', '#00E676'];

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
        <Link href="/" className={styles.backLink}>
          ← Back to Home
        </Link>

        <div className={styles.authHeader}>
          <Link href="/" className={styles.authLogo}>
            <div className={styles.authLogoIcon}>
              <Activity size={20} color="white" />
            </div>
            Stock <span className={styles.logoAccent}>Pulse</span>
          </Link>

          <h1>Create your account</h1>
          <p>Start trading smarter in 30 seconds</p>
        </div>

        {/* Step Indicator */}
        <div className={styles.stepIndicator}>
          {[1, 2, 3].map((s) => (
            <div key={s} className={styles.stepDot}>
              <div className={`${styles.dot} ${step >= s ? styles.dotActive : ''} ${step > s ? styles.dotDone : ''}`}>
                {step > s ? <Check size={12} /> : s}
              </div>
              {s < 3 && <div className={`${styles.stepLine} ${step > s ? styles.stepLineActive : ''}`} />}
            </div>
          ))}
        </div>

        {error && (
          <motion.div
            className={styles.errorMsg}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            className={styles.successMsg}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Check size={16} /> {success}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form
              key="step1"
              onSubmit={handleSendOtp}
              className={styles.authForm}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.inputGroup}>
                <label>Full Name</label>
                <div className={styles.inputWrap}>
                  <User size={18} className={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={styles.authInput}
                  />
                </div>
              </div>

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
                  <><Loader2 size={18} className={styles.spinner} /> Sending OTP...</>
                ) : (
                  <>Send Verification Code <ArrowRight size={18} /></>
                )}
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form
              key="step2"
              onSubmit={handleVerifyOtp}
              className={styles.authForm}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 20, textAlign: 'center' }}>
                We sent a 6-digit code to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
                <br /><span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>(Hint: Enter 123456 to test)</span>
              </p>

              <div className={styles.otpGroup}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
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

              <button type="submit" className={styles.submitBtn} disabled={loading || otp.join('').length < 6}>
                {loading ? (
                  <><Loader2 size={18} className={styles.spinner} /> Verifying...</>
                ) : (
                  <>Verify Code <ArrowRight size={18} /></>
                )}
              </button>
            </motion.form>
          )}

          {step === 3 && (
            <motion.form
              key="step3"
              onSubmit={handleSetPassword}
              className={styles.authForm}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.inputGroup}>
                <label>Create Password</label>
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
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.togglePassword}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Password Strength */}
              {password && (
                <div className={styles.strengthBar}>
                  <div className={styles.strengthTrack}>
                    <motion.div
                      className={styles.strengthFill}
                      initial={{ width: 0 }}
                      animate={{ width: `${(passwordStrength() / 5) * 100}%` }}
                      style={{ background: strengthColors[passwordStrength()] }}
                    />
                  </div>
                  <span style={{ fontSize: '0.78rem', color: strengthColors[passwordStrength()], fontWeight: 600 }}>
                    {strengthLabels[passwordStrength()]}
                  </span>
                </div>
              )}

              <button type="submit" className={styles.submitBtn} disabled={loading || password.length < 6}>
                {loading ? (
                  <><Loader2 size={18} className={styles.spinner} /> Creating account...</>
                ) : (
                  <>Create Account <ArrowRight size={18} /></>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className={styles.authSwitch}>
          Already have an account?{' '}
          <Link href="/signin">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
