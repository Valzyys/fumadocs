'use client';
import { useState, useEffect } from 'react';
import {
  QrCode, Clock, CheckCircle, AlertCircle, ShieldCheck, RefreshCw,
  Loader, Package, User, CreditCard, Check, Copy, Mail, Key,
  Calendar, Zap, Download, ArrowLeft, Ticket, Wifi
} from 'lucide-react';

interface OrderData {
  id: string; planId: string; planName: string; price: number;
  priceFormatted: string; limit: number | string; expireDays: number | null;
  customerName: string; customerEmail: string; apiKey: string;
  status: string; createdAt: string; uniqueAmount?: number;
}
interface QRISResponse {
  author: string; originalQRIS: string; dynamicQRIS: string;
  amount: string; includeFee: boolean; qrImageUrl: string;
}
interface MutationData {
  id: number; debet: string; kredit: string; saldo_akhir: string;
  keterangan: string; tanggal: string; status: string; fee: string;
  brand: { name: string; logo: string; };
}
interface PaymentSuccess {
  amount: string; from: string; logo: string; description: string;
  date: string; originalAmount: number; uniqueFee: number;
}

export default function PaymentPage() {
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [qrisData, setQrisData] = useState<QRISResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(900);
  const [isExpired, setIsExpired] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<PaymentSuccess | null>(null);
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [copiedApiKey, setCopiedApiKey] = useState(false);

  const generateUniqueFee = (): number => Math.floor(Math.random() * 999) + 1;

  useEffect(() => {
    const storedData = localStorage.getItem('orderData');
    if (storedData) {
      const data = JSON.parse(storedData);
      if (!data.uniqueAmount) {
        const uniqueFee = generateUniqueFee();
        data.uniqueAmount = data.price + uniqueFee;
        localStorage.setItem('orderData', JSON.stringify(data));
      }
      setOrderData(data);
      generateQRIS(data.uniqueAmount);
    }
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      if (checkInterval) clearInterval(checkInterval);
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, checkInterval]);

  useEffect(() => {
    if (orderData && !isExpired && !paymentSuccess) {
      const interval = setInterval(() => checkPayment(), 10000);
      setCheckInterval(interval);
      return () => clearInterval(interval);
    }
  }, [orderData, isExpired, paymentSuccess]);

  const generateQRIS = async (amount: number) => {
    setIsLoading(true); setError(null);
    try {
      const response = await fetch('/api/payment/generate-qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) throw new Error('Gagal generate QRIS');
      const result = await response.json();
      if (result.status && result.data) setQrisData(result.data);
      else throw new Error(result.message || 'Gagal generate QRIS');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const parseTransactionDate = (dateStr: string): Date => {
    const [datePart, timePart] = dateStr.split(' ');
    const [day, month, year] = datePart.split('/');
    const [hour, minute] = timePart.split(':');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
  };

  const formatDateForComparison = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, '0');
    return `${day}/${month}/${year}-${hour}`;
  };

  const checkPayment = async () => {
    if (!orderData || isChecking) return;
    setIsChecking(true);
    try {
      const response = await fetch('/api/payment/check-mutation', { method: 'GET' });
      if (!response.ok) throw new Error('Gagal mengecek pembayaran');
      const data = await response.json();
      if (data.status && data.result && Array.isArray(data.result)) {
        const now = new Date();
        const currentDate = formatDateForComparison(now);
        const incomingTransactions = data.result.filter((transaction: MutationData) => {
          if (transaction.status !== 'IN') return false;
          const transactionDate = parseTransactionDate(transaction.tanggal);
          const transactionDateStr = formatDateForComparison(transactionDate);
          const timeDiff = Math.abs(now.getTime() - transactionDate.getTime()) / 1000 / 60;
          return transactionDateStr === currentDate && timeDiff <= 30;
        });
        const matchedTransaction = incomingTransactions.find((transaction: MutationData) => {
          const amount = parseFloat(transaction.kredit.replace(/\./g, ''));
          return amount === orderData.uniqueAmount;
        });
        if (matchedTransaction) await createAPIKey(matchedTransaction);
      }
    } catch (err) {
      console.error('Error checking payment:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const createAPIKey = async (transaction: MutationData) => {
    try {
      let planType = 'basic';
      if (orderData?.planName.toLowerCase().includes('premium')) planType = 'premium';
      else if (orderData?.planName.toLowerCase().includes('enterprise')) planType = 'enterprise';

      const response = await fetch('/api/payment/create-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: orderData!.customerName, email: orderData!.customerEmail,
          type: planType, apikey: orderData!.apiKey,
        }),
      });
      if (!response.ok) throw new Error('Gagal membuat API key');
      const keyData = await response.json();
      if (keyData.status) {
        if (checkInterval) clearInterval(checkInterval);
        setPaymentSuccess({
          amount: transaction.kredit, from: transaction.brand.name,
          logo: transaction.brand.logo, description: transaction.keterangan,
          date: transaction.tanggal, originalAmount: orderData!.price,
          uniqueFee: orderData!.uniqueAmount! - orderData!.price
        });
        const updatedOrder = { ...orderData!, status: 'paid', apiKeyData: keyData.data };
        localStorage.setItem('orderData', JSON.stringify(updatedOrder));
      }
    } catch (err) {
      console.error('Error creating API key:', err);
      alert('Pembayaran terdeteksi, namun terjadi kesalahan saat membuat API key. Silakan hubungi admin.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRefreshQRIS = () => {
    if (orderData) {
      const newUniqueFee = generateUniqueFee();
      const newUniqueAmount = orderData.price + newUniqueFee;
      const updatedOrder = { ...orderData, uniqueAmount: newUniqueAmount };
      setOrderData(updatedOrder);
      localStorage.setItem('orderData', JSON.stringify(updatedOrder));
      setIsExpired(false); setTimeLeft(900);
      generateQRIS(newUniqueAmount);
    }
  };

  const handleConfirmPayment = async () => await checkPayment();

  const handleCopyApiKey = () => {
    if (orderData?.apiKey) {
      navigator.clipboard.writeText(orderData.apiKey);
      setCopiedApiKey(true);
      setTimeout(() => setCopiedApiKey(false), 2000);
    }
  };

  // ─────────────────────────────────────────────
  // SHARED STYLES
  // ─────────────────────────────────────────────
  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
    .ticket-font { font-family: 'Syne', sans-serif; }
    .mono-font { font-family: 'JetBrains Mono', monospace; }
    @keyframes fadeSlideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes ticketSlideIn {
      0% { transform: translateY(60px) rotate(-2deg); opacity: 0; }
      100% { transform: translateY(0) rotate(0deg); opacity: 1; }
    }
    @keyframes stampBounce {
      0% { transform: scale(0) rotate(-15deg); opacity: 0; }
      70% { transform: scale(1.1) rotate(3deg); opacity: 1; }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    @keyframes pulse-ring {
      0% { transform: scale(1); opacity: 0.6; }
      100% { transform: scale(1.5); opacity: 0; }
    }
    @keyframes scanBeam {
      0%, 100% { transform: translateY(0px); opacity: 0.7; }
      50% { transform: translateY(220px); opacity: 0.3; }
    }
    .fade-up { animation: fadeSlideUp 0.5s ease forwards; }
    .fade-up-2 { animation: fadeSlideUp 0.5s 0.15s ease both; }
    .ticket-slide { animation: ticketSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    .stamp-animate { animation: stampBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both; }
    .scan-beam { animation: scanBeam 2.5s ease-in-out infinite; }
    .pulse-ring-anim { animation: pulse-ring 2s ease-out infinite; }
    .perf-edge {
      background-image: radial-gradient(circle, var(--fd-background, #0a0a0a) 6px, transparent 6px);
      background-size: 20px 20px;
      background-position: -10px 0;
    }
    .barcode {
      background: repeating-linear-gradient(90deg,
        currentColor 0px, currentColor 2px,
        transparent 2px, transparent 5px,
        currentColor 5px, currentColor 8px,
        transparent 8px, transparent 12px,
        currentColor 12px, currentColor 13px,
        transparent 13px, transparent 18px
      );
    }
    .ticket-shadow { box-shadow: 0 20px 60px -10px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04); }
  `;

  // ─────────────────────────────────────────────
  // SUCCESS PAGE
  // ─────────────────────────────────────────────
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-fd-background flex items-center justify-center p-4">
        <style>{globalStyles}</style>

        <div className="w-full max-w-md ticket-slide">
          <div className="bg-fd-card border-2 border-fd-border rounded-2xl overflow-hidden ticket-shadow">

            {/* Header */}
            <div className="bg-green-500/10 border-b-2 border-fd-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 border-2 border-green-500/30 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="ticket-font text-[10px] text-fd-muted-foreground uppercase tracking-[0.25em]">Payment Receipt</p>
                  <p className="ticket-font text-sm font-700 text-fd-foreground">Pembayaran Dikonfirmasi</p>
                </div>
              </div>
              <div className="stamp-animate">
                <div style={{ border: '2.5px solid rgb(34 197 94)', borderRadius: '8px', padding: '4px 8px', transform: 'rotate(-8deg)' }}>
                  <p className="ticket-font text-xs text-green-500 uppercase tracking-widest" style={{ fontWeight: 800 }}>LUNAS</p>
                </div>
              </div>
            </div>

            {/* Perforation */}
            <div className="relative h-5 border-y border-fd-border/40 overflow-hidden">
              <div className="absolute inset-0 perf-edge"></div>
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-dashed border-fd-border/50"></div></div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="ticket-font text-[10px] text-fd-muted-foreground uppercase tracking-widest mb-1">Dibayar dari</p>
                  <div className="flex items-center gap-2">
                    {paymentSuccess.logo && <img src={paymentSuccess.logo} alt="" className="w-5 h-5 rounded object-contain" />}
                    <p className="ticket-font font-700 text-fd-foreground">{paymentSuccess.from}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="ticket-font text-[10px] text-fd-muted-foreground uppercase tracking-widest mb-1">Total</p>
                  <p className="ticket-font text-lg text-green-500" style={{ fontWeight: 800 }}>
                    Rp {parseInt(paymentSuccess.amount.replace(/\./g, '')).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {[
                { label: 'Keterangan', value: paymentSuccess.description },
                { label: 'Tanggal & Waktu', value: paymentSuccess.date },
                { label: 'Harga Paket', value: `Rp ${paymentSuccess.originalAmount.toLocaleString('id-ID')}` },
                { label: 'Kode Unik', value: `Rp ${paymentSuccess.uniqueFee.toLocaleString('id-ID')}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-dashed border-fd-border/40">
                  <p className="ticket-font text-[10px] text-fd-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="mono-font text-xs font-500 text-fd-foreground text-right max-w-[55%] truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Perforation */}
            <div className="relative h-5 border-y border-fd-border/40 overflow-hidden">
              <div className="absolute inset-0 perf-edge"></div>
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-dashed border-fd-border/50"></div></div>
            </div>

            {/* Stub */}
            <div className="bg-fd-accent/20 px-6 py-5">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-3.5 h-3.5 text-fd-muted-foreground" />
                <p className="ticket-font text-[10px] text-fd-muted-foreground uppercase tracking-widest">API Key Terkirim ke Email</p>
              </div>
              <p className="mono-font text-sm font-600 text-fd-foreground mb-4">{orderData?.customerEmail}</p>
              <div className="flex items-center gap-3 pt-3 border-t border-fd-border/40">
                <div className="h-10 flex-1 barcode text-fd-border/50 rounded overflow-hidden"></div>
                <div className="text-center px-1">
                  <p className="mono-font text-[9px] text-fd-muted-foreground uppercase tracking-wider">ORDER</p>
                  <p className="mono-font text-xs font-700 text-fd-foreground">#{orderData?.id.slice(-6)}</p>
                </div>
                <div className="h-10 flex-1 barcode text-fd-border/50 rounded overflow-hidden"></div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t-2 border-fd-border flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-fd-border bg-fd-card hover:bg-fd-accent transition-all ticket-font text-sm font-600">
                <ArrowLeft className="w-4 h-4" /> Dashboard
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-fd-primary bg-fd-primary text-fd-primary-foreground hover:opacity-90 transition-all ticket-font text-sm font-600">
                <Download className="w-4 h-4" /> Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-fd-background flex items-center justify-center">
        <style>{globalStyles}</style>
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-fd-primary" />
          <p className="ticket-font text-sm text-fd-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // MAIN PAYMENT PAGE
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-fd-background">
      <style>{globalStyles}</style>

      {/* Top Bar */}
      <div className="border-b-2 border-fd-border bg-fd-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-fd-primary" />
            <span className="ticket-font font-700 text-fd-foreground text-sm uppercase tracking-widest">Payment Terminal</span>
          </div>

          {/* Steps */}
          <div className="hidden sm:flex items-center gap-1">
            {[
              { n: 1, label: 'Paket', done: true },
              { n: 2, label: 'Data', done: true },
              { n: 3, label: 'Bayar', done: false },
            ].map((step, i) => (
              <div key={step.n} className="flex items-center">
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${step.done ? 'bg-fd-primary/10 border border-fd-primary/30' : 'bg-fd-accent border border-fd-border'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${step.done ? 'bg-fd-primary' : 'bg-fd-muted'}`}>
                    {step.done
                      ? <Check className="w-2.5 h-2.5 text-fd-primary-foreground" />
                      : <span className="mono-font text-[9px] font-700 text-fd-muted-foreground">{step.n}</span>
                    }
                  </div>
                  <span className={`ticket-font text-xs font-600 ${step.done ? 'text-fd-primary' : 'text-fd-foreground'}`}>{step.label}</span>
                </div>
                {i < 2 && <div className="w-4 h-px bg-fd-border mx-0.5"></div>}
              </div>
            ))}
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 ${isExpired ? 'border-red-500/40 bg-red-500/10' : 'border-fd-border bg-fd-accent'}`}>
            <Clock className={`w-3 h-3 ${isExpired ? 'text-red-500' : timeLeft < 120 ? 'text-orange-500' : 'text-fd-muted-foreground'}`} />
            <span className={`mono-font text-sm font-700 ${isExpired ? 'text-red-500' : timeLeft < 120 ? 'text-orange-500' : 'text-fd-foreground'}`}>
              {isExpired ? 'EXPIRED' : formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── LEFT: QRIS TICKET ── */}
          <div className="lg:col-span-3 fade-up">
            <div className="bg-fd-card border-2 border-fd-border rounded-2xl overflow-hidden ticket-shadow">

              {/* Header */}
              <div className="px-6 py-4 border-b-2 border-fd-border flex items-center justify-between">
                <div>
                  <p className="ticket-font text-[10px] text-fd-muted-foreground uppercase tracking-[0.3em] mb-0.5">QRIS Payment Ticket</p>
                  <p className="ticket-font text-base font-700 text-fd-foreground">Scan untuk Membayar</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-fd-border bg-fd-accent">
                  <Wifi className="w-3 h-3 text-green-500" />
                  <span className="ticket-font text-xs font-600 text-fd-foreground">QRIS</span>
                </div>
              </div>

              {/* QRIS Body */}
              <div className="px-6 pt-6 pb-4">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-fd-primary/30 pulse-ring-anim"></div>
                      <Loader className="w-8 h-8 animate-spin text-fd-primary" />
                    </div>
                    <p className="ticket-font text-sm text-fd-muted-foreground">Generating QRIS Code...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                    <p className="ticket-font font-600 text-fd-foreground">{error}</p>
                    <button onClick={() => generateQRIS(orderData.uniqueAmount || orderData.price)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-fd-border bg-fd-card hover:bg-fd-accent transition-all ticket-font text-sm font-600">
                      <RefreshCw className="w-4 h-4" /> Coba Lagi
                    </button>
                  </div>
                ) : qrisData ? (
                  <div className="flex flex-col items-center gap-5">
                    {/* QR — centered & large */}
                    <div className="flex flex-col items-center">
                      <div className={`relative rounded-2xl border-2 border-fd-border overflow-hidden bg-white ${isExpired ? 'opacity-40' : ''}`}
                        style={{ width: '240px', height: '240px' }}>
                        <img src={qrisData.qrImageUrl} alt="QRIS" className="w-full h-full object-contain p-3" />
                        {!isExpired && (
                          <div className="absolute inset-x-0 top-0 h-0.5 bg-fd-primary/80 scan-beam"
                            style={{ boxShadow: '0 0 12px 4px var(--fd-primary)' }}></div>
                        )}
                        {/* Corner marks */}
                        {[['top-0 left-0','top-0','left-0'],['top-0 right-0','top-0','right-0'],['bottom-0 left-0','bottom-0','left-0'],['bottom-0 right-0','bottom-0','right-0']].map(([pos,v,h],i) => (
                          <div key={i} className={`absolute ${pos} w-6 h-6`}>
                            <div className={`absolute w-full h-0.5 bg-fd-primary ${v}`}></div>
                            <div className={`absolute h-full w-0.5 bg-fd-primary ${h}`}></div>
                          </div>
                        ))}
                        {isExpired && (
                          <div className="absolute inset-0 bg-fd-background/80 flex items-center justify-center">
                            <div style={{ border: '2.5px solid rgb(239 68 68)', borderRadius: '8px', padding: '6px 14px', transform: 'rotate(-10deg)' }}>
                              <p className="ticket-font text-sm text-red-500 uppercase tracking-wider" style={{ fontWeight: 800 }}>EXPIRED</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="ticket-font text-[11px] text-fd-muted-foreground text-center mt-2.5">
                        {isExpired ? (
                          <button onClick={handleRefreshQRIS} className="flex items-center gap-1.5 mx-auto text-fd-primary hover:underline">
                            <RefreshCw className="w-3 h-3" /> Perbarui QR
                          </button>
                        ) : 'Scan dengan e-wallet atau mobile banking'}
                      </p>
                    </div>

                    {/* Amount breakdown — full width row */}
                    <div className="w-full space-y-1.5">
                      <div className="flex justify-between items-center py-2 border-b border-dashed border-fd-border/50">
                        <p className="ticket-font text-xs text-fd-muted-foreground uppercase tracking-wider">Harga Paket</p>
                        <p className="mono-font text-sm text-fd-foreground">Rp {orderData.price.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-dashed border-fd-border/50">
                        <p className="ticket-font text-xs text-fd-muted-foreground uppercase tracking-wider">Kode Unik</p>
                        <p className="mono-font text-sm text-fd-muted-foreground">+ Rp {(orderData.uniqueAmount! - orderData.price).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-fd-accent border border-fd-border mt-1">
                        <p className="ticket-font text-sm font-700 uppercase tracking-wider text-fd-foreground">Total</p>
                        <p className="mono-font text-base font-700 text-fd-foreground">Rp {orderData.uniqueAmount!.toLocaleString('id-ID')}</p>
                      </div>
                      <p className="ticket-font text-[10px] text-fd-muted-foreground text-center pt-1">
                        Kode unik membantu sistem mengidentifikasi pembayaran Anda secara otomatis
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Perforation */}
              <div className="relative h-5 border-y border-fd-border/40 overflow-hidden">
                <div className="absolute inset-0 perf-edge"></div>
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-dashed border-fd-border/50"></div></div>
              </div>

              {/* Instruction Stub */}
              <div className="bg-fd-accent/20 px-6 py-4">
                <p className="ticket-font text-[10px] text-fd-muted-foreground uppercase tracking-[0.25em] mb-3">Cara Pembayaran</p>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {[
                    'Buka aplikasi e-wallet atau mobile banking',
                    'Pilih menu scan QRIS',
                    'Scan kode QR di atas',
                    'Konfirmasi nominal & bayar',
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-full border border-fd-border bg-fd-card flex items-center justify-center flex-shrink-0">
                        <span className="mono-font text-[9px] font-700 text-fd-muted-foreground">{i + 1}</span>
                      </div>
                      <p className="ticket-font text-xs text-fd-muted-foreground whitespace-nowrap">{step}</p>
                    </div>
                  ))}
                </div>

                {isChecking && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-fd-border/40">
                    <Loader className="w-3 h-3 animate-spin text-fd-primary" />
                    <p className="ticket-font text-xs text-fd-muted-foreground">Mengecek status pembayaran...</p>
                  </div>
                )}

                <button
                  onClick={handleConfirmPayment}
                  disabled={isChecking || isExpired}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-fd-primary bg-fd-primary text-fd-primary-foreground ticket-font text-sm font-600 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChecking
                    ? <><Loader className="w-4 h-4 animate-spin" /> Mengecek...</>
                    : <><CheckCircle className="w-4 h-4" /> Saya Sudah Bayar</>
                  }
                </button>
                <p className="ticket-font text-[10px] text-fd-muted-foreground text-center mt-2">Auto-check setiap 10 detik</p>
              </div>
            </div>

            {/* Security strip */}
            <div className="mt-3 flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-fd-border/40 bg-fd-card/50">
              <ShieldCheck className="w-3.5 h-3.5 text-fd-muted-foreground flex-shrink-0" />
              <p className="ticket-font text-[11px] text-fd-muted-foreground">
                Enkripsi standar Bank Indonesia · Verifikasi real-time otomatis
              </p>
            </div>
          </div>

          {/* ── RIGHT: ORDER TICKET ── */}
          <div className="lg:col-span-2 fade-up-2">
            <div className="bg-fd-card border-2 border-fd-border rounded-2xl overflow-hidden ticket-shadow">

              {/* Header */}
              <div className="px-5 py-4 border-b-2 border-fd-border">
                <p className="ticket-font text-[10px] text-fd-muted-foreground uppercase tracking-[0.3em] mb-0.5">Order Ticket</p>
                <p className="ticket-font text-base font-700 text-fd-foreground">Detail Pesanan</p>
              </div>

              {/* Fields */}
              <div className="px-5 py-4 space-y-2.5">
                {[
                  { label: 'Order ID', value: orderData.id, mono: true },
                  { label: 'Paket', value: orderData.planName, mono: false },
                  { label: 'Pelanggan', value: orderData.customerName, mono: false },
                  { label: 'Email', value: orderData.customerEmail, mono: true },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="py-2 border-b border-dashed border-fd-border/40">
                    <p className="ticket-font text-[10px] text-fd-muted-foreground uppercase tracking-widest mb-0.5">{label}</p>
                    <p className={`${mono ? 'mono-font' : 'ticket-font'} text-xs font-600 text-fd-foreground truncate`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Perforation */}
              <div className="relative h-5 border-y border-fd-border/40 overflow-hidden">
                <div className="absolute inset-0 perf-edge"></div>
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-dashed border-fd-border/50"></div></div>
              </div>

              {/* API Key Stub */}
              <div className="px-5 py-4 bg-fd-accent/20">
                <p className="ticket-font text-[10px] text-fd-muted-foreground uppercase tracking-widest mb-2">API Key Anda</p>
                <div className="flex items-center gap-2 bg-fd-card border border-fd-border rounded-lg px-3 py-2">
                  <p className="mono-font text-xs font-500 text-fd-foreground flex-1 truncate">{orderData.apiKey}</p>
                  <button onClick={handleCopyApiKey} className="flex-shrink-0 p-1 rounded hover:bg-fd-accent transition-colors">
                    {copiedApiKey ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-fd-muted-foreground" />}
                  </button>
                </div>
                {copiedApiKey && <p className="ticket-font text-[10px] text-green-500 mt-1">✓ Tersalin ke clipboard</p>}

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { label: 'Limit', value: typeof orderData.limit === 'number' ? orderData.limit.toLocaleString() : orderData.limit },
                    { label: 'Durasi', value: orderData.expireDays ? `${orderData.expireDays}h` : '∞' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-fd-card border border-fd-border rounded-lg px-3 py-2 text-center">
                      <p className="ticket-font text-[9px] text-fd-muted-foreground uppercase tracking-wider">{label}</p>
                      <p className="mono-font text-sm font-700 text-fd-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Perforation */}
              <div className="relative h-5 border-y border-fd-border/40 overflow-hidden">
                <div className="absolute inset-0 perf-edge"></div>
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-dashed border-fd-border/50"></div></div>
              </div>

              {/* Footer Stub */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="ticket-font text-xs font-700 text-fd-muted-foreground uppercase tracking-wider">Total Bayar</p>
                  <p className="ticket-font text-lg text-fd-foreground" style={{ fontWeight: 800 }}>{orderData.priceFormatted}</p>
                </div>

                {/* Barcode */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 flex-1 barcode text-fd-border/50 rounded overflow-hidden"></div>
                  <div className="text-center px-1 flex-shrink-0">
                    <p className="mono-font text-[8px] text-fd-muted-foreground uppercase tracking-wider">ORDER</p>
                    <p className="mono-font text-[10px] font-700 text-fd-foreground">#{orderData.id.slice(-6)}</p>
                  </div>
                  <div className="h-8 flex-1 barcode text-fd-border/50 rounded overflow-hidden"></div>
                </div>

                {/* Benefits */}
                <div className="space-y-1.5">
                  {['Aktivasi instan', 'Support 24/7', 'Dokumentasi lengkap', '99.9% uptime guarantee'].map(b => (
                    <div key={b} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-green-500"></div>
                      </div>
                      <p className="ticket-font text-xs text-fd-muted-foreground">{b}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
