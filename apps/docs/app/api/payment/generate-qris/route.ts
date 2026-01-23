import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { amount } = await request.json();

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // QRIS code disimpan di server-side
    const qrisCode = '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214149391352933240303UMI51440014ID.CO.QRIS.WWW0215ID20233077025890303UMI5204541153033605802ID5919VALZSTORE%20OK14535636006SERANG61054211162070703A016304DCD2';
    
    // API key disimpan di server-side (bisa juga dari env variable)
    const apiKey = process.env.JKTCONNECT_API_KEY || 'JKTCONNECT';

    const response = await fetch(
      `https://api.jkt48connect.com/api/orkut/createpayment?amount=${amount}&qris=${qrisCode}&api_key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Failed to generate QRIS');
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Generate QRIS error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QRIS' },
      { status: 500 }
    );
  }
}
