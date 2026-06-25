import { useState, useRef, useEffect } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const MONO = "'Space Mono', monospace";
const SANS = "'Space Grotesk', sans-serif";

const AMBER = "#8B5E3C";
const AMBER_BG = "rgba(139,94,60,0.06)";
const BORDER = "rgba(28,26,23,0.1)";
const INK = "#1C1A17";
const INK_DIM = "#4A463E";
const INK_FAINT = "#8C8478";

const SUGGESTIONS = [
  "What RL methods did you use at CRAFT Lab?",
  "Tell me about your options pricing work.",
  "What roles are you targeting?",
  "How does the trading system work?",
];

export default function AskSimrat() {
  const [messages, setMessages] = useState([{
    role: "assistant",
    text: "Hi — ask me anything about Simrat's work, research, or background.",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(text) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Connection error — is the backend running?" }]);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff" }}>
      {/* Header */}
      <div style={{
        padding: "0.9rem 1.4rem",
        borderBottom: `1px solid ${BORDER}`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%", background: "#2D7A5A",
          animation: "blink-dot 2s infinite", display: "block",
        }} />
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".15em", color: AMBER, textTransform: "uppercase" }}>
          Ask Simrat
        </span>
        <span style={{ fontFamily: MONO, fontSize: 8, color: INK_FAINT, marginLeft: "auto" }}>
          PORTFOLIO AI
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.4rem", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "84%", padding: "0.65rem 0.9rem",
              background: m.role === "user" ? AMBER_BG : "#F9F6F0",
              border: `1px solid ${m.role === "user" ? "rgba(139,94,60,0.2)" : BORDER}`,
              borderRadius: 6,
              fontSize: 13, lineHeight: 1.7, fontFamily: SANS,
              color: m.role === "user" ? AMBER : INK_DIM,
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex" }}>
            <div style={{
              padding: "0.65rem 0.9rem",
              background: "#F9F6F0",
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              fontFamily: MONO, fontSize: 11, color: INK_FAINT, letterSpacing: ".1em",
            }}>
              thinking▋
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div style={{ padding: "0 1.4rem 0.75rem", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SUGGESTIONS.map((s, i) => (
            <button key={i} onClick={() => send(s)} style={{
              fontFamily: MONO, fontSize: 9, letterSpacing: ".08em",
              color: INK_FAINT, background: "#F5F0E8",
              border: `1px solid ${BORDER}`,
              padding: "5px 10px", cursor: "pointer", borderRadius: 3, textAlign: "left",
              transition: "border-color .2s, color .2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(139,94,60,0.35)"; e.currentTarget.style.color = AMBER; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = INK_FAINT; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "0.75rem 1.4rem", borderTop: `1px solid ${BORDER}`, display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask about Simrat's work..."
          style={{
            flex: 1, background: "#F9F6F0",
            border: `1px solid ${BORDER}`, borderRadius: 3,
            padding: "0.6rem 0.8rem",
            color: INK, fontFamily: SANS, fontSize: 13, outline: "none",
          }}
          onFocus={e => e.target.style.borderColor = "rgba(139,94,60,0.4)"}
          onBlur={e => e.target.style.borderColor = BORDER}
        />
        <button onClick={() => send()} disabled={loading} style={{
          fontFamily: MONO, fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase",
          color: loading ? INK_FAINT : AMBER,
          background: "none",
          border: `1px solid ${loading ? BORDER : "rgba(139,94,60,0.3)"}`,
          borderRadius: 3, padding: "0.6rem 1.1rem", cursor: loading ? "default" : "pointer",
          transition: "all .2s",
        }}>
          Send
        </button>
      </div>
    </div>
  );
}
