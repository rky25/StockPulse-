import './globals.css';
import { PageTransition } from '@/components/PageTransition';

export const metadata = {
  title: 'StockPulse — AI-Powered Stock Analysis & Trading Signals',
  description: 'Professional-grade stock analysis for Indian markets. Real-time signals, TradingView-style technical gauges, and AI-powered insights.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PageTransition>
          {children}
        </PageTransition>
      </body>
    </html>
  );
}
