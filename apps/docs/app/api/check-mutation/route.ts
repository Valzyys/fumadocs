import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

    console.log('[check-mutation] Fetching history for amount:', uniqueAmount);

    const response = await fetch(
      'https://orkut.jkt48connect.com/api/jkt48connect/qris/history',
      {
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      }
    ).catch((err: any) => {
      throw new Error(`Network fetch failed: ${err?.message ?? String(err)}`);
    });

    console.log('[check-mutation] HTTP status:', response.status);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Gateway HTTP ${response.status}: ${text.slice(0, 200)}`);
    }

    const raw = await response.text();
    console.log('[check-mutation] Raw response (first 300 chars):', raw.slice(0, 300));

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(`Invalid JSON from gateway: ${raw.slice(0, 200)}`);
    }

    // Struktur API: { status: "success", data: { success: true, results: [...] } }
    const results = data?.data?.results;

    if (!Array.isArray(results)) {
      console.error('[check-mutation] Unexpected shape. Keys found:', Object.keys(data ?? {}));
      // Coba fallback: beberapa versi API mungkin pakai data.result langsung
      const fallback = data?.result ?? data?.results ?? data?.data?.result;
      if (!Array.isArray(fallback)) {
        throw new Error(`results is not an array. Shape: ${JSON.stringify(Object.keys(data ?? {}))}`);
      }
      console.warn('[check-mutation] Using fallback results field');
      return processResults(fallback, uniqueAmount, currentDate);
    }

    return processResults(results, uniqueAmount, currentDate);

  } catch (error: any) {
    console.error('[check-mutation] Error:', error?.message ?? error);
    return NextResponse.json(
      { error: error?.message ?? 'Failed to fetch mutation data' },
      { status: 500 }
    );
  }
}

function processResults(results: any[], uniqueAmount: number, currentDate: string) {
  const now = new Date(currentDate);

  console.log('[check-mutation] Total results:', results.length);
  console.log('[check-mutation] Looking for amount:', uniqueAmount);

  const incomingTransactions = results.filter((tx: any) => {
    if (tx.status !== 'IN') return false;
    const txDate = parseTransactionDate(tx.tanggal);
    const diffMinutes = (now.getTime() - txDate.getTime()) / 1000 / 60;
    return diffMinutes >= 0 && diffMinutes <= 30;
  });

  console.log('[check-mutation] IN transactions (last 30min):', incomingTransactions.length);

  // Log semua kredit agar mudah debug nominal
  incomingTransactions.forEach((tx: any) => {
    console.log(`  → kredit raw: "${tx.kredit}" parsed: ${parseFloat(tx.kredit.replace(/\./g, ''))} tanggal: ${tx.tanggal}`);
  });

  const matched = incomingTransactions.find((tx: any) => {
    const amount = parseFloat(tx.kredit.replace(/\./g, ''));
    return amount === uniqueAmount;
  });

  if (matched) {
    console.log('[check-mutation] ✅ Match found:', matched.id);
    return NextResponse.json({ success: true, transaction: matched });
  }

  console.log('[check-mutation] ❌ No match found');
  return NextResponse.json({ success: false, message: 'No matching transaction found' });
}

// "28/02/2026 15:26" → Date (local time)
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
