'use client';

import Link from 'next/link';
import { Activity, Code, Share2, Link2, Mail } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.gradientLine} />
      <div className="container">
        <div className={styles.footerGrid}>
          {/* Brand */}
          <div className={styles.footerBrand}>
            <Link href="/" className={styles.footerLogo}>
              <div className={styles.logoIcon}>
                <Activity size={18} color="white" />
              </div>
              Stock<span className={styles.logoAccent}>Pulse</span>
            </Link>
            <p className={styles.footerDesc}>
              Professional-grade stock analysis platform for Indian markets.
              Real-time signals, AI insights, and institutional-grade tools.
            </p>
            <div className={styles.socials}>
              <a href="#" className={styles.socialLink} aria-label="Twitter"><Share2 size={18} /></a>
              <a href="#" className={styles.socialLink} aria-label="LinkedIn"><Link2 size={18} /></a>
              <a href="#" className={styles.socialLink} aria-label="GitHub"><Code size={18} /></a>
              <a href="#" className={styles.socialLink} aria-label="Email"><Mail size={18} /></a>
            </div>
          </div>

          {/* Links */}
          <div className={styles.footerLinks}>
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <Link href="/signin">Dashboard</Link>
          </div>

          <div className={styles.footerLinks}>
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Blog</a>
            <a href="#">Careers</a>
            <a href="#">Contact</a>
          </div>

          <div className={styles.footerLinks}>
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Disclaimer</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>&copy; {year} StockPulse. All rights reserved.</p>
          <p className={styles.footerDisclaimer}>
            Stock market investments are subject to market risk. Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </footer>
  );
}
