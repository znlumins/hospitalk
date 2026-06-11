'use client';

import React, { useState } from 'react';
import { Search, Plus, FileText } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import styles from './patients.module.css';

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const patients = [
    { id: '1', medRec: 'RM-001', name: 'Budi Santoso', type: 'Tuli', dob: '1990-05-12' },
    { id: '2', medRec: 'RM-002', name: 'Siti Aminah', type: 'Bisu & Tuli', dob: '1985-11-20' },
    { id: '3', medRec: 'RM-003', name: 'Ahmad Dahlan', type: 'Bisu', dob: '2001-02-15' },
  ];

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.medRec.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Data Pasien</h1>
          <p className="text-muted">Kelola data pasien disabilitas rungu dan wicara.</p>
        </div>
        <Button icon={<Plus size={18} />}>Tambah Pasien</Button>
      </div>

      <Card className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Cari nama atau No. Rekam Medis..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </Card>

      <Card padding="sm" className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>No. Rekam Medis</th>
              <th>Nama Pasien</th>
              <th>Tanggal Lahir</th>
              <th>Jenis Disabilitas</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map(patient => (
              <tr key={patient.id}>
                <td className="font-semibold text-primary">{patient.medRec}</td>
                <td className={styles.tdPatient}>
                  <div className={styles.avatarSm}>{patient.name.charAt(0)}</div>
                  {patient.name}
                </td>
                <td>{patient.dob}</td>
                <td>
                  <Badge variant="info">{patient.type}</Badge>
                </td>
                <td>
                  <Button variant="ghost" size="sm" icon={<FileText size={16} />}>
                    Rekam Medis
                  </Button>
                </td>
              </tr>
            ))}
            {filteredPatients.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted">
                  Tidak ada data pasien yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
