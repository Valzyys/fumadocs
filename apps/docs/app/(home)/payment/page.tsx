'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon, AlertCircleIcon, ShieldCheckIcon, MailIcon, UserIcon, KeyIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonVariants } from '@/components/ui/button';

interface PurchaseData {
  id: string;
  planId: string;
  planName: string;
  price: number;
  priceFormatted: string;
  limit: number | string;
  expireDays: number | null;
  timestamp: string;
}

interface FormData {
  name: string;
  email: string;
  customApiKey: string;
}

export default function ConfirmPage() {
  const router = useRouter();
  const [purchaseData, setPurchaseData] = useState<PurchaseData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    customApiKey: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load purchase data from localStorage
    const storedData = localStorage.getItem('pendingPurchase');
    if (storedData) {
      setPurchaseData(JSON.parse(storedData));
    } else {
      // Redirect back to pricing if no data
      router.push('/pricing');
    }
  }, [router]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nama minimal 3 karakter';
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    // Validate custom API key (optional but must follow format if provided)
    if (formData.customApiKey.trim()) {
      if (formData.customApiKey.trim().length < 8) {
        newErrors.customApiKey = 'API Key minimal 8 karakter';
      } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.customApiKey)) {
        newErrors.customApiKey = 'API Key hanya boleh berisi huruf, angka, underscore, dan dash';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !purchaseData) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate API key if not provided
    const apiKey = formData.customApiKey.trim() || 
      `jkt48_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save complete order data
    const orderData = {
      ...purchaseData,
      customerName: formData.name.trim(),
      customerEmail: formData.email.trim(),
      apiKey: apiKey,
      status: 'pending_payment',
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem('orderData', JSON.stringify(orderData));
    localStorage.removeItem('pendingPurchase');

    setIsSubmitting(false);

    // Redirect to payment page
    router.push('/payment');
  };

  if (!purchaseData) {
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
      <div className="mb-8">
        <button
          onClick={() => router.push('/pricing')}
          className="text-fd-muted-foreground hover:text-fd-foreground transition-colors flex items-center gap-2 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Pricing
        </button>
        <h1 className="text-4xl font-bold mb-2">Konfirmasi Pesanan</h1>
        <p className="text-fd-muted-foreground">
          Lengkapi informasi di bawah untuk melanjutkan ke pembayaran
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Order Summary - Sidebar */}
        <div className="lg:col-span-1">
          <div className="border border-dashed rounded-lg p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Ringkasan Pesanan</h2>
            
            <div className="space-y-4 mb-6">
              <div className="pb-3 border-b">
                <p className="text-sm text-fd-muted-foreground mb-1">Paket</p>
                <p className="font-bold text-lg">{purchaseData.planName}</p>
              </div>

              <div className="pb-3 border-b">
                <p className="text-sm text-fd-muted-foreground mb-1">API Requests</p>
                <p className="font-medium">
                  {typeof purchaseData.limit === 'number' 
                    ? purchaseData.limit.toLocaleString() 
                    : purchaseData.limit}
                </p>
              </div>

              <div className="pb-3 border-b">
                <p className="text-sm text-fd-muted-foreground mb-1">Durasi Aktif</p>
                <p className="font-medium">
                  {purchaseData.expireDays ? `${purchaseData.expireDays} hari` : 'Selamanya'}
                </p>
              </div>

              <div className="pt-2">
                <p className="text-sm text-fd-muted-foreground mb-1">Total Pembayaran</p>
                <p className="font-bold text-3xl text-fd-primary">{purchaseData.priceFormatted}</p>
              </div>
            </div>

            <div className="bg-fd-accent/50 p-4 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <CheckIcon className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <p className="text-sm">API Key akan dikirim ke email</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckIcon className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <p className="text-sm">Aktivasi otomatis setelah pembayaran</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckIcon className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <p className="text-sm">Dokumentasi lengkap tersedia</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form - Main Content */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information Section */}
            <div className="border border-dashed rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <UserIcon className="w-5 h-5 text-fd-primary" />
                <h2 className="text-xl font-bold">Informasi Pelanggan</h2>
              </div>

              <div className="space-y-4">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fd-primary transition-all",
                      errors.name 
                        ? "border-red-500 focus:ring-red-500" 
                        : "border-fd-border"
                    )}
                    placeholder="Masukkan nama lengkap Anda"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircleIcon className="w-4 h-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Aktif <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-fd-muted-foreground" />
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={cn(
                        "w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fd-primary transition-all",
                        errors.email 
                          ? "border-red-500 focus:ring-red-500" 
                          : "border-fd-border"
                      )}
                      placeholder="email@example.com"
                    />
                  </div>
                  {errors.email ? (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircleIcon className="w-4 h-4" />
                      {errors.email}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-fd-muted-foreground">
                      API Key dan invoice akan dikirim ke email ini setelah pembayaran tervalidasi
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* API Configuration Section */}
            <div className="border border-dashed rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <KeyIcon className="w-5 h-5 text-fd-primary" />
                <h2 className="text-xl font-bold">Konfigurasi API</h2>
              </div>

              <div>
                <label htmlFor="customApiKey" className="block text-sm font-medium mb-2">
                  Custom API Key <span className="text-fd-muted-foreground">(Opsional)</span>
                </label>
                <input
                  type="text"
                  id="customApiKey"
                  value={formData.customApiKey}
                  onChange={(e) => handleInputChange('customApiKey', e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fd-primary transition-all font-mono text-sm",
                    errors.customApiKey 
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-fd-border"
                  )}
                  placeholder="my_custom_api_key_2024"
                />
                {errors.customApiKey ? (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircleIcon className="w-4 h-4" />
                    {errors.customApiKey}
                  </p>
                ) : (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-fd-muted-foreground">
                      Kosongkan untuk generate API Key otomatis
                    </p>
                    <p className="text-xs text-fd-muted-foreground">
                      Format: minimal 8 karakter, hanya huruf, angka, underscore (_), dan dash (-)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Security Notice */}
            <div className="border border-fd-primary/30 rounded-lg p-6 bg-fd-primary/5">
              <div className="flex items-start gap-3">
                <ShieldCheckIcon className="w-6 h-6 text-fd-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold mb-2">Keamanan Data Terjamin</h3>
                  <p className="text-sm text-fd-muted-foreground mb-3">
                    Informasi Anda dienkripsi dan dilindungi sesuai standar keamanan industri. 
                    Kami tidak akan membagikan data Anda kepada pihak ketiga.
                  </p>
                  <ul className="text-sm text-fd-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-fd-primary"></div>
                      Email hanya digunakan untuk pengiriman API Key dan notifikasi
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-fd-primary"></div>
                      API Key dapat diubah kapan saja melalui dashboard
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/pricing')}
                className={cn(
                  buttonVariants({
                    variant: 'outline',
                    size: 'lg',
                  }),
                  'flex-1'
                )}
                disabled={isSubmitting}
              >
                Kembali
              </button>
              <button
                type="submit"
                className={cn(
                  buttonVariants({
                    variant: 'default',
                    size: 'lg',
                  }),
                  'flex-1',
                  isSubmitting && 'opacity-50 cursor-not-allowed'
                )}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Memproses...
                  </span>
                ) : (
                  'Lanjut ke Pembayaran'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
