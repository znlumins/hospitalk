'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarClock, Play } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import styles from './sessions.module.css';

export default function SessionsPage() {
  const sessions = [
    { id: '1', patient: 'Budi Santoso', doctor: 'Dr. Demo', status: 'active', date: '2026-06-10', time: '10:00 AM' },
    { id: '2', patient: 'Siti Aminah', doctor: 'Dr. Demo', status: 'completed', date: '2026-06-10', time: '09:30 AM' },
    { id: '3', patient: 'Ahmad Dahlan', doctor: 'Dr. Demo', status: 'completed', date: '2026-06-09', time: '14:15 PM' },
    { id: '4', patient: 'Rina Melati', doctor: 'Dr. Demo', status: 'cancelled', date: '2026-06-08', time: '11:00 AM' },
  ];

  return (
    <div className="animate-fade-in">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Sesi Konsultasi</h1>
          <p className="text-muted">Kelola sesi konsultasi aktif dan riwayat sebelumnya.</p>
        </div>
        <Button icon={<CalendarClock size={18} />}>Buat Sesi Baru</Button>
      </div>

      <Card padding="sm" className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID Sesi</th>
              <th>Pasien</th>
              <th>Dokter</th>
              <th>Tanggal & Waktu</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(session => (
              <tr key={session.id}>
                <td className="font-mono text-sm text-muted">#{session.id.padStart(5, '0')}</td>
                <td className="font-semibold">{session.patient}</td>
                <td>{session.doctor}</td>
                <td>
                  <div className={styles.dateTime}>
                    <span>{session.date}</span>
                    <span className="text-muted">{session.time}</span>
                  </div>
                </td>
                <td>
                  <Badge variant={session.status as any}>{session.status}</Badge>
                </td>
                <td>
                  {session.status === 'active' ? (
                    <Link href={`/consultation/${session.id}`}>
                      <Button size="sm" icon={<Play size={16} />}>Masuk Ruangan</Button>
                    </Link>
                  ) : (
                    <Link href={`/consultation/${session.id}/transcript-review`}>
                      <Button variant="secondary" size="sm">Lihat Transkrip</Button>
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
