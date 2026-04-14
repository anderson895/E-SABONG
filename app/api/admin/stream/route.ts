import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { streamUrl } = await request.json();

  const db = getDb();
  db.prepare('UPDATE stream_config SET stream_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(streamUrl || '');

  return NextResponse.json({ success: true });
}

export async function GET() {
  const db = getDb();
  const config = db.prepare('SELECT stream_url FROM stream_config WHERE id = 1').get() as any;
  return NextResponse.json({ streamUrl: config?.stream_url || '' });
}
