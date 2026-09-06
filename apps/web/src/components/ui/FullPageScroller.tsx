"use client";

import { useEffect, useRef, useState, Children, ReactNode } from "react";
import gsap from "gsap";

// ─── Per-section GSAP entry animation configs ────────────────────────────────
const ENTRY: Array<gsap.TweenVars | null> = [
  null,                                                           // 0 Hero        — initial, no anim
  { y: 90, opacity: 0, filter: "blur(10px)" },                  // 1 Features
  { scale: 0.88, opacity: 0, filter: "blur(8px)" },             // 2 Impact Stats
  { x: -90, opacity: 0, filter: "blur(8px)" },                  // 3 How It Works
  { y: 80, opacity: 0 },                                         // 4 Stats+Trust
  { x: 90, opacity: 0, filter: "blur(8px)" },                   // 5 Testimonials
  { y: 80, opacity: 0, filter: "blur(8px)" },                   // 6 FAQ
  { y: 50, opacity: 0 },                                         // 7 Footer
];

const EASE_IN  = "power2.in";
const EASE_OUT = "expo.out";
const DUR_OUT  = 0.38;
const DUR_IN   = 0.82;

const LABELS = [
  "Home", "Crop Intelligence", "Our Features", "How It Works",
  "Impact", "Farmer Stories", "FAQ", "Contact",
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function FullPageScroller({ children }: { children: ReactNode }) {
  const panels   = Children.toArray(children);
  const N        = panels.length;

  const [active, setActive] = useState(0);
  const refs     = useRef<(HTMLDivElement | null)[]>([]);
  const busy     = useRef(false);
  const cur      = useRef(0);           // tracks active index without re-render lag

  // ── Go to panel ─────────────────────────────────────────────────────────────
  const goTo = (next: number, dir: 1 | -1) => {
    if (busy.current || next === cur.current || next < 0 || next >= N) return;

    const prevEl = refs.current[cur.current];
    const nextEl = refs.current[next];
    if (!prevEl || !nextEl) return;

    busy.current = true;
    cur.current  = next;
    setActive(next);
    
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("kisanseva-panel-change", { detail: { activePanel: next } }));
    }

    // ── exit current ──
    gsap.to(prevEl, {
      opacity: 0,
      y:       dir > 0 ? -55 : 55,
      scale:   0.97,
      filter:  "blur(6px)",
      duration: DUR_OUT,
      ease:    EASE_IN,
      onComplete: () => gsap.set(prevEl, { zIndex: 1, display: "none" }),
    });

    // ── enter next ──
    const from: gsap.TweenVars = {
      ...(ENTRY[next] ?? { y: dir > 0 ? 55 : -55, opacity: 0 }),
      zIndex: 2,
      display: "flex",
    };
    gsap.set(nextEl, from);
    gsap.to(nextEl, {
      y: 0, x: 0, scale: 1, opacity: 1, filter: "blur(0px)",
      duration: DUR_IN,
      ease:     EASE_OUT,
      delay:    0.08,
      onComplete: () => { busy.current = false; },
    });
  };

  // ── Init: show panel 0, hide rest ───────────────────────────────────────────
  useEffect(() => {
    refs.current.forEach((el, i) => {
      if (!el) return;
      gsap.set(el, i === 0
        ? { opacity: 1, y: 0, x: 0, scale: 1, filter: "blur(0px)", zIndex: 2, display: "flex" }
        : { opacity: 0, zIndex: 1, display: "none" });
    });
  }, []);

  // ── Hide the layout-level footer while this scroller is mounted ──────────────
  useEffect(() => {
    const all = document.querySelectorAll<HTMLElement>("footer");
    const container = document.getElementById("fullpage-scroller-root");
    const hidden: HTMLElement[] = [];

    all.forEach(f => {
      if (!container?.contains(f)) {
        f.style.setProperty("display", "none", "important");
        hidden.push(f);
      }
    });

    return () => {
      hidden.forEach(f => f.style.removeProperty("display"));
    };
  }, []);

  // ── Wheel ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cooldown = false;
    let accumulatedDelta = 0;
    let lastWheelTime = 0;

    const onWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastWheelTime > 150) {
        accumulatedDelta = 0;
      }
      lastWheelTime = now;

      const panel = refs.current[cur.current];
      if (panel) {
        const { scrollTop, scrollHeight, clientHeight } = panel;
        if (e.deltaY > 0 && scrollHeight - scrollTop - clientHeight > 2) {
          accumulatedDelta = 0;
          return;
        }
        if (e.deltaY < 0 && scrollTop > 2) {
          accumulatedDelta = 0;
          return;
        }
      }
      e.preventDefault();

      if (cooldown || busy.current) {
        accumulatedDelta = 0;
        return;
      }
      
      accumulatedDelta += e.deltaY;
      
      if (Math.abs(accumulatedDelta) < 30) {
        return;
      }
      
      const dir = accumulatedDelta > 0 ? 1 : -1;
      
      cooldown = true;
      setTimeout(() => { cooldown = false; }, 900);
      accumulatedDelta = 0;
      
      goTo(cur.current + dir, dir as 1 | -1);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [N]);

  // ── Touch ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    let ty = 0;
    const onStart = (e: TouchEvent) => { ty = e.touches[0].clientY; };
    const onEnd   = (e: TouchEvent) => {
      const diff = ty - e.changedTouches[0].clientY;
      if (Math.abs(diff) < 45) return;

      const panel = refs.current[cur.current];
      if (panel) {
        const { scrollTop, scrollHeight, clientHeight } = panel;
        if (diff > 0 && scrollHeight - scrollTop - clientHeight > 2) return;
        if (diff < 0 && scrollTop > 2) return;
      }

      const dir = diff > 0 ? 1 : -1;
      goTo(cur.current + dir, dir as 1 | -1);
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend",   onEnd,   { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend",   onEnd);
    };
  }, [N]);

  // ── Keyboard ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const panel = refs.current[cur.current];
      
      if (["ArrowDown", "PageDown"].includes(e.key)) {
        if (panel) {
          const { scrollTop, scrollHeight, clientHeight } = panel;
          if (scrollHeight - scrollTop - clientHeight > 2) return;
        }
        e.preventDefault();
        goTo(cur.current + 1, 1);
      }
      
      if (["ArrowUp", "PageUp"].includes(e.key)) {
        if (panel) {
          const { scrollTop } = panel;
          if (scrollTop > 2) return;
        }
        e.preventDefault();
        goTo(cur.current - 1, -1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // Intentionally missing dependency array so goTo is fresh

  // ── External Navigation Events ───────────────────────────────────────────────
  useEffect(() => {
    const handleScrollToTop = () => {
      if (cur.current !== 0) {
        goTo(0, -1);
      }
    };
    window.addEventListener("kisanseva-scroll-to-top", handleScrollToTop);
    return () => window.removeEventListener("kisanseva-scroll-to-top", handleScrollToTop);
  }); // Intentionally missing dependency array so goTo is fresh

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      id="fullpage-scroller-root"
      style={{
        position: "fixed",
        top:      0,
        left:     0,
        right:    0,
        bottom:   0,
        overflow: "hidden",
        zIndex:   20,
        background: "#f8fafc",
      }}
    >
      {/* ── Panels ── */}
      {panels.map((panel, i) => (
        <div
          key={i}
          ref={el => { refs.current[i] = el; }}
          style={{
            position:  "absolute",
            inset:     0,
            overflowY: "auto",
            overflowX: "hidden",
            display:   "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
          }}
        >
          {panel}
        </div>
      ))}

      {/* ── Navigation dots (right side) ── */}
      <nav
        aria-label="Page sections"
        style={{
          position:  "fixed",
          right:     18,
          top:       "50%",
          transform: "translateY(-50%)",
          display:   "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          zIndex: 50,
        }}
      >
        {panels.map((_, i) => (
          <button
            key={i}
            aria-label={LABELS[i] ?? `Section ${i + 1}`}
            title={LABELS[i] ?? `Section ${i + 1}`}
            onClick={() => goTo(i, i > cur.current ? 1 : -1)}
            style={{
              width:        8,
              height:       i === active ? 28 : 8,
              borderRadius: 99,
              background:   i === active
                ? "#65a30d"
                : i < active
                  ? "rgba(101,163,13,0.3)"
                  : "rgba(148,163,184,0.4)",
              border:     "none",
              cursor:     "pointer",
              padding:    0,
              transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
              boxShadow:  i === active ? "0 0 0 3px rgba(101,163,13,0.15)" : "none",
            }}
          />
        ))}
      </nav>

      {/* ── Section label + progress ── */}
      <div
        style={{
          position:       "fixed",
          bottom:         16,
          left:           "50%",
          transform:      "translateX(-50%)",
          display:        "flex",
          alignItems:     "center",
          gap:            10,
          fontSize:       10,
          fontWeight:     700,
          letterSpacing:  "0.15em",
          textTransform:  "uppercase",
          color:          "rgba(100,116,139,0.65)",
          userSelect:     "none",
          pointerEvents:  "none",
          whiteSpace:     "nowrap",
        }}
      >
        <span>{LABELS[active]}</span>
        <span style={{ color: "rgba(148,163,184,0.5)" }}>·</span>
        <span>{active + 1} / {N}</span>
      </div>

      {/* ── Progress bar (top of scroller) ── */}
      <div
        style={{
          position:   "absolute",
          top:        0,
          left:       0,
          height:     2,
          width:      `${((active) / (N - 1)) * 100}%`,
          background: "linear-gradient(to right, #65a30d, #84cc16)",
          transition: "width 0.5s cubic-bezier(0.22,1,0.36,1)",
          zIndex:     50,
        }}
      />
    </div>
  );
}

