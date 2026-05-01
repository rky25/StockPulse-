'use client';

import { useState } from 'react';
import { Target, ShieldAlert, Crosshair, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

export default function MasterVerdictPanel({ price, technicalSummary, displaySymbol }) {
  const [capital, setCapital] = useState(100000);
  const [riskPct, setRiskPct] = useState(1);
  
  // Synthesize Signal
  let signal = 'NO TRADE ZONE';
  let color = 'var(--text-muted)';
  let bg = 'rgba(255, 255, 255, 0.05)';
  let icon = <AlertTriangle size={24} />;
  
  if (technicalSummary?.verdict === 'Strong Buy' || technicalSummary?.verdict === 'Buy') {
    signal = 'BUY SIGNAL';
    color = '#00C853';
    bg = 'rgba(0, 200, 83, 0.1)';
    icon = <TrendingUp size={24} />;
  } else if (technicalSummary?.verdict === 'Strong Sell' || technicalSummary?.verdict === 'Sell') {
    signal = 'SELL SIGNAL';
    color = '#FF1744';
    bg = 'rgba(255, 23, 68, 0.1)';
    icon = <TrendingDown size={24} />;
  }

  const confidence = technicalSummary?.confidence || 50;
  const isChoppy = technicalSummary?.regime?.isChoppy;
  const lowVolume = technicalSummary?.regime?.lowVolume;

  // Calculate SL and Target based on standard 1% ATR approximation or hard 1% for simplicity
  const riskAmount = capital * (riskPct / 100);
  const isBuy = signal === 'BUY SIGNAL';
  const isSell = signal === 'SELL SIGNAL';
  
  // 1% move as a generic stop loss if ATR isn't available
  const slOffset = price * 0.01; 
  const slPrice = isBuy ? price - slOffset : (isSell ? price + slOffset : 0);
  const targetPrice = isBuy ? price + (slOffset * 2) : (isSell ? price - (slOffset * 2) : 0); // 1:2 R:R
  
  const priceRiskPerShare = Math.abs(price - slPrice) || 1;
  const recommendedQty = Math.floor(riskAmount / priceRiskPerShare);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      marginBottom: '32px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '32px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
    }}>
      {/* Verdict Side */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Master Verdict ({displaySymbol})</span>
          <span style={{ fontWeight: 700, color: confidence > 70 ? 'var(--green)' : confidence < 30 ? 'var(--red)' : 'var(--accent)' }}>
            {confidence}% CONFIDENCE
          </span>
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          background: bg,
          color: color,
          padding: '16px 24px',
          borderRadius: 'var(--radius-md)',
          fontWeight: 800,
          fontSize: '1.4rem',
          border: `1px solid ${color}40`,
          width: 'max-content'
        }}>
          {icon}
          {signal}
        </div>
        
        {/* Warnings */}
        {(isChoppy || lowVolume) && (
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {isChoppy && (
              <div style={{ background: 'rgba(255, 152, 0, 0.1)', color: '#FF9800', border: '1px solid rgba(255, 152, 0, 0.3)', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={14} /> CHOPPY MARKET (ADX &lt; 20)
              </div>
            )}
            {lowVolume && (
              <div style={{ background: 'rgba(255, 82, 82, 0.1)', color: '#FF5252', border: '1px solid rgba(255, 82, 82, 0.3)', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldAlert size={14} /> LOW VOLUME WARNING
              </div>
            )}
          </div>
        )}
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <ShieldAlert size={14} /> Stop Loss (SL)
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#FF5252' }}>
              {slPrice ? `₹${slPrice.toFixed(2)}` : '--'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <Target size={14} /> Target (1:2)
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#00C853' }}>
              {targetPrice ? `₹${targetPrice.toFixed(2)}` : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Calculator Side */}
      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
          <Crosshair size={16} color="var(--accent)" /> Position Size Calculator
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Total Capital (₹)</label>
            <input 
              type="number" 
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'white', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Risk Per Trade (%)</label>
            <input 
              type="number" 
              value={riskPct}
              step="0.1"
              onChange={(e) => setRiskPct(Number(e.target.value))}
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'white', outline: 'none' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Amount at Risk</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{riskAmount.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Recommended Quantity</div>
            <div style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--accent-light)' }}>
              {isBuy || isSell ? recommendedQty : 0} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>shares</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
