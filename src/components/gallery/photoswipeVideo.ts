// Shared PhotoSwipe video helpers used by PortfolioGallery and ProjectList.
import "@mux/mux-player";
import "@mux/mux-video";

export const leftArrowSVGString =
  '<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 155 139" "width="39" height="35"><path d="m0 69 69 69 14-12-45-46h116V58H38l44-44L69 0 0 69Z" style="fill-rule:nonzero"/></svg>';
export const CloseSVGString =
  '<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 139 139" "width="139" height="139"><path d="m69 83-56 55-13-12 56-57L0 14 13 0l56 56 56-56 13 14-55 55 55 57-13 12-56-55Z"/></svg>';

export function isPhonePortrait() {
  return window.matchMedia("(max-width: 650px) and (orientation: portrait)")
    .matches;
}

const MUX_ENV_KEY = import.meta.env.PUBLIC_MUX_ENV_KEY ?? "";

function escapeHtml(value: string | null) {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildMuxPlayerSlide(videoLink: HTMLAnchorElement) {
  const playbackId = videoLink.getAttribute("data-mux-playback-id");
  const poster = videoLink.getAttribute("data-mux-poster");
  const maxResolution = videoLink.getAttribute("data-mux-max-resolution");
  const width = videoLink.getAttribute("data-pswp-width") ?? "16";
  const height = videoLink.getAttribute("data-pswp-height") ?? "9";
  const showControls = videoLink.getAttribute("data-mux-controls") !== "false";
  const autoplay = videoLink.getAttribute("data-mux-autoplay") === "true";
  const loop = videoLink.getAttribute("data-mux-loop") === "true";
  const muted = videoLink.getAttribute("data-mux-muted") === "true";
  const title = escapeHtml(videoLink.getAttribute("data-description_title"));
  const posterAttr = poster ? ` poster="${escapeHtml(poster)}"` : "";
  const maxResolutionAttr = maxResolution
    ? ` max-resolution="${escapeHtml(maxResolution)}"`
    : "";
  const controlsAttr = showControls ? " controls" : "";
  const autoplayAttr = autoplay ? " autoplay" : "";
  const loopAttr = loop ? " loop" : "";
  const mutedAttr = muted ? " muted" : "";
  const envKeyAttr = MUX_ENV_KEY ? ` env-key="${escapeHtml(MUX_ENV_KEY)}"` : "";
  const muxElement = showControls ? "mux-player" : "mux-video";

  return {
    html: `<div class="pswp__video-slide photoswipeData" style="--video-aspect-ratio: ${escapeHtml(width)} / ${escapeHtml(height)};">
        <${muxElement}
          playback-id="${escapeHtml(playbackId)}"
          stream-type="on-demand"
          metadata-video-id="${escapeHtml(playbackId)}"
          metadata-video-title="${title}"
          ${controlsAttr}
          ${autoplayAttr}
          ${loopAttr}
          ${mutedAttr}
          playsinline
          ${posterAttr}
          ${maxResolutionAttr}
          ${envKeyAttr}
        ></${muxElement}>
      </div>`,
    width: videoLink.getAttribute("data-pswp-width"),
    height: videoLink.getAttribute("data-pswp-height"),
    description_title: videoLink.getAttribute("data-description_title"),
    description_text: videoLink.getAttribute("data-description_text"),
    link: videoLink.getAttribute("data-link"),
  };
}

export function pauseAllVideos(root: ParentNode = document) {
  root.querySelectorAll("video, mux-video, mux-player").forEach((video) => {
    if ("pause" in video && typeof video.pause === "function") {
      video.pause();
    }
  });
}

export function playAutoplayVideos(root: ParentNode) {
  root.querySelectorAll("video, mux-video, mux-player").forEach((video) => {
    if (
      video.hasAttribute("autoplay") &&
      "play" in video &&
      typeof video.play === "function"
    ) {
      video.play().catch(() => {});
    }
  });
}

export function playActivePhotoSwipeVideo() {
  window.requestAnimationFrame(() => {
    const activeSlide =
      document.querySelector<HTMLElement>(".pswp__item--active") ??
      document.querySelector<HTMLElement>(".pswp__item[aria-hidden='false']") ??
      document.querySelector<HTMLElement>(".pswp__video-slide");

    if (activeSlide) {
      playAutoplayVideos(activeSlide);
    }
  });
}
