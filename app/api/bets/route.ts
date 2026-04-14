import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { fightId, side, amount } = await request.json();

  if (!fightId || !side || !amount) {
    return NextResponse.json({ error: 'fightId, side, and amount required' }, { status: 400 });
  }

  if (!['meron', 'wala'].includes(side)) {
    return NextResponse.json({ error: 'Side must be meron or wala' }, { status: 400 });
  }

  if (amount <= 0) {
    return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
  }

  const db = getDb();

  const fight = db.prepare('SELECT * FROM fights WHERE id = ?').get(fightId) as any;
  if (!fight) {
    return NextResponse.json({ error: 'Fight not found' }, { status: 404 });
  }

  if (fight.status !== 'open') {
    return NextResponse.json({ error: 'Betting is closed for this fight' }, { status: 400 });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.id) as any;
  if (!user || user.balance < amount) {
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
  }

  const existingBet = db.prepare('SELECT id FROM bets WHERE user_id = ? AND fight_id = ?').get(session.id, fightId);
  if (existingBet) {
    return NextResponse.json({ error: 'You already placed a bet on this fight' }, { status: 400 });
  }

  const placeBet = db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, session.id);
    const result = db.prepare(
      'INSERT INTO bets (user_id, fight_id, side, amount, odds) VALUES (?, ?, ?, ?, ?)'
    ).run(session.id, fightId, side, amount, 1.0);
    return result.lastInsertRowid;
  });

  const betId = placeBet();

  return NextResponse.json({ success: true, betId });
}
