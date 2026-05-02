'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Activity, 
  Home, 
  Search, 
  Star, 
  Briefcase, 
  Settings, 
  LogOut,
  Bell,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import styles from './dashboard.module.css';

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [marketStatus, setMarketStatus] = useState({ open: false, label: 'Checking...' });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('stockpulse_token') || sessionStorage.getItem('stockpulse_token');
    const userDataStr = localStorage.getItem('stockpulse_user') || sessionStorage.getItem('stockpulse_user');
    
    if (!token || !userDataStr) {
      router.push('/signin');
      return;
    }

    try {
      setUser(JSON.parse(userDataStr));
    } catch (e) {
      console.error('Failed to parse user data');
      router.push('/signin');
    }

    // Handle resize for sidebar
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    
    // Check market status (NSE hours: 9:15 AM to 3:30 PM IST)
    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000); // Check every minute
    
    // Handle Keyboard shortcuts
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K for search focus
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  const checkMarketStatus = () => {
    const now = new Date();
    // Convert current time to IST
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istTime = new Date(utcTime + istOffset);
    
    const day = istTime.getDay();
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const timeValue = hours + minutes / 60;
    
    // NSE timings: Mon-Fri (1-5), 9:15 AM to 3:30 PM (9.25 to 15.5)
    if (day >= 1 && day <= 5 && timeValue >= 9.25 && timeValue < 15.5) {
      setMarketStatus({ open: true, label: 'Market Open' });
    } else {
      setMarketStatus({ open: false, label: 'Market Closed' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('stockpulse_token');
    localStorage.removeItem('stockpulse_user');
    sessionStorage.removeItem('stockpulse_token');
    sessionStorage.removeItem('stockpulse_user');
    router.push('/signin');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/stock/${searchQuery.trim().toUpperCase()}`);
      setSearchQuery('');
    }
  };

  const navItems = [
    { label: 'Overview', icon: <Home size={20} />, path: '/dashboard' },
    { label: 'Watchlist', icon: <Star size={20} />, path: '/dashboard/watchlist' },
    { label: 'Portfolio', icon: <Briefcase size={20} />, path: '/dashboard/portfolio' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/dashboard/settings' },
  ];

  if (!user) return null; // Or a loading spinner

  return (
    <div className={styles.layout}>
      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className={styles.mobileOverlay} 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? '' : styles.sidebarCollapsed} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/dashboard" className={styles.logo}>
            <div className={styles.logoIcon}>
              <Activity size={18} color="white" />
            </div>
            {isSidebarOpen && <span>Stock<span className={styles.logoAccent}>Pulse</span></span>}
          </Link>
          
          <button 
            className={styles.collapseBtn}
            onClick={() => setSidebarOpen(!isSidebarOpen)}
          >
            <Menu size={18} />
          </button>
          
          {/* Mobile close button */}
          <button 
            className={styles.mobileCloseBtn}
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.navMenu}>
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                title={!isSidebarOpen ? item.label : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className={styles.navIcon}>{item.icon}</div>
                {isSidebarOpen && <span className={styles.navLabel}>{item.label}</span>}
                {isSidebarOpen && isActive && (
                  <motion.div layoutId="activeNavIndicator" className={styles.activeIndicator} />
                )}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button 
            className={styles.logoutBtn} 
            onClick={handleLogout}
            title={!isSidebarOpen ? "Log Out" : undefined}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button 
              className={styles.mobileMenuBtn}
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <div className={styles.searchWrapper}>
                <Search size={18} className={styles.searchIcon} />
                <input 
                  id="global-search"
                  type="text" 
                  placeholder="Search stocks (e.g., RELIANCE)" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                <div className={styles.searchShortcut}>
                  <kbd>⌘</kbd> <kbd>K</kbd>
                </div>
              </div>
            </form>
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.marketStatus}>
              <span className={`${styles.statusDot} ${marketStatus.open ? styles.statusOpen : styles.statusClosed}`}></span>
              <span className={styles.statusLabel}>{marketStatus.label}</span>
            </div>
            
            <button className={styles.notificationBtn}>
              <Bell size={20} />
              <span className={styles.notificationBadge}></span>
            </button>
            
            <div className={styles.userProfile}>
              <div className={styles.avatar}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.name}</span>
                <span className={styles.userRole}>Pro Trader</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.pageContainer}>
          {children}
        </main>
      </div>
    </div>
  );
}
