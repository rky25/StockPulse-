'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Activity, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import styles from '../auth.module.css';

export default function SignInPage() {
  const [email, setEmail] = useState('test@gmail.com');
  const [password, setPassword] = useState('12345');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (email === 'test@gmail.com' && password === '12345') {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('stockpulse_token', 'static_dummy_token_12345');
      storage.setItem('stockpulse_user', JSON.stringify({ id: 999, name: 'Test User', email: 'test@gmail.com' }));
      router.push('/dashboard');
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem('stockpulse_token', data.token);
        storage.setItem('stockpulse_user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
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

          <h1>Welcome back</h1>
          <p>Sign in to access your trading dashboard</p>
        </div>

        {error && (
          <motion.div
            className={styles.errorMsg}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className={styles.authForm}>
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

          <div className={styles.inputGroup}>
            <label>Password</label>
            <div className={styles.inputWrap}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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

          <div className={styles.formOptions}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(!remember)}
              />
              <span className={styles.checkmark} />
              Remember me
            </label>
            <Link href="/forgot-password" className={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className={styles.spinner} /> Signing in...
              </>
            ) : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className={styles.authSwitch}>
          Don&apos;t have an account?{' '}
          <Link href="/signup">Sign up free</Link>
        </p>
      </motion.div>
    </div>
  );
}
