'use client';

import React from 'react';
import { ShieldCheck, Activity, Users, Database } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import styles from './admin.module.css';

export default function AdminPage() {
  const auditLogs = [
    { id: '1', user: 'Daffa Ahmad Al Attas', action: 'UPDATE_TRANSCRIPT', resource: 'Session #1234', time: '2026-06-10 10:15:22', ip: '192.168.1.5' },
    { id: '2', user: 'Admin System', action: 'CREATE_USER', resource: 'User #992', time: '2026-06-10 09:00:00', ip: '10.0.0.1' },
    { id: '3', user: 'Nurse Ratna', action: 'VIEW_PATIENT', resource: 'Patient RM-001', time: '2026-06-09 16:45:10', ip: '192.168.1.12' },
    { id: '4', user: 'Daffa Ahmad Al Attas', action: 'VIEW_PATIENT', resource: 'Patient RM-002', time: '2026-06-09 14:20:00', ip: '192.168.1.5' },
  ];

  const devices = [
    { id: 'TBLT-001', location: 'Ruang Konsultasi 1', battery: '85%', status: 'active', connection: 'Wi-Fi (Kuat)' },
    { id: 'TBLT-002', location: 'IGD', battery: '15%', status: 'warning', connection: 'LTE (Sedang)' },
    { id: 'TBLT-003', location: 'Poli Gigi', battery: '100%', status: 'idle', connection: 'Wi-Fi (Kuat)' },
  ];

  return (
    <div className="animate-fade-in">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Panel & Keamanan</h1>
          <p className="text-muted">Pantau aktivitas sistem, audit log, dan pengaturan akses.</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <ShieldCheck size={24} className="text-primary" />
          <div>
            <p className="text-sm text-muted">Status Keamanan (RLS)</p>
            <h3 className="text-success mt-1">Aktif & Aman</h3>
          </div>
        </Card>
        <Card className={styles.statCard}>
          <Activity size={24} className="text-primary" />
          <div>
            <p className="text-sm text-muted">Sistem AI (Edge)</p>
            <h3 className="text-success mt-1">Online</h3>
          </div>
        </Card>
        <Card className={styles.statCard}>
          <Users size={24} className="text-primary" />
          <div>
            <p className="text-sm text-muted">Pengguna Aktif</p>
            <h3 className="text-primary mt-1">24 Staff</h3>
          </div>
        </Card>
        <Card className={styles.statCard}>
          <Database size={24} className="text-primary" />
          <div>
            <p className="text-sm text-muted">Koneksi Database</p>
            <h3 className="text-success mt-1">Terhubung (Supabase)</h3>
          </div>
        </Card>
      </div>

      {/* Dasbor Monitoring Perangkat Real-Time */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Card padding="sm" className={styles.tableCard}>
          <div className="p-4 border-b border-[var(--surface-border)] bg-[var(--surface)] flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Pemantauan Perangkat (Tablet) Real-Time</h3>
              <p className="text-sm text-muted">Status baterai dan konektivitas tablet rumah sakit.</p>
            </div>
            <Badge variant="active">Live Update via Supabase</Badge>
          </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID Perangkat</th>
              <th>Lokasi</th>
              <th>Status Baterai</th>
              <th>Koneksi</th>
              <th>Status Sesi</th>
            </tr>
          </thead>
          <tbody>
            {devices.map(device => (
              <tr key={device.id}>
                <td className="font-semibold">{device.id}</td>
                <td>{device.location}</td>
                <td>
                  <span className={device.battery === '15%' ? 'text-danger font-semibold' : ''}>
                    {device.battery}
                  </span>
                </td>
                <td className="text-sm text-muted">{device.connection}</td>
                <td>
                  <Badge variant={device.status === 'active' ? 'active' : device.status === 'warning' ? 'warning' : 'info'}>
                    {device.status === 'active' ? 'Sedang Konsultasi' : device.status === 'warning' ? 'Low Battery' : 'Tersedia'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      </div>

      <Card padding="sm" className={styles.tableCard}>

        <div className="p-4 border-b border-[var(--surface-border)] bg-[var(--surface)]">
          <h3 className="font-semibold">Audit Trail (Log Aktivitas)</h3>
          <p className="text-sm text-muted">Sesuai standar kepatuhan medis (HIPAA/UU PDP).</p>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Pengguna</th>
              <th>Aksi</th>
              <th>Target Data</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map(log => (
              <tr key={log.id}>
                <td className="text-sm text-muted">{log.time}</td>
                <td className="font-semibold">{log.user}</td>
                <td>
                  <Badge variant={log.action.includes('UPDATE') ? 'warning' : 'info'}>
                    {log.action}
                  </Badge>
                </td>
                <td>{log.resource}</td>
                <td className="font-mono text-sm text-muted">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
