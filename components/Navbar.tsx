'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FireIcon,
  WalletIcon,
  Cog6ToothIcon,
  TicketIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon,
  ArrowLeftOnRectangleIcon,
  SignalIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/solid';

interface User {
  id: number;
  username: string;
  role: string;
  balance: number;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
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
    setMenuOpen(false);
    router.push('/login');
    router.refresh();
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="bg-gray-900 border-b border-red-900/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between h-14 sm:h-16 gap-2">
        {/* Brand */}
        <Link href="/" onClick={closeMenu} className="flex items-center gap-2 min-w-0">
          <FireIcon className="w-6 h-6 sm:w-7 sm:h-7 text-red-500 flex-shrink-0" />
          <span className="text-lg sm:text-xl font-bold text-red-500 truncate">E-SABONG</span>
          <span className="hidden xs:flex items-center gap-1 text-[10px] sm:text-xs bg-red-600 text-white px-1.5 sm:px-2 py-0.5 rounded-full live-indicator font-bold">
            <SignalIcon className="w-3 h-3" />
            LIVE
          </span>
        </Link>

        {/* Balance (always visible when logged in) */}
        {!loading && user && (
          <div className="flex md:hidden items-center gap-1 text-xs bg-gray-800 border border-green-900/40 rounded-full px-2.5 py-1 ml-auto mr-1">
            <WalletIcon className="w-3.5 h-3.5 text-green-400" />
            <span className="text-green-400 font-bold">₱{user.balance.toFixed(2)}</span>
          </div>
        )}

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4">
          {loading ? null : user ? (
            <>
              <div className="flex items-center gap-1.5 text-sm bg-gray-800 border border-green-900/40 rounded-full px-3 py-1">
                <WalletIcon className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-bold">₱{user.balance.toFixed(2)}</span>
              </div>
              <span className="text-sm text-gray-400 hidden lg:inline">@{user.username}</span>
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

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition"
        >
          {menuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-900">
          <div className="max-w-7xl mx-auto px-3 py-3 space-y-2">
            {loading ? null : user ? (
              <>
                <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-400">@{user.username}</span>
                  <div className="flex items-center gap-1.5 text-sm">
                    <WalletIcon className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-bold">₱{user.balance.toFixed(2)}</span>
                  </div>
                </div>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={closeMenu}
                    className="flex items-center gap-2 text-sm bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-2.5 rounded-lg transition"
                  >
                    <Cog6ToothIcon className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}
                <Link
                  href="/bets"
                  onClick={closeMenu}
                  className="flex items-center gap-2 text-sm text-gray-200 hover:bg-gray-800 px-3 py-2.5 rounded-lg transition"
                >
                  <TicketIcon className="w-4 h-4" />
                  My Bets
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-2.5 rounded-lg transition"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="flex items-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-2.5 rounded-lg transition"
                >
                  <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={closeMenu}
                  className="flex items-center gap-2 text-sm bg-red-600 hover:bg-red-500 text-white px-3 py-2.5 rounded-lg transition"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
