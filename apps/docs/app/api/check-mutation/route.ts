import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { uniqueAmount, currentDate } = await request.json();

    if (!uniqueAmount || !currentDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Fetch mutation history
    let response: Response;
    try {
      response = await fetch(
        'https://orkut.jkt48connect.com/api/jkt48connect/qris/history',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(10_000),
        }
      );
    } catch (fetchErr: any) {
      console.error('[check-mutation] Network error:', fetchErr?.message);
      return NextResponse.json(
        { error: 'Cannot reach payment gateway', detail: fetchErr?.message },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const rawText = await response.text().catch(() => '(unreadable)');
      console.error(`[check-mutation] API returned ${response.status}:`, rawText);
      return NextResponse.json(
        { error: `Payment gateway error: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();

    // ✅ Struktur asli API:
    // { status: "success", data: { success: true, results: [...] } }
    //
    // ❌ Bug lama: cek data.result (field ini tidak ada!) dan data.status (truthy tapi
    //    data.result tetap undefined → Array.isArray(undefined) = false → skip semua)
    const results = data?.data?.results;

    if (!Array.isArray(results)) {
      console.error('[check-mutation] Unexpected API shape:', JSON.stringify(data).slice(0, 300));
      return NextResponse.json(
        { error: 'Unexpected response from payment gateway' },
        { status: 502 }
      );
    }

    const now = new Date(currentDate);

    // Filter: hanya transaksi IN dalam 30 menit terakhir
    const incomingTransactions = results.filter((transaction: any) => {
      if (transaction.status !== 'IN') return false;

      const transactionDate = parseTransactionDate(transaction.tanggal);
      const timeDiffMinutes = (now.getTime() - transactionDate.getTime()) / 1000 / 60;

      // Terima transaksi dalam 30 menit terakhir (positif = sudah lewat)
      return timeDiffMinutes >= 0 && timeDiffMinutes <= 30;
    });

    // Cari transaksi yang nominalnya cocok persis dengan uniqueAmount
    // kredit format "15.352" (titik = pemisah ribuan) → hapus titik → 15352
    const matchedTransaction = incomingTransactions.find((transaction: any) => {
      const amount = parseFloat(transaction.kredit.replace(/\./g, ''));
      return amount === uniqueAmount;
    });

    if (matchedTransaction) {
      return NextResponse.json({
        success: true,
        transaction: matchedTransaction,
      });
    }

    return NextResponse.json({
      success: false,
      message: 'No matching transaction found',
    });

  } catch (error: any) {
    console.error('[check-mutation] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mutation data', detail: error?.message },
      { status: 500 }
    );
  }
}

// "28/02/2026 15:26" → Date object (local time)
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
