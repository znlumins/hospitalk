'use client';

import React from 'react';
import { Users, CalendarClock, Activity, AlertCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import styles from './dashboard.module.css';
import Link from 'next/link';

export default function DashboardPage() {
  // Dummy data for MVP
  const stats = [
    { label: 'Sesi Hari Ini', value: '12', icon: CalendarClock, color: 'primary' },
    { label: 'Pasien Aktif', value: '48', icon: Users, color: 'success' },
    { label: 'Sesi Tertunda', value: '3', icon: AlertCircle, color: 'warning' },
    { label: 'Total Transkrip', value: '342', icon: Activity, color: 'primary' },
  ];

  const recentSessions = [
    { id: '1', patient: 'Budi Santoso', status: 'active', time: '10:00 AM' },
    { id: '2', patient: 'Siti Aminah', status: 'completed', time: '09:30 AM' },
    { id: '3', patient: 'Ahmad Dahlan', status: 'completed', time: '08:15 AM' },
  ];

  return (
    <div className="animate-fade-in">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard Overview</h1>
          <p className="text-muted">Selamat datang, Dr. Demo! Berikut adalah ringkasan hari ini.</p>
        </div>
        <Link href="/sessions">
          <Button icon={<CalendarClock size={18} />}>Mulai Sesi Baru</Button>
        </Link>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className={styles.statCard} hover>
              <div className={styles.statIconWrapper} data-color={stat.color}>
                <Icon size={24} />
              </div>
              <div>
                <p className={styles.statLabel}>{stat.label}</p>
                <h3 className={styles.statValue}>{stat.value}</h3>
              </div>
            </Card>
          );
        })}
      </div>

      <div className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <h2>Sesi Konsultasi Terbaru</h2>
          <Link href="/sessions" className={styles.viewAll}>
            Lihat Semua
          </Link>
        </div>
        
        <Card padding="sm" className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Pasien</th>
                <th>Waktu</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((session) => (
                <tr key={session.id}>
                  <td className={styles.tdPatient}>
                    <div className={styles.avatarSm}>{session.patient.charAt(0)}</div>
                    {session.patient}
                  </td>
                  <td>{session.time}</td>
                  <td>
                    <Badge variant={session.status as any}>{session.status}</Badge>
                  </td>
                  <td>
                    <Link href={`/consultation/${session.id}`}>
                      <Button variant="ghost" size="sm">
                        {session.status === 'active' ? 'Lanjutkan' : 'Lihat Detail'}
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
