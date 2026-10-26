import { placePreview } from "./listHelpers.ts";

const PREVIEW_WIDTH = 220;

// Cursor-following preview for the project list. Desktop pointers only; the
// returned function removes every listener and hides the image again.
export function initListPreview(list: HTMLElement): () => void {
  const preview = list.querySelector<HTMLImageElement>(".list-preview");

  if (
    !preview ||
    !window.matchMedia("(hover: hover) and (pointer: fine)").matches
  ) {
    return () => {};
  }

  let frame = 0;
  let currentSrc = "";
  let preloaded = false;
  // Kept so a frame queued before the pointer moved on can't resurrect the image.
  let visible = false;
  let pointer = { x: 0, y: 0 };
  let displayHeight = PREVIEW_WIDTH;

  function hide() {
    visible = false;
    preview!.hidden = true;
  }

  function rowFor(target: EventTarget | null): HTMLElement | null {
    return target instanceof Element
      ? target.closest<HTMLElement>(".ListElement")
      : null;
  }

  function onPointerMove(event: PointerEvent) {
    const row = rowFor(event.target);
    const src = row?.dataset.previewSrc;

    if (!row || !src || row.classList.contains("open")) {
      hide();
      return;
    }

    const width = Number(row.dataset.previewWidth);
    const height = Number(row.dataset.previewHeight);
    displayHeight =
      width > 0 && height > 0
        ? (PREVIEW_WIDTH * height) / width
        : PREVIEW_WIDTH;

    if (currentSrc !== src) {
      currentSrc = src;
      preview!.src = src;
    }

    visible = true;
    pointer = { x: event.clientX, y: event.clientY };

    if (frame) {
      return;
    }

    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!visible) {
        return;
      }

      const { x, y } = placePreview(
        pointer,
        { width: PREVIEW_WIDTH, height: displayHeight },
        { width: window.innerWidth, height: window.innerHeight },
      );

      preview!.style.height = `${displayHeight}px`;
      preview!.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      preview!.hidden = false;
    });
  }

  // Warm the cache once so the first swap between rows is instant.
  function onPointerEnter() {
    if (preloaded) {
      return;
    }
    preloaded = true;

    list.querySelectorAll<HTMLElement>("[data-preview-src]").forEach((row) => {
      const src = row.dataset.previewSrc;
      if (src) {
        new Image().src = src;
      }
    });
  }

  list.addEventListener("pointermove", onPointerMove);
  list.addEventListener("pointerleave", hide);
  list.addEventListener("click", hide);
  list.addEventListener("pointerenter", onPointerEnter);

  return () => {
    list.removeEventListener("pointermove", onPointerMove);
    list.removeEventListener("pointerleave", hide);
    list.removeEventListener("click", hide);
    list.removeEventListener("pointerenter", onPointerEnter);
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    hide();
  };
}
