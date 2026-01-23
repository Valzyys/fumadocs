import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount } = body;

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // QRIS code disimpan di server-side
    const qrisCode = '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214149391352933240303UMI51440014ID.CO.QRIS.WWW0215ID20233077025890303UMI5204541153033605802ID5919VALZSTORE%20OK14535636006SERANG61054211162070703A016304DCD2';
    
    // API key disimpan di server-side
    const apiKey = process.env.JKTCONNECT_API_KEY || 'JKTCONNECT';

    // Menggunakan endpoint API v2 yang baru
    const apiUrl = `https://v2.jkt48connect.com/api/qris/generate?qris=${qrisCode}&amount=${amount}&apikey=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to generate QRIS');
    }

    const data = await response.json();
    
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Generate QRIS error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QRIS' },
      { status: 500 }
    );
  }
}

// Tambahkan OPTIONS untuk CORS jika diperlukan
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
