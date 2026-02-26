'use client';
import { useState, useEffect } from 'react';
import {
  QrCode, Clock, CheckCircle, AlertCircle, ShieldCheck,
  RefreshCw, Loader, Package, User, CreditCard, Check,
  Copy, Mail, Key, Calendar, Zap, Download, ArrowLeft, Plane
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
    if (timeLeft <= 0) { setIsExpired(true); if (checkInterval) clearInterval(checkInterval); return; }
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) throw new Error('Gagal generate QRIS');
      const result = await response.json();
      if (result.status && result.data) setQrisData(result.data);
      else throw new Error(result.message || 'Gagal generate QRIS');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally { setIsLoading(false); }
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
    } catch (err) { console.error('Error checking payment:', err); }
    finally { setIsChecking(false); }
  };

  const createAPIKey = async (transaction: MutationData) => {
    try {
      let planType = 'basic';
      if (orderData?.planName.toLowerCase().includes('premium')) planType = 'premium';
      else if (orderData?.planName.toLowerCase().includes('enterprise')) planType = 'enterprise';
      const response = await fetch('/api/payment/create-key', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: orderData!.customerName, email: orderData!.customerEmail, type: planType, apikey: orderData!.apiKey }),
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

  const handleCopyApiKey = () => {
    if (orderData?.apiKey) {
      navigator.clipboard.writeText(orderData.apiKey);
      setCopiedApiKey(true);
      setTimeout(() => setCopiedApiKey(false), 2000);
    }
  };

  // ─── SUCCESS PAGE ─────────────────────────────────────────────────────────
  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--fd-background)' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
          
          :root {
            --ticket-bg: var(--fd-card, #ffffff);
            --ticket-border: var(--fd-border, #e2e8f0);
            --ticket-muted: var(--fd-muted-foreground, #64748b);
            --ticket-fg: var(--fd-foreground, #0f172a);
            --ticket-accent: var(--fd-primary, #2563eb);
            --ticket-success: #16a34a;
          }

          .ticket-font { font-family: 'Barlow Condensed', sans-serif; }
          .mono-font { font-family: 'IBM Plex Mono', monospace; }

          .boarding-pass {
            background: var(--ticket-bg);
            border: 1.5px solid var(--ticket-border);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06);
            position: relative;
          }

          .tear-line {
            position: relative;
            display: flex;
            align-items: center;
          }
          .tear-line::before, .tear-line::after {
            content: '';
            width: 20px; height: 20px;
            background: var(--fd-background, #f8fafc);
            border-radius: 50%;
            border: 1.5px solid var(--ticket-border);
            flex-shrink: 0;
            margin: 0 -10px;
            position: relative;
            z-index: 1;
          }
          .tear-line-inner {
            flex: 1;
            border-top: 2px dashed var(--ticket-border);
            margin: 0 6px;
          }

          .barcode-lines {
            display: flex; gap: 2px; align-items: center; justify-content: center;
            height: 48px; padding: 0 8px;
          }
          .barcode-lines span {
            display: block; background: var(--ticket-fg); border-radius: 1px;
          }

          .success-stamp {
            position: absolute; top: 24px; right: 24px;
            width: 80px; height: 80px;
            border: 3px solid var(--ticket-success);
            border-radius: 50%;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            transform: rotate(12deg);
            opacity: 0.85;
          }

          .pulse-ring {
            animation: pulse-ring 1.5s ease-out infinite;
          }
          @keyframes pulse-ring {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.4); }
            70% { transform: scale(1); box-shadow: 0 0 0 16px rgba(22, 163, 74, 0); }
            100% { transform: scale(0.95); }
          }

          .slide-up {
            animation: slideUp 0.5s ease-out both;
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .delay-1 { animation-delay: 0.1s; }
          .delay-2 { animation-delay: 0.2s; }
          .delay-3 { animation-delay: 0.3s; }
        `}</style>

        <div className="w-full max-w-md">
          {/* BOARDING PASS - SUCCESS */}
          <div className="boarding-pass slide-up">
            {/* Header strip */}
            <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid var(--ticket-border)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="ticket-font text-xs tracking-[0.2em] uppercase mb-1" style={{ color: 'var(--ticket-muted)' }}>E-TICKET</div>
                  <div className="ticket-font font-black text-2xl leading-none" style={{ color: 'var(--ticket-fg)' }}>BOARDING PASS</div>
                  <div className="ticket-font text-sm mt-1" style={{ color: 'var(--ticket-muted)' }}>API ACCESS CONFIRMED</div>
                </div>
                {/* Stamp */}
                <div className="success-stamp pulse-ring">
                  <Check size={20} strokeWidth={3} style={{ color: 'var(--ticket-success)' }} />
                  <span className="ticket-font font-bold text-xs leading-none mt-0.5" style={{ color: 'var(--ticket-success)' }}>PAID</span>
                </div>
              </div>
            </div>

            {/* Route section */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="ticket-font font-black text-3xl" style={{ color: 'var(--ticket-fg)' }}>IDR</div>
                  <div className="ticket-font text-xs tracking-widest" style={{ color: 'var(--ticket-muted)' }}>DARI</div>
                </div>
                <div className="flex-1 flex items-center gap-1">
                  <div className="flex-1 border-t border-dashed" style={{ borderColor: 'var(--ticket-border)' }}></div>
                  <Plane size={18} style={{ color: 'var(--ticket-accent)' }} />
                  <div className="flex-1 border-t border-dashed" style={{ borderColor: 'var(--ticket-border)' }}></div>
                </div>
                <div className="text-center">
                  <div className="ticket-font font-black text-3xl" style={{ color: 'var(--ticket-accent)' }}>API</div>
                  <div className="ticket-font text-xs tracking-widest" style={{ color: 'var(--ticket-muted)' }}>ACCESS</div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-1">
                <div className="text-left flex-1">
                  <div className="ticket-font text-xs" style={{ color: 'var(--ticket-muted)' }}>{paymentSuccess.from}</div>
                </div>
                <div className="text-right flex-1">
                  <div className="ticket-font text-xs" style={{ color: 'var(--ticket-muted)' }}>{orderData?.planName}</div>
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-3 px-6 pb-4 gap-4">
              {[
                { label: 'PENUMPANG', value: orderData?.customerName || '—' },
                { label: 'TANGGAL', value: paymentSuccess.date.split(' ')[0] },
                { label: 'GATE', value: paymentSuccess.date.split(' ')[1] || '—' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="ticket-font text-xs tracking-widest mb-0.5" style={{ color: 'var(--ticket-muted)' }}>{item.label}</div>
                  <div className="ticket-font font-bold text-sm leading-tight" style={{ color: 'var(--ticket-fg)' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Tear line */}
            <div className="tear-line px-2 py-1">
              <div className="tear-line-inner"></div>
            </div>

            {/* Stub section */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="ticket-font text-xs tracking-widest mb-0.5" style={{ color: 'var(--ticket-muted)' }}>HARGA PAKET</div>
                  <div className="ticket-font font-bold" style={{ color: 'var(--ticket-fg)' }}>Rp {paymentSuccess.originalAmount.toLocaleString('id-ID')}</div>
                </div>
                <div>
                  <div className="ticket-font text-xs tracking-widest mb-0.5" style={{ color: 'var(--ticket-muted)' }}>KODE UNIK</div>
                  <div className="ticket-font font-bold" style={{ color: 'var(--ticket-fg)' }}>+ Rp {paymentSuccess.uniqueFee.toLocaleString('id-ID')}</div>
                </div>
                <div>
                  <div className="ticket-font text-xs tracking-widest mb-0.5" style={{ color: 'var(--ticket-muted)' }}>TOTAL BAYAR</div>
                  <div className="ticket-font font-black text-lg" style={{ color: 'var(--ticket-accent)' }}>
                    Rp {parseInt(paymentSuccess.amount.replace(/\./g, '')).toLocaleString('id-ID')}
                  </div>
                </div>
                <div>
                  <div className="ticket-font text-xs tracking-widest mb-0.5" style={{ color: 'var(--ticket-muted)' }}>STATUS</div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--ticket-success)' }}></span>
                    <span className="ticket-font font-bold text-sm" style={{ color: 'var(--ticket-success)' }}>LUNAS</span>
                  </div>
                </div>
              </div>

              {/* Email notice */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(37, 99, 235, 0.06)', border: '1px solid rgba(37, 99, 235, 0.15)' }}>
                <Mail size={14} style={{ color: 'var(--ticket-accent)', flexShrink: 0 }} />
                <span className="ticket-font text-sm" style={{ color: 'var(--ticket-accent)' }}>
                  API Key dikirim ke <strong>{orderData?.customerEmail}</strong>
                </span>
              </div>
            </div>

            {/* Barcode */}
            <div className="px-6 pb-5 flex flex-col items-center gap-2">
              <div className="barcode-lines">
                {Array.from({ length: 52 }, (_, i) => {
                  const heights = [32, 48, 40, 32, 48, 36, 44, 48, 32, 40];
                  const widths = [2, 1, 3, 2, 1, 2, 3, 1, 2, 1];
                  return <span key={i} style={{ height: `${heights[i % 10]}px`, width: `${widths[i % 10]}px`, opacity: 0.6 + (i % 3) * 0.13 }} />;
                })}
              </div>
              <div className="mono-font text-xs tracking-[0.3em]" style={{ color: 'var(--ticket-muted)' }}>
                {orderData?.id.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-4 slide-up delay-2">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl ticket-font font-bold text-sm tracking-wide" style={{ background: 'var(--ticket-bg)', border: '1.5px solid var(--ticket-border)', color: 'var(--ticket-fg)' }}>
              <ArrowLeft size={15} /> DASHBOARD
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl ticket-font font-bold text-sm tracking-wide" style={{ background: 'var(--ticket-accent)', color: '#fff' }}>
              <Download size={15} /> DOWNLOAD
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--fd-background)' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader size={28} className="animate-spin" style={{ color: 'var(--fd-primary)' }} />
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'var(--fd-muted-foreground)' }}>Memuat data...</span>
        </div>
      </div>
    );
  }

  // ─── MAIN PAYMENT PAGE ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: 'var(--fd-background)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        .ticket-font { font-family: 'Barlow Condensed', sans-serif; }
        .mono-font { font-family: 'IBM Plex Mono', monospace; }

        .boarding-pass {
          background: var(--fd-card);
          border: 1.5px solid var(--fd-border);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.05);
        }

        .tear-line {
          position: relative;
          display: flex;
          align-items: center;
        }
        .tear-line::before, .tear-line::after {
          content: '';
          width: 22px; height: 22px;
          background: var(--fd-background);
          border-radius: 50%;
          border: 1.5px solid var(--fd-border);
          flex-shrink: 0;
          margin: 0 -11px;
          position: relative;
          z-index: 2;
        }
        .tear-line-inner {
          flex: 1;
          border-top: 2px dashed var(--fd-border);
          margin: 0 8px;
        }

        .qr-wrapper {
          position: relative;
          display: inline-block;
        }
        .qr-corner {
          position: absolute;
          width: 18px; height: 18px;
          border-color: var(--fd-primary);
          border-style: solid;
          border-radius: 2px;
        }
        .qr-corner-tl { top: -4px; left: -4px; border-width: 3px 0 0 3px; }
        .qr-corner-tr { top: -4px; right: -4px; border-width: 3px 3px 0 0; }
        .qr-corner-bl { bottom: -4px; left: -4px; border-width: 0 0 3px 3px; }
        .qr-corner-br { bottom: -4px; right: -4px; border-width: 0 3px 3px 0; }

        .step-connector {
          flex: 1; height: 1.5px;
          background: linear-gradient(90deg, var(--fd-primary) 0%, var(--fd-border) 100%);
        }
        .step-connector.inactive {
          background: var(--fd-border);
        }

        .timer-digits {
          font-family: 'IBM Plex Mono', monospace;
          font-weight: 600;
        }

        .barcode-lines {
          display: flex; gap: 1.5px; align-items: center; justify-content: center;
          height: 40px;
        }
        .barcode-lines span {
          display: block; background: var(--fd-foreground); border-radius: 1px;
        }

        .instruction-item {
          display: flex; align-items: flex-start; gap: 10px; padding: 8px 0;
          border-bottom: 1px dashed var(--fd-border);
        }
        .instruction-item:last-child { border-bottom: none; }

        .price-tag {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 2px 10px; border-radius: 999px;
          border: 1.5px solid var(--fd-border);
          background: var(--fd-card);
        }

        .shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .stamp-expired {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px;
        }
        .stamp-expired-inner {
          border: 3px solid #ef4444; border-radius: 8px;
          padding: 6px 16px;
          transform: rotate(-20deg);
        }

        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
      `}</style>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── PROGRESS BOARDING STEPS ── */}
        <div className="flex items-center mb-8">
          {[
            { number: 1, label: 'PILIH PAKET', icon: Package },
            { number: 2, label: 'KONFIRMASI', icon: User },
            { number: 3, label: 'PEMBAYARAN', icon: CreditCard },
          ].map((step, i) => {
            const Icon = step.icon;
            const done = i < 2;
            const current = i === 2;
            return (
              <div key={step.number} className="flex items-center" style={{ flex: i < 2 ? '1' : 'none' }}>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full ticket-font font-black text-sm"
                    style={{
                      background: done ? 'var(--fd-primary)' : current ? 'var(--fd-primary)' : 'var(--fd-card)',
                      color: (done || current) ? '#fff' : 'var(--fd-muted-foreground)',
                      border: (!done && !current) ? '1.5px solid var(--fd-border)' : 'none',
                    }}>
                    {done ? <Check size={14} strokeWidth={3} /> : step.number}
                  </div>
                  <span className="ticket-font font-bold text-xs tracking-widest hidden sm:block"
                    style={{ color: current ? 'var(--fd-foreground)' : done ? 'var(--fd-primary)' : 'var(--fd-muted-foreground)' }}>
                    {step.label}
                  </span>
                </div>
                {i < 2 && <div className={`step-connector mx-3 ${!done ? 'inactive' : ''}`}></div>}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── MAIN TICKET (3/5) ── */}
          <div className="lg:col-span-3">
            <div className="boarding-pass fade-in">

              {/* Ticket header */}
              <div className="flex items-stretch" style={{ borderBottom: '1.5px solid var(--fd-border)' }}>
                <div className="px-6 py-5 flex-1">
                  <div className="ticket-font text-xs tracking-[0.2em] uppercase mb-0.5" style={{ color: 'var(--fd-muted-foreground)' }}>
                    E-PAYMENT TICKET
                  </div>
                  <div className="ticket-font font-black text-3xl leading-none" style={{ color: 'var(--fd-foreground)' }}>
                    PEMBAYARAN
                  </div>
                  <div className="ticket-font text-sm mt-1" style={{ color: 'var(--fd-muted-foreground)' }}>
                    {orderData.planName.toUpperCase()} · {orderData.id}
                  </div>
                </div>
                {/* Timer section */}
                <div className="px-5 py-4 flex flex-col items-center justify-center" style={{ borderLeft: '1.5px dashed var(--fd-border)', minWidth: 100 }}>
                  <div className="ticket-font text-xs tracking-widest mb-1" style={{ color: 'var(--fd-muted-foreground)' }}>
                    {isExpired ? 'EXPIRED' : 'BOARDING'}
                  </div>
                  <div className={`timer-digits text-2xl ${isExpired ? '' : timeLeft <= 120 ? 'shimmer' : ''}`}
                    style={{ color: isExpired ? '#ef4444' : timeLeft <= 120 ? '#ef4444' : 'var(--fd-foreground)' }}>
                    {isExpired ? '00:00' : formatTime(timeLeft)}
                  </div>
                  {isExpired && (
                    <button onClick={handleRefreshQRIS}
                      className="mt-2 flex items-center gap-1 ticket-font font-bold text-xs px-2 py-1 rounded"
                      style={{ background: 'var(--fd-primary)', color: '#fff' }}>
                      <RefreshCw size={11} /> REFRESH
                    </button>
                  )}
                </div>
              </div>

              {/* Flight info row */}
              <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1.5px solid var(--fd-border)' }}>
                <div className="text-center">
                  <div className="ticket-font font-black text-2xl" style={{ color: 'var(--fd-foreground)' }}>IDR</div>
                  <div className="ticket-font text-xs tracking-widest" style={{ color: 'var(--fd-muted-foreground)' }}>WALLET</div>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 border-t border-dashed" style={{ borderColor: 'var(--fd-border)' }}></div>
                  <Plane size={16} style={{ color: 'var(--fd-primary)' }} />
                  <div className="flex-1 border-t border-dashed" style={{ borderColor: 'var(--fd-border)' }}></div>
                </div>
                <div className="text-center">
                  <div className="ticket-font font-black text-2xl" style={{ color: 'var(--fd-primary)' }}>API</div>
                  <div className="ticket-font text-xs tracking-widest" style={{ color: 'var(--fd-muted-foreground)' }}>ACCESS</div>
                </div>

                <div className="ml-auto pl-3" style={{ borderLeft: '1.5px dashed var(--fd-border)' }}>
                  <div className="ticket-font text-xs tracking-widest mb-0.5" style={{ color: 'var(--fd-muted-foreground)' }}>PENUMPANG</div>
                  <div className="ticket-font font-bold text-sm" style={{ color: 'var(--fd-foreground)' }}>{orderData.customerName}</div>
                </div>
              </div>

              {/* QR Code zone */}
              <div className="px-6 py-6">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Loader size={28} className="animate-spin" style={{ color: 'var(--fd-primary)' }} />
                    <span className="ticket-font text-sm tracking-widest" style={{ color: 'var(--fd-muted-foreground)' }}>GENERATING QRIS...</span>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <AlertCircle size={28} style={{ color: '#ef4444' }} />
                    <span className="ticket-font font-bold" style={{ color: '#ef4444' }}>{error}</span>
                    <button onClick={() => generateQRIS(orderData.uniqueAmount || orderData.price)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg ticket-font font-bold text-sm"
                      style={{ border: '1.5px solid var(--fd-border)', color: 'var(--fd-foreground)' }}>
                      <RefreshCw size={14} /> COBA LAGI
                    </button>
                  </div>
                ) : qrisData ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="ticket-font text-xs tracking-[0.2em] uppercase" style={{ color: 'var(--fd-muted-foreground)' }}>
                      SCAN QRIS UNTUK MEMBAYAR
                    </div>

                    {/* QR with corner brackets */}
                    <div className="qr-wrapper">
                      <div className="qr-corner qr-corner-tl"></div>
                      <div className="qr-corner qr-corner-tr"></div>
                      <div className="qr-corner qr-corner-bl"></div>
                      <div className="qr-corner qr-corner-br"></div>
                      {isExpired && (
                        <div className="stamp-expired">
                          <div className="stamp-expired-inner">
                            <span className="ticket-font font-black text-xl tracking-widest" style={{ color: '#ef4444' }}>EXPIRED</span>
                          </div>
                        </div>
                      )}
                      <img src={qrisData.qrImageUrl} alt="QRIS Code"
                        className={`rounded-lg ${isExpired ? 'opacity-40' : ''}`}
                        style={{ width: 200, height: 200, display: 'block' }} />
                    </div>

                    {/* Amount tags */}
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <div className="price-tag">
                        <span className="ticket-font text-xs tracking-widest" style={{ color: 'var(--fd-muted-foreground)' }}>PAKET</span>
                        <span className="ticket-font font-bold text-sm" style={{ color: 'var(--fd-foreground)' }}>Rp {orderData.price.toLocaleString('id-ID')}</span>
                      </div>
                      <span className="ticket-font text-sm" style={{ color: 'var(--fd-muted-foreground)' }}>+</span>
                      <div className="price-tag">
                        <span className="ticket-font text-xs tracking-widest" style={{ color: 'var(--fd-muted-foreground)' }}>UNIK</span>
                        <span className="ticket-font font-bold text-sm" style={{ color: 'var(--fd-foreground)' }}>Rp {(orderData.uniqueAmount! - orderData.price).toLocaleString('id-ID')}</span>
                      </div>
                      <span className="ticket-font text-sm" style={{ color: 'var(--fd-muted-foreground)' }}>=</span>
                      <div className="price-tag" style={{ borderColor: 'var(--fd-primary)', borderWidth: 2 }}>
                        <span className="ticket-font font-black text-base" style={{ color: 'var(--fd-primary)' }}>Rp {orderData.uniqueAmount!.toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    <p className="ticket-font text-xs text-center" style={{ color: 'var(--fd-muted-foreground)', maxWidth: 280 }}>
                      Kode unik membantu sistem mengidentifikasi pembayaran Anda secara otomatis
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Tear line */}
              <div className="tear-line px-2">
                <div className="tear-line-inner"></div>
              </div>

              {/* Instructions stub */}
              <div className="px-6 py-5">
                <div className="ticket-font font-bold text-xs tracking-[0.15em] mb-3" style={{ color: 'var(--fd-muted-foreground)' }}>
                  CARA PEMBAYARAN
                </div>
                {[
                  'Buka e-wallet atau mobile banking Anda',
                  'Pilih menu Scan QRIS atau QR Code',
                  'Scan kode QR di atas dengan kamera',
                  'Pastikan nominal sesuai total pembayaran',
                  'Konfirmasi dan tunggu notifikasi',
                ].map((step, i) => (
                  <div key={i} className="instruction-item">
                    <span className="ticket-font font-black text-xs w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                      style={{ background: 'var(--fd-primary)', color: '#fff' }}>
                      {i + 1}
                    </span>
                    <span className="ticket-font text-sm" style={{ color: 'var(--fd-foreground)' }}>{step}</span>
                  </div>
                ))}
              </div>

              {/* Barcode + confirm */}
              <div className="px-6 pb-6 flex flex-col items-center gap-3">
                <div className="barcode-lines w-full">
                  {Array.from({ length: 60 }, (_, i) => {
                    const heights = [32, 40, 36, 32, 40, 28, 40, 36, 32, 28];
                    const widths = [2, 1, 3, 1, 2, 1, 3, 2, 1, 2];
                    return <span key={i} style={{ height: `${heights[i % 10]}px`, width: `${widths[i % 10]}px`, opacity: 0.5 + (i % 4) * 0.12 }} />;
                  })}
                </div>
                <div className="mono-font text-xs tracking-[0.25em]" style={{ color: 'var(--fd-muted-foreground)' }}>
                  {orderData.id.toUpperCase()}
                </div>

                {isChecking && (
                  <div className="flex items-center gap-2">
                    <Loader size={13} className="animate-spin" style={{ color: 'var(--fd-primary)' }} />
                    <span className="ticket-font text-xs tracking-widest" style={{ color: 'var(--fd-muted-foreground)' }}>MENGECEK PEMBAYARAN...</span>
                  </div>
                )}

                <button onClick={() => checkPayment()} disabled={isChecking || isExpired}
                  className="w-full py-3 rounded-xl ticket-font font-black text-base tracking-[0.1em] flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: isExpired ? 'var(--fd-border)' : 'var(--fd-primary)',
                    color: isExpired ? 'var(--fd-muted-foreground)' : '#fff',
                    cursor: isExpired ? 'not-allowed' : 'pointer',
                  }}>
                  {isChecking ? <><Loader size={16} className="animate-spin" /> MENGECEK...</> : <><CheckCircle size={16} /> SAYA SUDAH BAYAR</>}
                </button>
                <p className="ticket-font text-xs text-center" style={{ color: 'var(--fd-muted-foreground)' }}>
                  Sistem otomatis mengecek pembayaran setiap 10 detik
                </p>
              </div>
            </div>

            {/* Security notice */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-4 px-2">
              {[
                { icon: ShieldCheck, text: 'Enkripsi standar BI' },
                { icon: Mail, text: 'API Key via email' },
                { icon: Zap, text: 'Verifikasi real-time' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <Icon size={13} style={{ color: 'var(--fd-muted-foreground)' }} />
                  <span className="ticket-font text-xs" style={{ color: 'var(--fd-muted-foreground)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── SIDEBAR STUB (2/5) ── */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Order stub card */}
            <div className="boarding-pass fade-in">
              <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1.5px solid var(--fd-border)' }}>
                <div className="ticket-font text-xs tracking-[0.2em] uppercase mb-0.5" style={{ color: 'var(--fd-muted-foreground)' }}>
                  STUB / KUPON
                </div>
                <div className="ticket-font font-black text-xl" style={{ color: 'var(--fd-foreground)' }}>DETAIL PESANAN</div>
              </div>

              <div className="px-5 py-4 space-y-3">
                {[
                  { label: 'ORDER ID', value: orderData.id, mono: true },
                  { label: 'PAKET', value: orderData.planName },
                  { label: 'PELANGGAN', value: orderData.customerName },
                  { label: 'EMAIL', value: orderData.customerEmail },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="ticket-font text-xs tracking-widest" style={{ color: 'var(--fd-muted-foreground)' }}>{label}</span>
                    <span className={`${mono ? 'mono-font text-xs' : 'ticket-font font-bold text-sm'} truncate`} style={{ color: 'var(--fd-foreground)' }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tear */}
              <div className="tear-line px-2"><div className="tear-line-inner"></div></div>

              {/* API Key */}
              <div className="px-5 py-4">
                <div className="ticket-font text-xs tracking-widest mb-2" style={{ color: 'var(--fd-muted-foreground)' }}>API KEY ANDA</div>
                <div className="rounded-lg p-2 flex items-center gap-2" style={{ background: 'var(--fd-muted, rgba(0,0,0,0.04))', border: '1px solid var(--fd-border)' }}>
                  <span className="mono-font text-xs flex-1 truncate" style={{ color: 'var(--fd-foreground)', fontSize: 10 }}>
                    {orderData.apiKey}
                  </span>
                  <button onClick={handleCopyApiKey}
                    className="flex-shrink-0 p-1.5 rounded"
                    style={{ background: copiedApiKey ? 'var(--fd-primary)' : 'transparent', color: copiedApiKey ? '#fff' : 'var(--fd-muted-foreground)' }}>
                    {copiedApiKey ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
                {copiedApiKey && (
                  <p className="ticket-font text-xs mt-1" style={{ color: 'var(--fd-primary)' }}>✓ Tersalin ke clipboard</p>
                )}
              </div>

              {/* Stats row */}
              <div className="px-5 pb-5 grid grid-cols-2 gap-3">
                {[
                  { label: 'LIMIT REQUEST', value: typeof orderData.limit === 'number' ? orderData.limit.toLocaleString() : orderData.limit },
                  { label: 'DURASI', value: orderData.expireDays ? `${orderData.expireDays}h` : '∞' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg px-3 py-2" style={{ border: '1px dashed var(--fd-border)' }}>
                    <div className="ticket-font text-xs tracking-widest" style={{ color: 'var(--fd-muted-foreground)' }}>{label}</div>
                    <div className="ticket-font font-black text-lg" style={{ color: 'var(--fd-foreground)' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits stub */}
            <div className="boarding-pass fade-in">
              <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1.5px solid var(--fd-border)' }}>
                <div className="ticket-font font-bold text-xs tracking-[0.15em]" style={{ color: 'var(--fd-muted-foreground)' }}>
                  KEUNTUNGAN PAKET
                </div>
              </div>
              <div className="px-5 py-4 space-y-2">
                {['Aktivasi instan', 'Support 24/7', 'Dokumentasi lengkap', '99.9% uptime guarantee'].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2">
                    <Check size={13} style={{ color: 'var(--fd-primary)', flexShrink: 0 }} />
                    <span className="ticket-font text-sm" style={{ color: 'var(--fd-foreground)' }}>{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                <div className="flex items-center justify-between py-3 rounded-lg px-3" style={{ background: 'var(--fd-muted, rgba(0,0,0,0.04))', border: '1px dashed var(--fd-border)' }}>
                  <span className="ticket-font font-bold text-xs tracking-widest" style={{ color: 'var(--fd-muted-foreground)' }}>TOTAL BAYAR</span>
                  <span className="ticket-font font-black text-lg" style={{ color: 'var(--fd-primary)' }}>{orderData.priceFormatted}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
