'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = 'chat' | 'form' | 'done';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMessage(text: string) {
  // Bold **text**
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Inline code `code`
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="msg-code">$1</code>');
  // Links
  formatted = formatted.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="msg-link">$1</a>'
  );
  // Newlines
  formatted = formatted.replace(/\n/g, '<br/>');
  return formatted;
}

// ─── Dots Loader ──────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <span className="typing-dots" aria-label="AI sedang mengetik">
      <span /><span /><span />
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CreatePage() {
  const [stage, setStage] = useState<Stage>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Heyy! Gw **Zeco**, asisten JKT48Connect 👋\n\nGw di sini buat bantu lu dapetin API key. Tapi sebelum itu, gw mau kenal dulu — ceritain dong, mau bikin apa pake API JKT48Connect? 🚀',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [apiKeyResult, setApiKeyResult] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, stage]);

  // ─── Send chat message ──────────────────────────────────────────────────────

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: text, timestamp: new Date() },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.result ?? 'Maaf, ada error nih. Coba lagi ya!',
          timestamp: new Date(),
        },
      ]);

      // AI approved → show form
      if (data.requireUserInfo) {
        setTimeout(() => setStage('form'), 600);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Koneksi gagal. Coba lagi ya!',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Submit user info → create API key ─────────────────────────────────────

  const submitUserInfo = async () => {
    if (!name.trim() || !email.trim()) return;
    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          pendingApiKey: true,
          userEmail: email.trim(),
          userName: name.trim(),
        }),
      });

      const data = await res.json();

      if (data.apiKeyCreated) {
        setApiKeyResult(data.result);
        setStage('done');
      } else {
        setCreateError(data.result ?? 'Gagal membuat API key. Coba lagi ya!');
      }
    } catch {
      setCreateError('Koneksi gagal. Coba lagi!');
    } finally {
      setIsCreating(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        .create-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #0a0a0f;
          color: #e8e8f0;
          position: relative;
          overflow: hidden;
        }

        /* ── Background ── */
        .create-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }
        .create-bg::before {
          content: '';
          position: absolute;
          top: -20%;
          left: -10%;
          width: 60%;
          height: 70%;
          background: radial-gradient(ellipse, rgba(99,102,241,.18) 0%, transparent 70%);
          filter: blur(40px);
        }
        .create-bg::after {
          content: '';
          position: absolute;
          bottom: -10%;
          right: -10%;
          width: 55%;
          height: 60%;
          background: radial-gradient(ellipse, rgba(236,72,153,.13) 0%, transparent 70%);
          filter: blur(40px);
        }

        /* ── Header ── */
        .create-header {
          position: relative;
          z-index: 10;
          padding: 2rem 2rem 1rem;
          text-align: center;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .create-header h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.6rem, 4vw, 2.4rem);
          font-weight: 800;
          letter-spacing: -.02em;
          background: linear-gradient(135deg, #fff 30%, #a5b4fc 70%, #f472b6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 .35rem;
        }
        .create-header p {
          font-size: .9rem;
          color: rgba(232,232,240,.45);
          margin: 0;
        }

        /* ── Layout ── */
        .create-body {
          position: relative;
          z-index: 10;
          flex: 1;
          display: flex;
          flex-direction: column;
          max-width: 760px;
          width: 100%;
          margin: 0 auto;
          padding: 1.5rem 1rem 0;
        }

        /* ── Messages ── */
        .messages-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          padding-bottom: 1rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,.1) transparent;
        }

        .msg-row {
          display: flex;
          align-items: flex-end;
          gap: .65rem;
        }
        .msg-row.user { flex-direction: row-reverse; }

        .msg-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: .75rem;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
        }
        .msg-avatar.ai {
          background: linear-gradient(135deg, #6366f1, #f472b6);
          color: #fff;
        }
        .msg-avatar.user {
          background: rgba(255,255,255,.1);
          color: rgba(255,255,255,.7);
          border: 1px solid rgba(255,255,255,.1);
        }

        .msg-bubble {
          max-width: 72%;
          padding: .85rem 1.1rem;
          border-radius: 18px;
          font-size: .9rem;
          line-height: 1.65;
          word-break: break-word;
        }
        .msg-bubble.ai {
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.08);
          border-bottom-left-radius: 5px;
        }
        .msg-bubble.user {
          background: linear-gradient(135deg, #6366f1, #818cf8);
          color: #fff;
          border-bottom-right-radius: 5px;
        }

        .msg-code {
          background: rgba(255,255,255,.12);
          padding: .1em .4em;
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: .82em;
        }
        .msg-link {
          color: #a5b4fc;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        /* ── Typing dots ── */
        .typing-dots {
          display: inline-flex;
          gap: 4px;
          align-items: center;
          height: 18px;
        }
        .typing-dots span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,.4);
          animation: td-bounce .9s ease-in-out infinite;
        }
        .typing-dots span:nth-child(2) { animation-delay: .15s; }
        .typing-dots span:nth-child(3) { animation-delay: .3s; }
        @keyframes td-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: .4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }

        /* ── Input bar ── */
        .input-bar {
          position: sticky;
          bottom: 0;
          padding: 1rem 0 1.5rem;
          background: linear-gradient(to top, #0a0a0f 70%, transparent);
        }
        .input-wrap {
          display: flex;
          gap: .6rem;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 14px;
          padding: .5rem .5rem .5rem .9rem;
          transition: border-color .2s;
        }
        .input-wrap:focus-within {
          border-color: rgba(99,102,241,.5);
        }
        .chat-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #e8e8f0;
          font-family: 'DM Sans', sans-serif;
          font-size: .92rem;
          resize: none;
        }
        .chat-input::placeholder { color: rgba(232,232,240,.3); }
        .send-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #818cf8);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: opacity .2s, transform .15s;
        }
        .send-btn:disabled { opacity: .4; cursor: not-allowed; transform: none; }
        .send-btn:not(:disabled):hover { opacity: .85; transform: scale(1.05); }
        .send-btn svg { width: 18px; height: 18px; fill: #fff; }

        /* ── Form stage ── */
        .form-card {
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 20px;
          padding: 2rem;
          margin-bottom: 2rem;
          animation: slide-up .4s ease;
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .form-card h2 {
          font-family: 'Syne', sans-serif;
          font-size: 1.3rem;
          font-weight: 700;
          margin: 0 0 .35rem;
        }
        .form-card .subtitle {
          font-size: .85rem;
          color: rgba(232,232,240,.45);
          margin: 0 0 1.5rem;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: .4rem;
          margin-bottom: 1rem;
        }
        .field label {
          font-size: .8rem;
          font-weight: 500;
          color: rgba(232,232,240,.6);
          text-transform: uppercase;
          letter-spacing: .05em;
        }
        .field input {
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 10px;
          padding: .75rem 1rem;
          color: #e8e8f0;
          font-family: 'DM Sans', sans-serif;
          font-size: .92rem;
          outline: none;
          transition: border-color .2s;
        }
        .field input:focus {
          border-color: rgba(99,102,241,.6);
        }
        .field input::placeholder { color: rgba(232,232,240,.25); }

        .create-btn {
          width: 100%;
          padding: .85rem;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #f472b6 100%);
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity .2s, transform .15s;
          margin-top: .5rem;
        }
        .create-btn:disabled { opacity: .5; cursor: not-allowed; }
        .create-btn:not(:disabled):hover { opacity: .85; transform: translateY(-1px); }

        .error-msg {
          background: rgba(239,68,68,.1);
          border: 1px solid rgba(239,68,68,.25);
          color: #fca5a5;
          border-radius: 10px;
          padding: .7rem 1rem;
          font-size: .85rem;
          margin-top: .75rem;
        }

        /* ── Done stage ── */
        .done-card {
          background: rgba(99,102,241,.08);
          border: 1px solid rgba(99,102,241,.25);
          border-radius: 20px;
          padding: 2.5rem 2rem;
          text-align: center;
          animation: slide-up .4s ease;
          margin-bottom: 2rem;
        }
        .done-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        .done-card h2 {
          font-family: 'Syne', sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0 0 .5rem;
        }
        .done-card p {
          color: rgba(232,232,240,.55);
          font-size: .9rem;
          margin: 0 0 1.5rem;
        }
        .apikey-box {
          background: rgba(0,0,0,.35);
          border: 1px solid rgba(99,102,241,.3);
          border-radius: 12px;
          padding: 1rem 1.2rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: .88rem;
          color: #a5b4fc;
          word-break: break-all;
          text-align: left;
          margin-bottom: 1.5rem;
        }
        .docs-link {
          display: inline-flex;
          align-items: center;
          gap: .4rem;
          color: #a5b4fc;
          font-size: .88rem;
          text-decoration: none;
          border: 1px solid rgba(99,102,241,.3);
          border-radius: 8px;
          padding: .5rem 1rem;
          transition: background .2s;
        }
        .docs-link:hover { background: rgba(99,102,241,.1); }

        /* ── Stage indicator ── */
        .stage-pill {
          display: inline-flex;
          align-items: center;
          gap: .4rem;
          font-size: .75rem;
          padding: .3rem .7rem;
          border-radius: 99px;
          margin-bottom: 1.5rem;
          font-weight: 500;
          letter-spacing: .03em;
        }
        .stage-pill.chat-stage {
          background: rgba(99,102,241,.12);
          border: 1px solid rgba(99,102,241,.2);
          color: #a5b4fc;
        }
        .stage-pill.form-stage {
          background: rgba(168,85,247,.12);
          border: 1px solid rgba(168,85,247,.2);
          color: #d8b4fe;
        }
        .stage-pill.done-stage {
          background: rgba(34,197,94,.12);
          border: 1px solid rgba(34,197,94,.2);
          color: #86efac;
        }
        .stage-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: .3; }
        }
      `}</style>

      <div className="create-root">
        <div className="create-bg" />

        {/* Header */}
        <header className="create-header">
          <h1>Dapetin API Key JKT48Connect</h1>
          <p>Chat sama Zeco dulu — dia yang bakal bantu lu semua 🤖</p>
        </header>

        <div className="create-body">

          {/* Stage pill */}
          <div style={{ textAlign: 'center' }}>
            {stage === 'chat' && (
              <span className="stage-pill chat-stage">
                <span className="stage-dot" /> Ngobrol sama Zeco
              </span>
            )}
            {stage === 'form' && (
              <span className="stage-pill form-stage">
                <span className="stage-dot" /> Isi data kamu
              </span>
            )}
            {stage === 'done' && (
              <span className="stage-pill done-stage">
                <span className="stage-dot" /> API Key siap!
              </span>
            )}
          </div>

          {/* ── DONE STAGE ────────────────────────────────────────────────── */}
          {stage === 'done' && apiKeyResult && (
            <div className="done-card">
              <div className="done-icon">🎉</div>
              <h2>API Key Berhasil Dibuat!</h2>
              <p>Simpan API key ini baik-baik ya, jangan kasih ke siapapun!</p>
              <div
                className="apikey-box"
                dangerouslySetInnerHTML={{ __html: formatMessage(apiKeyResult) }}
              />
              <a
                href="https://docs.jkt48connect.com/docs/ui"
                target="_blank"
                rel="noopener noreferrer"
                className="docs-link"
              >
                📚 Baca dokumentasi lengkap →
              </a>
            </div>
          )}

          {/* ── FORM STAGE ────────────────────────────────────────────────── */}
          {stage === 'form' && (
            <>
              {/* Still show chat history */}
              <div className="messages-list" style={{ maxHeight: '35vh' }}>
                {messages.map((msg, i) => (
                  <div key={i} className={`msg-row ${msg.role}`}>
                    <div className={`msg-avatar ${msg.role === 'assistant' ? 'ai' : 'user'}`}>
                      {msg.role === 'assistant' ? 'Z' : 'U'}
                    </div>
                    <div
                      className={`msg-bubble ${msg.role === 'assistant' ? 'ai' : 'user'}`}
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                    />
                  </div>
                ))}
              </div>

              {/* Form */}
              <div className="form-card" style={{ marginTop: '1.5rem' }}>
                <h2>✨ Hampir selesai!</h2>
                <p className="subtitle">
                  Zeco udah approve lu. Tinggal isi nama & email buat dapetin API key-nya.
                </p>
                <div className="field">
                  <label>Nama Lengkap</label>
                  <input
                    type="text"
                    placeholder="Misal: Budi Santoso"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="Misal: budi@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button
                  className="create-btn"
                  onClick={submitUserInfo}
                  disabled={!name.trim() || !email.trim() || isCreating}
                >
                  {isCreating ? '⏳ Membuat API Key...' : '🚀 Buat API Key Sekarang'}
                </button>
                {createError && (
                  <div className="error-msg">❌ {createError}</div>
                )}
              </div>
            </>
          )}

          {/* ── CHAT STAGE ────────────────────────────────────────────────── */}
          {stage === 'chat' && (
            <>
              <div className="messages-list">
                {messages.map((msg, i) => (
                  <div key={i} className={`msg-row ${msg.role}`}>
                    <div className={`msg-avatar ${msg.role === 'assistant' ? 'ai' : 'user'}`}>
                      {msg.role === 'assistant' ? 'Z' : 'U'}
                    </div>
                    <div
                      className={`msg-bubble ${msg.role === 'assistant' ? 'ai' : 'user'}`}
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                    />
                  </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <div className="msg-row assistant">
                    <div className="msg-avatar ai">Z</div>
                    <div className="msg-bubble ai">
                      <TypingDots />
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input bar */}
              <div className="input-bar">
                <div className="input-wrap">
                  <input
                    ref={inputRef}
                    className="chat-input"
                    placeholder="Ketik pesan lu di sini..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={isLoading}
                  />
                  <button
                    className="send-btn"
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    aria-label="Kirim pesan"
                  >
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
