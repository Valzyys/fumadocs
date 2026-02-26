'use client';
import { useState, useEffect } from 'react';
import {
  CheckCircle, AlertCircle, ShieldCheck,
  RefreshCw, Loader, Check,
  Copy, Mail, Zap, Download, ArrowLeft, Plane
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
  brand: { name: string; logo: string };
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

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.tf  { font-family: 'Barlow Condensed', sans-serif !important; }
.mf  { font-family: 'IBM Plex Mono', monospace !important; }

.bp-card {
  background: var(--fd-card);
  border: 1.5px solid var(--fd-border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 32px rgba(0,0,0,.12), 0 1px 6px rgba(0,0,0,.06);
}

.tear {
  display: flex;
  align-items: center;
  position: relative;
  margin: 0 -1.5px;
}
.tear::before, .tear::after {
  content: '';
  width: 24px; height: 24px;
  border-radius: 50%;
  background: var(--fd-background);
  border: 1.5px solid var(--fd-border);
  flex-shrink: 0;
  z-index: 2;
  margin: 0 -12px;
}
.tear-inner {
  flex: 1;
  border-top: 2px dashed var(--fd-border);
  margin: 0 6px;
}

.lbl {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--fd-muted-foreground);
  margin: 0;
}
.val {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: var(--fd-foreground);
  margin: 0;
}
.val-mono {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: var(--fd-foreground);
  word-break: break-all;
  margin: 0;
}

.pp {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 100px;
  border: 1.5px solid var(--fd-border);
  background: var(--fd-card);
}

.stat {
  border: 1.5px dashed var(--fd-border);
  border-radius: 10px;
  padding: 10px 14px;
}

.qf {
  position: relative;
  display: inline-block;
  padding: 4px;
}
.qc {
  position: absolute;
  width: 20px; height: 20px;
  border-color: var(--fd-primary);
  border-style: solid;
}
.qc-tl { top: 0; left: 0;   border-width: 3px 0 0 3px; border-radius: 3px 0 0 0; }
.qc-tr { top: 0; right: 0;  border-width: 3px 3px 0 0; border-radius: 0 3px 0 0; }
.qc-bl { bottom: 0; left: 0;  border-width: 0 0 3px 3px; border-radius: 0 0 0 3px; }
.qc-br { bottom: 0; right: 0; border-width: 0 3px 3px 0; border-radius: 0 0 3px 0; }

.xov {
  position: absolute; inset: 0;
  background: rgba(0,0,0,.58);
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px;
}
.xstamp {
  border: 3px solid #ef4444;
  border-radius: 8px;
  padding: 6px 20px;
  transform: rotate(-18deg);
}

.cbtn {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 900; font-size: 16px;
  letter-spacing: .1em;
  text-transform: uppercase;
  border: none; cursor: pointer;
  background: var(--fd-primary); color: #fff;
  transition: opacity .18s;
}
.cbtn:hover:not(:disabled) { opacity: .84; }
.cbtn:disabled { background: var(--fd-border); color: var(--fd-muted-foreground); cursor: not-allowed; }

.step-c {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 900; font-size: 14px;
}
.step-l { flex: 1; height: 1.5px; background: var(--fd-border); margin: 0 6px; }
.step-l.done { background: var(--fd-primary); }

.bk { display: flex; gap: 2px; align-items: flex-end; justify-content: center; height: 44px; }
.bk span { display: block; background: var(--fd-foreground); border-radius: 1px; opacity: .6; }

.ok-stamp {
  position: absolute; top: 18px; right: 18px;
  width: 70px; height: 70px; border-radius: 50%;
  border: 3px solid #16a34a;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  transform: rotate(11deg);
}

.blink { animation: blink .85s ease-in-out infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }

.fup { animation: fup .4s ease-out both; }
@keyframes fup { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

.fup-d1 { animation: fup .4s .1s ease-out both; }
.fup-d2 { animation: fup .4s .2s ease-out both; }

.pulse-ok { animation: pok 2s ease-in-out infinite; }
@keyframes pok {
  0%,100% { box-shadow: 0 0 0 0 rgba(22,163,74,.35); }
  50%      { box-shadow: 0 0 0 12px rgba(22,163,74,0); }
}

@media (max-width: 900px) {
  .bp-grid { grid-template-columns: 1fr !important; }
}
`;

const Barcode = () => {
  const H = [40,48,36,48,32,44,48,36,40,32];
  const W = [2,1,3,1,2,3,1,2,1,3];
  return (
    <div className="bk" style={{width:'100%'}}>
      {Array.from({length:58},(_,i)=>(
        <span key={i} style={{height:H[i%10],width:W[i%10]}}/>
      ))}
    </div>
  );
};

export default function PaymentPage() {
  const [orderData,      setOrderData]      = useState<OrderData|null>(null);
  const [qrisData,       setQrisData]       = useState<QRISResponse|null>(null);
  const [isLoading,      setIsLoading]      = useState(true);
  const [error,          setError]          = useState<string|null>(null);
  const [timeLeft,       setTimeLeft]       = useState(900);
  const [isExpired,      setIsExpired]      = useState(false);
  const [isChecking,     setIsChecking]     = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<PaymentSuccess|null>(null);
  const [checkInterval,  setCheckInterval]  = useState<ReturnType<typeof setInterval>|null>(null);
  const [copied,         setCopied]         = useState(false);

  const genFee = () => Math.floor(Math.random()*999)+1;

  useEffect(()=>{
    const raw = localStorage.getItem('orderData');
    if (raw) {
      const d = JSON.parse(raw);
      if (!d.uniqueAmount) {
        d.uniqueAmount = d.price + genFee();
        localStorage.setItem('orderData', JSON.stringify(d));
      }
      setOrderData(d);
      generateQRIS(d.uniqueAmount);
    } else {
      setIsLoading(false);
    }
  },[]);

  useEffect(()=>{
    if (timeLeft <= 0) {
      setIsExpired(true);
      if (checkInterval) clearInterval(checkInterval);
      return;
    }
    const t = setInterval(()=>setTimeLeft(p=>p-1),1000);
    return ()=>clearInterval(t);
  },[timeLeft]);

  useEffect(()=>{
    if (orderData && !isExpired && !paymentSuccess) {
      const iv = setInterval(checkPayment, 10000);
      setCheckInterval(iv);
      return ()=>clearInterval(iv);
    }
  },[orderData, isExpired, paymentSuccess]);

  const generateQRIS = async (amount: number) => {
    setIsLoading(true); setError(null);
    try {
      const r = await fetch('/api/payment/generate-qris', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({amount}),
      });
      if (!r.ok) throw new Error('Gagal generate QRIS');
      const res = await r.json();
      if (res.status && res.data) setQrisData(res.data);
      else throw new Error(res.message || 'Gagal generate QRIS');
    } catch(e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const parseTxDate = (s: string): Date => {
    const [dp,tp] = s.split(' ');
    const [day,mon,yr] = dp.split('/');
    const [h,m] = tp.split(':');
    return new Date(+yr, +mon-1, +day, +h, +m);
  };

  const fmtCmp = (d: Date) =>
    `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}-${String(d.getHours()).padStart(2,'0')}`;

  const checkPayment = async () => {
    if (!orderData || isChecking) return;
    setIsChecking(true);
    try {
      const r = await fetch('/api/payment/check-mutation');
      if (!r.ok) throw new Error();
      const data = await r.json();
      if (data.status && Array.isArray(data.result)) {
        const now = new Date();
        const cur = fmtCmp(now);
        const matched = data.result.find((tx: MutationData) => {
          if (tx.status !== 'IN') return false;
          const td = parseTxDate(tx.tanggal);
          const diff = Math.abs(now.getTime()-td.getTime())/60000;
          return fmtCmp(td)===cur && diff<=30 && parseFloat(tx.kredit.replace(/\./g,''))===orderData.uniqueAmount;
        });
        if (matched) await createAPIKey(matched);
      }
    } catch(e) { console.error(e); }
    finally { setIsChecking(false); }
  };

  const createAPIKey = async (tx: MutationData) => {
    try {
      let planType = 'basic';
      if (orderData?.planName.toLowerCase().includes('premium'))       planType = 'premium';
      else if (orderData?.planName.toLowerCase().includes('enterprise')) planType = 'enterprise';
      const r = await fetch('/api/payment/create-key', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          owner:   orderData!.customerName,
          email:   orderData!.customerEmail,
          type:    planType,
          apikey:  orderData!.apiKey,
        }),
      });
      if (!r.ok) throw new Error();
      const kd = await r.json();
      if (kd.status) {
        if (checkInterval) clearInterval(checkInterval);
        setPaymentSuccess({
          amount:         tx.kredit,
          from:           tx.brand.name,
          logo:           tx.brand.logo,
          description:    tx.keterangan,
          date:           tx.tanggal,
          originalAmount: orderData!.price,
          uniqueFee:      orderData!.uniqueAmount! - orderData!.price,
        });
        localStorage.setItem('orderData', JSON.stringify({...orderData!, status:'paid', apiKeyData:kd.data}));
      }
    } catch(e) {
      console.error(e);
      alert('Pembayaran terdeteksi, namun terjadi kesalahan saat membuat API key. Silakan hubungi admin.');
    }
  };

  const fmtTime = (s: number) =>
    `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const refresh = () => {
    if (!orderData) return;
    const fee = genFee();
    const amt = orderData.price + fee;
    const upd = {...orderData, uniqueAmount: amt};
    setOrderData(upd);
    localStorage.setItem('orderData', JSON.stringify(upd));
    setIsExpired(false);
    setTimeLeft(900);
    generateQRIS(amt);
  };

  const handleCopy = () => {
    if (orderData?.apiKey) {
      navigator.clipboard.writeText(orderData.apiKey);
      setCopied(true);
      setTimeout(()=>setCopied(false), 2000);
    }
  };

  /* ══════════════════════════════════════════
     SUCCESS PAGE
  ══════════════════════════════════════════ */
  if (paymentSuccess) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'var(--fd-background)'}}>
        <style dangerouslySetInnerHTML={{__html: CSS}}/>
        <div style={{width:'100%',maxWidth:440}}>

          <div className="bp-card fup" style={{position:'relative'}}>

            {/* Stamp */}
            <div className="ok-stamp pulse-ok">
              <Check size={22} strokeWidth={3} style={{color:'#16a34a'}}/>
              <span className="tf" style={{fontWeight:900,fontSize:11,color:'#16a34a',marginTop:2}}>PAID</span>
            </div>

            {/* Header */}
            <div style={{padding:'24px 24px 16px',borderBottom:'1.5px solid var(--fd-border)'}}>
              <p className="lbl" style={{marginBottom:2}}>E-TICKET · KONFIRMASI</p>
              <h1 className="tf" style={{fontWeight:900,fontSize:30,margin:0,color:'var(--fd-foreground)'}}>PEMBAYARAN BERHASIL!</h1>
              <p className="tf" style={{fontSize:13,margin:'4px 0 0',color:'var(--fd-muted-foreground)'}}>
                Transaksi Anda telah berhasil dikonfirmasi
              </p>
            </div>

            {/* Route */}
            <div style={{padding:'14px 24px',borderBottom:'1.5px solid var(--fd-border)',display:'flex',alignItems:'center',gap:12}}>
              <div style={{textAlign:'center'}}>
                <div className="tf" style={{fontWeight:900,fontSize:24,lineHeight:1,color:'var(--fd-foreground)'}}>IDR</div>
                <div className="lbl">WALLET</div>
              </div>
              <div style={{flex:1,display:'flex',alignItems:'center',gap:6}}>
                <div style={{flex:1,borderTop:'1.5px dashed var(--fd-border)'}}/>
                <Plane size={15} style={{color:'var(--fd-primary)'}}/>
                <div style={{flex:1,borderTop:'1.5px dashed var(--fd-border)'}}/>
              </div>
              <div style={{textAlign:'center'}}>
                <div className="tf" style={{fontWeight:900,fontSize:24,lineHeight:1,color:'var(--fd-primary)'}}>API</div>
                <div className="lbl">ACCESS</div>
              </div>
              <div style={{marginLeft:'auto',paddingLeft:14,borderLeft:'1.5px dashed var(--fd-border)'}}>
                <div className="lbl">PENUMPANG</div>
                <div className="val">{orderData?.customerName}</div>
              </div>
            </div>

            {/* Transaction details */}
            <div style={{padding:'16px 24px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,borderBottom:'1.5px solid var(--fd-border)'}}>
              {[
                {l:'DIBAYAR DARI', v:paymentSuccess.from},
                {l:'TANGGAL',      v:paymentSuccess.date},
                {l:'HARGA PAKET',  v:`Rp ${paymentSuccess.originalAmount.toLocaleString('id-ID')}`},
                {l:'KODE UNIK',    v:`Rp ${paymentSuccess.uniqueFee.toLocaleString('id-ID')}`},
              ].map(({l,v})=>(
                <div key={l}>
                  <div className="lbl">{l}</div>
                  <div className="val" style={{marginTop:2}}>{v}</div>
                </div>
              ))}
              <div style={{gridColumn:'1/-1',paddingTop:10,borderTop:'1px dashed var(--fd-border)'}}>
                <div className="lbl">TOTAL DIBAYAR</div>
                <div className="tf" style={{fontWeight:900,fontSize:24,color:'var(--fd-primary)',marginTop:2}}>
                  Rp {parseInt(paymentSuccess.amount.replace(/\./g,'')).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* Email */}
            <div style={{padding:'14px 24px',borderBottom:'1.5px solid var(--fd-border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:10,background:'rgba(37,99,235,.06)',border:'1px solid rgba(37,99,235,.18)'}}>
                <Mail size={14} style={{color:'var(--fd-primary)',flexShrink:0}}/>
                <span className="tf" style={{fontSize:13,color:'var(--fd-primary)'}}>
                  API Key dikirim ke <strong>{orderData?.customerEmail}</strong>
                </span>
              </div>
            </div>

            {/* Tear */}
            <div className="tear"><div className="tear-inner"/></div>

            {/* Barcode */}
            <div style={{padding:'16px 24px 20px',display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
              <Barcode/>
              <div className="mf" style={{fontSize:10,letterSpacing:'.25em',color:'var(--fd-muted-foreground)'}}>
                {orderData?.id.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:14}} className="fup-d1">
            <button style={{padding:'12px',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:14,letterSpacing:'.08em',background:'var(--fd-card)',border:'1.5px solid var(--fd-border)',color:'var(--fd-foreground)',cursor:'pointer'}}>
              <ArrowLeft size={14}/> DASHBOARD
            </button>
            <button style={{padding:'12px',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:14,letterSpacing:'.08em',background:'var(--fd-primary)',border:'none',color:'#fff',cursor:'pointer'}}>
              <Download size={14}/> DOWNLOAD
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* No orderData */
  if (!orderData) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--fd-background)'}}>
        <style dangerouslySetInnerHTML={{__html: CSS}}/>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
          <Loader size={28} className="animate-spin" style={{color:'var(--fd-primary)'}}/>
          <span className="tf" style={{fontSize:14,letterSpacing:'.1em',color:'var(--fd-muted-foreground)'}}>MEMUAT DATA...</span>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     MAIN PAYMENT PAGE
  ══════════════════════════════════════════ */
  const timerRed = !isExpired && timeLeft <= 120;

  return (
    <div style={{minHeight:'100vh',background:'var(--fd-background)'}}>
      <style dangerouslySetInnerHTML={{__html: CSS}}/>

      <div style={{maxWidth:1080,margin:'0 auto',padding:'32px 16px'}}>

        {/* Progress steps */}
        <div style={{display:'flex',alignItems:'center',marginBottom:32}}>
          {[
            {n:1, l:'PILIH PAKET', done:true},
            {n:2, l:'KONFIRMASI',  done:true},
            {n:3, l:'PEMBAYARAN',  done:false},
          ].map((s,i)=>(
            <div key={s.n} style={{display:'flex',alignItems:'center',flex:i<2?1:'none'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div className="step-c" style={{
                  background: (s.done||i===2) ? 'var(--fd-primary)' : 'var(--fd-card)',
                  color:      (s.done||i===2) ? '#fff'               : 'var(--fd-muted-foreground)',
                  border:     (!s.done&&i!==2) ? '1.5px solid var(--fd-border)' : 'none',
                }}>
                  {s.done ? <Check size={14} strokeWidth={3}/> : s.n}
                </div>
                <span className="tf" style={{
                  fontWeight:700, fontSize:11, letterSpacing:'.16em',
                  color: i===2 ? 'var(--fd-foreground)' : s.done ? 'var(--fd-primary)' : 'var(--fd-muted-foreground)',
                }}>
                  {s.l}
                </span>
              </div>
              {i < 2 && <div className={`step-l${s.done?' done':''}`}/>}
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="bp-grid" style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:20,alignItems:'start'}}>

          {/* ══ LEFT: Main ticket ══ */}
          <div className="fup">
            <div className="bp-card">

              {/* Header */}
              <div style={{display:'flex',alignItems:'stretch',borderBottom:'1.5px solid var(--fd-border)'}}>
                <div style={{flex:1,padding:'20px 24px'}}>
                  <p className="lbl" style={{marginBottom:4}}>E-PAYMENT TICKET</p>
                  <h1 className="tf" style={{fontWeight:900,fontSize:34,margin:0,lineHeight:1,color:'var(--fd-foreground)'}}>PEMBAYARAN</h1>
                  <p className="tf" style={{fontSize:13,margin:'4px 0 0',color:'var(--fd-muted-foreground)'}}>
                    {orderData.planName.toUpperCase()} &middot; {orderData.id}
                  </p>
                </div>
                {/* Timer */}
                <div style={{padding:'16px 20px',borderLeft:'1.5px dashed var(--fd-border)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minWidth:108}}>
                  <span className="lbl" style={{marginBottom:4}}>{isExpired ? 'EXPIRED' : 'BOARDING'}</span>
                  <span
                    className={`mf${(timerRed||isExpired) ? ' blink' : ''}`}
                    style={{fontSize:26,fontWeight:600,color:isExpired ? '#ef4444' : timerRed ? '#ef4444' : 'var(--fd-foreground)'}}>
                    {isExpired ? '00:00' : fmtTime(timeLeft)}
                  </span>
                  {isExpired && (
                    <button onClick={refresh}
                      style={{marginTop:8,display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:8,background:'var(--fd-primary)',border:'none',cursor:'pointer',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,color:'#fff'}}>
                      <RefreshCw size={11}/> REFRESH
                    </button>
                  )}
                </div>
              </div>

              {/* Flight row */}
              <div style={{padding:'14px 24px',borderBottom:'1.5px solid var(--fd-border)',display:'flex',alignItems:'center',gap:12}}>
                <div style={{textAlign:'center'}}>
                  <div className="tf" style={{fontWeight:900,fontSize:26,lineHeight:1,color:'var(--fd-foreground)'}}>IDR</div>
                  <div className="lbl">WALLET</div>
                </div>
                <div style={{flex:1,display:'flex',alignItems:'center',gap:6}}>
                  <div style={{flex:1,borderTop:'1.5px dashed var(--fd-border)'}}/>
                  <Plane size={16} style={{color:'var(--fd-primary)'}}/>
                  <div style={{flex:1,borderTop:'1.5px dashed var(--fd-border)'}}/>
                </div>
                <div style={{textAlign:'center'}}>
                  <div className="tf" style={{fontWeight:900,fontSize:26,lineHeight:1,color:'var(--fd-primary)'}}>API</div>
                  <div className="lbl">ACCESS</div>
                </div>
                <div style={{marginLeft:'auto',paddingLeft:14,borderLeft:'1.5px dashed var(--fd-border)'}}>
                  <div className="lbl">PENUMPANG</div>
                  <div className="tf" style={{fontWeight:700,fontSize:15,color:'var(--fd-foreground)',marginTop:2}}>{orderData.customerName}</div>
                </div>
              </div>

              {/* QR zone */}
              <div style={{padding:'24px',display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>

                {isLoading && (
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:'32px 0'}}>
                    <Loader size={28} className="animate-spin" style={{color:'var(--fd-primary)'}}/>
                    <span className="lbl" style={{letterSpacing:'.2em'}}>GENERATING QRIS...</span>
                  </div>
                )}

                {!isLoading && error && (
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:'24px 0'}}>
                    <AlertCircle size={28} style={{color:'#ef4444'}}/>
                    <span className="tf" style={{fontWeight:700,color:'#ef4444'}}>{error}</span>
                    <button
                      onClick={()=>generateQRIS(orderData.uniqueAmount||orderData.price)}
                      style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:10,background:'var(--fd-card)',border:'1.5px solid var(--fd-border)',cursor:'pointer',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:14,color:'var(--fd-foreground)'}}>
                      <RefreshCw size={13}/> COBA LAGI
                    </button>
                  </div>
                )}

                {!isLoading && !error && qrisData && (
                  <>
                    <span className="lbl" style={{letterSpacing:'.2em'}}>SCAN QRIS UNTUK MEMBAYAR</span>

                    <div className="qf">
                      <div className="qc qc-tl"/>
                      <div className="qc qc-tr"/>
                      <div className="qc qc-bl"/>
                      <div className="qc qc-br"/>
                      {isExpired && (
                        <div className="xov">
                          <div className="xstamp">
                            <span className="tf" style={{fontWeight:900,fontSize:22,letterSpacing:'.1em',color:'#ef4444'}}>EXPIRED</span>
                          </div>
                        </div>
                      )}
                      <img
                        src={qrisData.qrImageUrl}
                        alt="QRIS"
                        style={{width:210,height:210,display:'block',borderRadius:8,opacity:isExpired ? .35 : 1}}
                      />
                    </div>

                    <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',justifyContent:'center'}}>
                      <div className="pp">
                        <span className="lbl">PAKET</span>
                        <span className="tf" style={{fontWeight:800,fontSize:14,color:'var(--fd-foreground)'}}>
                          Rp {orderData.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <span className="tf" style={{fontWeight:700,fontSize:16,color:'var(--fd-muted-foreground)'}}>+</span>
                      <div className="pp">
                        <span className="lbl">UNIK</span>
                        <span className="tf" style={{fontWeight:800,fontSize:14,color:'var(--fd-foreground)'}}>
                          Rp {(orderData.uniqueAmount!-orderData.price).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <span className="tf" style={{fontWeight:700,fontSize:16,color:'var(--fd-muted-foreground)'}}>=</span>
                      <div className="pp" style={{borderColor:'var(--fd-primary)',borderWidth:2}}>
                        <span className="tf" style={{fontWeight:900,fontSize:16,color:'var(--fd-primary)'}}>
                          Rp {orderData.uniqueAmount!.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <p className="tf" style={{fontSize:12,margin:0,color:'var(--fd-muted-foreground)',textAlign:'center',maxWidth:280}}>
                      Kode unik membantu sistem mengidentifikasi pembayaran Anda secara otomatis
                    </p>
                  </>
                )}
              </div>

              {/* Tear */}
              <div className="tear"><div className="tear-inner"/></div>

              {/* Instructions */}
              <div style={{padding:'20px 24px'}}>
                <p className="lbl" style={{marginBottom:10}}>CARA PEMBAYARAN</p>
                {[
                  'Buka e-wallet atau mobile banking Anda',
                  'Pilih menu Scan QRIS atau QR Code',
                  'Scan kode QR di atas dengan kamera',
                  'Pastikan nominal sesuai total pembayaran',
                  'Konfirmasi dan tunggu notifikasi',
                ].map((txt,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'7px 0',borderBottom:i<4?'1px dashed var(--fd-border)':'none'}}>
                    <span className="tf" style={{fontWeight:900,fontSize:11,width:20,height:20,minWidth:20,borderRadius:'50%',background:'var(--fd-primary)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',marginTop:1}}>
                      {i+1}
                    </span>
                    <span className="tf" style={{fontSize:14,color:'var(--fd-foreground)'}}>{txt}</span>
                  </div>
                ))}
              </div>

              {/* Barcode + button */}
              <div style={{padding:'0 24px 24px',display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
                <Barcode/>
                <div className="mf" style={{fontSize:10,letterSpacing:'.22em',color:'var(--fd-muted-foreground)'}}>
                  {orderData.id.toUpperCase()}
                </div>

                {isChecking && (
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <Loader size={13} className="animate-spin" style={{color:'var(--fd-primary)'}}/>
                    <span className="lbl">MENGECEK PEMBAYARAN...</span>
                  </div>
                )}

                <button className="cbtn" onClick={()=>checkPayment()} disabled={isChecking||isExpired}>
                  {isChecking
                    ? <><Loader size={15} className="animate-spin"/> MENGECEK...</>
                    : <><CheckCircle size={15}/> SAYA SUDAH BAYAR</>
                  }
                </button>
                <p className="tf" style={{fontSize:12,margin:0,color:'var(--fd-muted-foreground)'}}>
                  Sistem otomatis mengecek setiap 10 detik
                </p>
              </div>
            </div>

            {/* Security badges */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:20,marginTop:14,flexWrap:'wrap'}}>
              {[
                {I:ShieldCheck, t:'Enkripsi standar BI'},
                {I:Mail,        t:'API Key via email'},
                {I:Zap,         t:'Verifikasi real-time'},
              ].map(({I,t})=>(
                <div key={t} style={{display:'flex',alignItems:'center',gap:5}}>
                  <I size={12} style={{color:'var(--fd-muted-foreground)'}}/>
                  <span className="tf" style={{fontSize:12,color:'var(--fd-muted-foreground)'}}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ══ RIGHT: Sidebar ══ */}
          <div style={{display:'flex',flexDirection:'column',gap:16}}>

            {/* Order stub */}
            <div className="bp-card fup-d1">
              <div style={{padding:'16px 20px 14px',borderBottom:'1.5px solid var(--fd-border)'}}>
                <p className="lbl" style={{marginBottom:4}}>STUB / KUPON</p>
                <h2 className="tf" style={{fontWeight:900,fontSize:22,margin:0,color:'var(--fd-foreground)'}}>DETAIL PESANAN</h2>
              </div>

              <div style={{padding:'4px 20px 8px'}}>
                {[
                  {l:'ORDER ID',  v:orderData.id,            mono:true},
                  {l:'PAKET',     v:orderData.planName,      mono:false},
                  {l:'PELANGGAN', v:orderData.customerName,  mono:false},
                  {l:'EMAIL',     v:orderData.customerEmail, mono:false},
                ].map(({l,v,mono})=>(
                  <div key={l} style={{padding:'8px 0',borderBottom:'1px dashed var(--fd-border)'}}>
                    <div className="lbl">{l}</div>
                    <div className={mono ? 'val-mono' : 'val'} style={{marginTop:2}}>{v}</div>
                  </div>
                ))}
              </div>

              <div className="tear"><div className="tear-inner"/></div>

              {/* API key */}
              <div style={{padding:'14px 20px'}}>
                <div className="lbl" style={{marginBottom:8}}>API KEY ANDA</div>
                <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:10,background:'rgba(128,128,128,.07)',border:'1px solid var(--fd-border)'}}>
                  <span className="mf" style={{flex:1,fontSize:10,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--fd-foreground)'}}>
                    {orderData.apiKey}
                  </span>
                  <button
                    onClick={handleCopy}
                    style={{flexShrink:0,padding:5,borderRadius:6,background:copied?'var(--fd-primary)':'transparent',border:'none',cursor:'pointer',color:copied?'#fff':'var(--fd-muted-foreground)',display:'flex',alignItems:'center'}}>
                    {copied ? <Check size={12}/> : <Copy size={12}/>}
                  </button>
                </div>
                {copied && (
                  <p className="tf" style={{fontSize:12,color:'var(--fd-primary)',margin:'4px 0 0'}}>
                    ✓ Tersalin ke clipboard
                  </p>
                )}
              </div>

              {/* Stats */}
              <div style={{padding:'0 20px 20px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div className="stat">
                  <div className="lbl">LIMIT REQUEST</div>
                  <div className="tf" style={{fontWeight:900,fontSize:20,color:'var(--fd-foreground)',marginTop:4}}>
                    {typeof orderData.limit==='number' ? orderData.limit.toLocaleString() : orderData.limit}
                  </div>
                </div>
                <div className="stat">
                  <div className="lbl">DURASI</div>
                  <div className="tf" style={{fontWeight:900,fontSize:20,color:'var(--fd-foreground)',marginTop:4}}>
                    {orderData.expireDays ? `${orderData.expireDays}h` : '∞'}
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="bp-card fup-d2">
              <div style={{padding:'14px 20px 10px',borderBottom:'1.5px solid var(--fd-border)'}}>
                <div className="lbl">YANG ANDA DAPATKAN</div>
              </div>
              <div style={{padding:'12px 20px'}}>
                {['Aktivasi instan','Support 24/7','Dokumentasi lengkap','99.9% uptime guarantee'].map((b,i)=>(
                  <div key={b} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderBottom:i<3?'1px dashed var(--fd-border)':'none'}}>
                    <Check size={12} style={{color:'var(--fd-primary)',flexShrink:0}}/>
                    <span className="tf" style={{fontSize:14,color:'var(--fd-foreground)'}}>{b}</span>
                  </div>
                ))}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:14,padding:'10px 12px',borderRadius:10,background:'rgba(128,128,128,.05)',border:'1.5px dashed var(--fd-border)'}}>
                  <span className="lbl">TOTAL BAYAR</span>
                  <span className="tf" style={{fontWeight:900,fontSize:18,color:'var(--fd-primary)'}}>{orderData.priceFormatted}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
