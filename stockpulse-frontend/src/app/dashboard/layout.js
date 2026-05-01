'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity, LayoutDashboard, Search, BarChart3,
  Briefcase, Star, Settings, Menu, X, User, MoreVertical, LogOut
} from 'lucide-react';
import styles from './dashboard.module.css';

const SEARCH_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.' },
  { symbol: 'SBIN', name: 'State Bank of India' },
  { symbol: 'INFY', name: 'Infosys Ltd.' },
  { symbol: 'LICI', name: 'Life Insurance Corporation' },
  { symbol: 'ITC', name: 'ITC Ltd.' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd.' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd.' },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd.' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd.' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd.' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank' },
  { symbol: 'TITAN', name: 'Titan Company Ltd.' },
  { symbol: 'ONGC', name: 'ONGC Ltd.' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.' },
  { symbol: 'NTPC', name: 'NTPC Ltd.' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd.' },
  { symbol: 'DMART', name: 'Avenue Supermarts Ltd.' },
  { symbol: 'ADANIGREEN', name: 'Adani Green Energy' },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd.' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd.' },
  { symbol: 'COALINDIA', name: 'Coal India Ltd.' },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd.' },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd.' },
  { symbol: 'POWERGRID', name: 'Power Grid Corp' },
  { symbol: 'NESTLEIND', name: 'Nestle India Ltd.' },
  { symbol: 'WIPRO', name: 'Wipro Ltd.' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra' },
  { symbol: 'IOC', name: 'Indian Oil Corp' },
  { symbol: 'JIOFIN', name: 'Jio Financial Services' },
  { symbol: 'HAL', name: 'Hindustan Aeronautics' },
  { symbol: 'DLF', name: 'DLF Ltd.' },
  { symbol: 'ADANIPOWER', name: 'Adani Power Ltd.' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd.' },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.' },
  { symbol: 'SIEMENS', name: 'Siemens Ltd.' },
  { symbol: 'IRFC', name: 'Indian Railway Finance' },
  { symbol: 'VBL', name: 'Varun Beverages Ltd.' },
  { symbol: 'ZOMATO', name: 'Zomato Ltd.' },
  { symbol: 'PIDILITIND', name: 'Pidilite Industries' },
  { symbol: 'GRASIM', name: 'Grasim Industries Ltd.' },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance' },
  { symbol: 'BEL', name: 'Bharat Electronics Ltd.' },
  { symbol: 'LTIM', name: 'LTIMindtree Ltd.' }
];

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userName, setUserName] = useState('Rajesh');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Load user from localStorage or sessionStorage
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('stockpulse_user') || sessionStorage.getItem('stockpulse_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.name) {
            setUserName(user.name);
          }
        } catch (e) {
          console.error("Failed to parse user");
        }
      }
    }

    const handleSearchClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleSearchClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleSearchClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('stockpulse_token');
    localStorage.removeItem('stockpulse_user');
    window.location.href = '/';
  };

  const links = [
    { href: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Overview' },
    { href: '/dashboard/stock/RELIANCE.NS', icon: <BarChart3 size={18} />, label: 'Terminal', prefix: '/dashboard/stock' },
    { href: '/dashboard/watchlist', icon: <Star size={18} />, label: 'Watchlist', prefix: '/dashboard/watchlist' },
    { href: '/dashboard/portfolio', icon: <Briefcase size={18} />, label: 'Portfolio', prefix: '/dashboard/portfolio' },
    { href: '/dashboard/settings', icon: <Settings size={18} />, label: 'Settings', prefix: '/dashboard/settings' },
  ];

  const isMarketOpen = () => {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes();
    const day = now.getDay();
    return day >= 1 && day <= 5 && ((h === 9 && m >= 15) || (h > 9 && h < 15) || (h === 15 && m <= 30));
  };

  return (
    <div className={styles.dashboard}>
      {/* Mobile overlay */}
      <div
        className={`${styles.sidebarOverlay} ${sidebarOpen ? styles.show : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <Link href="/dashboard" className={styles.sidebarLogo}>
          <div className={styles.sidebarLogoIcon}>
            <Activity size={18} color="white" />
          </div>
          <span className={styles.hideOnCollapse}>
            Stock<span className="text-gradient">Pulse</span>
          </span>
        </Link>

        <nav className={styles.sidebarNav}>
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`${styles.sidebarLink} ${(link.prefix ? pathname.startsWith(link.prefix) : pathname === link.href) ? styles.sidebarLinkActive : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {link.icon}
              <span className={styles.hideOnCollapse}>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.sidebarUserContainer} ref={menuRef}>
            <div 
              className={styles.sidebarUser} 
              onClick={(e) => {
                e.stopPropagation();
                setUserMenuOpen(prev => !prev);
              }}
            >
              <div className={styles.sidebarUserInfo}>
                <div className={styles.userAvatar}>{userName.charAt(0).toUpperCase()}</div>
                <div className={styles.hideOnCollapse}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{userName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Free Plan</div>
                </div>
              </div>
              <MoreVertical className={styles.hideOnCollapse} size={16} color="var(--text-muted)" style={{ pointerEvents: 'none' }} />
            </div>

            {userMenuOpen && (
              <div className={styles.userMenu}>
                <button className={styles.userMenuItem} onClick={() => router.push('/dashboard')}>
                  <User size={16} /> Profile Settings
                </button>
                <button className={`${styles.userMenuItem} ${styles.danger}`} onClick={handleLogout}>
                  <LogOut size={16} /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className={styles.main}>
        <div className={styles.topbar}>
          <button className={styles.sidebarToggle} onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>

          <div className={styles.searchBox} ref={searchRef}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input 
              placeholder="Search stocks... (e.g. RELIANCE, TCS)" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            
            {showSuggestions && searchQuery.trim() !== '' && (
              <div className={styles.searchSuggestions}>
                {SEARCH_STOCKS.filter(s => 
                  s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  s.name.toLowerCase().includes(searchQuery.toLowerCase())
                ).slice(0, 8).map((stock) => (
                  <div 
                    key={stock.symbol} 
                    className={styles.suggestionItem}
                    onClick={() => {
                      setSearchQuery('');
                      setShowSuggestions(false);
                      router.push(`/dashboard/stock/${stock.symbol}.NS`);
                    }}
                  >
                    <span className={styles.suggestionSymbol}>{stock.symbol}</span>
                    <span className={styles.suggestionName}>{stock.name}</span>
                  </div>
                ))}
                {SEARCH_STOCKS.filter(s => 
                  s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  s.name.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                  <div className={styles.suggestionItem} style={{ cursor: 'default' }}>
                    <span className={styles.suggestionName}>No stocks found</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.marketStatus}>
              <div className={`${styles.statusDot} ${isMarketOpen() ? styles.statusOpen : styles.statusClosed}`} />
              {isMarketOpen() ? 'Market Open' : 'Market Closed'}
            </div>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
