/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare global {
  interface ImportMetaEnv {
    readonly PUBLIC_MUX_ENV_ID?: string;
    readonly PUBLIC_MUX_ENV_KEY?: string;
  }

  interface HTMLElement {
    hasClickListener?: boolean;
  }

  interface Window {
    pswpLightbox?: unknown;
  }
}

export {};
