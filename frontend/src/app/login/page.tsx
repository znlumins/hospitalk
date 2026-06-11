'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button';
import { signIn } from '@/lib/supabase';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!email || !password) {
        setError('Email dan kata sandi wajib diisi.');
        setLoading(false);
        return;
      }

      const { error: authError } = await signIn(email, password);
      
      if (authError) {
        setError(authError.message || 'Kredensial tidak valid. Silakan coba lagi.');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Terjadi kesalahan tidak terduga saat login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Left Side - Branding */}
      <div className={styles.branding}>
        <div className={styles.brandContent}>
          <div className={styles.brandLogo}>
            <Activity size={40} strokeWidth={2.5} />
          </div>
          <h1 className={styles.brandTitle}>HOSPITALK</h1>
          <p className={styles.brandSubtitle}>Medical Communication Platform</p>
          <div className={styles.brandDescription}>
            <p>
              Platform komunikasi medis berbasis AI yang memungkinkan pasien
              disabilitas berkomunikasi dengan dokter melalui pengenalan bahasa
              isyarat secara <strong>real-time</strong>.
            </p>
          </div>
          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureDot} />
              Pengenalan Bahasa Isyarat (BISINDO/SIBI)
            </div>
            <div className={styles.feature}>
              <span className={styles.featureDot} />
              Speech-to-Text untuk Dokter
            </div>
            <div className={styles.feature}>
              <span className={styles.featureDot} />
              Transkrip Otomatis & Rekam Medis
            </div>
          </div>
        </div>
        <div className={styles.brandWave} />
      </div>

      {/* Right Side - Login Form */}
      <div className={styles.formSection}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h2>Selamat Datang</h2>
            <p>Masuk ke dashboard HOSPITALK</p>
          </div>

          {error && (
            <div className={styles.errorAlert}>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  id="email"
                  type="email"
                  placeholder="nama@rumahsakit.co.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                Kata Sandi
              </label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.eyeButton}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" loading={loading} className={styles.submitBtn}>
              Masuk ke Dashboard
            </Button>
          </form>

          <p className={styles.footerText}>
            Butuh akun? Hubungi administrator rumah sakit Anda.
          </p>
        </div>
      </div>
    </div>
  );
}
