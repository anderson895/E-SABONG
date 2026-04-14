import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId, amount } = await request.json();

  if (!userId || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Valid userId and amount required' }, { status: 400 });
  }

  const db = getDb();
  const user = db.prepare('SELECT id, username, balance FROM users WHERE id = ? AND role = ?').get(userId, 'user') as any;

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, userId);

  const updated = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId) as any;

  return NextResponse.json({
    success: true,
    username: user.username,
    added: amount,
    newBalance: updated.balance,
  });
}
