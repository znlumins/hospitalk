'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  MessageSquareText,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import Image from 'next/image';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/patients', label: 'Pasien', icon: Users },
  { href: '/sessions', label: 'Sesi Konsultasi', icon: CalendarClock },
  { href: '/consultation', label: 'Konsultasi Live', icon: MessageSquareText },
  { href: '/admin', label: 'Admin Panel', icon: ShieldCheck },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    import('@/lib/supabase').then(({ getCurrentUser }) => {
      getCurrentUser().then(u => {
        if (u) setUser(u);
      });
    });
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    const { signOut } = await import('@/lib/supabase');
    await signOut();
    window.location.href = '/login';
  };

  const userRole = user?.user_metadata?.role || '';
  const userName = user?.user_metadata?.name || 'Guest';

  // Filter nav items based on role
  const filteredNavItems = navItems.filter(item => {
    if (item.href === '/admin' && userRole !== 'admin') return false;
    return true;
  });

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Image src="/logo.png" alt="Logo" width={28} height={28} style={{ objectFit: 'contain' }} />
        </div>
        <div>
          <h1 className={styles.logoTitle}>HOSPITALK</h1>
          <p className={styles.logoSubtitle}>Medical Communication</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <p className={styles.navLabel}>MENU UTAMA</p>
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
              {isActive && <span className={styles.activeIndicator} />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={styles.bottom}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>{userName.charAt(0).toUpperCase()}</div>
          <div>
            <p className={styles.userName}>{userName}</p>
            <p className={styles.userRole} style={{textTransform: 'capitalize'}}>{userRole}</p>
          </div>
        </div>
        <a href="#" onClick={handleLogout} className={styles.logout}>
          <LogOut size={18} />
          <span>Keluar</span>
        </a>
      </div>
    </aside>
  );
}
