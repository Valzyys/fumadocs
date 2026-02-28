import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
// Paksa runtime Node.js (bukan Edge) agar fetch lebih reliable di Vercel
export const runtime = 'nodejs';
// Maksimal 30 detik untuk Vercel serverless
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { uniqueAmount, currentDate } = body;

    if (!uniqueAmount || !currentDate) {
      return NextResponse.json(
        { error: 'Missing required parameters', received: { uniqueAmount, currentDate } },
        { status: 400 }
      );
    }

    console.log('[check-mutation] Fetching for amount:', uniqueAmount, 'date:', currentDate);

    // Vercel: gunakan undici atau node-fetch style, hindari AbortSignal.timeout
    // yang kadang bermasalah di Vercel Edge
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12_000);

    let response: Response;
    try {
      response = await fetch(
        'https://orkut.jkt48connect.com/api/jkt48connect/qris/history',
        {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; NextJS/1.0)',
          },
          signal: controller.signal,
        }
      );
    } catch (err: any) {
      clearTimeout(timeoutId);
      const msg = err?.name === 'AbortError'
        ? 'Request timeout (>12s) reaching payment gateway'
        : `Network error: ${err?.message ?? String(err)}`;
      console.error('[check-mutation] Fetch failed:', msg);
      return NextResponse.json({ error: msg }, { status: 502 });
    } finally {
      clearTimeout(timeoutId);
    }

    console.log('[check-mutation] Response status:', response.status);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error('[check-mutation] Non-OK response:', response.status, text.slice(0, 300));
      return NextResponse.json(
        { error: `Payment gateway returned ${response.status}` },
        { status: 502 }
      );
    }

    const raw = await response.text();
    console.log('[check-mutation] Response preview:', raw.slice(0, 400));

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error('[check-mutation] JSON parse failed. Raw:', raw.slice(0, 300));
      return NextResponse.json(
        { error: 'Payment gateway returned invalid JSON' },
        { status: 502 }
      );
    }

    // Struktur API: { status: "success", data: { results: [...] } }
    const results: any[] = data?.data?.results
      ?? data?.data?.result
      ?? data?.results
      ?? data?.result
      ?? [];

    if (!Array.isArray(results) || results.length === 0) {
      console.warn('[check-mutation] Empty or missing results. Top-level keys:', Object.keys(data ?? {}));
      return NextResponse.json({ success: false, message: 'No transactions found' });
    }

    console.log('[check-mutation] Total transactions:', results.length);

    const now = new Date(currentDate);

    // Filter transaksi IN dalam 30 menit terakhir
    const recent = results.filter((tx: any) => {
      if (tx.status !== 'IN') return false;
      const txDate = parseTransactionDate(tx.tanggal);
      const diffMin = (now.getTime() - txDate.getTime()) / 60_000;
      return diffMin >= 0 && diffMin <= 30;
    });

    console.log('[check-mutation] Recent IN transactions:', recent.length);
    recent.forEach((tx: any) => {
      const parsed = parseFloat(tx.kredit.replace(/\./g, ''));
      console.log(`  id=${tx.id} kredit="${tx.kredit}" parsed=${parsed} tanggal=${tx.tanggal}`);
    });

    // Cocokkan nominal
    const matched = recent.find((tx: any) => {
      const amount = parseFloat(tx.kredit.replace(/\./g, ''));
      return amount === Number(uniqueAmount);
    });

    if (matched) {
      console.log('[check-mutation] ✅ Matched transaction id:', matched.id);
      return NextResponse.json({ success: true, transaction: matched });
    }

    console.log('[check-mutation] ❌ No match for amount:', uniqueAmount);
    return NextResponse.json({ success: false, message: 'No matching transaction found' });

  } catch (error: any) {
    console.error('[check-mutation] Unhandled error:', error?.message ?? error);
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}

// "28/02/2026 15:26" → Date (local time, WIB)
function parseTransactionDate(dateStr: string): Date {
  const [datePart, timePart] = dateStr.split(' ');
  const [day, month, year] = datePart.split('/');
  const [hour, minute] = timePart.split(':');
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute)
  );
}
