import { sheets, SPREADSHEET_ID } from '@/lib/sheets/client';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get('tab') ?? 'sets';
    const range = searchParams.get('range') ?? `${tab}!A:Z`;

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });

    return NextResponse.json({ values: res.data.values ?? [] });
  } catch (err) {
    console.error('Sheets read error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
