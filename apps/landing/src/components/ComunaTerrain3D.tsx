import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./motion";

export type ComunaDatum = { id: string; name: string; intensity: number };

/**
 * Dependency-free isometric 3D bar field for the transparency panel.
 *
 * Pure 2D canvas + a hand-rolled isometric projection = real depth with zero
 * new dependencies. Renders exactly the presentational fixtures it is handed
 * (no data wiring), rises the bars in on view, breathes gently while visible,
 * and highlights the bar under the pointer. Fully static + labelled for
 * prefers-reduced-motion, and mirrored into an sr-only list for a11y.
 */
export function ComunaTerrain3D({
  data,
  className = "",
}: {
  data: ComunaDatum[];
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hoverRef = useRef<number>(-1);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = prefersReducedMotion();
    const maxIntensity = Math.max(1, ...data.map((d) => d.intensity));

    const FALLBACK = "#6ee7a8";
    let primary = FALLBACK;
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
      // Only adopt the token if this canvas engine can actually parse it
      // (older engines reject oklch() and silently keep the prior fillStyle).
      if (v) {
        ctx.fillStyle = "#000000";
        ctx.fillStyle = v;
        primary = ctx.fillStyle === "#000000" ? FALLBACK : v;
      }
    } catch {
      primary = FALLBACK;
    }

    const hw = 24; // tile half-width
    const hh = 12; // tile half-height (2:1 iso)
    const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";

    let width = 0;
    let height = 0;

    const layout = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = wrap.clientWidth;
      height = wrap.clientHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const diamond = (cx: number, cy: number, lift: number) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy - hh - lift);
      ctx.lineTo(cx + hw, cy - lift);
      ctx.lineTo(cx, cy + hh - lift);
      ctx.lineTo(cx - hw, cy - lift);
      ctx.closePath();
    };

    const drawBar = (cx: number, cy: number, barH: number, dim: number, hot: boolean) => {
      // contact shadow
      ctx.save();
      ctx.globalAlpha = 0.26;
      ctx.fillStyle = "#000";
      diamond(cx + 5, cy + 4, 0);
      ctx.fill();
      ctx.restore();

      // left face (darkest)
      ctx.beginPath();
      ctx.moveTo(cx - hw, cy);
      ctx.lineTo(cx, cy + hh);
      ctx.lineTo(cx, cy + hh - barH);
      ctx.lineTo(cx - hw, cy - barH);
      ctx.closePath();
      ctx.fillStyle = primary;
      ctx.fill();
      ctx.fillStyle = `rgba(0,0,0,${0.44 + dim})`;
      ctx.fill();

      // right face (mid)
      ctx.beginPath();
      ctx.moveTo(cx + hw, cy);
      ctx.lineTo(cx, cy + hh);
      ctx.lineTo(cx, cy + hh - barH);
      ctx.lineTo(cx + hw, cy - barH);
      ctx.closePath();
      ctx.fillStyle = primary;
      ctx.fill();
      ctx.fillStyle = `rgba(0,0,0,${0.22 + dim})`;
      ctx.fill();

      // top face (brightest)
      diamond(cx, cy, barH);
      ctx.fillStyle = primary;
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${hot ? 0.18 : 0.07})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${hot ? 0.45 : 0.16})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const positions: { cx: number; cy: number; h: number; d: ComunaDatum }[] = data.map((d) => ({
      cx: 0,
      cy: 0,
      h: 0,
      d,
    }));

    let startTime = 0; // lazily set on the first painted frame (i.e. on reveal)
    let raf = 0;

    const draw = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const intro = reduce ? 1 : Math.min(1, elapsed / 950);
      const introEased = 1 - Math.pow(1 - intro, 3);

      ctx.clearRect(0, 0, width, height);

      const n = data.length;
      const marginX = 48;
      const step = n > 1 ? (width - marginX * 2) / (n - 1) : 0;
      const baseY = height - 38;
      const slope = hh * 0.5;
      const maxBarH = Math.max(30, height - 82);

      for (let i = 0; i < n; i++) {
        positions[i].cx = marginX + i * step;
        positions[i].cy = baseY - (i - (n - 1) / 2) * slope;
      }

      // faint ground tiles
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      for (let i = 0; i < n; i++) {
        diamond(positions[i].cx, positions[i].cy, 0);
        ctx.stroke();
      }
      ctx.restore();

      // bars, back-to-front
      for (let i = 0; i < n; i++) {
        const p = positions[i];
        const norm = p.d.intensity / maxIntensity;
        let barH = (16 + norm * (maxBarH - 16)) * introEased;
        if (!reduce) barH *= 1 + 0.025 * Math.sin(elapsed / 900 + i * 0.9);
        p.h = barH;
        const dim = (1 - norm) * 0.18;
        const hot = hoverRef.current === i;
        const lift = hot ? 6 : 0;

        drawBar(p.cx, p.cy - lift, barH, dim, hot);

        // value above
        ctx.textAlign = "center";
        ctx.font = `600 12px ${MONO}`;
        ctx.fillStyle = hot ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.72)";
        ctx.fillText(String(p.d.intensity), p.cx, p.cy - lift - barH - 10);

        // comuna id below
        ctx.font = `500 10px ${MONO}`;
        ctx.fillStyle = hot ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.42)";
        ctx.fillText(p.d.id, p.cx, p.cy + hh + 15);
      }

      if (!reduce) raf = requestAnimationFrame(draw);
    };

    const redrawStatic = () => {
      if (reduce) {
        cancelAnimationFrame(raf);
        draw(performance.now());
      }
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let found = -1;
      for (let i = 0; i < positions.length; i++) {
        const p = positions[i];
        if (mx >= p.cx - hw && mx <= p.cx + hw && my <= p.cy + hh && my >= p.cy - p.h - 18) {
          found = i;
        }
      }
      if (found !== hoverRef.current) {
        hoverRef.current = found;
        canvas.style.cursor = found >= 0 ? "pointer" : "default";
        redrawStatic();
      }
    };
    const onLeave = () => {
      if (hoverRef.current !== -1) {
        hoverRef.current = -1;
        canvas.style.cursor = "default";
        redrawStatic();
      }
    };

    const startLoop = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(() => {
      layout();
      if (reduce) draw(performance.now());
    });
    ro.observe(wrap);

    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              if (reduce) draw(performance.now());
              else startLoop();
            } else if (!reduce) {
              cancelAnimationFrame(raf);
            }
          }
        },
        { threshold: 0.12 },
      );
      io.observe(wrap);
    }

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    layout();
    // Reduced-motion: paint the final state now. Animated: wait for the
    // element to enter view (IO) so the intro rise plays on reveal; if IO is
    // unavailable, start immediately.
    if (reduce) draw(performance.now());
    else if (!io) startLoop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io?.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [data]);

  return (
    <div ref={wrapRef} className={`relative w-full ${className}`} style={{ height: 190 }}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 90% at 50% 100%, color-mix(in oklab, var(--primary) 10%, transparent), transparent 70%)",
        }}
      />
      <canvas ref={canvasRef} className="relative block h-full w-full" aria-hidden />
      <ul className="sr-only">
        {data.map((d) => (
          <li key={d.id}>{`Comuna ${d.id} ${d.name}: intensidad ${d.intensity}`}</li>
        ))}
      </ul>
    </div>
  );
}
