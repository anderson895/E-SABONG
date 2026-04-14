import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { broadcast } from '@/lib/ws';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { fightId, result } = await request.json();

  if (!['meron', 'wala', 'draw', 'cancelled'].includes(result)) {
    return NextResponse.json({ error: 'Invalid result' }, { status: 400 });
  }

  const db = getDb();
  const fight = db.prepare('SELECT * FROM fights WHERE id = ?').get(fightId) as any;

  if (!fight) {
    return NextResponse.json({ error: 'Fight not found' }, { status: 404 });
  }

  if (fight.status === 'finished') {
    return NextResponse.json({ error: 'Fight already finished' }, { status: 400 });
  }

  const settleResult = db.transaction(() => {
    db.prepare('UPDATE fights SET status = ?, result = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('finished', result, fightId);

    const bets = db.prepare('SELECT * FROM bets WHERE fight_id = ?').all(fightId) as any[];

    if (result === 'cancelled' || result === 'draw') {
      // Refund all bets
      for (const bet of bets) {
        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(bet.amount, bet.user_id);
        db.prepare('UPDATE bets SET status = ?, payout = ? WHERE id = ?').run('refunded', bet.amount, bet.id);
      }
    } else {
      const winnerBets = bets.filter((b) => b.side === result);
      const loserBets = bets.filter((b) => b.side !== result);

      const winPool = winnerBets.reduce((s: number, b: any) => s + b.amount, 0);
      const losePool = loserBets.reduce((s: number, b: any) => s + b.amount, 0);

      // Parimutuel payout. When no opposing bets exist, fall back to a 2x
      // payout so the winner still gets winnings instead of only their stake.
      const MIN_MULTIPLIER = 2;

      for (const bet of winnerBets) {
        let payout: number;
        if (losePool > 0 && winPool > 0) {
          const odds = (winPool + losePool) / winPool;
          payout = bet.amount * Math.max(odds, MIN_MULTIPLIER);
        } else {
          payout = bet.amount * MIN_MULTIPLIER;
        }
        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(payout, bet.user_id);
        db.prepare('UPDATE bets SET status = ?, payout = ? WHERE id = ?').run('won', payout, bet.id);
      }

      for (const bet of loserBets) {
        db.prepare('UPDATE bets SET status = ?, payout = ? WHERE id = ?').run('lost', 0, bet.id);
      }
    }
  });

  settleResult();

  broadcast('fight:result', { fightId, result });

  return NextResponse.json({ success: true });
}
