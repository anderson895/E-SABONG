'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import LiveStream from '@/components/LiveStream';
import BettingPanel from '@/components/BettingPanel';
import Link from 'next/link';
import { ClockIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Fight {
  id: number;
  fight_number: number;
  meron_name: string;
  wala_name: string;
  status: string;
  result: string | null;
  meron_pool: number | null;
  wala_pool: number | null;
}

interface User {
  id: number;
  username: string;
  role: string;
  balance: number;
}

export default function Home() {
  const [fight, setFight] = useState<Fight | null>(null);
  const [streamUrl, setStreamUrl] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [recentFights, setRecentFights] = useState<Fight[]>([]);

  const fetchData = useCallback(async () => {
    const [currentRes, userRes, fightsRes] = await Promise.all([
      fetch('/api/fights/current'),
      fetch('/api/users/me'),
      fetch('/api/fights'),
    ]);

    if (currentRes.ok) {
      const data = await currentRes.json();
      setFight(data.fight);
      setStreamUrl(data.streamUrl);
    }

    if (userRes.ok) {
      const data = await userRes.json();
      setUser(data.user);
    }

    if (fightsRes.ok) {
      const data = await fightsRes.json();
      setRecentFights(data.fights.filter((f: Fight) => f.status === 'finished').slice(0, 5));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Re-fetch data on any WebSocket event from the server
  const wsEvents = useMemo(() => ({
    'fight:created': fetchData,
    'fight:status': fetchData,
    'fight:result': fetchData,
    'bet:placed': fetchData,
    'stream:updated': fetchData,
  }), [fetchData]);

  useWebSocket(wsEvents);

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Stream + Recent Results */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
            <LiveStream streamUrl={streamUrl} />

            {recentFights.length > 0 && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-3 sm:p-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Results</h3>
                <div className="space-y-1">
                  {recentFights.map((f) => (
                    <div key={f.id} className="flex items-center justify-between gap-2 text-sm py-2 border-b border-gray-800 last:border-0">
                      <span className="text-gray-400 flex-shrink-0">Fight #{f.fight_number}</span>
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <span className="text-gray-500 truncate text-xs sm:text-sm">{f.meron_name} vs {f.wala_name}</span>
                        <ResultBadge result={f.result} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Betting Panel */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            {fight ? (
              user ? (
                <BettingPanel fight={fight} userBalance={user.balance} onBetPlaced={fetchData} />
              ) : (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
                  <p className="text-gray-400 mb-4">Login to place bets</p>
                  <Link href="/login" className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg transition inline-block">
                    Login
                  </Link>
                </div>
              )
            ) : (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
                <ClockIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 font-semibold">No Active Fight</p>
                <p className="text-gray-600 text-sm mt-1">Next fight coming soon</p>
              </div>
            )}

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-yellow-500 uppercase tracking-wider mb-3">
                <InformationCircleIcon className="w-4 h-4" />
                How to Play
              </h3>
              <ol className="space-y-2 text-sm text-gray-400">
                <li className="flex gap-2"><span className="text-red-400 font-bold">1.</span> Register and get ₱1,000 starting balance</li>
                <li className="flex gap-2"><span className="text-red-400 font-bold">2.</span> Wait for a fight to open betting</li>
                <li className="flex gap-2"><span className="text-red-400 font-bold">3.</span> Choose <span className="text-red-400 font-bold mx-1">MERON</span> or <span className="text-blue-400 font-bold mx-1">WALA</span></li>
                <li className="flex gap-2"><span className="text-red-400 font-bold">4.</span> Enter your bet amount and confirm</li>
                <li className="flex gap-2"><span className="text-red-400 font-bold">5.</span> Watch the live stream and win!</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ResultBadge({ result }: { result: string | null }) {
  if (!result) return null;
  const map: Record<string, string> = {
    meron: 'bg-red-900 text-red-300',
    wala: 'bg-blue-900 text-blue-300',
    draw: 'bg-yellow-900 text-yellow-300',
    cancelled: 'bg-gray-800 text-gray-400',
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${map[result] || 'bg-gray-800 text-gray-400'}`}>
      {result}
    </span>
  );
}
