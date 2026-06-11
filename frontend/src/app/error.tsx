'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="max-w-md w-full bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl p-8 text-center shadow-lg">
        <div className="w-16 h-16 bg-[var(--accent-danger-bg)] text-[var(--accent-danger)] rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-[var(--primary-dark)] mb-2">Terjadi Kesalahan!</h2>
        <p className="text-[var(--text-secondary)] mb-6">
          Maaf, sistem mengalami kesalahan teknis saat memproses permintaan Anda.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push('/')}>Ke Halaman Utama</Button>
          <Button variant="secondary" onClick={() => reset()}>Coba Lagi</Button>
        </div>
      </div>
    </div>
  );
}
