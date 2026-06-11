'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarClock, AlertCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function ConsultationIndexPage() {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center h-[70vh]">
      <Card padding="lg" className="text-center max-w-md w-full flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-[var(--primary-50)] text-[var(--primary)] rounded-full flex items-center justify-center mb-2">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-[var(--primary-dark)]">Pilih Sesi Konsultasi</h2>
        <p className="text-[var(--text-secondary)] mb-4">
          Untuk memulai konsultasi *live*, Anda harus memilih sesi yang sedang aktif dari daftar sesi terlebih dahulu.
        </p>
        <Link href="/sessions" className="w-full">
          <Button size="lg" className="w-full" icon={<CalendarClock size={20} />}>
            Buka Daftar Sesi
          </Button>
        </Link>
      </Card>
    </div>
  );
}
