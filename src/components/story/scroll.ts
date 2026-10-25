// Client runtime for project story pages (Story.astro).
//
// - Lenis smooth scrolling (skipped under prefers-reduced-motion).
// - Reveal-on-scroll: adds `.is-visible` to every [data-reveal] once.
// - Sticky blocks: the step nearest the viewport centre gets `.is-active`.
//
// Everything is torn down on `astro:before-swap` so View Transitions never
// double-init (the earlier /fire prototype leaked its Lenis + ticker; see
// docs/ux-review-2026-06-25.md F-2).

import Lenis from "lenis";

let lenis: Lenis | null = null;
let rafId = 0;
let observers: IntersectionObserver[] = [];

function reduceMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function startSmoothScroll() {
  if (reduceMotion()) return;
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  const loop = (time: number) => {
    lenis?.raf(time);
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);
}

function startReveals(root: HTMLElement) {
  const targets = root.querySelectorAll<HTMLElement>("[data-reveal]");
  if (targets.length === 0) return;

  if (reduceMotion()) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
  );
  targets.forEach((el) => io.observe(el));
  observers.push(io);
}

function startStickySteps(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>("[data-sticky]").forEach((block) => {
    const steps = Array.from(block.querySelectorAll<HTMLElement>("[data-step]"));
    if (steps.length === 0) return;

    // A band around the viewport centre: whichever step is inside it is active.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          steps.forEach((step) =>
            step.classList.toggle("is-active", step === entry.target),
          );
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    steps.forEach((step) => io.observe(step));
    observers.push(io);
  });
}

function teardown() {
  cancelAnimationFrame(rafId);
  rafId = 0;
  lenis?.destroy();
  lenis = null;
  observers.forEach((io) => io.disconnect());
  observers = [];
}

export function initStoryScroll() {
  document.addEventListener("astro:page-load", () => {
    const root = document.querySelector<HTMLElement>(".story");
    if (!root) return;
    teardown();
    startSmoothScroll();
    startReveals(root);
    startStickySteps(root);
  });

  document.addEventListener("astro:before-swap", teardown);
}
