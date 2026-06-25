import { useRef } from "react";

const MONO = "'Space Mono', monospace";
const SANS = "'Space Grotesk', sans-serif";

const CERTIFICATIONS = [
  { name: "MS Computer Science · Financial Engineering Certificate", org: "Stevens Institute of Technology, Hoboken NJ", year: "2024–2026", note: "GPA 3.8" },
  { name: "BE Information and Communication Technology", org: "Gujarat Technological University, India", year: "2019–2023", note: "GPA 3.55" },
  { name: "IEEE Xplore Publication", org: "Position Mapping via Content-Based Image Retrieval and Annoy", year: "Dec 2023", note: "" },
  { name: "Featured · Analytics India Magazine", org: "Credit Risk ML Pipeline at Lendingkart", year: "2024", note: "" },
];

export default function CVSection({ resume }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Simrat Kaur Randhawa — CV</title>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Space Grotesk',sans-serif;background:#fff;color:#111;padding:48px 52px;max-width:820px;margin:0 auto;font-size:13px;line-height:1.6}
        h1{font-size:2rem;font-weight:700;letter-spacing:-.02em;margin-bottom:4px}
        h2{font-size:.7rem;font-family:'Space Mono',monospace;letter-spacing:.18em;text-transform:uppercase;color:#666;margin-bottom:32px}
        h3{font-size:.65rem;font-family:'Space Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:#999;border-bottom:0.5px solid #ddd;padding-bottom:4px;margin:24px 0 12px}
        .role{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px}
        .role-title{font-size:.95rem;font-weight:600}
        .role-org{font-size:.8rem;color:#555;margin-bottom:6px}
        .role-period{font-size:.65rem;font-family:'Space Mono',monospace;letter-spacing:.08em;color:#888}
        ul{padding-left:1rem;margin-bottom:10px}
        li{margin-bottom:2px;font-size:.85rem;color:#444}
        .tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
        .tag{font-family:'Space Mono',monospace;font-size:.6rem;letter-spacing:.06em;padding:2px 6px;border:0.5px solid #ccc;color:#666;text-transform:uppercase}
        .skills-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        .skill-col h4{font-family:'Space Mono',monospace;font-size:.6rem;letter-spacing:.14em;text-transform:uppercase;color:#888;margin-bottom:6px}
        .skill-col ul{padding-left:.8rem;list-style:disc}
        .cert-row{display:flex;justify-content:space-between;align-items:baseline;padding:6px 0;border-bottom:0.5px solid #eee}
        .cert-name{font-weight:500;font-size:.88rem}
        .cert-org{font-size:.78rem;color:#666}
        .cert-yr{font-family:'Space Mono',monospace;font-size:.65rem;color:#888}
        @media print{body{padding:24px 32px}}
      </style></head><body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  if (!resume) return null;
  const { name, title, location, email, linkedin, github, experience = [], skills = {} } = resume;

  return (
    <div id="cv" style={{ background: "#EDE8DF" }}>
      {/* Section header */}
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "8rem 3rem 0" }}>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "#5ef0ff", display: "flex", alignItems: "center", gap: 8, marginBottom: "1.4rem" }}>
          <span style={{ width: 16, height: "0.5px", background: "#5ef0ff", display: "block" }} />
          Résumé
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "3rem", flexWrap: "wrap", gap: "1rem" }}>
          <h2 style={{ fontFamily: SANS, fontWeight: 700, letterSpacing: "-.03em", lineHeight: 1.05, fontSize: "clamp(2.4rem,5vw,4.2rem)" }}>
            Curriculum <span style={{ color: "#5ef0ff" }}>Vitae</span>
          </h2>
          <button onClick={handlePrint} data-cursor="hover" style={{
            fontFamily: MONO, fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase",
            padding: ".75rem 1.5rem", background: "transparent",
            border: "0.5px solid rgba(94,240,255,0.3)", color: "#5ef0ff",
            cursor: "none", borderRadius: 3, transition: "background .2s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(94,240,255,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            ↓ Print / PDF
          </button>
        </div>
      </div>

      {/* CV document */}
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 3rem 8rem" }}>
        <div ref={printRef} style={{
          background: "#f8f7f4", color: "#111",
          borderRadius: 6, padding: "3.5rem 4rem",
          boxShadow: "0 12px 48px rgba(28,26,23,0.1)",
        }}>
          {/* Header */}
          <div style={{ marginBottom: "2.5rem", paddingBottom: "2rem", borderBottom: "0.5px solid #d8d6d0" }}>
            <h1 style={{ fontFamily: SANS, fontSize: "2.4rem", fontWeight: 700, letterSpacing: "-.03em", lineHeight: 1, marginBottom: 8 }}>
              {name}
            </h1>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".15em", color: "#666", textTransform: "uppercase", marginBottom: "1rem" }}>
              {title}
            </div>
            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              {[
                { label: "Location", val: location },
                { label: "Email", val: email },
                { label: "LinkedIn", val: linkedin },
                { label: "GitHub", val: github },
              ].map(({ label, val }) => (
                <div key={label}>
                  <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "#aaa", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, color: "#333" }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "#aaa", paddingBottom: 6, borderBottom: "0.5px solid #d8d6d0", marginBottom: "1.5rem" }}>
              Experience
            </div>
            {experience.map((e, i) => (
              <div key={i} style={{ marginBottom: "1.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2, flexWrap: "wrap", gap: 4 }}>
                  <span style={{ fontFamily: SANS, fontSize: "1rem", fontWeight: 600 }}>{e.role}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: "#888", textTransform: "uppercase" }}>{e.period}</span>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: "#777", marginBottom: 8 }}>{e.org}</div>
                <ul style={{ paddingLeft: "1.1rem" }}>
                  {e.bullets.map((b, j) => (
                    <li key={j} style={{ fontSize: 13, color: "#444", lineHeight: 1.8, marginBottom: 2 }}>{b}</li>
                  ))}
                </ul>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                  {e.tags.map((t, j) => (
                    <span key={j} style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".06em", textTransform: "uppercase", padding: "3px 7px", border: "0.5px solid #ccc", color: "#666", borderRadius: 2 }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Education + Certifications */}
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "#aaa", paddingBottom: 6, borderBottom: "0.5px solid #d8d6d0", marginBottom: "1.5rem" }}>
              Education & Recognition
            </div>
            {CERTIFICATIONS.map((c, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "8px 0", borderBottom: "0.5px solid #eee", flexWrap: "wrap", gap: 4 }}>
                <div>
                  <div style={{ fontFamily: SANS, fontSize: ".95rem", fontWeight: 500 }}>{c.name}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: "#888" }}>{c.org}{c.note ? ` · ${c.note}` : ""}</div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 9, color: "#aaa", letterSpacing: ".1em" }}>{c.year}</span>
              </div>
            ))}
          </div>

          {/* Skills */}
          <div>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "#aaa", paddingBottom: 6, borderBottom: "0.5px solid #d8d6d0", marginBottom: "1.5rem" }}>
              Technical Skills
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem" }}>
              {Object.entries(skills).map(([cat, list]) => (
                <div key={cat}>
                  <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "#999", marginBottom: 8 }}>{cat}</div>
                  <ul style={{ paddingLeft: "1rem", listStyleType: "disc" }}>
                    {list.map((s, j) => (
                      <li key={j} style={{ fontSize: 12, color: "#444", marginBottom: 3 }}>{s}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
