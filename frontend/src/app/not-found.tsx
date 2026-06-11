import React from 'react';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 bg-[var(--primary-50)] text-[var(--primary)] rounded-full flex items-center justify-center mx-auto mb-6">
          <HelpCircle size={48} />
        </div>
        <h1 className="text-6xl font-bold text-[var(--primary-dark)] mb-2">404</h1>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Halaman Tidak Ditemukan</h2>
        <p className="text-[var(--text-secondary)] mb-8">
          Alamat URL yang Anda tuju mungkin salah ketik atau halaman sudah dipindahkan.
        </p>
        <Link href="/dashboard">
          <Button size="lg">Kembali ke Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
