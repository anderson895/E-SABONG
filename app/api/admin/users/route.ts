import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getDb();
  const users = db.prepare(`
    SELECT id, username, role, balance, created_at,
      (SELECT COUNT(*) FROM bets WHERE user_id = users.id) as total_bets
    FROM users
    WHERE role = 'user'
    ORDER BY username ASC
  `).all();

  return NextResponse.json({ users });
}
