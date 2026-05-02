'use client';

import styles from './Skeleton.module.css';

export function Skeleton({ width, height, borderRadius, style }) {
  return (
    <div
      className={styles.skeleton}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius: borderRadius || 'var(--radius-sm)',
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ height }) {
  return (
    <div className={styles.skeletonCard}>
      <Skeleton height="14px" width="40%" />
      <Skeleton height="28px" width="60%" style={{ marginTop: 12 }} />
      <Skeleton height="14px" width="30%" style={{ marginTop: 8 }} />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className={styles.skeletonCard} style={{ height: 300 }}>
      <div className={styles.skeletonBars}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={styles.skeleton}
            style={{
              width: '4%',
              height: `${30 + Math.random() * 60}%`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className={styles.skeletonRow}>
      <Skeleton width="30%" height="16px" />
      <Skeleton width="20%" height="16px" />
      <Skeleton width="15%" height="16px" />
    </div>
  );
}
