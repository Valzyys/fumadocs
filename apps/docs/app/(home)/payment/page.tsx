'use client';

import { useState, useEffect } from 'react';
import { 
  QrCode, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Loader,
  Package,
  User,
  CreditCard,
  Check,
  Copy,
  Mail,
  Key,
  Calendar,
  Zap,
  Download,
  ArrowLeft
} from 'lucide-react';

interface OrderData {
  id: string;
  planId: string;
  planName: string;
  price: number;
  priceFormatted: string;
  limit: number | string;
  expireDays: number | null;
  customerName: string;
  customerEmail: string;
  apiKey: string;
  status: string;
  createdAt: string;
  uniqueAmount?: number;
}

interface QRISResponse {
  author: string;
  originalQRIS: string;
  dynamicQRIS: string;
  amount: string;
  includeFee: boolean;
  qrImageUrl: string;
}

interface MutationData {
  id: number;
  debet: string;
  kredit: string;
  saldo_akhir: string;
  keterangan: string;
  tanggal: string;
  status: string;
  fee: string;
  brand: {
    name: string;
    logo: string;
  };
}

interface PaymentSuccess {
  amount: string;
  from: string;
  logo: string;
  description: string;
  date: string;
  originalAmount: number;
  uniqueFee: number;
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

  const generateUniqueFee = (): number => {
    return Math.floor(Math.random() * 999) + 1;
  };

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
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, checkInterval]);

  useEffect(() => {
    if (orderData && !isExpired && !paymentSuccess) {
      const interval = setInterval(() => {
        checkPayment();
      }, 10000);

      setCheckInterval(interval);

      return () => clearInterval(interval);
    }
  }, [orderData, isExpired, paymentSuccess]);

  const generateQRIS = async (amount: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payment/generate-qris', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        throw new Error('Gagal generate QRIS');
      }

      const result = await response.json();
      
      // Extract data from the wrapper
      if (result.status && result.data) {
        setQrisData(result.data);
      } else {
        throw new Error(result.message || 'Gagal generate QRIS');
      }
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

    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute)
    );
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
      const response = await fetch('/api/payment/check-mutation', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Gagal mengecek pembayaran');
      }

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

        if (matchedTransaction) {
          await createAPIKey(matchedTransaction);
        }
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
      if (orderData?.planName.toLowerCase().includes('premium')) {
        planType = 'premium';
      } else if (orderData?.planName.toLowerCase().includes('enterprise')) {
        planType = 'enterprise';
      }

      const response = await fetch('/api/payment/create-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: orderData!.customerName,
          email: orderData!.customerEmail,
          type: planType,
          apikey: orderData!.apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal membuat API key');
      }

      const keyData = await response.json();

      if (keyData.status) {
        if (checkInterval) {
          clearInterval(checkInterval);
        }

        setPaymentSuccess({
          amount: transaction.kredit,
          from: transaction.brand.name,
          logo: transaction.brand.logo,
          description: transaction.keterangan,
          date: transaction.tanggal,
          originalAmount: orderData!.price,
          uniqueFee: orderData!.uniqueAmount! - orderData!.price
        });

        const updatedOrder = {
          ...orderData!,
          status: 'paid',
          apiKeyData: keyData.data
        };
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
      
      const updatedOrder = {
        ...orderData,
        uniqueAmount: newUniqueAmount
      };
      
      setOrderData(updatedOrder);
      localStorage.setItem('orderData', JSON.stringify(updatedOrder));
      
      setIsExpired(false);
      setTimeLeft(900);
      generateQRIS(newUniqueAmount);
    }
  };

  const handleConfirmPayment = async () => {
    await checkPayment();
  };

  const handleCopyApiKey = () => {
    if (orderData?.apiKey) {
      navigator.clipboard.writeText(orderData.apiKey);
      setCopiedApiKey(true);
      setTimeout(() => setCopiedApiKey(false), 2000);
    }
  };

  const steps = [
    { number: 1, label: 'Pilih Paket', icon: Package, status: 'completed' },
    { number: 2, label: 'Konfirmasi', icon: User, status: 'completed' },
    { number: 3, label: 'Pembayaran', icon: CreditCard, status: 'current' }
  ];

  // Success Page
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fd-background via-fd-background to-fd-accent/20">
        <main className="px-4 py-8 w-full max-w-[900px] mx-auto">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/50 animate-pulse">
                <CheckCircle className="w-20 h-20 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute inset-0 w-32 h-32 bg-green-400/30 rounded-full animate-ping mx-auto"></div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-3 bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
              Pembayaran Berhasil!
            </h1>
            <p className="text-fd-muted-foreground text-lg">
              Terima kasih, transaksi Anda telah berhasil dikonfirmasi
            </p>
          </div>

          <div className="grid gap-6">
            {/* Transaction Details */}
            <div className="bg-gradient-to-br from-fd-card to-fd-accent/20 backdrop-blur-sm border border-fd-border rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold">Detail Transaksi</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-fd-background/50 rounded-xl border border-fd-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-fd-primary/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-fd-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-fd-muted-foreground mb-0.5">Dibayar dari</p>
                      <p className="font-semibold text-lg">{paymentSuccess.from}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-fd-background/50 rounded-xl border border-fd-border/50">
                  <div>
                    <p className="text-xs text-fd-muted-foreground mb-1">Keterangan</p>
                    <p className="font-medium">{paymentSuccess.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-fd-background/50 rounded-xl border border-fd-border/50">
                  <div>
                    <p className="text-xs text-fd-muted-foreground mb-1">Tanggal & Waktu</p>
                    <p className="font-medium">{paymentSuccess.date}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-fd-background/50 rounded-xl border border-fd-border/50">
                    <p className="text-xs text-fd-muted-foreground mb-1">Harga Paket</p>
                    <p className="font-semibold text-lg">
                      Rp {paymentSuccess.originalAmount.toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="p-4 bg-fd-primary/5 rounded-xl border border-fd-primary/30">
                    <p className="text-xs text-fd-primary mb-1">Kode Unik</p>
                    <p className="font-semibold text-lg text-fd-primary">
                      Rp {paymentSuccess.uniqueFee.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-fd-primary/10 to-fd-primary/5 rounded-xl border-2 border-fd-primary/30">
                  <div className="flex items-center justify-between">
                    <p className="text-fd-muted-foreground font-medium">Total Dibayar</p>
                    <p className="font-bold text-4xl bg-gradient-to-r from-fd-primary to-fd-primary/70 bg-clip-text text-transparent">
                      Rp {parseInt(paymentSuccess.amount.replace(/\./g, '')).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Notification */}
            <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">API Key Terkirim!</h3>
                  <p className="text-sm text-fd-muted-foreground mb-3">
                    API Key Anda telah dikirim ke email:
                  </p>
                  <p className="font-mono text-sm bg-fd-background/50 px-4 py-2 rounded-lg border border-fd-border inline-block">
                    {orderData?.customerEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid sm:grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold bg-fd-primary text-white hover:bg-fd-primary/90 transition-all shadow-lg shadow-fd-primary/30">
                <Zap className="w-5 h-5" />
                Ke Dashboard
              </button>
              <button className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold border-2 border-fd-border bg-fd-card hover:bg-fd-accent transition-all">
                <Download className="w-5 h-5" />
                Download Invoice
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-fd-background via-fd-background to-fd-accent/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fd-primary mx-auto mb-4"></div>
          <p className="text-fd-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fd-background via-fd-background to-fd-accent/20">
      <main className="px-4 py-8 w-full max-w-[1400px] mx-auto">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-8 left-0 right-0 h-0.5 bg-fd-border/50" style={{ left: '5%', right: '5%' }}>
                <div className="absolute inset-0 bg-fd-primary" style={{ width: '100%' }}></div>
              </div>

              {/* Steps */}
              <div className="relative flex justify-between items-start">
                {steps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.number} className="flex flex-col items-center" style={{ width: '33.33%' }}>
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all duration-300 relative z-10 ${
                          step.status === 'completed' 
                            ? "bg-fd-primary text-white shadow-lg shadow-fd-primary/30" 
                            : step.status === 'current'
                            ? "bg-fd-primary text-white shadow-lg shadow-fd-primary/50 ring-4 ring-fd-primary/20"
                            : "bg-fd-card border-2 border-fd-border text-fd-muted-foreground"
                        }`}
                      >
                        {step.status === 'completed' ? (
                          <Check className="w-7 h-7" strokeWidth={3} />
                        ) : (
                          <Icon className="w-7 h-7" />
                        )}
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-semibold mb-1 ${
                          step.status === 'current' ? "text-fd-primary" : step.status === 'upcoming' ? "text-fd-muted-foreground" : ""
                        }`}>
                          Step {step.number}
                        </p>
                        <p className={`text-xs sm:text-sm font-medium ${
                          step.status === 'current' ? "text-fd-foreground" : step.status === 'upcoming' ? "text-fd-muted-foreground" : ""
                        }`}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 bg-gradient-to-r from-fd-foreground to-fd-foreground/70 bg-clip-text text-transparent">
            Selesaikan Pembayaran
          </h1>
          <p className="text-fd-muted-foreground text-lg">
            Scan QRIS dengan aplikasi e-wallet atau mobile banking Anda
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Main Payment Section */}
          <div className="lg:col-span-8 space-y-6">
            {/* Timer Card */}
            <div className={`relative overflow-hidden backdrop-blur-sm border-2 rounded-2xl p-6 shadow-xl transition-all ${
              isExpired 
                ? "bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/50" 
                : "bg-gradient-to-br from-fd-card to-fd-accent/20 border-fd-border"
            }`}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-fd-primary/5 rounded-full blur-3xl"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    isExpired ? "bg-red-500/20" : "bg-fd-primary/10"
                  }`}>
                    <Clock className={`w-7 h-7 ${isExpired ? "text-red-500" : "text-fd-primary"}`} />
                  </div>
                  <div>
                    <p className="text-sm text-fd-muted-foreground mb-1">
                      {isExpired ? "QRIS Expired" : "Waktu Pembayaran"}
                    </p>
                    <p className={`text-4xl font-bold font-mono ${
                      isExpired ? "text-red-500" : "text-fd-primary"
                    }`}>
                      {isExpired ? "00:00" : formatTime(timeLeft)}
                    </p>
                  </div>
                </div>
                {isExpired && (
                  <button
                    onClick={handleRefreshQRIS}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-fd-primary text-white hover:bg-fd-primary/90 transition-all shadow-lg"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Generate Ulang
                  </button>
                )}
              </div>
              {isChecking && (
                <div className="mt-4 flex items-center gap-3 p-3 bg-fd-primary/10 rounded-xl">
                  <Loader className="w-5 h-5 text-fd-primary animate-spin" />
                  <span className="text-sm font-medium text-fd-primary">Mengecek status pembayaran...</span>
                </div>
              )}
            </div>

            {/* QRIS Card */}
            <div className="bg-gradient-to-br from-fd-card to-fd-accent/20 backdrop-blur-sm border border-fd-border rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-fd-primary/10 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-fd-primary" />
                </div>
                <h2 className="text-2xl font-bold">Scan QRIS untuk Membayar</h2>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-fd-primary/20 border-t-fd-primary"></div>
                    <QrCode className="w-8 h-8 text-fd-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-fd-muted-foreground mt-6 font-medium">Generating QRIS Code...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-red-500 mb-6 font-medium">{error}</p>
                  <button
                    onClick={() => generateQRIS(orderData.uniqueAmount || orderData.price)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border-2 border-fd-border bg-fd-card hover:bg-fd-accent transition-all"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Coba Lagi
                  </button>
                </div>
              ) : qrisData ? (
                <div className="space-y-6">
                  {/* QR Code */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="absolute -inset-4 bg-gradient-to-r from-fd-primary/20 to-fd-primary/10 rounded-3xl blur-xl"></div>
                      <div className="relative bg-white p-6 rounded-2xl shadow-2xl border-4 border-fd-primary/20">
                        <img
                          src={qrisData.qrImageUrl}
                          alt="QRIS Code"
                          className="w-72 h-72 object-contain"
                        />
                        {isExpired && (
                          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
                            <AlertCircle className="w-12 h-12 text-white mb-2" />
                            <p className="text-white font-bold text-lg">EXPIRED</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount Breakdown */}
                  <div className="bg-gradient-to-br from-fd-primary/5 to-fd-primary/10 border-2 border-fd-primary/30 rounded-xl p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-fd-muted-foreground">Harga Paket</span>
                        <span className="font-semibold text-lg">Rp {orderData.price.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-fd-primary font-medium">Kode Unik</span>
                        <span className="font-semibold text-lg text-fd-primary">
                          Rp {(orderData.uniqueAmount! - orderData.price).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="border-t-2 border-fd-primary/30 pt-3 flex justify-between items-center">
                        <span className="font-bold text-lg">Total Pembayaran</span>
                        <span className="font-bold text-3xl bg-gradient-to-r from-fd-primary to-fd-primary/70 bg-clip-text text-transparent">
                          Rp {orderData.uniqueAmount!.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-fd-background/50 rounded-lg">
                      <p className="text-xs text-fd-muted-foreground flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Kode unik membantu sistem mengidentifikasi pembayaran Anda secara otomatis
                      </p>
                    </div>
                  </div>

                  {/* Payment Instructions */}
                  <div className="bg-fd-accent/30 rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-fd-primary/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-fd-primary">?</span>
                      </div>
                      Cara Pembayaran
                    </h3>
                    <div className="space-y-3">
                      {[
                        "Buka aplikasi e-wallet atau mobile banking Anda",
                        "Pilih menu scan QRIS atau QR Code",
                        "Scan kode QR di atas",
                        "Pastikan nominal sesuai dengan total pembayaran",
                        "Konfirmasi pembayaran dan tunggu notifikasi"
                      ].map((step, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-fd-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-sm font-bold text-fd-primary">{index + 1}</span>
                          </div>
                          <p className="text-sm text-fd-muted-foreground pt-1">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Confirm Button */}
                  <button
                    onClick={handleConfirmPayment}
                    className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all shadow-lg ${
                      isExpired || isChecking
                        ? 'bg-fd-muted text-fd-muted-foreground cursor-not-allowed'
                        : 'bg-fd-primary text-white hover:bg-fd-primary/90 shadow-fd-primary/30'
                    }`}
                    disabled={isExpired || isChecking}
                  >
                    {isChecking ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Mengecek Pembayaran...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Saya Sudah Bayar
                      </>
                    )}
                  </button>

                  <p className="text-xs text-center text-fd-muted-foreground flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" />
                    Sistem akan otomatis mengecek pembayaran setiap 10 detik
                  </p>
                </div>
              ) : null}
            </div>

            {/* Security Notice */}
            <div className="relative overflow-hidden bg-gradient-to-br from-fd-primary/5 to-fd-primary/10 backdrop-blur-sm border-2 border-fd-primary/30 rounded-2xl p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-fd-primary/5 rounded-full blur-3xl"></div>
              <div className="relative flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-fd-primary/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-fd-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Pembayaran Aman & Terpercaya</h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-fd-primary mt-2"></div>
                      <p className="text-sm text-fd-muted-foreground">
                        QRIS dilindungi enkripsi standar Bank Indonesia
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-fd-primary mt-2"></div>
                      <p className="text-sm text-fd-muted-foreground">
                        API Key otomatis dikirim ke email setelah pembayaran terverifikasi
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-fd-primary mt-2"></div>
                      <p className="text-sm text-fd-muted-foreground">
                        Verifikasi otomatis menggunakan sistem real-time
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-8 space-y-6">
              <div className="bg-gradient-to-br from-fd-card to-fd-accent/20 backdrop-blur-sm border border-fd-border rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-fd-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-fd-primary" />
                  </div>
                  <h2 className="text-xl font-bold">Detail Pesanan</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-fd-background/50 rounded-xl border border-fd-border/50">
                    <p className="text-xs text-fd-muted-foreground mb-2 uppercase tracking-wide">Order ID</p>
                    <p className="font-mono text-xs break-all">{orderData.id}</p>
                  </div>

                  <div className="p-4 bg-fd-background/50 rounded-xl border border-fd-border/50">
                    <p className="text-xs text-fd-muted-foreground mb-2 uppercase tracking-wide">Paket</p>
                    <p className="font-bold text-lg">{orderData.planName}</p>
                  </div>

                  <div className="p-4 bg-fd-background/50 rounded-xl border border-fd-border/50">
                    <p className="text-xs text-fd-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Nama Pelanggan
                    </p>
                    <p className="font-medium">{orderData.customerName}</p>
                  </div>

                  <div className="p-4 bg-fd-background/50 rounded-xl border border-fd-border/50">
                    <p className="text-xs text-fd-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </p>
                    <p className="font-medium text-sm break-all">{orderData.customerEmail}</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-fd-primary/10 to-fd-primary/5 rounded-xl border border-fd-primary/30">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-fd-primary uppercase tracking-wide flex items-center gap-1.5 font-semibold">
                        <Key className="w-3.5 h-3.5" />
                        API Key Anda
                      </p>
                      <button
                        onClick={handleCopyApiKey}
                        className="p-2 hover:bg-fd-primary/10 rounded-lg transition-colors group"
                        title="Copy API Key"
                      >
                        {copiedApiKey ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-fd-primary group-hover:scale-110 transition-transform" />
                        )}
                      </button>
                    </div>
                    <p className="font-mono text-xs break-all bg-fd-background/50 px-3 py-2 rounded-lg border border-fd-border/50">
                      {orderData.apiKey}
                    </p>
                    {copiedApiKey && (
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Tersalin ke clipboard!
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-fd-background/50 rounded-xl border border-fd-border/50">
                      <p className="text-xs text-fd-muted-foreground mb-2 uppercase tracking-wide">Limit Request</p>
                      <p className="font-semibold text-lg">
                        {typeof orderData.limit === 'number' 
                          ? orderData.limit.toLocaleString() 
                          : orderData.limit}
                      </p>
                    </div>

                    <div className="p-4 bg-fd-background/50 rounded-xl border border-fd-border/50">
                      <p className="text-xs text-fd-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Durasi
                      </p>
                      <p className="font-semibold text-lg">
                        {orderData.expireDays ? `${orderData.expireDays}h` : '∞'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-fd-border/50">
                    <p className="text-sm text-fd-muted-foreground mb-2">Total Pembayaran</p>
                    <p className="font-bold text-4xl bg-gradient-to-r from-fd-primary to-fd-primary/70 bg-clip-text text-transparent">
                      {orderData.priceFormatted}
                    </p>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-gradient-to-br from-fd-card to-fd-accent/20 backdrop-blur-sm border border-fd-border rounded-2xl p-6 shadow-xl">
                <h3 className="font-bold mb-4">Yang Anda Dapatkan</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" strokeWidth={2.5} />
                    </div>
                    <p className="text-sm text-fd-muted-foreground">Aktivasi instan</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" strokeWidth={2.5} />
                    </div>
                    <p className="text-sm text-fd-muted-foreground">Support 24/7</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" strokeWidth={2.5} />
                    </div>
                    <p className="text-sm text-fd-muted-foreground">Dokumentasi lengkap</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" strokeWidth={2.5} />
                    </div>
                    <p className="text-sm text-fd-muted-foreground">99.9% uptime guarantee</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
