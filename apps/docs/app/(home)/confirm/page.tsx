'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, AlertCircle, ShieldCheck, Mail, User, Key, ArrowLeft, ArrowRight, Package, CreditCard } from 'lucide-react';
import { cn } from '@/lib/cn';
import LiquidGlass from 'liquid-glass-react';

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
    const storedData = localStorage.getItem('pendingPurchase');
    if (storedData) {
      setPurchaseData(JSON.parse(storedData));
    } else {
      router.push('/pricing');
    }
  }, [router]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nama minimal 3 karakter';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

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
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !purchaseData) return;

    setIsSubmitting(true);

    setTimeout(async () => {
      const apiKey = formData.customApiKey.trim() || 
        `jkt48_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
      router.push('/payment');
    }, 1500);
  };

  if (!purchaseData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-fd-background via-fd-background to-fd-accent/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fd-primary mx-auto mb-4"></div>
          <p className="text-fd-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  const steps = [
    { number: 1, label: 'Pilih Paket', icon: Package, status: 'completed' },
    { number: 2, label: 'Konfirmasi', icon: User, status: 'current' },
    { number: 3, label: 'Pembayaran', icon: CreditCard, status: 'upcoming' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-fd-background via-fd-background to-fd-accent/20">
      <main className="px-4 py-8 w-full max-w-[1400px] mx-auto">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-8 left-0 right-0 h-0.5 bg-fd-border/50" style={{ left: '5%', right: '5%' }}>
                <div className="absolute inset-0 bg-fd-primary" style={{ width: '50%' }}></div>
              </div>

              {/* Steps */}
              <div className="relative flex justify-between items-start">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.number} className="flex flex-col items-center" style={{ width: '33.33%' }}>
                      <div
                        className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all duration-300 relative z-10",
                          step.status === 'completed' && "bg-fd-primary text-white shadow-lg shadow-fd-primary/30",
                          step.status === 'current' && "bg-fd-primary text-white shadow-lg shadow-fd-primary/50 ring-4 ring-fd-primary/20",
                          step.status === 'upcoming' && "bg-fd-card border-2 border-fd-border text-fd-muted-foreground"
                        )}
                      >
                        {step.status === 'completed' ? (
                          <Check className="w-7 h-7" strokeWidth={3} />
                        ) : (
                          <Icon className="w-7 h-7" />
                        )}
                      </div>
                      <div className="text-center">
                        <p className={cn(
                          "text-sm font-semibold mb-1",
                          step.status === 'current' && "text-fd-primary",
                          step.status === 'upcoming' && "text-fd-muted-foreground"
                        )}>
                          Step {step.number}
                        </p>
                        <p className={cn(
                          "text-xs sm:text-sm font-medium",
                          step.status === 'current' && "text-fd-foreground",
                          step.status === 'upcoming' && "text-fd-muted-foreground"
                        )}>
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
            Konfirmasi Pesanan
          </h1>
          <p className="text-fd-muted-foreground text-lg">
            Lengkapi informasi untuk melanjutkan ke pembayaran
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Order Summary - Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-8">
              <div className="bg-gradient-to-br from-fd-card to-fd-accent/20 backdrop-blur-sm border border-fd-border rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-fd-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-fd-primary" />
                  </div>
                  <h2 className="text-xl font-bold">Ringkasan Pesanan</h2>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-fd-background/50 rounded-xl border border-fd-border/50">
                    <p className="text-xs text-fd-muted-foreground mb-2 uppercase tracking-wide">Paket</p>
                    <p className="font-bold text-xl">{purchaseData.planName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-fd-background/50 rounded-xl border border-fd-border/50">
                      <p className="text-xs text-fd-muted-foreground mb-2 uppercase tracking-wide">Requests</p>
                      <p className="font-semibold text-lg">
                        {typeof purchaseData.limit === 'number' 
                          ? purchaseData.limit.toLocaleString() 
                          : purchaseData.limit}
                      </p>
                    </div>

                    <div className="p-4 bg-fd-background/50 rounded-xl border border-fd-border/50">
                      <p className="text-xs text-fd-muted-foreground mb-2 uppercase tracking-wide">Durasi</p>
                      <p className="font-semibold text-lg">
                        {purchaseData.expireDays ? `${purchaseData.expireDays}h` : '∞'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-fd-border/50">
                    <p className="text-sm text-fd-muted-foreground mb-2">Total Pembayaran</p>
                    <p className="font-bold text-4xl bg-gradient-to-r from-fd-primary to-fd-primary/70 bg-clip-text text-transparent">
                      {purchaseData.priceFormatted}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-fd-border/50">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-600" strokeWidth={3} />
                    </div>
                    <p className="text-sm text-fd-muted-foreground">API Key dikirim otomatis ke email</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-600" strokeWidth={3} />
                    </div>
                    <p className="text-sm text-fd-muted-foreground">Aktivasi instan setelah pembayaran</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-600" strokeWidth={3} />
                    </div>
                    <p className="text-sm text-fd-muted-foreground">Dokumentasi lengkap tersedia</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form - Main Content */}
          <div className="lg:col-span-8">
            <div className="space-y-6">
              {/* Customer Information Section */}
              <div className="bg-fd-card backdrop-blur-sm border border-fd-border rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-fd-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-fd-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Informasi Pelanggan</h2>
                </div>

                <div className="space-y-5">
                  {/* Name Field */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold mb-2 text-fd-foreground">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={cn(
                        "w-full px-4 py-3.5 bg-fd-background border-2 rounded-xl focus:outline-none focus:ring-2 transition-all",
                        errors.name 
                          ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" 
                          : "border-fd-border focus:border-fd-primary focus:ring-fd-primary/20"
                      )}
                      placeholder="Masukkan nama lengkap Anda"
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-500 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold mb-2 text-fd-foreground">
                      Email Aktif <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-fd-muted-foreground" />
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={cn(
                          "w-full pl-12 pr-4 py-3.5 bg-fd-background border-2 rounded-xl focus:outline-none focus:ring-2 transition-all",
                          errors.email 
                            ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" 
                            : "border-fd-border focus:border-fd-primary focus:ring-fd-primary/20"
                        )}
                        placeholder="email@example.com"
                      />
                    </div>
                    {errors.email ? (
                      <p className="mt-2 text-sm text-red-500 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-fd-muted-foreground">
                        API Key dan invoice akan dikirim ke email ini
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* API Configuration Section */}
              <div className="bg-fd-card backdrop-blur-sm border border-fd-border rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-fd-primary/10 flex items-center justify-center">
                    <Key className="w-5 h-5 text-fd-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Konfigurasi API</h2>
                </div>

                <div>
                  <label htmlFor="customApiKey" className="block text-sm font-semibold mb-2 text-fd-foreground">
                    Custom API Key <span className="text-fd-muted-foreground font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    id="customApiKey"
                    value={formData.customApiKey}
                    onChange={(e) => handleInputChange('customApiKey', e.target.value)}
                    className={cn(
                      "w-full px-4 py-3.5 bg-fd-background border-2 rounded-xl focus:outline-none focus:ring-2 transition-all font-mono text-sm",
                      errors.customApiKey 
                        ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" 
                        : "border-fd-border focus:border-fd-primary focus:ring-fd-primary/20"
                    )}
                    placeholder="my_custom_api_key_2024"
                  />
                  {errors.customApiKey ? (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      {errors.customApiKey}
                    </p>
                  ) : (
                    <div className="mt-3 p-4 bg-fd-accent/30 rounded-xl space-y-1.5">
                      <p className="text-sm text-fd-muted-foreground">
                        💡 Kosongkan untuk generate API Key otomatis
                      </p>
                      <p className="text-xs text-fd-muted-foreground">
                        Format: minimal 8 karakter (huruf, angka, underscore, dash)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Notice */}
              <div className="relative overflow-hidden bg-gradient-to-br from-fd-primary/5 to-fd-primary/10 backdrop-blur-sm border-2 border-fd-primary/30 rounded-2xl p-6 sm:p-8">
                <div className="absolute top-0 right-0 w-32 h-32 bg-fd-primary/5 rounded-full blur-3xl"></div>
                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-fd-primary/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6 text-fd-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Keamanan Data Terjamin</h3>
                    <p className="text-sm text-fd-muted-foreground mb-4">
                      Informasi Anda dienkripsi dan dilindungi sesuai standar keamanan industri
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-fd-primary mt-2"></div>
                        <p className="text-sm text-fd-muted-foreground">
                          Email hanya untuk pengiriman API Key dan notifikasi
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-fd-primary mt-2"></div>
                        <p className="text-sm text-fd-muted-foreground">
                          API Key dapat diubah kapan saja melalui dashboard
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <LiquidGlass
                  displacementScale={50}
                  blurAmount={0.08}
                  saturation={120}
                  aberrationIntensity={1.5}
                  elasticity={0.3}
                  cornerRadius={12}
                  className="sm:flex-1"
                  onClick={() => !isSubmitting && router.push('/pricing')}
                >
                  <div className="flex items-center justify-center gap-2 px-8 py-4 font-semibold text-fd-foreground">
                    <ArrowLeft className="w-5 h-5" />
                    Kembali
                  </div>
                </LiquidGlass>

                <LiquidGlass
                  displacementScale={64}
                  blurAmount={0.1}
                  saturation={130}
                  aberrationIntensity={2}
                  elasticity={0.35}
                  cornerRadius={12}
                  className={cn(
                    "sm:flex-1",
                    isSubmitting && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={!isSubmitting ? handleSubmit : undefined}
                >
                  <div className="flex items-center justify-center gap-2 px-8 py-4 font-semibold text-white bg-fd-primary/90">
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Memproses...
                      </>
                    ) : (
                      <>
                        Lanjut ke Pembayaran
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </div>
                </LiquidGlass>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
