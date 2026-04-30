/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare global {
  interface HTMLElement {
    hasClickListener?: boolean;
  }

  interface Window {
    pswpLightbox?: unknown;
  }
}

export {};
