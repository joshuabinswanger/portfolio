// Mobile logo: folds into the left screen edge while the page scrolls down and
// unfolds on scroll up or back at the top. The class drives a CSS rotateY
// hinged on the left edge (see #Logo in the mobile navs).

const TOP = 24; // always unfolded this close to the top
const TRAVEL = 12; // px of scroll in one direction before the state flips

export function initLogoFold(logo: HTMLElement) {
  if (logo.dataset.fold) return; // the nav persists across page swaps
  logo.dataset.fold = "on";

  // `anchor` follows the furthest point in the current direction, so slow
  // smooth-scroll steps still add up to a flip.
  let anchor = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    const folded = logo.classList.contains("is-folded");
    if (y < TOP) {
      logo.classList.remove("is-folded");
      anchor = y;
    } else if (!folded) {
      if (y < anchor) anchor = y;
      else if (y - anchor > TRAVEL) {
        logo.classList.add("is-folded");
        anchor = y;
      }
    } else {
      if (y > anchor) anchor = y;
      else if (anchor - y > TRAVEL) {
        logo.classList.remove("is-folded");
        anchor = y;
      }
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
}
