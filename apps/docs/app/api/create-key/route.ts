import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { owner, email, type, apikey } = await request.json();

    if (!owner || !email || !type || !apikey) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Admin credentials disimpan di server-side (env variables)
    const username = process.env.ADMIN_USERNAME || 'vzy';
    const password = process.env.ADMIN_PASSWORD || 'vzy';

    const response = await fetch(
      `https://v2.jkt48connect.com/api/admin/create-key?username=${username}&password=${password}&owner=${encodeURIComponent(owner)}&email=${encodeURIComponent(email)}&type=${type}&apikey=${encodeURIComponent(apikey)}`
    );

    if (!response.ok) {
      throw new Error('Failed to create API key');
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Create API key error:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}
