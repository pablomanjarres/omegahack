import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

/**
 * Presentation-layer motion primitives.
 *
 * Design rules baked in:
 *  - SSR / no-JS safe: the prerendered HTML always shows the FINAL state.
 *    JS adds `.reveal-ready` to <html>; only then do elements hide until
 *    they scroll into view. If JS never runs, content stays fully visible.
 *  - prefers-reduced-motion is honored everywhere: motion collapses to the
 *    final state instantly, no rAF loops, no transitions.
 */

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Observe an element and add `.is-visible` the first time it enters view.
 * Also arms the global `.reveal-ready` flag so the CSS pre-state applies
 * only once JS is running.
 */
export function useInView<T extends HTMLElement = HTMLElement>(options?: {
  threshold?: number;
  rootMargin?: string;
}) {
  const ref = useRef<T | null>(null);
  const threshold = options?.threshold ?? 0.15;
  const rootMargin = options?.rootMargin ?? "0px 0px -10% 0px";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    document.documentElement.classList.add("reveal-ready");

    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold, rootMargin },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  return ref;
}

type RevealProps = {
  as?: ElementType;
  className?: string;
  /** entrance delay in ms (use to stagger siblings) */
  delay?: number;
  /** translateY distance of the pre-state in px */
  y?: number;
  children?: ReactNode;
  style?: CSSProperties;
} & Record<string, unknown>;

/**
 * Wrapper that fades + rises its content into view on scroll.
 * Renders as the given host element so it can slot straight into grids
 * and lists without extra DOM.
 */
export function Reveal({
  as = "div",
  className,
  delay = 0,
  y = 22,
  children,
  style,
  ...rest
}: RevealProps) {
  const ref = useInView<HTMLElement>();
  const Tag = as as ElementType;
  return (
    <Tag
      ref={ref as never}
      data-reveal=""
      className={className}
      style={
        {
          "--reveal-delay": `${delay}ms`,
          "--reveal-y": `${y}px`,
          ...style,
        } as CSSProperties
      }
      {...rest}
    >
      {children}
    </Tag>
  );
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Counts a number up from 0 to `value` the first time it scrolls into view.
 * SSR renders the final value (correct for no-JS + SEO); the client resets to
 * 0 while off-screen and animates on reveal, so users only ever see 0 → value.
 */
export function CountUp({
  value,
  duration = 1500,
  decimals = 0,
  locale = "es-CO",
  grouping = true,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  duration?: number;
  decimals?: number;
  locale?: string;
  grouping?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const fmt = (n: number) =>
    prefix +
    n.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: grouping,
    }) +
    suffix;

  const [text, setText] = useState(() => fmt(value));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setText(fmt(value));
      return;
    }

    let raf = 0;
    let started = false;
    // Reset while (almost always) off-screen so the count is seen from 0.
    setText(fmt(0));

    const run = () => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        setText(fmt(value * easeOutCubic(p)));
        if (p < 1) raf = requestAnimationFrame(tick);
        else setText(fmt(value));
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !started) {
            started = true;
            run();
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.45 },
    );

    io.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, decimals, locale, grouping, prefix, suffix]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {text}
    </span>
  );
}

const SCRAMBLE_CHARS = "!<>-_\\/[]{}=+*^?#01";

/**
 * Decrypt / scramble-in reveal for a short string (a console URL, a code).
 * On-theme for a security-minded civic tool. Reduced-motion → plain text.
 */
export function Scramble({
  text,
  className,
  duration = 900,
}: {
  text: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [out, setOut] = useState(text);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setOut(text);
      return;
    }

    let raf = 0;
    let started = false;

    const run = () => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        const lock = Math.floor(p * text.length);
        let s = "";
        for (let i = 0; i < text.length; i++) {
          const c = text[i];
          if (i < lock || c === " " || c === "." || c === "/" || c === ":") s += c;
          else s += SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
        }
        setOut(s);
        if (p < 1) raf = requestAnimationFrame(tick);
        else setOut(text);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !started) {
            started = true;
            run();
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.6 },
    );

    io.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [text, duration]);

  return (
    <span ref={ref} className={className}>
      {out}
    </span>
  );
}

/**
 * True once the window has scrolled past `offset` px. Used to make the
 * fixed header settle into a more solid, elevated glass on scroll.
 */
export function useScrolled(offset = 8): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [offset]);
  return scrolled;
}
