'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FireIcon, UserIcon, LockClosedIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      setError(data.error || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="bg-red-600/20 p-4 rounded-2xl">
              <FireIcon className="w-12 h-12 text-red-500" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-red-500">E-SABONG</h1>
          <p className="text-gray-400 mt-1">Create your account — get ₱1,000 free!</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl border border-gray-800 p-8 space-y-5">
          <div>
            <label className="text-sm text-gray-400 uppercase tracking-wider block mb-2">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-red-500 transition"
                placeholder="Min. 3 characters"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 uppercase tracking-wider block mb-2">Password</label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-red-500 transition"
                placeholder="Min. 6 characters"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 uppercase tracking-wider block mb-2">Confirm Password</label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-red-500 transition"
                placeholder="Repeat password"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-900/30 text-red-400 text-sm px-3 py-2 rounded-lg">
              <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 text-lg"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>

          <p className="text-center text-gray-500 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-red-400 hover:text-red-300 transition">
              Login here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
