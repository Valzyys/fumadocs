'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mail, CheckCircle, AlertCircle, Loader, RefreshCw,
  ShieldCheck, Clock, ArrowLeft, Ticket, Inbox,
  RotateCcw, Zap, Check, X, ExternalLink
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type VerifyState = 'idle' | 'checking' | 'success' | 'error' | 'expired';

interface VerifyResult {
  username: string;
  email: string;
  verifiedAt: string;
  membershipType: string;
  referralCode: string;
}

// ─── Shared ticket styles (same design language as PaymentPage) ───────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
  .ticket-font { font-family: 'Syne', sans-serif; }
  .mono-font   { font-family: 'JetBrains Mono', monospace; }

  @keyframes fadeSlideUp {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes ticketSlideIn {
    0%   { transform: translateY(60px) rotate(-2deg); opacity: 0; }
    100% { transform: translateY(0)    rotate(0deg);  opacity: 1; }
  }
  @keyframes stampBounce {
    0%   { transform: scale(0)   rotate(-15deg); opacity: 0; }
    70%  { transform: scale(1.1) rotate(3deg);   opacity: 1; }
    100% { transform: scale(1)   rotate(0deg);   opacity: 1; }
  }
  @keyframes pulseRing {
    0%   { transform: scale(1);   opacity: 0.6; }
    100% { transform: scale(1.6); opacity: 0; }
  }
  @keyframes mailFloat {
    0%, 100% { transform: translateY(0px) rotate(-2deg); }
    50%       { transform: translateY(-8px) rotate(2deg); }
  }
  @keyframes dotPulse {
    0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
    40%            { transform: scale(1); opacity: 1; }
  }
  @keyframes scanLine {
    0%, 100% { transform: translateY(0);    opacity: 0.7; }
    50%       { transform: translateY(72px); opacity: 0.2; }
  }
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  @keyframes checkDraw {
    from { stroke-dashoffset: 100; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes successPop {
    0%   { transform: scale(0.5); opacity: 0; }
    60%  { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1);   opacity: 1; }
  }

  .fade-up        { animation: fadeSlideUp  0.5s ease forwards; }
  .fade-up-2      { animation: fadeSlideUp  0.5s 0.15s ease both; }
  .ticket-slide   { animation: ticketSlideIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .stamp-animate  { animation: stampBounce  0.5s cubic-bezier(0.34,1.56,0.64,1) 0.4s both; }
  .mail-float     { animation: mailFloat 3s ease-in-out infinite; }
  .pulse-ring     { animation: pulseRing 2s ease-out infinite; }
  .scan-line      { animation: scanLine  2s ease-in-out infinite; }
  .success-pop    { animation: successPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }

  .dot-1 { animation: dotPulse 1.4s ease-in-out 0s   infinite; }
  .dot-2 { animation: dotPulse 1.4s ease-in-out 0.2s infinite; }
  .dot-3 { animation: dotPulse 1.4s ease-in-out 0.4s infinite; }

  .shimmer-text {
    background: linear-gradient(90deg,
      #888 0%, #888 35%, #fff 50%, #888 65%, #888 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 2.5s linear infinite;
  }

  .ticket-shadow {
    box-shadow: 0 20px 60px -10px rgba(0,0,0,0.4),
                0 0 0 1px rgba(255,255,255,0.04);
  }
  .perf-edge {
    background-image: radial-gradient(circle, #0a0a0a 6px, transparent 6px);
    background-size: 20px 20px;
    background-position: -10px 0;
  }
  .barcode {
    background: repeating-linear-gradient(90deg,
      currentColor 0px,  currentColor 2px,
      transparent 2px,   transparent 5px,
      currentColor 5px,  currentColor 8px,
      transparent 8px,   transparent 12px,
      currentColor 12px, currentColor 13px,
      transparent 13px,  transparent 18px
    );
  }

  .input-glow:focus-within {
    box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
  }
  .btn-primary {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    transition: all 0.2s;
  }
  .btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #5457e5, #7c4fe0);
    transform: translateY(-1px);
    box-shadow: 0 8px 20px -4px rgba(99,102,241,0.4);
  }
  .btn-primary:active:not(:disabled) {
    transform: translateY(0);
  }

  .otp-input {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.5rem;
    font-weight: 700;
    text-align: center;
    background: transparent;
    outline: none;
    width: 100%;
  }
  .otp-input::selection { background: rgba(99,102,241,0.3); }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const API_BASE = 'https://v2.jkt48connect.com/api/jkt48connect';
const API_KEY  = 'JKTCONNECT';

const Perf = () => (
  <div className="relative h-5 border-y border-white/5 overflow-hidden">
    <div className="absolute inset-0 perf-edge" />
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t-2 border-dashed border-white/10" />
    </div>
  </div>
);

const LoadingDots = () => (
  <div className="flex items-center gap-1">
    <div className="w-2 h-2 rounded-full bg-white dot-1" />
    <div className="w-2 h-2 rounded-full bg-white dot-2" />
    <div className="w-2 h-2 rounded-full bg-white dot-3" />
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────
export default function VerifyEmailPage() {
  const [token,    setToken]    = useState('');
  const [email,    setEmail]    = useState('');
  const [state,    setState]    = useState<VerifyState>('idle');
  const [result,   setResult]   = useState<VerifyResult | null>(null);
  const [errMsg,   setErrMsg]   = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [resending,setResending]= useState(false);
  const [resendOk, setResendOk] = useState(false);

  const tokenRef = useRef<HTMLTextAreaElement>(null); // ✅ FIXED: was HTMLInputElement

  // Pre-fill from URL params (e.g. /verify-email?token=xxx&email=xxx)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token') ?? '';
    const e = params.get('email') ?? '';
    if (t) setToken(t);
    if (e) setEmail(e);
    // Auto-verify if both present in URL
    if (t && e) handleVerify(t, e);
  }, []);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown(p => p - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleVerify = useCallback(async (t = token, e = email) => {
    if (!t.trim() || !e.trim()) return;
    setState('checking');
    setErrMsg('');
    try {
      const res  = await fetch(`${API_BASE}/auth/verify-email?apikey=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: t.trim(), email: e.toLowerCase().trim() }),
      });
      const data = await res.json();

      if (data.status) {
        // Fetch profile to show details
        const profileRes  = await fetch(`${API_BASE}/profile/me?apikey=${API_KEY}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'x-email': e.toLowerCase().trim() },
        }).catch(() => null);

        setResult({
          username:       data.data?.username       ?? e.split('@')[0],
          email:          data.data?.email          ?? e,
          verifiedAt:     new Date().toLocaleString('id-ID'),
          membershipType: data.data?.membership_type ?? 'free',
          referralCode:   data.data?.referral_code  ?? '-',
        });
        setState('success');
      } else {
        const msg = data.message ?? 'Verifikasi gagal';
        const isExpired = msg.toLowerCase().includes('kadaluarsa') ||
                          msg.toLowerCase().includes('expired');
        setState(isExpired ? 'expired' : 'error');
        setErrMsg(msg);
      }
    } catch {
      setState('error');
      setErrMsg('Koneksi gagal. Periksa internet dan coba lagi.');
    }
  }, [token, email]);

  const handleResend = async () => {
    if (!email.trim() || cooldown > 0) return;
    setResending(true);
    setResendOk(false);
    try {
      const res  = await fetch(`${API_BASE}/auth/resend-verification?apikey=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await res.json();
      if (data.status) {
        setResendOk(true);
        setCooldown(60);
        setState('idle');
        setToken('');
      } else {
        setErrMsg(data.message ?? 'Gagal kirim ulang email');
      }
    } catch {
      setErrMsg('Koneksi gagal.');
    } finally {
      setResending(false);
    }
  };

  const handleReset = () => {
    setState('idle');
    setToken('');
    setErrMsg('');
    setResult(null);
    setTimeout(() => tokenRef.current?.focus(), 100);
  };

  // ── SUCCESS ────────────────────────────────────────────────────────────────
  if (state === 'success' && result) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <style>{globalStyles}</style>

        <div className="w-full max-w-md ticket-slide">
          <div className="bg-[#111] border-2 border-white/10 rounded-2xl overflow-hidden ticket-shadow">

            {/* ── header ── */}
            <div className="bg-green-500/10 border-b-2 border-white/10 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 border-2 border-green-500/30 flex items-center justify-center success-pop">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="ticket-font text-[10px] text-white/40 uppercase tracking-[0.25em]">Verification Receipt</p>
                  <p className="ticket-font text-sm font-bold text-white">Email Terverifikasi!</p>
                </div>
              </div>
              {/* stamp */}
              <div className="stamp-animate">
                <div style={{ border: '2.5px solid #22c55e', borderRadius: 8, padding: '4px 10px', transform: 'rotate(-8deg)' }}>
                  <p className="ticket-font text-xs text-green-500 uppercase tracking-widest font-extrabold">VERIFIED</p>
                </div>
              </div>
            </div>

            <Perf />

            {/* ── body ── */}
            <div className="px-6 py-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="ticket-font text-[10px] text-white/40 uppercase tracking-widest mb-1">Akun</p>
                  <p className="ticket-font font-bold text-white">@{result.username}</p>
                </div>
                <div className="text-right">
                  <p className="ticket-font text-[10px] text-white/40 uppercase tracking-widest mb-1">Membership</p>
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider
                    bg-green-500/15 border border-green-500/30 text-green-400">
                    {result.membershipType}
                  </span>
                </div>
              </div>

              {[
                { label: 'Email',        value: result.email },
                { label: 'Diverifikasi', value: result.verifiedAt },
                { label: 'Referral Code',value: result.referralCode },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-dashed border-white/8">
                  <p className="ticket-font text-[10px] text-white/40 uppercase tracking-wider">{label}</p>
                  <p className="mono-font text-xs font-medium text-white/80 text-right max-w-[60%] truncate">{value}</p>
                </div>
              ))}
            </div>

            <Perf />

            {/* ── stub / footer ── */}
            <div className="bg-white/[0.03] px-6 py-5">
              <p className="ticket-font text-[10px] text-white/40 uppercase tracking-[0.25em] mb-3">Langkah Selanjutnya</p>
              <div className="space-y-2 mb-4">
                {[
                  'Akun kamu sudah aktif sepenuhnya',
                  'Login dan mulai nikmati JKT48Connect',
                  'Upgrade membership untuk akses penuh',
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    </div>
                    <p className="ticket-font text-xs text-white/60">{s}</p>
                  </div>
                ))}
              </div>

              {/* barcode */}
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 flex-1 barcode text-white/10 rounded overflow-hidden" />
                <div className="text-center px-1 flex-shrink-0">
                  <p className="mono-font text-[8px] text-white/30 uppercase tracking-wider">VERIFY</p>
                  <p className="mono-font text-[10px] font-bold text-white/60">#{Date.now().toString().slice(-6)}</p>
                </div>
                <div className="h-8 flex-1 barcode text-white/10 rounded overflow-hidden" />
              </div>

              {/* actions */}
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-white/10
                  bg-[#111] hover:bg-white/5 transition-all ticket-font text-sm font-semibold text-white/70">
                  <ArrowLeft className="w-4 h-4" /> Beranda
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-indigo-500/40
                  btn-primary text-white ticket-font text-sm font-semibold">
                  <Zap className="w-4 h-4" /> Login Sekarang
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ── MAIN VERIFY PAGE ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <style>{globalStyles}</style>

      {/* ── top bar ── */}
      <div className="border-b-2 border-white/8 bg-[#111]/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-indigo-400" />
            <span className="ticket-font font-bold text-white text-sm uppercase tracking-widest">
              Verify Terminal
            </span>
          </div>

          {/* steps */}
          <div className="hidden sm:flex items-center gap-1">
            {[
              { n: 1, label: 'Daftar',  done: true  },
              { n: 2, label: 'Email',   done: false  },
              { n: 3, label: 'Aktif',   done: false  },
            ].map((step, i) => (
              <div key={step.n} className="flex items-center">
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                  ${step.done
                    ? 'bg-indigo-500/10 border border-indigo-500/30'
                    : i === 1
                      ? 'bg-white/5 border border-white/15'
                      : 'bg-transparent border border-white/5 opacity-40'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center
                    ${step.done ? 'bg-indigo-500' : i === 1 ? 'bg-white/10' : 'bg-white/5'}`}>
                    {step.done
                      ? <Check className="w-2.5 h-2.5 text-white" />
                      : <span className="mono-font text-[9px] font-bold text-white/50">{step.n}</span>
                    }
                  </div>
                  <span className={`ticket-font text-xs font-semibold
                    ${step.done ? 'text-indigo-400' : i === 1 ? 'text-white' : 'text-white/30'}`}>
                    {step.label}
                  </span>
                </div>
                {i < 2 && <div className="w-4 h-px bg-white/10 mx-0.5" />}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5">
            <Mail className="w-3 h-3 text-white/50" />
            <span className="ticket-font text-xs font-semibold text-white/60 uppercase tracking-wider">Email Verify</span>
          </div>
        </div>
      </div>

      {/* ── main ── */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-5xl mx-auto px-4 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* ══════════════════════════════════════
                LEFT: Verification Ticket
            ══════════════════════════════════════ */}
            <div className="lg:col-span-3 fade-up">
              <div className="bg-[#111] border-2 border-white/10 rounded-2xl overflow-hidden ticket-shadow">

                {/* header */}
                <div className="px-6 py-4 border-b-2 border-white/10 flex items-center justify-between">
                  <div>
                    <p className="ticket-font text-[10px] text-white/40 uppercase tracking-[0.3em] mb-0.5">
                      Email Verification Ticket
                    </p>
                    <p className="ticket-font text-base font-bold text-white">Verifikasi Akun Kamu</p>
                  </div>
                  {/* floating mail icon */}
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20
                    flex items-center justify-center mail-float">
                    <Mail className="w-5 h-5 text-indigo-400" />
                  </div>
                </div>

                {/* icon + copy */}
                <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center gap-3">
                  {/* envelope graphic */}
                  <div className="relative w-24 h-24 mb-2">
                    <div className="absolute inset-0 rounded-full bg-indigo-500/10 border-2 border-indigo-500/20 pulse-ring" />
                    <div className="absolute inset-0 rounded-full bg-indigo-500/8 border border-indigo-500/15 flex items-center justify-center">
                      <div className="relative w-14 h-14">
                        {/* envelope body */}
                        <div className="w-full h-full rounded-lg bg-indigo-500/20 border-2 border-indigo-500/40
                          flex items-center justify-center overflow-hidden">
                          {/* scan line */}
                          <div className="absolute inset-x-0 top-0 h-0.5 bg-indigo-400/70 scan-line
                            rounded" style={{ boxShadow: '0 0 8px 3px rgba(99,102,241,0.5)' }} />
                          <Mail className="w-7 h-7 text-indigo-400 relative z-10" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <h2 className="ticket-font text-xl font-extrabold text-white">
                    Masukkan Token Verifikasi
                  </h2>
                  <p className="ticket-font text-sm text-white/50 max-w-xs leading-relaxed">
                    Token dikirim ke emailmu. Cek folder Inbox atau Spam, lalu paste token di bawah.
                  </p>
                </div>

                {/* form */}
                <div className="px-6 pb-2 space-y-4">
                  {/* email input */}
                  <div>
                    <label className="ticket-font text-[10px] text-white/40 uppercase tracking-widest block mb-1.5">
                      Email Terdaftar
                    </label>
                    <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-xl
                      px-4 h-12 input-glow transition-all">
                      <Mail className="w-4 h-4 text-white/30 flex-shrink-0" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="email@kamu.com"
                        className="ticket-font flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/20"
                      />
                    </div>
                  </div>

                  {/* token input */}
                  <div>
                    <label className="ticket-font text-[10px] text-white/40 uppercase tracking-widest block mb-1.5">
                      Token Verifikasi
                    </label>
                    <div className="flex items-start gap-3 bg-white/[0.03] border border-white/10 rounded-xl
                      px-4 py-3 input-glow transition-all">
                      <ShieldCheck className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
                      <textarea
                        ref={tokenRef}
                        value={token}
                        onChange={e => setToken(e.target.value)}
                        placeholder="Paste token dari email..."
                        rows={3}
                        className="mono-font flex-1 bg-transparent text-white text-xs outline-none
                          placeholder:text-white/20 resize-none leading-relaxed"
                      />
                      {token && (
                        <button onClick={() => setToken('')}
                          className="p-1 rounded hover:bg-white/5 transition-colors flex-shrink-0 mt-0.5">
                          <X className="w-3.5 h-3.5 text-white/30" />
                        </button>
                      )}
                    </div>
                    <p className="ticket-font text-[10px] text-white/30 mt-1.5 ml-1">
                      Token berupa string panjang — paste seluruhnya
                    </p>
                  </div>

                  {/* error / expired banner */}
                  {(state === 'error' || state === 'expired') && (
                    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border
                      ${state === 'expired'
                        ? 'bg-orange-500/8 border-orange-500/25'
                        : 'bg-red-500/8 border-red-500/25'}`}>
                      <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5
                        ${state === 'expired' ? 'text-orange-400' : 'text-red-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`ticket-font text-xs font-semibold
                          ${state === 'expired' ? 'text-orange-400' : 'text-red-400'}`}>
                          {state === 'expired' ? 'Token Kadaluarsa' : 'Verifikasi Gagal'}
                        </p>
                        <p className="ticket-font text-[11px] text-white/40 mt-0.5 leading-relaxed">{errMsg}</p>
                        {state === 'expired' && (
                          <button onClick={handleResend} disabled={cooldown > 0 || resending}
                            className="mt-2 flex items-center gap-1.5 ticket-font text-[11px] text-orange-400
                            hover:text-orange-300 underline underline-offset-2 disabled:opacity-50">
                            <RotateCcw className="w-3 h-3" />
                            {cooldown > 0 ? `Kirim ulang dalam ${cooldown}s` : 'Kirim ulang token'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* resend success */}
                  {resendOk && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-green-500/8 border-green-500/25">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <p className="ticket-font text-xs text-green-400">
                        Email verifikasi baru telah dikirim! Cek inbox kamu.
                      </p>
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    onClick={() => handleVerify()}
                    disabled={!token.trim() || !email.trim() || state === 'checking'}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
                      btn-primary text-white ticket-font text-sm font-bold
                      disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    {state === 'checking' ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Memverifikasi</span>
                        <LoadingDots />
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Verifikasi Email Sekarang
                      </>
                    )}
                  </button>
                  <p className="ticket-font text-[10px] text-white/25 text-center pb-2">
                    Proses verifikasi berjalan otomatis setelah submit
                  </p>
                </div>

                <Perf />

                {/* instruction stub */}
                <div className="bg-white/[0.02] px-6 py-5">
                  <p className="ticket-font text-[10px] text-white/30 uppercase tracking-[0.25em] mb-3">
                    Cara Mendapatkan Token
                  </p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
                    {[
                      'Buka email yang kamu daftarkan',
                      'Cari email dari JKT48Connect',
                      'Salin token verifikasi',
                      'Paste di kolom token di atas',
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-full border border-white/10 bg-white/5
                          flex items-center justify-center flex-shrink-0">
                          <span className="mono-font text-[9px] font-bold text-white/40">{i + 1}</span>
                        </div>
                        <p className="ticket-font text-xs text-white/40 whitespace-nowrap">{s}</p>
                      </div>
                    ))}
                  </div>

                  {/* resend row */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/8">
                    <p className="ticket-font text-xs text-white/30">Tidak dapat email?</p>
                    <button
                      onClick={handleResend}
                      disabled={cooldown > 0 || resending || !email.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10
                        bg-white/5 hover:bg-white/8 transition-all ticket-font text-xs font-semibold text-white/50
                        disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {resending
                        ? <><Loader className="w-3 h-3 animate-spin" /> Mengirim...</>
                        : cooldown > 0
                          ? <><Clock className="w-3 h-3" /> {cooldown}s</>
                          : <><RefreshCw className="w-3 h-3" /> Kirim Ulang</>}
                    </button>
                  </div>
                </div>

              </div>

              {/* security strip */}
              <div className="mt-3 flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl
                border border-white/5 bg-white/[0.02]">
                <ShieldCheck className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                <p className="ticket-font text-[11px] text-white/30">
                  Token dienkripsi 256-bit · Berlaku 24 jam · Satu kali pakai
                </p>
              </div>
            </div>

            {/* ══════════════════════════════════════
                RIGHT: Info Ticket
            ══════════════════════════════════════ */}
            <div className="lg:col-span-2 fade-up-2 flex flex-col gap-4">

              {/* ── status card ── */}
              <div className="bg-[#111] border-2 border-white/10 rounded-2xl overflow-hidden ticket-shadow">

                <div className="px-5 py-4 border-b-2 border-white/10">
                  <p className="ticket-font text-[10px] text-white/40 uppercase tracking-[0.3em] mb-0.5">Status Ticket</p>
                  <p className="ticket-font text-base font-bold text-white">Informasi Akun</p>
                </div>

                {/* status indicator */}
                <div className="px-5 py-4 space-y-3">
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border
                    ${state === 'success'
                      ? 'bg-green-500/8 border-green-500/25'
                      : state === 'checking'
                        ? 'bg-indigo-500/8 border-indigo-500/25'
                        : state === 'expired'
                          ? 'bg-orange-500/8 border-orange-500/25'
                          : state === 'error'
                            ? 'bg-red-500/8 border-red-500/25'
                            : 'bg-white/[0.03] border-white/10'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0
                      ${state === 'success'  ? 'bg-green-500'
                      : state === 'checking' ? 'bg-indigo-400 animate-pulse'
                      : state === 'expired'  ? 'bg-orange-400'
                      : state === 'error'    ? 'bg-red-500'
                                              : 'bg-white/20'}`} />
                    <p className={`ticket-font text-xs font-semibold
                      ${state === 'success'  ? 'text-green-400'
                      : state === 'checking' ? 'text-indigo-400'
                      : state === 'expired'  ? 'text-orange-400'
                      : state === 'error'    ? 'text-red-400'
                                              : 'text-white/40'}`}>
                      {state === 'success'  ? 'Terverifikasi'
                      : state === 'checking' ? 'Sedang memverifikasi...'
                      : state === 'expired'  ? 'Token kadaluarsa'
                      : state === 'error'    ? 'Verifikasi gagal'
                                              : 'Menunggu verifikasi'}
                    </p>
                  </div>

                  {[
                    { label: 'Email',  value: email  || '—' },
                    { label: 'Token',  value: token  ? token.slice(0, 16) + '...' : '—' },
                    { label: 'Status', value: state === 'idle' ? 'Belum diverifikasi' : state },
                  ].map(({ label, value }) => (
                    <div key={label} className="py-2 border-b border-dashed border-white/8">
                      <p className="ticket-font text-[10px] text-white/30 uppercase tracking-widest mb-0.5">{label}</p>
                      <p className="mono-font text-xs font-medium text-white/60 truncate">{value}</p>
                    </div>
                  ))}
                </div>

                <Perf />

                {/* token validity info */}
                <div className="bg-white/[0.02] px-5 py-4 space-y-2">
                  <p className="ticket-font text-[10px] text-white/30 uppercase tracking-widest mb-2">Info Token</p>
                  {[
                    { icon: Clock,       label: 'Berlaku',    value: '24 jam sejak dikirim' },
                    { icon: ShieldCheck, label: 'Enkripsi',   value: 'SHA-256 hex token'    },
                    { icon: Check,       label: 'Pemakaian',  value: 'Satu kali saja'       },
                    { icon: RefreshCw,   label: 'Kirim ulang',value: 'Maks. 3x per jam'     },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/8
                        flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3 h-3 text-white/30" />
                      </div>
                      <div className="flex-1 flex items-center justify-between gap-2">
                        <p className="ticket-font text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
                        <p className="mono-font text-[11px] text-white/50 text-right">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* ── email preview card ── */}
              <div className="bg-[#111] border-2 border-white/10 rounded-2xl overflow-hidden ticket-shadow">

                <div className="px-5 py-4 border-b-2 border-white/10 flex items-center gap-3">
                  <Inbox className="w-4 h-4 text-white/40" />
                  <div>
                    <p className="ticket-font text-[10px] text-white/30 uppercase tracking-widest">Preview Email</p>
                    <p className="ticket-font text-sm font-bold text-white">Yang Kamu Terima</p>
                  </div>
                </div>

                {/* mock email preview */}
                <div className="px-5 py-4">
                  <div className="bg-[#0d0d0d] border border-white/8 rounded-xl overflow-hidden">
                    {/* email header mock */}
                    <div className="bg-[#1a1a1a] px-4 py-3 border-b border-white/8">
                      <p className="ticket-font text-[10px] text-white/30 uppercase tracking-widest mb-1">Dari</p>
                      <p className="mono-font text-xs text-white/60">noreply@jkt48connect.my.id</p>
                    </div>
                    <div className="px-4 py-4 space-y-2">
                      <p className="ticket-font text-xs font-bold text-white/80">
                        ✉️ Verify Your Email — JKT48Connect
                      </p>
                      <p className="ticket-font text-[11px] text-white/40 leading-relaxed">
                        Halo! Klik tombol di email atau salin token verifikasi dan paste di form sebelah kiri.
                      </p>
                      {/* mock token box */}
                      <div className="mt-3 bg-[#111] border border-white/10 rounded-lg px-3 py-2.5">
                        <p className="ticket-font text-[9px] text-indigo-400/60 uppercase tracking-widest mb-1">
                          Verification Token
                        </p>
                        <p className="mono-font text-[10px] text-white/30 break-all leading-relaxed shimmer-text">
                          a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Perf />

                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 flex-1 barcode text-white/8 rounded overflow-hidden" />
                    <p className="mono-font text-[9px] text-white/20 uppercase tracking-wider px-1">VERIFY</p>
                    <div className="h-6 flex-1 barcode text-white/8 rounded overflow-hidden" />
                  </div>
                  <p className="ticket-font text-[10px] text-white/25 text-center">
                    Tidak menemukan email? Cek folder Spam atau kirim ulang
                  </p>
                </div>

              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
