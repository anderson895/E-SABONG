import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { broadcast } from '@/lib/ws';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { fightNumber, meronName, walaName } = await request.json();

  const db = getDb();

  // Close any currently open fight first
  db.prepare("UPDATE fights SET status = 'closed' WHERE status = 'open'").run();
  db.prepare("UPDATE fights SET status = 'closed' WHERE status = 'live'").run();

  const result = db.prepare(
    'INSERT INTO fights (fight_number, meron_name, wala_name, status) VALUES (?, ?, ?, ?)'
  ).run(fightNumber || 1, meronName || 'MERON', walaName || 'WALA', 'open');

  broadcast('fight:created', { fightId: result.lastInsertRowid });

  return NextResponse.json({ success: true, fightId: result.lastInsertRowid });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { fightId, status } = await request.json();
  const validStatuses = ['open', 'live', 'closed', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const db = getDb();
  db.prepare('UPDATE fights SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, fightId);

  broadcast('fight:status', { fightId, status });

  return NextResponse.json({ success: true });
}
