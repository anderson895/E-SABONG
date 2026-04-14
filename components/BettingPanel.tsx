'use client';

import { useState } from 'react';

interface Fight {
  id: number;
  fight_number: number;
  meron_name: string;
  wala_name: string;
  status: string;
  meron_pool: number | null;
  wala_pool: number | null;
}

interface BettingPanelProps {
  fight: Fight;
  userBalance: number;
  onBetPlaced: () => void;
}

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

export default function BettingPanel({ fight, userBalance, onBetPlaced }: BettingPanelProps) {
  const [selectedSide, setSelectedSide] = useState<'meron' | 'wala' | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const meronPool = fight.meron_pool || 0;
  const walaPool = fight.wala_pool || 0;
  const totalPool = meronPool + walaPool;

  const meronOdds = totalPool > 0 && walaPool > 0 ? (totalPool / meronPool).toFixed(2) : '—';
  const walaOdds = totalPool > 0 && meronPool > 0 ? (totalPool / walaPool).toFixed(2) : '—';

  const isBettingOpen = fight.status === 'open';

  const handleBet = async () => {
    if (!selectedSide || !amount || parseFloat(amount) <= 0) {
      setMessage({ text: 'Select a side and enter an amount', type: 'error' });
      return;
    }

    if (parseFloat(amount) > userBalance) {
      setMessage({ text: 'Insufficient balance', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fightId: fight.id, side: selectedSide, amount: parseFloat(amount) }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: `Bet placed on ${selectedSide.toUpperCase()}! Good luck!`, type: 'success' });
        setAmount('');
        setSelectedSide(null);
        onBetPlaced();
      } else {
        setMessage({ text: data.error || 'Failed to place bet', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Network error', type: 'error' });
    }

    setLoading(false);
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Fight Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <span className="text-gray-400 text-xs uppercase tracking-wider">Fight #{fight.fight_number}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={fight.status} />
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Total Pool</div>
          <div className="text-green-400 font-bold text-lg">₱{totalPool.toFixed(2)}</div>
        </div>
      </div>

      {/* Teams */}
      <div className="grid grid-cols-2 gap-0 border-b border-gray-800">
        <button
          onClick={() => isBettingOpen && setSelectedSide('meron')}
          disabled={!isBettingOpen}
          className={`p-4 transition-all ${
            selectedSide === 'meron'
              ? 'bg-red-900/40 border-b-2 border-red-500'
              : 'hover:bg-red-900/20'
          } ${!isBettingOpen ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
        >
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Meron</div>
            <div className="text-2xl font-black text-red-400">{fight.meron_name}</div>
            <div className="text-xs text-gray-400 mt-1">Pool: ₱{meronPool.toFixed(2)}</div>
            <div className="text-sm font-bold text-red-300 mt-0.5">Odds: {meronOdds}x</div>
          </div>
        </button>

        <button
          onClick={() => isBettingOpen && setSelectedSide('wala')}
          disabled={!isBettingOpen}
          className={`p-4 transition-all border-l border-gray-800 ${
            selectedSide === 'wala'
              ? 'bg-blue-900/40 border-b-2 border-blue-500'
              : 'hover:bg-blue-900/20'
          } ${!isBettingOpen ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
        >
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Wala</div>
            <div className="text-2xl font-black text-blue-400">{fight.wala_name}</div>
            <div className="text-xs text-gray-400 mt-1">Pool: ₱{walaPool.toFixed(2)}</div>
            <div className="text-sm font-bold text-blue-300 mt-0.5">Odds: {walaOdds}x</div>
          </div>
        </button>
      </div>

      {/* Betting Area */}
      {isBettingOpen ? (
        <div className="p-4 space-y-4">
          {selectedSide && (
            <div className={`text-center text-sm font-bold py-2 rounded-lg ${
              selectedSide === 'meron' ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'
            }`}>
              Betting on {selectedSide.toUpperCase()}
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Quick Bet</label>
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAmount(String(a))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    amount === String(a)
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  ₱{a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Amount (₱)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount..."
              min="1"
              max={userBalance}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 transition"
            />
            <div className="text-xs text-gray-500 mt-1">Balance: ₱{userBalance.toFixed(2)}</div>
          </div>

          {message && (
            <div className={`text-sm text-center py-2 rounded-lg ${
              message.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
            }`}>
              {message.text}
            </div>
          )}

          <button
            onClick={handleBet}
            disabled={loading || !selectedSide || !amount}
            className={`w-full py-3 rounded-lg font-bold text-lg transition ${
              selectedSide === 'meron'
                ? 'btn-meron hover:opacity-90'
                : selectedSide === 'wala'
                ? 'btn-wala hover:opacity-90'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            } disabled:opacity-50`}
          >
            {loading ? 'Placing Bet...' : selectedSide ? `BET ${selectedSide.toUpperCase()}` : 'SELECT A SIDE'}
          </button>
        </div>
      ) : (
        <div className="p-6 text-center">
          <p className="text-gray-400 text-sm">
            {fight.status === 'live' && 'Betting is closed — fight in progress'}
            {fight.status === 'closed' && 'Betting closed — awaiting result'}
            {fight.status === 'finished' && `Result: ${fight.status.toUpperCase()}`}
            {fight.status === 'upcoming' && 'Fight coming soon'}
            {fight.status === 'cancelled' && 'Fight cancelled'}
          </p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    upcoming: { label: 'Upcoming', cls: 'bg-gray-600 text-gray-200' },
    open: { label: 'Betting Open', cls: 'bg-green-700 text-green-100 live-indicator' },
    live: { label: 'Fight Live', cls: 'bg-red-700 text-red-100 live-indicator' },
    closed: { label: 'Betting Closed', cls: 'bg-yellow-700 text-yellow-100' },
    finished: { label: 'Finished', cls: 'bg-gray-700 text-gray-300' },
    cancelled: { label: 'Cancelled', cls: 'bg-gray-700 text-gray-400' },
  };

  const s = map[status] || { label: status, cls: 'bg-gray-700 text-gray-300' };

  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${s.cls}`}>
      {s.label}
    </span>
  );
}
