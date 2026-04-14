'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
          <span className="text-2xl">🐓</span>
          <span className="text-xl font-bold text-red-500">E-SABONG</span>
          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full live-indicator font-bold">LIVE</span>
        </Link>

        <div className="flex items-center gap-4">
          {loading ? null : user ? (
            <>
              <div className="text-sm text-gray-300">
                <span className="text-gray-500">Balance:</span>{' '}
                <span className="text-green-400 font-bold">₱{user.balance.toFixed(2)}</span>
              </div>
              <span className="text-sm text-gray-400">@{user.username}</span>
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="text-sm bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1.5 rounded-lg transition"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/bets"
                className="text-sm text-gray-300 hover:text-white transition"
              >
                My Bets
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-300 hover:text-white transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-sm bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-lg transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
