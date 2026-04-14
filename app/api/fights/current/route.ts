import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();

  const fight = db.prepare(`
    SELECT f.*,
      (SELECT SUM(amount) FROM bets WHERE fight_id = f.id AND side = 'meron') as meron_pool,
      (SELECT SUM(amount) FROM bets WHERE fight_id = f.id AND side = 'wala') as wala_pool
    FROM fights f
    WHERE f.status IN ('open', 'live', 'closed')
    ORDER BY f.created_at DESC
    LIMIT 1
  `).get() as any;

  const streamConfig = db.prepare('SELECT stream_url FROM stream_config WHERE id = 1').get() as any;

  return NextResponse.json({
    fight: fight || null,
    streamUrl: streamConfig?.stream_url || '',
  });
}
