import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Credentials disimpan di server-side (sebaiknya di env variables)
    const apiKey = process.env.MUTATION_API_KEY || 'ubot';
    const username = process.env.MUTATION_USERNAME || 'valzhost';
    const token = process.env.MUTATION_TOKEN || '1453563:PegBGy3NOkz69pZJdohTWMFiI1qsLRVH';

    const response = await fetch(
      `https://api-simplebot.vercel.app/orderkuota/mutasiqr?apikey=${apiKey}&username=${username}&token=${token}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch mutation data');
    }

    const data = await response.json();
    
    // Return raw data, biarkan client yang filter
    return NextResponse.json(data);
  } catch (error) {
    console.error('Check mutation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check mutation' },
      { status: 500 }
    );
  }
}
