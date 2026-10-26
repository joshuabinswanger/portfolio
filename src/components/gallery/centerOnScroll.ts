// Mobile homepage: the galleries sit offset left/right in the 7-column grid
// (span 6 from column 1 or 2). While scrolling, each one slides sideways into
// the horizontal centre as it nears the middle of the screen, and back out as
// it leaves. Scroll-linked (no timers); off on desktop and under
// prefers-reduced-motion.

const MOBILE = "(max-width: 767px)";
const REDUCED = "(prefers-reduced-motion: reduce)";

let cleanup: (() => void) | null = null;

export function startCenterOnScroll(selector: string) {
  stopCenterOnScroll();
  const items = Array.from(document.querySelectorAll<HTMLElement>(selector));
  if (items.length === 0) return;

  const mobile = window.matchMedia(MOBILE);
  const reduced = window.matchMedia(REDUCED);
  const shift = new Map<HTMLElement, number>(); // currently applied px
  let frame = 0;

  const update = () => {
    frame = 0;
    const active = mobile.matches && !reduced.matches;
    const vh = window.innerHeight;
    items.forEach((el) => {
      const parent = el.parentElement;
      if (!active || !parent) {
        if (shift.has(el)) {
          el.style.transform = "";
          shift.delete(el);
        }
        return;
      }
      const applied = shift.get(el) ?? 0;
      const box = el.getBoundingClientRect();
      const host = parent.getBoundingClientRect();
      // Offset from centred, measured on the untransformed layout box.
      const toCentre =
        host.left + host.width / 2 - (box.left - applied + box.width / 2);
      // 1 when the gallery's middle is at the screen's middle, 0 from
      // roughly 60% of a screen away; smoothstep for a soft start and stop.
      const distance = Math.abs(box.top + box.height / 2 - vh / 2);
      const t = Math.min(Math.max(1 - distance / (vh * 0.6), 0), 1);
      const eased = t * t * (3 - 2 * t);
      const x = Math.round(toCentre * eased * 10) / 10;
      if (x !== applied) {
        el.style.transform = x ? `translate3d(${x}px, 0, 0)` : "";
        shift.set(el, x);
      }
    });
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  mobile.addEventListener("change", schedule);
  reduced.addEventListener("change", schedule);
  // Galleries start small (.restrain) and grow once loaded: re-measure.
  const resized = new ResizeObserver(schedule);
  items.forEach((el) => resized.observe(el));
  schedule();

  cleanup = () => {
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    mobile.removeEventListener("change", schedule);
    reduced.removeEventListener("change", schedule);
    resized.disconnect();
    items.forEach((el) => (el.style.transform = ""));
  };
}

export function stopCenterOnScroll() {
  cleanup?.();
  cleanup = null;
}
