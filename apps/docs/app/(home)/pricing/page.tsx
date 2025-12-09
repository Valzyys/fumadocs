'use client';

import { CheckIcon, XIcon, SparklesIcon } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { buttonVariants } from '@/components/ui/button';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  priceNumeric: number;
  description: string;
  limit: number | string;
  expireDays: number | null;
  features: string[];
  notIncluded?: string[];
  popular?: boolean;
  cta: string;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 'Rp 5.000',
    priceNumeric: 5000,
    description: 'Perfect untuk developer yang baru memulai',
    limit: 1000,
    expireDays: 30,
    features: [
      '1.000 API requests per bulan',
      'Akses ke semua endpoint dasar',
      'Data member & jadwal',
      'Rate limit: 10 req/menit',
      'Email support',
      'Dokumentasi lengkap',
    ],
    notIncluded: [
      'Priority support',
      'Webhook notifications',
      'Custom integration',
    ],
    cta: 'Mulai Basic',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'Rp 15.000',
    priceNumeric: 15000,
    description: 'Untuk aplikasi dengan traffic menengah',
    limit: 5000,
    expireDays: 60,
    popular: true,
    features: [
      '5.000 API requests per 2 bulan',
      'Semua fitur Basic',
      'Rate limit: 30 req/menit',
      'Priority email support',
      'Akses webhook notifications',
      'Analytics dashboard',
      'Realtime livestream data',
    ],
    notIncluded: [
      'Custom SLA',
      'Dedicated support channel',
    ],
    cta: 'Pilih Premium',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Rp 50.000',
    priceNumeric: 50000,
    description: 'Solusi terbaik untuk aplikasi berskala besar',
    limit: 25000,
    expireDays: 152,
    features: [
      '25.000 API requests per 5 bulan',
      'Semua fitur Premium',
      'Rate limit: 100 req/menit',
      'Priority support 24/7',
      'Custom webhook events',
      'Advanced analytics',
      'Team collaboration tools',
      'API monitoring dashboard',
    ],
    cta: 'Pilih Enterprise',
  },
  {
    id: 'premium-plus',
    name: 'Premium Plus',
    price: 'Rp 150.000',
    priceNumeric: 150000,
    description: 'Unlimited access untuk kebutuhan maksimal',
    limit: 'Unlimited',
    expireDays: null,
    features: [
      'Unlimited API requests',
      'Akses selamanya (no expiry)',
      'Semua fitur Enterprise',
      'No rate limits',
      'Dedicated account manager',
      'Custom SLA guarantee',
      'White-label options',
      'Direct line support',
      'Early access to new features',
      'Custom integration assistance',
    ],
    cta: 'Pilih Premium Plus',
  },
];

const faqs = [
  {
    question: 'Bagaimana cara pembayaran?',
    answer: 'Pembayaran dapat dilakukan melalui transfer bank, e-wallet (GoPay, OVO, DANA), atau metode pembayaran lainnya. Hubungi kami untuk detail lebih lanjut.',
  },
  {
    question: 'Apakah bisa upgrade atau downgrade paket?',
    answer: 'Ya, Anda dapat upgrade atau downgrade paket kapan saja. Sisa limit dan waktu akan disesuaikan secara proporsional.',
  },
  {
    question: 'Apa yang terjadi jika limit habis?',
    answer: 'API akan mengembalikan error 429 (Too Many Requests). Anda dapat upgrade paket atau menunggu periode reset berikutnya.',
  },
  {
    question: 'Apakah ada refund policy?',
    answer: 'Kami menyediakan refund 100% dalam 7 hari pertama jika Anda tidak puas dengan layanan kami.',
  },
];

export default function Pricing() {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const router = useRouter();

  const handleSelectPlan = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setShowConfirmModal(true);
  };

  const handleConfirmPurchase = () => {
    if (!selectedPlan) return;

    // Generate unique order ID
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Prepare purchase data
    const purchaseData = {
      id: orderId,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      price: selectedPlan.priceNumeric,
      priceFormatted: selectedPlan.price,
      limit: selectedPlan.limit,
      expireDays: selectedPlan.expireDays,
      timestamp: new Date().toISOString(),
    };

    // Save to localStorage
    localStorage.setItem('pendingPurchase', JSON.stringify(purchaseData));

    // Close modal and redirect
    setShowConfirmModal(false);
    router.push('/confirm');
  };

  const handleCancelPurchase = () => {
    setShowConfirmModal(false);
    setSelectedPlan(null);
  };

  return (
    <main className="px-4 py-12 w-full max-w-[1400px] mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Pilih Paket yang Tepat untuk Anda
        </h1>
        <p className="text-lg text-fd-muted-foreground max-w-2xl mx-auto">
          Mulai dari Rp 5.000 untuk akses API JKT48Connect. Semua paket include dokumentasi lengkap dan support berkualitas.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16">
        {pricingPlans.map((plan) => (
          <PricingCard 
            key={plan.id} 
            {...plan} 
            onSelect={() => handleSelectPlan(plan)}
          />
        ))}
      </div>

      {/* Comparison Table */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          Perbandingan Fitur
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium">Fitur</th>
                {pricingPlans.map((plan) => (
                  <th key={plan.name} className="p-4 font-medium text-center">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4">API Requests</td>
                {pricingPlans.map((plan) => (
                  <td key={plan.name} className="p-4 text-center">
                    {typeof plan.limit === 'number' ? plan.limit.toLocaleString() : plan.limit}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4">Durasi</td>
                {pricingPlans.map((plan) => (
                  <td key={plan.name} className="p-4 text-center">
                    {plan.expireDays ? `${plan.expireDays} hari` : 'Selamanya'}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4">Rate Limit</td>
                <td className="p-4 text-center">10/min</td>
                <td className="p-4 text-center">30/min</td>
                <td className="p-4 text-center">100/min</td>
                <td className="p-4 text-center">Unlimited</td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Support</td>
                <td className="p-4 text-center">Email</td>
                <td className="p-4 text-center">Priority Email</td>
                <td className="p-4 text-center">24/7</td>
                <td className="p-4 text-center">Dedicated</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-dashed p-6 rounded-lg">
              <h3 className="font-medium mb-2">{faq.question}</h3>
              <p className="text-sm text-fd-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center border border-dashed p-8 rounded-lg bg-fd-accent/50">
        <h3 className="text-2xl font-bold mb-2">Masih Bingung Pilih Paket?</h3>
        <p className="text-fd-muted-foreground mb-6">
          Tim kami siap membantu Anda memilih paket yang sesuai dengan kebutuhan Anda.
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="https://wa.me/6285701479245"
            target="_blank"
            rel="noreferrer noopener"
            className={cn(
              buttonVariants({
                variant: 'default',
                size: 'lg',
              }),
            )}
          >
            Konsultasi Gratis
          </a>
          <a
            href="https://docs.jkt48connect.my.id"
            className={cn(
              buttonVariants({
                variant: 'outline',
                size: 'lg',
              }),
            )}
          >
            Lihat Dokumentasi
          </a>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedPlan && (
        <ConfirmationModal
          plan={selectedPlan}
          onConfirm={handleConfirmPurchase}
          onCancel={handleCancelPurchase}
        />
      )}
    </main>
  );
}

interface PricingCardProps extends PricingPlan {
  onSelect: () => void;
}

function PricingCard({
  name,
  price,
  description,
  limit,
  expireDays,
  features,
  notIncluded,
  popular,
  cta,
  onSelect,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        'relative border rounded-lg p-6 flex flex-col',
        popular
          ? 'border-fd-primary shadow-lg scale-105'
          : 'border-dashed hover:bg-fd-accent transition-all'
      )}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-fd-primary text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <SparklesIcon className="w-3 h-3" />
            Paling Populer
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">{name}</h3>
        <p className="text-sm text-fd-muted-foreground mb-4">{description}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">{price}</span>
        </div>
        <p className="text-xs text-fd-muted-foreground mt-1">
          {typeof limit === 'number' ? `${limit.toLocaleString()} requests` : limit} / 
          {expireDays ? ` ${expireDays} hari` : ' Selamanya'}
        </p>
      </div>

      <div className="flex-1 mb-6">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <CheckIcon className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
          {notIncluded?.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-fd-muted-foreground">
              <XIcon className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onSelect}
        className={cn(
          buttonVariants({
            variant: popular ? 'default' : 'outline',
            size: 'lg',
          }),
          'w-full'
        )}
      >
        {cta}
      </button>
    </div>
  );
}

interface ConfirmationModalProps {
  plan: PricingPlan;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationModal({ plan, onConfirm, onCancel }: ConfirmationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-fd-background border rounded-lg p-6 max-w-md w-full shadow-xl">
        <h3 className="text-2xl font-bold mb-4">Konfirmasi Pembelian</h3>
        
        <div className="mb-6 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-fd-muted-foreground">Paket</span>
            <span className="font-medium">{plan.name}</span>
          </div>
          
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-fd-muted-foreground">Harga</span>
            <span className="font-bold text-lg">{plan.price}</span>
          </div>
          
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-fd-muted-foreground">API Requests</span>
            <span className="font-medium">
              {typeof plan.limit === 'number' ? plan.limit.toLocaleString() : plan.limit}
            </span>
          </div>
          
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-fd-muted-foreground">Durasi</span>
            <span className="font-medium">
              {plan.expireDays ? `${plan.expireDays} hari` : 'Selamanya'}
            </span>
          </div>
        </div>

        <div className="bg-fd-accent/50 p-4 rounded-lg mb-6">
          <p className="text-sm text-fd-muted-foreground">
            Anda akan diarahkan ke halaman konfirmasi untuk melanjutkan proses pembayaran.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className={cn(
              buttonVariants({
                variant: 'outline',
                size: 'lg',
              }),
              'flex-1'
            )}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              buttonVariants({
                variant: 'default',
                size: 'lg',
              }),
              'flex-1'
            )}
          >
            Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}
