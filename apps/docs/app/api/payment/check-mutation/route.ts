import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { uniqueAmount, currentDate } = await request.json();

    if (!uniqueAmount || !currentDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Credentials disimpan di server-side (sebaiknya di env variables)
    const apiKey = process.env.MUTATION_API_KEY || 'ubot';
    const username = process.env.MUTATION_USERNAME || 'valzhost';
    const token = process.env.MUTATION_TOKEN || '1453563:PegBGy3NOkz69pZJdohTWMFiI1qsLRVH';

    const response = await fetch(
      `https://api-simplebot.vercel.app/orderkuota/mutasiqr?apikey=${apiKey}&username=${username}&token=${token}`
    );

    if (!response.ok) {
      throw new Error('Failed to check mutation');
    }

    const data = await response.json();

    if (data.status && data.result && Array.isArray(data.result)) {
      // Filter transaksi yang sesuai
      const incomingTransactions = data.result.filter((transaction: any) => {
        if (transaction.status !== 'IN') return false;

        const transactionDate = parseTransactionDate(transaction.tanggal);
        const transactionDateStr = formatDateForComparison(transactionDate);
        
        const now = new Date(currentDate);
        const timeDiff = Math.abs(now.getTime() - transactionDate.getTime()) / 1000 / 60;
        
        return transactionDateStr === formatDateForComparison(now) && timeDiff <= 5;
      });

      // Cari transaksi yang cocok
      const matchedTransaction = incomingTransactions.find((transaction: any) => {
        const amount = parseFloat(transaction.kredit.replace(/\./g, ''));
        return amount === uniqueAmount;
      });

      if (matchedTransaction) {
        return NextResponse.json({
          success: true,
          transaction: matchedTransaction
        });
      }
    }

    return NextResponse.json({
      success: false,
      message: 'No matching transaction found'
    });
  } catch (error) {
    console.error('Check mutation error:', error);
    return NextResponse.json(
      { error: 'Failed to check mutation' },
      { status: 500 }
    );
  }
}

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

function formatDateForComparison(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, '0');
  
  return `${day}/${month}/${year}-${hour}`;
}
