'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  QrCodeIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  AlertCircleIcon,
  CopyIcon,
  CheckIcon,
  ShieldCheckIcon,
  RefreshCwIcon,
  LoaderIcon
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonVariants } from '@/components/ui/button';

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
  uniqueAmount?: number; // Jumlah dengan fee unik
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
  const router = useRouter();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [qrisData, setQrisData] = useState<QRISResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedQRIS, setCopiedQRIS] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900);
  const [isExpired, setIsExpired] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<PaymentSuccess | null>(null);
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(null);

  // Generate fee unik (1-999)
  const generateUniqueFee = (): number => {
    return Math.floor(Math.random() * 999) + 1;
  };

  useEffect(() => {
    const storedData = localStorage.getItem('orderData');
    if (storedData) {
      const data = JSON.parse(storedData);
      
      // Generate unique fee jika belum ada
      if (!data.uniqueAmount) {
        const uniqueFee = generateUniqueFee();
        data.uniqueAmount = data.price + uniqueFee;
        localStorage.setItem('orderData', JSON.stringify(data));
      }
      
      setOrderData(data);
      generateQRIS(data.uniqueAmount);
    } else {
      router.push('/pricing');
    }
  }, [router]);

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

  // Auto-check payment setiap 10 detik
  useEffect(() => {
    if (orderData && !isExpired && !paymentSuccess) {
      const interval = setInterval(() => {
        checkPayment();
      }, 10000); // Check setiap 10 detik

      setCheckInterval(interval);

      return () => clearInterval(interval);
    }
  }, [orderData, isExpired, paymentSuccess]);

  const generateQRIS = async (amount: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const qrisCode = '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214149391352933240303UMI51440014ID.CO.QRIS.WWW0215ID20233077025890303UMI5204541153033605802ID5919VALZSTORE%20OK14535636006SERANG61054211162070703A016304DCD2';
      
      const response = await fetch(
        `https://api.jkt48connect.my.id/api/orkut/createpayment?amount=${amount}&qris=${qrisCode}&api_key=JKTCONNECT`
      );

      if (!response.ok) {
        throw new Error('Gagal generate QRIS');
      }

      const data: QRISResponse = await response.json();
      setQrisData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const checkPayment = async () => {
    if (!orderData || isChecking) return;

    setIsChecking(true);

    try {
      // Get mutation data
      const response = await fetch(
        'https://api-simplebot.vercel.app/orderkuota/mutasiqr?apikey=ubot&username=valzhost&token=1453563%3APegBGy3NOkz69pZJdohTWMFiI1qsLRVH'
      );

      if (!response.ok) {
        throw new Error('Gagal mengecek pembayaran');
      }

      const data = await response.json();

      if (data.status && data.result && Array.isArray(data.result)) {
        const now = new Date();
        const currentDate = formatDateForComparison(now);

        // Filter transaksi masuk (IN) dengan tanggal yang sesuai
        const incomingTransactions = data.result.filter((transaction: MutationData) => {
          if (transaction.status !== 'IN') return false;

          const transactionDate = parseTransactionDate(transaction.tanggal);
          const transactionDateStr = formatDateForComparison(transactionDate);

          // Cek apakah tanggal dan jam sesuai (toleransi 5 menit)
          const timeDiff = Math.abs(now.getTime() - transactionDate.getTime()) / 1000 / 60;
          return transactionDateStr === currentDate && timeDiff <= 5;
        });

        // Cek apakah ada transaksi dengan nominal unik yang sesuai
        const matchedTransaction = incomingTransactions.find((transaction: MutationData) => {
          const amount = parseFloat(transaction.kredit.replace(/\./g, ''));
          return amount === orderData.uniqueAmount;
        });

        if (matchedTransaction) {
          // Pembayaran ditemukan, buat API key
          await createAPIKey(matchedTransaction);
        }
      }
    } catch (err) {
      console.error('Error checking payment:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const parseTransactionDate = (dateStr: string): Date => {
    // Format: "04/12/2025 18:56"
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

  const createAPIKey = async (transaction: MutationData) => {
    try {
      // Tentukan type berdasarkan plan
      let planType = 'basic';
      if (orderData?.planName.toLowerCase().includes('premium')) {
        planType = 'premium';
      } else if (orderData?.planName.toLowerCase().includes('enterprise')) {
        planType = 'enterprise';
      }

      const createKeyResponse = await fetch(
        `https://v2.jkt48connect.com/api/admin/create-key?username=vzy&password=vzy&owner=${encodeURIComponent(orderData!.customerName)}&email=${encodeURIComponent(orderData!.customerEmail)}&type=${planType}&apikey=${encodeURIComponent(orderData!.apiKey)}`
      );

      if (!createKeyResponse.ok) {
        throw new Error('Gagal membuat API key');
      }

      const keyData = await createKeyResponse.json();

      if (keyData.status) {
        // Stop checking
        if (checkInterval) {
          clearInterval(checkInterval);
        }

        // Set payment success data
        setPaymentSuccess({
          amount: transaction.kredit,
          from: transaction.brand.name,
          logo: transaction.brand.logo,
          description: transaction.keterangan,
          date: transaction.tanggal,
          originalAmount: orderData!.price,
          uniqueFee: orderData!.uniqueAmount! - orderData!.price
        });

        // Update order data di localStorage
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedQRIS(true);
      setTimeout(() => setCopiedQRIS(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRefreshQRIS = () => {
    if (orderData) {
      // Generate fee baru
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

  // Success Page
  if (paymentSuccess) {
    return (
      <main className="px-4 py-12 w-full max-w-[800px] mx-auto">
        <div className="border rounded-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold mb-2">Pembayaran Berhasil!</h1>
          <p className="text-fd-muted-foreground mb-8">
            Terima kasih, pembayaran Anda telah dikonfirmasi
          </p>

          <div className="bg-fd-accent/50 rounded-lg p-6 mb-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-fd-muted-foreground">Dibayar dari</span>
              <div className="flex items-center gap-2">
                <img src={paymentSuccess.logo} alt={paymentSuccess.from} className="w-6 h-6" />
                <span className="font-bold">{paymentSuccess.from}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-fd-muted-foreground">Keterangan</span>
              <span className="font-medium">{paymentSuccess.description}</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-fd-muted-foreground">Tanggal</span>
              <span className="font-medium">{paymentSuccess.date}</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-fd-muted-foreground">Harga Paket</span>
              <span className="font-medium">
                Rp {paymentSuccess.originalAmount.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-fd-muted-foreground">Kode Unik</span>
              <span className="font-medium text-fd-primary">
                Rp {paymentSuccess.uniqueFee.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-fd-muted-foreground font-medium">Total Dibayar</span>
              <span className="font-bold text-2xl text-fd-primary">
                Rp {parseInt(paymentSuccess.amount.replace(/\./g, '')).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              <strong>API Key Anda telah dikirim ke email:</strong><br />
              {orderData?.customerEmail}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className={cn(
                buttonVariants({
                  variant: 'default',
                  size: 'lg',
                }),
                'w-full'
              )}
            >
              Ke Dashboard
            </button>
            <button
              onClick={() => router.push('/')}
              className={cn(
                buttonVariants({
                  variant: 'outline',
                  size: 'lg',
                }),
                'w-full'
              )}
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fd-primary mx-auto mb-4"></div>
          <p className="text-fd-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="px-4 py-12 w-full max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/confirm')}
          className="text-fd-muted-foreground hover:text-fd-foreground transition-colors flex items-center gap-2 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali
        </button>
        <h1 className="text-4xl font-bold mb-2">Pembayaran</h1>
        <p className="text-fd-muted-foreground">
          Scan QRIS di bawah untuk menyelesaikan pembayaran
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Payment Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timer & Status */}
          <div className={cn(
            "border rounded-lg p-6",
            isExpired ? "border-red-500 bg-red-50" : "border-dashed"
          )}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClockIcon className={cn(
                  "w-5 h-5",
                  isExpired ? "text-red-500" : "text-fd-primary"
                )} />
                <span className="font-medium">
                  {isExpired ? "QRIS Expired" : "Waktu Pembayaran"}
                </span>
              </div>
              <div className={cn(
                "text-2xl font-bold font-mono",
                isExpired ? "text-red-500" : "text-fd-primary"
              )}>
                {isExpired ? "00:00" : formatTime(timeLeft)}
              </div>
            </div>
            {isExpired && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-600">QRIS telah expired, silakan generate ulang</p>
                <button
                  onClick={handleRefreshQRIS}
                  className={cn(
                    buttonVariants({
                      variant: 'default',
                      size: 'sm',
                    })
                  )}
                >
                  <RefreshCwIcon className="w-4 h-4 mr-2" />
                  Generate Ulang
                </button>
              </div>
            )}
            {isChecking && (
              <div className="flex items-center gap-2 text-sm text-fd-primary">
                <LoaderIcon className="w-4 h-4 animate-spin" />
                <span>Mengecek pembayaran...</span>
              </div>
            )}
          </div>

          {/* QRIS Section */}
          <div className="border border-dashed rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <QrCodeIcon className="w-5 h-5 text-fd-primary" />
              <h2 className="text-xl font-bold">Scan QRIS</h2>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fd-primary mb-4"></div>
                <p className="text-fd-muted-foreground">Generating QRIS...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircleIcon className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={() => generateQRIS(orderData.uniqueAmount || orderData.price)}
                  className={cn(
                    buttonVariants({
                      variant: 'outline',
                      size: 'sm',
                    })
                  )}
                >
                  Coba Lagi
                </button>
              </div>
            ) : qrisData ? (
              <div className="space-y-6">
                {/* QR Code Image */}
                <div className="flex justify-center">
                  <div className="relative border-4 border-fd-primary rounded-lg p-4 bg-white">
                    <img
                      src={qrisData.qrImageUrl}
                      alt="QRIS Code"
                      className="w-64 h-64 object-contain"
                    />
                    {isExpired && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                        <p className="text-white font-bold">EXPIRED</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount Info with Unique Fee */}
                <div className="bg-fd-primary/5 border border-fd-primary/20 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-fd-muted-foreground">Harga Paket</span>
                      <span className="font-medium">Rp {orderData.price.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-fd-muted-foreground">Kode Unik</span>
                      <span className="font-medium text-fd-primary">
                        Rp {(orderData.uniqueAmount! - orderData.price).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between items-center">
                      <span className="font-bold">Total Pembayaran</span>
                      <span className="font-bold text-xl text-fd-primary">
                        Rp {orderData.uniqueAmount!.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-fd-muted-foreground mt-3">
                    💡 Kode unik membantu sistem mengidentifikasi pembayaran Anda secara otomatis
                  </p>
                </div>

                {/* Payment Instructions */}
                <div className="bg-fd-accent/50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">Cara Pembayaran:</h3>
                  <ol className="space-y-2 text-sm text-fd-muted-foreground">
                    <li className="flex gap-2">
                      <span className="font-bold text-fd-primary">1.</span>
                      <span>Buka aplikasi e-wallet atau mobile banking Anda</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-fd-primary">2.</span>
                      <span>Pilih menu scan QRIS atau QR Code</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-fd-primary">3.</span>
                      <span>Scan kode QR di atas atau paste kode QRIS manual</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-fd-primary">4.</span>
                      <span>Pastikan nominal sesuai dengan total pembayaran</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-fd-primary">5.</span>
                      <span>Konfirmasi pembayaran</span>
                    </li>
                  </ol>
                </div>

                {/* Confirm Payment Button */}
                <button
                  onClick={handleConfirmPayment}
                  className={cn(
                    buttonVariants({
                      variant: 'default',
                      size: 'lg',
                    }),
                    'w-full'
                  )}
                  disabled={isExpired || isChecking}
                >
                  {isChecking ? (
                    <>
                      <LoaderIcon className="w-5 h-5 mr-2 animate-spin" />
                      Mengecek Pembayaran...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      Saya Sudah Bayar
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-fd-muted-foreground">
                  Sistem akan otomatis mengecek pembayaran setiap 10 detik
                </p>
              </div>
            ) : null}
          </div>

          {/* Security Notice */}
          <div className="border border-fd-primary/30 rounded-lg p-6 bg-fd-primary/5">
            <div className="flex items-start gap-3">
              <ShieldCheckIcon className="w-6 h-6 text-fd-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold mb-2">Pembayaran Aman</h3>
                <ul className="text-sm text-fd-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-fd-primary"></div>
                    QRIS dilindungi enkripsi standar Bank Indonesia
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-fd-primary"></div>
                    API Key otomatis dikirim ke email setelah pembayaran terverifikasi
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-fd-primary"></div>
                    Verifikasi otomatis menggunakan sistem real-time
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="border border-dashed rounded-lg p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Detail Pesanan</h2>
            
            <div className="space-y-4 mb-6">
              <div className="pb-3 border-b">
                <p className="text-sm text-fd-muted-foreground mb-1">Order ID</p>
                <p className="font-mono text-xs break-all">{orderData.id}</p>
              </div>

              <div className="pb-3 border-b">
                <p className="text-sm text-fd-muted-foreground mb-1">Paket</p>
                <p className="font-bold">{orderData.planName}</p>
              </div>

              <div className="pb-3 border-b">
                <p className="text-sm text-fd-muted-foreground mb-1">Nama</p>
                <p className="font-medium">{orderData.customerName}</p>
              </div>

              <div className="pb-3 border-b">
                <p className="text-sm text-fd-muted-foreground mb-1">Email</p>
                <p className="font-medium text-sm break-all">{orderData.customerEmail}</p>
              </div>

              <div className="pb-3 border-b">
                <p className="text-sm text-fd-muted-foreground mb-1">API Key</p>
                <p className="font-mono text-xs break-all">{orderData.apiKey}</p>
              </div>

              <div className="pb-3 border-b">
                <p className="text-sm text-fd-muted-foreground mb-1">Limit</p>
                <p className="font-medium">
                  {typeof orderData.limit === 'number' 
                    ? orderData.limit.toLocaleString() + ' requests'
                    : orderData.limit}
                </p>
              </div>

              <div className="pb-3 border-b">
                <p className="text-sm text-fd-muted-foreground mb-1">Durasi</p>
                <p className="font-medium">
                  {orderData.expireDays ? `${orderData.expireDays} hari` : 'Selamanya'}
                </p>
              </div>

              <div className="pt-2">
                <p className="text-sm text-fd-muted-foreground mb-1">Total</p>
                <p className="font-bold text-3xl text-fd-primary">{orderData.priceFormatted}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                <span>Aktivasi otomatis</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                <span>Support 24/7</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                <span>Dokumentasi lengkap</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
