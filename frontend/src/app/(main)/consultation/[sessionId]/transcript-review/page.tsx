'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Save, FileText, CheckCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import styles from './review.module.css';

export default function TranscriptReviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [isSaving, setIsSaving] = useState(false);
  const [synced, setSynced] = useState(false);

  // Mock transcript
  const [transcript, setTranscript] = useState([
    { id: '1', sender: 'doctor', text: 'Halo Budi, bagaimana perasaannya hari ini?', time: '10:01 AM' },
    { id: '2', sender: 'patient', text: 'Sakit dada sebelah kiri', time: '10:02 AM' },
    { id: '3', sender: 'doctor', text: 'Sejak kapan rasa sakitnya mulai muncul?', time: '10:03 AM' },
    { id: '4', sender: 'patient', text: 'Sejak kemarin malam', time: '10:04 AM' },
  ]);

  const [summary, setSummary] = useState(
    'S (Subjective): Pasien mengeluhkan sakit dada sebelah kiri sejak kemarin malam.\n' +
    'O (Objective): (Menunggu hasil pemeriksaan fisik)\n' +
    'A (Assessment): Suspect Angina / Nyeri Dada Non-Spesifik\n' +
    'P (Plan): Rekomendasi EKG dan observasi.'
  );

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call to save and sync to EMR
    await new Promise(r => setTimeout(r, 1500));
    setSynced(true);
    setIsSaving(false);
  };

  return (
    <div className={`animate-fade-in ${styles.container}`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Review Transkrip Konsultasi</h1>
          <p className="text-muted">Sesi #{sessionId.substring(0,8)} - Budi Santoso</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => router.push('/sessions')}>Kembali</Button>
          <Button 
            icon={synced ? <CheckCircle size={18}/> : <Save size={18}/>} 
            loading={isSaving}
            onClick={handleSave}
            disabled={synced}
            variant={synced ? 'ghost' : 'primary'}
          >
            {synced ? 'Tersimpan & Sinkron' : 'Simpan ke Rekam Medis (EMR)'}
          </Button>
        </div>
      </div>

      <div className={styles.grid}>
        <Card className={styles.logCard}>
          <div className={styles.cardHeader}>
            <FileText size={20} className="text-primary" />
            <h3>Log Percakapan</h3>
            <Badge variant="info">Dapat Diedit</Badge>
          </div>
          <div className={styles.logContent}>
            {transcript.map((msg, index) => (
              <div key={msg.id} className={styles.logItem}>
                <div className={styles.logMeta}>
                  <span className={styles.logSender}>
                    {msg.sender === 'doctor' ? '👨‍⚕️ Dokter' : '👤 Pasien'}
                  </span>
                  <span className={styles.logTime}>{msg.time}</span>
                </div>
                <textarea 
                  className={styles.logInput}
                  value={msg.text}
                  onChange={(e) => {
                    const newT = [...transcript];
                    newT[index].text = e.target.value;
                    setTranscript(newT);
                  }}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <FileText size={20} className="text-success" />
            <h3>Ringkasan Medis Otomatis (SOAP)</h3>
            <Badge variant="active">AI Generated</Badge>
          </div>
          <div className={styles.summaryContent}>
            <p className="text-sm text-muted mb-4">
              Ringkasan ini di-*generate* secara otomatis oleh LLM berdasarkan transkrip. Silakan koreksi jika diperlukan.
            </p>
            <textarea
              className={styles.summaryInput}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={12}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
