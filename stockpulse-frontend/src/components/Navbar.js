'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, ArrowRight } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileOpen]);

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Markets', href: '#markets' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <>
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <Activity size={20} color="white" />
            </div>
            Stock<span className={styles.logoAccent}>Pulse</span>
          </Link>

          <div className={styles.navLinks}>
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className={styles.navLink}>
                {item.label}
                <span className={styles.linkUnderline} />
              </a>
            ))}
          </div>

          <div className={styles.navActions}>
            <Link href="/signin" className={styles.signInBtn}>
              Log In
            </Link>
            <Link href="/signin" className={styles.getStartedBtn}>
              Get Started <ArrowRight size={16} />
            </Link>
            <button
              className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerOpen : ''}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`${styles.mobileOverlay} ${mobileOpen ? styles.mobileOverlayOpen : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`${styles.mobileMenu} ${mobileOpen ? styles.mobileMenuOpen : ''}`}>
        <div className={styles.mobileMenuHeader}>
          <Link href="/" className={styles.logo} onClick={() => setMobileOpen(false)}>
            <div className={styles.logoIcon}>
              <Activity size={20} color="white" />
            </div>
            Stock<span className={styles.logoAccent}>Pulse</span>
          </Link>
          <button className={styles.mobileClose} onClick={() => setMobileOpen(false)}>
            <X size={24} />
          </button>
        </div>
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={styles.mobileLink}
            onClick={() => setMobileOpen(false)}
          >
            {item.label}
          </a>
        ))}
        <div className={styles.mobileActions}>
          <Link href="/signin" className={styles.signInBtn} onClick={() => setMobileOpen(false)}>
            Log In
          </Link>
          <Link href="/signin" className={styles.getStartedBtn} onClick={() => setMobileOpen(false)}>
            Get Started Free <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </>
  );
}

function X({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
