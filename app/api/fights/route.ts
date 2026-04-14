import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const fights = db.prepare(`
    SELECT f.*,
      (SELECT COUNT(*) FROM bets WHERE fight_id = f.id AND side = 'meron') as meron_bets,
      (SELECT COUNT(*) FROM bets WHERE fight_id = f.id AND side = 'wala') as wala_bets,
      (SELECT SUM(amount) FROM bets WHERE fight_id = f.id AND side = 'meron') as meron_pool,
      (SELECT SUM(amount) FROM bets WHERE fight_id = f.id AND side = 'wala') as wala_pool
    FROM fights f
    ORDER BY f.created_at DESC
    LIMIT 20
  `).all();

  return NextResponse.json({ fights });
}
