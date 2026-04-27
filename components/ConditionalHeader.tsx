'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import UserMenu from './UserMenu';
import ThemeToggle from './ThemeToggle';
import { Sun } from '@phosphor-icons/react';

export default function ConditionalHeader() {
  const pathname = usePathname();
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Europe/Paris',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      setTime(now.toLocaleTimeString('fr-FR', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const isAuthPage =
    pathname?.startsWith('/login') || pathname?.startsWith('/reset-password');

  if (isAuthPage) {
    return null;
  }

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 w-full h-16 bg-gradient-to-r from-cyan-500/90 via-blue-500/90 to-violet-500/90 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-cyan-500/10 flex items-center px-4 relative overflow-hidden"
        style={{ position: 'fixed', top: 0, left: 0, right: 0 }}
        role="banner"
      >
        <div className="flex-1 flex items-center gap-3 relative z-10">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="relative bg-white rounded-full p-2 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <Sun size={24} weight="fill" className="text-cyan-500" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Eversun
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="text-xs font-semibold bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg shadow-md border border-white/30 hover:bg-white/30 transition-colors duration-300">
            {time}
          </div>
          <div className="flex items-center gap-2 pl-3 border-l border-white/20">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>
      <div id="logout-dialog-portal" />
    </>
  );
}
