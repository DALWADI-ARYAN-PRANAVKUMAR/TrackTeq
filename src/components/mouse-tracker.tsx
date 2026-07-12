import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";

/**
 * Minimal cursor companion: a single glowing ball that trails the cursor.
 * Disabled on touch devices and when the "Reduce motion" preference is on.
 */
export function MouseTracker() {
  const dot = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reducedMotion = useStore((s) => s.reducedMotion);

  useEffect(() => {
    if (reducedMotion) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;
    setVisible(true);

    let x = window.innerWidth / 2,
      y = window.innerHeight / 2;
    let tx = x,
      ty = y;
    let raf = 0;

    const move = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    const loop = () => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      if (dot.current) dot.current.style.transform = `translate3d(${x - 10}px, ${y - 10}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("mousemove", move);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
    };
  }, [reducedMotion]);

  if (!visible || reducedMotion) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden>
      <div
        ref={dot}
        className="absolute h-5 w-5 rounded-full"
        style={{
          background:
            "radial-gradient(circle, var(--color-primary) 0%, color-mix(in oklab, var(--color-primary) 40%, transparent) 55%, transparent 75%)",
          boxShadow:
            "0 0 16px 4px color-mix(in oklab, var(--color-primary) 60%, transparent), 0 0 40px 8px color-mix(in oklab, var(--color-primary) 30%, transparent)",
        }}
      />
    </div>
  );
}
