'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

interface Bet {
  id: number;
  fight_id: number;
  fight_number: number;
  meron_name: string;
  wala_name: string;
  side: string;
  amount: number;
  payout: number | null;
  status: string;
  fight_status: string;
  fight_result: string | null;
  created_at: string;
}

export default function BetsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    fetch('/api/bets/my')
      .then((r) => {
        if (r.status === 401) { setUnauthorized(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) setBets(data.bets);
        setLoading(false);
      });
  }, []);

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-gray-400 mb-4">Please login to view your bets</p>
            <Link href="/login" className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg transition">Login</Link>
          </div>
        </div>
      </div>
    );
  }

  const totalBet = bets.reduce((s, b) => s + b.amount, 0);
  const totalPayout = bets.filter(b => b.status === 'won').reduce((s, b) => s + (b.payout || 0), 0);

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white">My Bets</h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-2xl font-bold text-white">{bets.length}</div>
            <div className="text-[10px] sm:text-xs text-gray-400 mt-1">Total Bets</div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-3 sm:p-4 text-center">
            <div className="text-base sm:text-2xl font-bold text-red-400 break-all">₱{totalBet.toFixed(2)}</div>
            <div className="text-[10px] sm:text-xs text-gray-400 mt-1">Total Wagered</div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-3 sm:p-4 text-center">
            <div className="text-base sm:text-2xl font-bold text-green-400 break-all">₱{totalPayout.toFixed(2)}</div>
            <div className="text-[10px] sm:text-xs text-gray-400 mt-1">Total Winnings</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-16">Loading...</div>
        ) : bets.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">No bets yet</p>
            <Link href="/" className="text-red-400 hover:text-red-300 text-sm mt-2 inline-block">Place your first bet →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bets.map((bet) => (
              <div key={bet.id} className="bg-gray-900 rounded-xl border border-gray-800 p-3 sm:p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-gray-400 text-sm">Fight #{bet.fight_number}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                      bet.side === 'meron' ? 'bg-red-900 text-red-300' : 'bg-blue-900 text-blue-300'
                    }`}>{bet.side}</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{bet.meron_name} vs {bet.wala_name}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-white font-bold text-sm sm:text-base">₱{bet.amount.toFixed(2)}</div>
                  <BetStatusBadge status={bet.status} payout={bet.payout} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function BetStatusBadge({ status, payout }: { status: string; payout: number | null }) {
  const map: Record<string, string> = {
    pending: 'text-yellow-400',
    won: 'text-green-400',
    lost: 'text-red-400',
    refunded: 'text-gray-400',
  };
  return (
    <div className={`text-sm font-bold ${map[status] || 'text-gray-400'}`}>
      {status === 'won' && payout ? `+₱${payout.toFixed(2)}` : status.toUpperCase()}
    </div>
  );
}
