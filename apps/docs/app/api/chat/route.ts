export const runtime = 'edge';

// Keywords yang menandakan AI menyetujui pembuatan API key
const APPROVAL_KEYWORDS = [
  'apikey', 'api key', 'api-key',
  'buat api', 'bikin api', 'daftar api',
  'setuju', 'disetujui', 'approved',
  'silakan', 'silahkan',
  'oke, aku bantu', 'oke aku bantu',
  'yuk buat', 'yuk kita buat',
  'langkah', 'proses pembuatan',
  'nama', 'email',
];

function detectApproval(text: string): boolean {
  const lower = text.toLowerCase();
  // Deteksi apakah AI response mengandung sinyal persetujuan pembuatan API key
  const hasApprovalSignal = APPROVAL_KEYWORDS.some(k => lower.includes(k));
  // Pastikan bukan penolakan
  const hasDenialSignal = ['tidak bisa', 'tidak dapat', 'maaf', 'belum bisa', 'tidak diizinkan'].some(k => lower.includes(k));
  return hasApprovalSignal && !hasDenialSignal;
}

export async function POST(req: Request) {
  try {
    const reqJson = await req.json();

    // Ambil semua messages untuk konteks conversation
    const messages: { role: string; content: string }[] = reqJson.messages || [];

    // Ambil pesan terakhir dari user
    const lastUserMessage = messages.filter((msg) => msg.role === 'user').pop();

    if (!lastUserMessage) {
      return new Response(
        JSON.stringify({ error: 'No user message found' }),
        { status: 400 }
      );
    }

    // Cek apakah user sudah submit email & nama (dari metadata)
    const pendingApiKey: boolean = reqJson.pendingApiKey ?? false;
    const userEmail: string | null = reqJson.userEmail ?? null;
    const userName: string | null = reqJson.userName ?? null;

    // ─────────────────────────────────────────────
    // FLOW: Jika ada pending API key creation & email+nama sudah diterima
    // ─────────────────────────────────────────────
    if (pendingApiKey && userEmail && userName) {
      try {
        // Buat API key via endpoint yang ada
        const createRes = await fetch(`${new URL(req.url).origin}/api/payment/create-key`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner: userName,
            email: userEmail,
            type: 'basic',
            apikey: null, // biarkan server generate
          }),
        });

        if (!createRes.ok) throw new Error('Gagal membuat API key');

        const keyData = await createRes.json();

        if (keyData.status) {
          return new Response(
            JSON.stringify({
              success: true,
              apiKeyCreated: true,
              result: `✅ **API Key berhasil dibuat!**\n\n` +
                `👤 **Nama:** ${userName}\n` +
                `📧 **Email:** ${userEmail}\n` +
                `🔑 **API Key:** \`${keyData.apikey || keyData.data?.apikey || 'Cek email kamu ya!'}\`\n\n` +
                `Simpan API key kamu baik-baik dan jangan share ke orang lain!\n\n` +
                `📚 **Dokumentasi:** https://docs.jkt48connect.com/docs/ui`,
            }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        } else {
          throw new Error(keyData.message || 'Gagal membuat API key');
        }
      } catch (err: any) {
        return new Response(
          JSON.stringify({
            success: false,
            result: `❌ Gagal membuat API key: ${err.message}. Coba lagi ya atau hubungi support.`,
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // ─────────────────────────────────────────────
    // FLOW NORMAL: Kirim ke AI JKT48Connect
    // ─────────────────────────────────────────────
    const userMessageLower = lastUserMessage.content.toLowerCase();

    const apiUrl = `https://v2.jkt48connect.com/api/zeco?apikey=JKTCONNECT&text=${encodeURIComponent(lastUserMessage.content)}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.status) {
      return new Response(
        JSON.stringify({ error: 'API call failed' }),
        { status: 500 }
      );
    }

    let processedResult: string = data.data?.result ?? '';

    // ─────────────────────────────────────────────
    // DETEKSI PERSETUJUAN API KEY dari response AI
    // ─────────────────────────────────────────────
    const aiApproved = detectApproval(processedResult);

    // ─────────────────────────────────────────────
    // DOC LINKS — tetap dipertahankan
    // ─────────────────────────────────────────────
    const docLinks: Record<string, string> = {
      'dokumentasi': 'https://docs.jkt48connect.com/docs/ui',
      'panduan': 'https://docs.jkt48connect.com/docs/ui',
      'docs': 'https://docs.jkt48connect.com/docs/ui',
      'what is jkt48connect': 'https://docs.jkt48connect.com/docs/ui/what-is-jkt48connect',
      'apa itu jkt48connect': 'https://docs.jkt48connect.com/docs/ui/what-is-jkt48connect',
      'pengenalan': 'https://docs.jkt48connect.com/docs/ui/what-is-jkt48connect',
      'all live': 'https://docs.jkt48connect.com/docs/ui/all-live',
      'live': 'https://docs.jkt48connect.com/docs/ui/all-live',
      'idn live': 'https://docs.jkt48connect.com/docs/ui/idn',
      'idn': 'https://docs.jkt48connect.com/docs/ui/idn',
      'showroom': 'https://docs.jkt48connect.com/docs/ui/showroom',
      'youtube': 'https://docs.jkt48connect.com/docs/ui/youtube',
      'recent': 'https://docs.jkt48connect.com/docs/ui/recent',
      'recent detail': 'https://docs.jkt48connect.com/docs/ui/recent-detail',
      'member': 'https://docs.jkt48connect.com/docs/ui/member',
      'members': 'https://docs.jkt48connect.com/docs/ui/member',
    };

    const redirectKeywords = [
      'buka dokumentasi', 'ke dokumentasi', 'lihat dokumentasi',
      'redirect ke', 'arahkan ke', 'bawa ke',
      'halaman dokumentasi', 'page dokumentasi',
    ];

    const isDirectRedirectRequest = redirectKeywords.some(k => userMessageLower.includes(k));

    if (isDirectRedirectRequest) {
      let redirectLink = 'https://docs.jkt48connect.com/docs/ui';
      for (const [keyword, link] of Object.entries(docLinks)) {
        if (userMessageLower.includes(keyword)) {
          redirectLink = link;
          break;
        }
      }
      processedResult += `\n\n🔗 **Redirect ke Dokumentasi:** ${redirectLink}`;
    } else {
      for (const [keyword, link] of Object.entries(docLinks)) {
        if (userMessageLower.includes(keyword)) {
          processedResult += `\n\n📚 **Dokumentasi Terkait:** ${link}`;
          break;
        }
      }
    }

    if (
      !processedResult.includes('📚 **Dokumentasi') &&
      !processedResult.includes('🔗 **Redirect') &&
      !aiApproved
    ) {
      processedResult += `\n\n📚 **Dokumentasi Lengkap:** https://docs.jkt48connect.com/docs/ui`;
    }

    if (
      userMessageLower.includes('api key') ||
      userMessageLower.includes('apikey') ||
      userMessageLower.includes('authentication')
    ) {
      processedResult += `\n\n🔑 **Catatan:** Jangan lupa menambahkan API key kamu pada setiap request: \`?apikey=YOUR_API_KEY\``;
    }

    // ─────────────────────────────────────────────
    // Jika AI menyetujui → trigger form input email & nama di frontend
    // ─────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        result: processedResult,
        // Flag ini dibaca frontend untuk menampilkan form email & nama
        requireUserInfo: aiApproved,
        session_id: data.data?.session_id ?? null,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
      { status: 500 }
    );
  }
}
