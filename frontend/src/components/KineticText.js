import { useEffect, useRef } from "react";
import gsap from "gsap";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const randChar = () => CHARSET[Math.floor(Math.random() * CHARSET.length)];

/**
 * KineticText — renders text where each character "reprices" through random
 * characters before settling, like a ticker tape locking in a quote.
 * Triggers once on mount (or when `trigger` prop changes).
 */
export default function KineticText({
  text,
  as: Tag = "span",
  style = {},
  className = "",
  staggerMs = 28,
  delay = 0,
  idleJitter = false,
  jitterInterval = 1800,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = "";
    const spans = [];

    [...text].forEach((ch) => {
      const span = document.createElement("span");
      span.style.display = "inline-block";
      span.style.fontVariantNumeric = "tabular-nums";
      span.style.opacity = "0";
      span.style.transform = "translateY(12px)";
      span.textContent = ch === " " ? "\u00A0" : ch;
      span.dataset.final = ch;
      el.appendChild(span);
      spans.push(span);
    });

    const intervals = [];
    const tweens = [];
    let cancelled = false;

    spans.forEach((span, i) => {
      const final = span.dataset.final;
      if (final === " ") { span.style.opacity = "1"; span.style.transform = "none"; return; }

      const tween = gsap.to(span, {
        opacity: 1, y: 0, duration: 0.45, ease: "power2.out",
        delay: delay + i * (staggerMs / 1000),
        onStart() {
          if (cancelled) return;
          let count = 0;
          const ticks = 8 + Math.floor(Math.random() * 5); // 8–12 ticks
          const iv = setInterval(() => {
            if (cancelled) { clearInterval(iv); return; }
            if (count >= ticks) { span.textContent = final; clearInterval(iv); return; }
            span.textContent = randChar();
            count++;
          }, 55); // slower, clearly visible per-tick
          intervals.push(iv);
        },
      });
      tweens.push(tween);
    });

    let jitterIv;
    if (idleJitter) {
      jitterIv = setInterval(() => {
        if (cancelled) return;
        const pool = spans.filter(s => s.dataset.final !== " ");
        if (!pool.length) return;
        const span = pool[Math.floor(Math.random() * pool.length)];
        const final = span.dataset.final;
        let count = 0;
        const iv = setInterval(() => {
          if (cancelled) { clearInterval(iv); return; }
          if (count >= 3) { span.textContent = final; clearInterval(iv); return; }
          span.textContent = randChar();
          count++;
        }, 50);
      }, jitterInterval);
    }

    return () => {
      cancelled = true;
      intervals.forEach(clearInterval);
      tweens.forEach(t => t.kill());
      if (jitterIv) clearInterval(jitterIv);
    };
  }, [text, staggerMs, delay, idleJitter, jitterInterval]);

  return <Tag ref={ref} className={className} style={style} aria-label={text} />;
}
