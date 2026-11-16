// Desktop/tablet sidebar auto-hide. While the page scrolls down the sidebar
// slides out to the left; it comes back as soon as the user scrolls up, stops
// scrolling for IDLE_MS, or is near the top of the page. The visual part is
// the `.nav-hidden` class in NavigationBar.astro (which also keeps the
// sidebar visible while it holds keyboard focus).
//
// The sidebar is `transition:persist`, so this wires one window listener per
// full page load and just resets the state on every client-side navigation.

const HIDDEN_CLASS = "nav-hidden";
const IDLE_MS = 300; // pause after the last scroll event before it returns
const TOP_ZONE = 80; // px from the top where the sidebar always shows
const MIN_DELTA = 4; // ignore sub-pixel and trackpad jitter

let lastY = 0;
let idleTimer: number | undefined;
let wired = false;

function show(nav: HTMLElement) {
  nav.classList.remove(HIDDEN_CLASS);
}

function onScroll(nav: HTMLElement) {
  const y = window.scrollY;
  const delta = y - lastY;

  if (y < TOP_ZONE || delta < -MIN_DELTA) {
    show(nav);
  } else if (delta > MIN_DELTA) {
    nav.classList.add(HIDDEN_CLASS);
  }
  if (Math.abs(delta) > MIN_DELTA || y < TOP_ZONE) lastY = y;

  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => show(nav), IDLE_MS);
}

export function initNavAutoHide(navId: string) {
  const nav = document.getElementById(navId);
  if (!nav) return;

  show(nav);
  lastY = window.scrollY;

  if (wired) return;
  wired = true;
  window.addEventListener(
    "scroll",
    () => {
      const current = document.getElementById(navId);
      if (current) onScroll(current);
    },
    { passive: true },
  );
}
