import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
  variant?: 'active' | 'completed' | 'cancelled' | 'info' | 'warning';
  children: React.ReactNode;
}

export default function Badge({ variant = 'info', children }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {children}
    </span>
  );
}
