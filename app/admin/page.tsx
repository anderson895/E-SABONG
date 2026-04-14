'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Player {
  id: number;
  username: string;
  balance: number;
  total_bets: number;
  created_at: string;
}

interface Fight {
  id: number;
  fight_number: number;
  meron_name: string;
  wala_name: string;
  status: string;
  result: string | null;
  meron_pool: number | null;
  wala_pool: number | null;
  created_at: string;
}

export default function AdminPage() {
  const [fights, setFights] = useState<Fight[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [streamUrl, setStreamUrl] = useState('');
  const [newStreamUrl, setNewStreamUrl] = useState('');
  const [fightNum, setFightNum] = useState('');
  const [meronName, setMeronName] = useState('MERON');
  const [walaName, setWalaName] = useState('WALA');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [topupUserId, setTopupUserId] = useState<number | null>(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const userRes = await fetch('/api/users/me');
      if (!userRes.ok) { router.push('/login'); return; }
      const userData = await userRes.json();
      if (userData.user.role !== 'admin') { router.push('/'); return; }
      setAuthorized(true);

      const [fightsRes, streamRes, playersRes] = await Promise.all([
        fetch('/api/fights'),
        fetch('/api/admin/stream'),
        fetch('/api/admin/users'),
      ]);

      if (fightsRes.ok) {
        const data = await fightsRes.json();
        setFights(data.fights);
      }

      if (streamRes.ok) {
        const data = await streamRes.json();
        setStreamUrl(data.streamUrl);
        setNewStreamUrl(data.streamUrl);
      }

      if (playersRes.ok) {
        const data = await playersRes.json();
        setPlayers(data.users);
      }
    } catch {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const wsEvents = useMemo(() => ({
    'fight:created': fetchData,
    'fight:status': fetchData,
    'fight:result': fetchData,
    'bet:placed': fetchData,
  }), [fetchData]);

  useWebSocket(wsEvents);

  const createFight = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/fights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fightNumber: parseInt(fightNum) || 1,
        meronName: meronName || 'MERON',
        walaName: walaName || 'WALA',
      }),
    });
    if (res.ok) {
      setMsg('Fight created!');
      fetchData();
    } else {
      const d = await res.json();
      setMsg(d.error || 'Error');
    }
    setLoading(false);
  };

  const updateStatus = async (fightId: number, status: string) => {
    const res = await fetch('/api/admin/fights', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fightId, status }),
    });
    if (res.ok) fetchData();
  };

  const declareResult = async (fightId: number, result: string) => {
    const res = await fetch('/api/admin/fights/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fightId, result }),
    });
    if (res.ok) {
      setMsg(`Result declared: ${result.toUpperCase()}`);
      fetchData();
    }
  };

  const handleTopup = async (userId: number) => {
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0) return;
    setTopupLoading(true);

    const res = await fetch('/api/admin/users/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount }),
    });

    const data = await res.json();
    if (res.ok) {
      setMsg(`Added ₱${amount.toFixed(2)} to @${data.username}. New balance: ₱${data.newBalance.toFixed(2)}`);
      setTopupUserId(null);
      setTopupAmount('');
      fetchData();
    } else {
      setMsg(data.error || 'Top-up failed');
    }
    setTopupLoading(false);
  };

  const updateStream = async () => {
    const res = await fetch('/api/admin/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ streamUrl: newStreamUrl }),
    });
    if (res.ok) {
      setStreamUrl(newStreamUrl);
      setMsg('Stream URL updated!');
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <p className="text-gray-400">Checking permissions...</p>
          <a href="/login" className="text-red-400 hover:text-red-300 text-sm underline">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const activeFight = fights.find((f) => ['open', 'live', 'closed'].includes(f.status));

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-yellow-400">Admin Panel</h1>
          {msg && (
            <div className="bg-green-900/30 text-green-400 text-sm px-4 py-2 rounded-lg">
              {msg}
            </div>
          )}
        </div>

        {/* Stream Control */}
        <section className="bg-gray-900 rounded-xl border border-gray-800 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-white mb-4">Live Stream URL</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newStreamUrl}
              onChange={(e) => setNewStreamUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or HLS/MP4 URL"
              className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition"
            />
            <button
              onClick={updateStream}
              className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-5 py-2.5 rounded-lg transition text-sm whitespace-nowrap"
            >
              Update Stream
            </button>
          </div>
          {streamUrl && (
            <p className="text-xs text-gray-500 mt-2 truncate">Current: {streamUrl}</p>
          )}
        </section>

        {/* Create Fight */}
        <section className="bg-gray-900 rounded-xl border border-gray-800 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-white mb-4">Create New Fight</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Fight #</label>
              <input
                type="number"
                value={fightNum}
                onChange={(e) => setFightNum(e.target.value)}
                placeholder="1"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Meron Name</label>
              <input
                type="text"
                value={meronName}
                onChange={(e) => setMeronName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Wala Name</label>
              <input
                type="text"
                value={walaName}
                onChange={(e) => setWalaName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={createFight}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-lg transition disabled:opacity-50 text-sm"
              >
                {loading ? 'Creating...' : 'Open Fight'}
              </button>
            </div>
          </div>
        </section>

        {/* Active Fight Controls */}
        {activeFight && (
          <section className="bg-gray-900 rounded-xl border border-red-900/50 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-red-400 mb-4">
              Active Fight — #{activeFight.fight_number}: {activeFight.meron_name} vs {activeFight.wala_name}
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-red-950/30 rounded-lg p-4 text-center">
                <div className="text-xs text-gray-400 uppercase">Meron Pool</div>
                <div className="text-2xl font-bold text-red-400">₱{(activeFight.meron_pool || 0).toFixed(2)}</div>
              </div>
              <div className="bg-blue-950/30 rounded-lg p-4 text-center">
                <div className="text-xs text-gray-400 uppercase">Wala Pool</div>
                <div className="text-2xl font-bold text-blue-400">₱{(activeFight.wala_pool || 0).toFixed(2)}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Status Control</p>
                <div className="flex flex-wrap gap-2">
                  {['open', 'live', 'closed'].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(activeFight.id, s)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition capitalize ${
                        activeFight.status === s
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      {s === 'open' ? 'Open Bets' : s === 'live' ? 'Start Fight' : 'Close Bets'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Declare Result</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => declareResult(activeFight.id, 'meron')}
                    className="btn-meron px-5 py-2 rounded-lg text-sm font-bold transition hover:opacity-90"
                  >
                    MERON WINS
                  </button>
                  <button
                    onClick={() => declareResult(activeFight.id, 'wala')}
                    className="btn-wala px-5 py-2 rounded-lg text-sm font-bold transition hover:opacity-90"
                  >
                    WALA WINS
                  </button>
                  <button
                    onClick={() => declareResult(activeFight.id, 'draw')}
                    className="btn-draw px-5 py-2 rounded-lg text-sm font-bold transition hover:opacity-90"
                  >
                    DRAW
                  </button>
                  <button
                    onClick={() => declareResult(activeFight.id, 'cancelled')}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-5 py-2 rounded-lg text-sm font-bold transition"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Players & Top-up */}
        <section className="bg-gray-900 rounded-xl border border-green-900/40 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-green-400">Players & Balance Top-up</h2>
            <span className="text-xs text-gray-400">{players.length} players</span>
          </div>

          <input
            type="text"
            value={playerSearch}
            onChange={(e) => setPlayerSearch(e.target.value)}
            placeholder="Search player..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-green-500 transition mb-4"
          />

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {players
              .filter((p) => p.username.toLowerCase().includes(playerSearch.toLowerCase()))
              .map((player) => (
                <div key={player.id} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium truncate">@{player.username}</span>
                        <span className="text-xs text-gray-500">{player.total_bets} bets</span>
                      </div>
                      <div className={`text-sm font-bold mt-0.5 ${player.balance <= 0 ? 'text-red-400' : player.balance < 100 ? 'text-yellow-400' : 'text-green-400'}`}>
                        ₱{player.balance.toFixed(2)}
                        {player.balance <= 0 && <span className="ml-2 text-xs bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded">WALANG PERA</span>}
                        {player.balance > 0 && player.balance < 100 && <span className="ml-2 text-xs bg-yellow-900/50 text-yellow-300 px-1.5 py-0.5 rounded">MABABA</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {topupUserId === player.id ? (
                        <>
                          <input
                            type="number"
                            value={topupAmount}
                            onChange={(e) => setTopupAmount(e.target.value)}
                            placeholder="Amount"
                            autoFocus
                            className="w-28 bg-gray-700 border border-green-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
                          />
                          <button
                            onClick={() => handleTopup(player.id)}
                            disabled={topupLoading}
                            className="bg-green-600 hover:bg-green-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                          >
                            {topupLoading ? '...' : 'Add'}
                          </button>
                          <button
                            onClick={() => { setTopupUserId(null); setTopupAmount(''); }}
                            className="text-gray-500 hover:text-gray-300 text-sm px-2 py-1.5 transition"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          {[100, 500, 1000].map((amt) => (
                            <button
                              key={amt}
                              onClick={async () => {
                                setTopupLoading(true);
                                const res = await fetch('/api/admin/users/topup', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ userId: player.id, amount: amt }),
                                });
                                const data = await res.json();
                                if (res.ok) {
                                  setMsg(`+₱${amt} kay @${data.username}. Bagong balance: ₱${data.newBalance.toFixed(2)}`);
                                  fetchData();
                                }
                                setTopupLoading(false);
                              }}
                              className="text-xs bg-gray-700 hover:bg-green-800 text-green-300 font-bold px-2 py-1 rounded transition"
                            >
                              +₱{amt}
                            </button>
                          ))}
                          <button
                            onClick={() => { setTopupUserId(player.id); setTopupAmount(''); }}
                            className="text-xs bg-green-700 hover:bg-green-600 text-white font-bold px-3 py-1.5 rounded-lg transition"
                          >
                            Custom
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            {players.filter((p) => p.username.toLowerCase().includes(playerSearch.toLowerCase())).length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No players found</p>
            )}
          </div>
        </section>

        {/* Fight History */}
        <section className="bg-gray-900 rounded-xl border border-gray-800 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-white mb-4">Fight History</h2>
          {fights.length === 0 ? (
            <p className="text-gray-500 text-sm">No fights yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
                    <th className="text-left py-2 pr-4">#</th>
                    <th className="text-left py-2 pr-4">Fighters</th>
                    <th className="text-left py-2 pr-4">Status</th>
                    <th className="text-left py-2 pr-4">Result</th>
                    <th className="text-right py-2">Pool</th>
                  </tr>
                </thead>
                <tbody>
                  {fights.map((f) => (
                    <tr key={f.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-2.5 pr-4 text-gray-400">{f.fight_number}</td>
                      <td className="py-2.5 pr-4 text-white">
                        <span className="text-red-400">{f.meron_name}</span>
                        <span className="text-gray-500 mx-2">vs</span>
                        <span className="text-blue-400">{f.wala_name}</span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${statusColor(f.status)}`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        {f.result ? (
                          <span className={`text-xs font-bold uppercase ${resultColor(f.result)}`}>{f.result}</span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right text-gray-300">
                        ₱{((f.meron_pool || 0) + (f.wala_pool || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function statusColor(s: string) {
  const m: Record<string, string> = {
    open: 'bg-green-900 text-green-300',
    live: 'bg-red-900 text-red-300',
    closed: 'bg-yellow-900 text-yellow-300',
    finished: 'bg-gray-800 text-gray-400',
    cancelled: 'bg-gray-800 text-gray-500',
  };
  return m[s] || 'bg-gray-800 text-gray-400';
}

function resultColor(r: string) {
  const m: Record<string, string> = {
    meron: 'text-red-400',
    wala: 'text-blue-400',
    draw: 'text-yellow-400',
    cancelled: 'text-gray-500',
  };
  return m[r] || 'text-gray-400';
}
