'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FireIcon, WalletIcon, Cog6ToothIcon, TicketIcon, ArrowRightOnRectangleIcon, UserPlusIcon, ArrowLeftOnRectangleIcon, SignalIcon } from '@heroicons/react/24/solid';

interface User {
  id: number;
  username: string;
  role: string;
  balance: number;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/users/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch {}
    setLoading(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="bg-gray-900 border-b border-red-900/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <FireIcon className="w-7 h-7 text-red-500" />
          <span className="text-xl font-bold text-red-500">E-SABONG</span>
          <span className="flex items-center gap-1 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full live-indicator font-bold">
            <SignalIcon className="w-3 h-3" />
            LIVE
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {loading ? null : user ? (
            <>
              <div className="flex items-center gap-1.5 text-sm text-gray-300">
                <WalletIcon className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-bold">₱{user.balance.toFixed(2)}</span>
              </div>
              <span className="text-sm text-gray-400">@{user.username}</span>
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 text-sm bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1.5 rounded-lg transition"
                >
                  <Cog6ToothIcon className="w-4 h-4" />
                  Admin
                </Link>
              )}
              <Link
                href="/bets"
                className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition"
              >
                <TicketIcon className="w-4 h-4" />
                My Bets
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition"
              >
                <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                Login
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 text-sm bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-lg transition"
              >
                <UserPlusIcon className="w-4 h-4" />
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
