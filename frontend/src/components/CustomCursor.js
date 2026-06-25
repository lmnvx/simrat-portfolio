import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const pos = useRef({ mx: 0, my: 0, rx: 0, ry: 0 });

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return; // skip on touch

    const dot = dotRef.current;
    const ring = ringRef.current;

    const onMove = (e) => {
      pos.current.mx = e.clientX;
      pos.current.my = e.clientY;
    };
    window.addEventListener("mousemove", onMove);

    let raf;
    const loop = () => {
      const p = pos.current;
      p.rx += (p.mx - p.rx) * 0.18;
      p.ry += (p.my - p.ry) * 0.18;
      if (dot) { dot.style.left = p.mx + "px"; dot.style.top = p.my + "px"; }
      if (ring) { ring.style.left = p.rx + "px"; ring.style.top = p.ry + "px"; }
      raf = requestAnimationFrame(loop);
    };
    loop();

    const onEnterHover = () => document.body.classList.add("cur-hover");
    const onLeaveHover = () => document.body.classList.remove("cur-hover");
    const onEnterText = () => document.body.classList.add("cur-text");
    const onLeaveText = () => document.body.classList.remove("cur-text");

    const attach = () => {
      document.querySelectorAll("[data-cursor='hover']").forEach(el => {
        el.addEventListener("mouseenter", onEnterHover);
        el.addEventListener("mouseleave", onLeaveHover);
      });
      document.querySelectorAll("[data-cursor='text']").forEach(el => {
        el.addEventListener("mouseenter", onEnterText);
        el.addEventListener("mouseleave", onLeaveText);
      });
    };
    attach();
    // re-attach periodically since React re-renders swap DOM nodes
    const interval = setInterval(attach, 1500);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      clearInterval(interval);
    };
  }, []);

  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
    return null;
  }

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}
