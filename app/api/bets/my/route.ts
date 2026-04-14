import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const bets = db.prepare(`
    SELECT b.*, f.fight_number, f.meron_name, f.wala_name, f.status as fight_status, f.result as fight_result
    FROM bets b
    JOIN fights f ON b.fight_id = f.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `).all(session.id);

  return NextResponse.json({ bets });
}
