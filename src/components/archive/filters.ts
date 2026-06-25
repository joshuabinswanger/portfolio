// Client-side runtime for the archive filter/sort UI.
//
// Extracted from ArchiveGallery_BoxFilters.astro to match the project
// convention of colocating client logic in plain `.ts` helpers per system
// (see gallery/utils.ts, list/utils.ts). This is behaviour-only — it reads
// everything from the rendered DOM; the markup, the `define:vars` CSS, and the
// fragile mobile/iOS animation layer stay in the .astro component.
//
// `initArchiveFilters()` registers the `astro:page-load` / `astro:before-swap`
// listeners that drive MixItUp + PhotoSwipe across View Transitions. Call it
// once from the component's bundled module script.

import mixitup from "mixitup";
import mixitupMultifilter from "mixitup-multifilter";
import PhotoSwipeLightbox from "photoswipe/lightbox";

//////////////////////////////
///////MixItUp FUNCTIONS//////
//////////////////////////////

type PhotoSwipeDataItem = {
  src: string | null;
  width: number;
  height: number;
  alt: string;
  title: string;
  description_title: string | null;
  description_text: string | null;
};

let mixer:
  | { destroy: () => void; configure: (options: unknown) => void; show: () => void }
  | undefined = undefined;
let lightbox: InstanceType<typeof PhotoSwipeLightbox> | null = null;
let imageDataSource: PhotoSwipeDataItem[] = [];

function getArchiveContainer() {
  const containerEl = document.querySelector<HTMLElement>("#archive-wrapper");

  if (!containerEl) {
    throw new Error("Archive wrapper not found");
  }

  return containerEl;
}

// Updates Active Filters List on MixItUp end
function updateActiveFiltersList() {
  const activeFiltersContainer = document.getElementById("active-filters-list");

  if (!activeFiltersContainer) {
    return;
  }

  // Clear current filters
  activeFiltersContainer.innerHTML = "";

  // Select active filter buttons
  const activeButtons = document.querySelectorAll<HTMLButtonElement>(
    ".filter-button.mixitup-control-active",
  );

  // Retrieve Astro scoped attribute from the container or existing element
  const astroScopedAttr = activeFiltersContainer.attributes;
  let astroCidAttr = "";

  for (const attr of astroScopedAttr) {
    if (attr.name.startsWith("data-astro-cid-")) {
      astroCidAttr = attr.name;
      break;
    }
  }

  // Generate active filter divs with Astro scoped ID
  activeButtons.forEach((button) => {
    const filterName =
      button.getAttribute("data-filter-name") || button.textContent?.trim() || "";
    const filterClass = button.getAttribute("data-toggle")?.replace(".", "") ?? "";

    // Create div element
    const div = document.createElement("div");
    div.classList.add("active-filter");

    // Add Astro scoped attribute if found
    if (astroCidAttr) {
      div.setAttribute(astroCidAttr, "");
    }

    div.textContent = filterName;
    div.dataset.filterClass = filterClass;

    // Add click-to-remove event handler
    div.addEventListener("click", removeActiveFilter);

    activeFiltersContainer.appendChild(div);
  });

  // Update CSS variable for dynamic column count.
  // Set it on #filter-box (the chip grid's ancestor) so both the chip grid
  // and the #filter-box column-width calc resolve the same live value.
  const filterBox = document.getElementById("filter-box");
  filterBox?.style.setProperty(
    "--active-filters-list-length",
    String(activeButtons.length),
  );

  // Show the active-filter count in brackets on the Filter button, e.g. "Filter [2]".
  const filterCount = document.getElementById("filter-count");
  if (filterCount) {
    filterCount.textContent =
      activeButtons.length > 0 ? ` [${activeButtons.length}]` : "";
  }
}

// Function to handle removing filters on click
function removeActiveFilter(event: MouseEvent) {
  const filterClass = (event.currentTarget as HTMLElement).dataset.filterClass;

  if (!filterClass) {
    return;
  }

  // Find corresponding button and simulate a click to deactivate it
  const correspondingButton = document.querySelector<HTMLButtonElement>(
    `.filter-button[data-toggle=".${filterClass}"].mixitup-control-active`,
  );

  if (correspondingButton) {
    correspondingButton.click();
  }
}

function updateFilterButtonAvailability() {
  // Select visible archive items (assuming items hidden by filtering have 'display: none')
  const visibleItems = document.querySelectorAll<HTMLElement>(
    '#grid-container .archiveElement:not([style*="display: none"])',
  );
  // Get all filter buttons (adjust the selector as needed)
  const filterButtons = document.querySelectorAll<HTMLButtonElement>(
    ".filter-group .filter-button",
  );

  filterButtons.forEach((button) => {
    // Remove the leading dot if present (or adjust as needed)
    const filterValue = button.getAttribute("data-toggle")?.replace(".", "") ?? "";
    // Check if any visible element has this filter value as a class.
    let hasMatch = false;
    visibleItems.forEach((item) => {
      if (item.classList.contains(filterValue)) {
        hasMatch = true;
      }
    });
    // Update the button's state based on whether there's a match.
    if (!hasMatch) {
      button.classList.add("filter-disabled");
      button.disabled = true;
    } else {
      button.classList.remove("filter-disabled");
      button.disabled = false;
    }
  });
}

//////////////////////////////
///////ZOOM (COLUMN COUNT)/////
//////////////////////////////

// The archive grid's column count is driven by the --archive-columns CSS custom
// property on the grid container (see .archive-grid in GridLayout.astro). The
// +/- buttons step it by one and persist the choice. The upper bound is
// breakpoint-aware: phones get a smaller range (more columns would be too tiny).
const ZOOM_STORAGE_KEY = "archiveColumns";
const ZOOM_MIN = 1;
const ZOOM_MAX_DESKTOP = 10;
const ZOOM_MAX_MOBILE = 4;
const ZOOM_MOBILE_QUERY = "(max-width: 767px)"; // matches --bp-mobile

function getMaxColumns(): number {
  return window.matchMedia(ZOOM_MOBILE_QUERY).matches
    ? ZOOM_MAX_MOBILE
    : ZOOM_MAX_DESKTOP;
}

function getArchiveGrid() {
  return document.querySelector<HTMLElement>("#archive .archive-grid");
}

// Current column count: the live applied value (inline --archive-columns) if set,
// otherwise the count the CSS resolved for this breakpoint (computed track list).
// Reading the applied value — not raw storage — keeps stepping correct when a
// stored desktop value is clamped down on mobile.
function getArchiveColumnCount(grid: HTMLElement): number {
  const inline = grid.style.getPropertyValue("--archive-columns").trim();
  if (inline) {
    const n = parseInt(inline, 10);
    if (Number.isFinite(n)) return n;
  }
  const tracks = getComputedStyle(grid)
    .gridTemplateColumns.split(" ")
    .filter(Boolean).length;
  return tracks || 4;
}

// Changing the column count reflows the grid, which would otherwise snap. FLIP
// (First-Last-Invert-Play): measure each visible cell, apply the layout change,
// measure again, then animate from the old box to the new one with a transform.
// Transforms are GPU-compositable and don't touch grid tracks, so this is smooth
// and WebKit-safe (unlike interpolating grid-template-columns). Honours
// prefers-reduced-motion. Cells are always square, so scaleX == scaleY — the
// image scales uniformly with no distortion.
const ZOOM_ANIM_ID = "archiveZoom";

function flipColumnChange(grid: HTMLElement, apply: () => void) {
  const items = Array.from(
    grid.querySelectorAll<HTMLElement>(".archiveElement"),
  ).filter((el) => el.offsetParent !== null); // skip filtered-out (display:none) cells

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (reduceMotion || items.length === 0) {
    apply();
    return;
  }

  // Cancel any in-flight zoom animation so measurements reflect true layout,
  // not a transformed mid-animation box.
  items.forEach((el) =>
    el.getAnimations().forEach((a) => {
      if (a.id === ZOOM_ANIM_ID) a.cancel();
    }),
  );

  const firstRects = items.map((el) => el.getBoundingClientRect());
  apply();

  items.forEach((el, i) => {
    const first = firstRects[i];
    const last = el.getBoundingClientRect();
    const dx = first.left - last.left;
    const dy = first.top - last.top;
    const sx = last.width ? first.width / last.width : 1;
    const sy = last.height ? first.height / last.height : 1;

    // Skip cells that didn't move or resize.
    if (
      Math.abs(dx) < 0.5 &&
      Math.abs(dy) < 0.5 &&
      Math.abs(sx - 1) < 0.001 &&
      Math.abs(sy - 1) < 0.001
    ) {
      return;
    }

    const anim = el.animate(
      [
        {
          transformOrigin: "top left",
          transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
        },
        { transformOrigin: "top left", transform: "none" },
      ],
      { duration: 300, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
    );
    anim.id = ZOOM_ANIM_ID;
  });
}

function initArchiveZoom() {
  const grid = getArchiveGrid();
  const zoomIn = document.getElementById("zoom-in");
  const zoomOut = document.getElementById("zoom-out");
  if (!grid || !zoomIn || !zoomOut) return;

  // Re-apply a persisted override after a fresh load / View Transition swap,
  // clamped to this breakpoint's range. Storage is left untouched so a desktop
  // preference survives a mobile visit (where it's only displayed clamped).
  const stored = localStorage.getItem(ZOOM_STORAGE_KEY);
  if (stored) {
    const n = parseInt(stored, 10);
    if (Number.isFinite(n)) {
      const clamped = Math.max(ZOOM_MIN, Math.min(getMaxColumns(), n));
      grid.style.setProperty("--archive-columns", String(clamped));
    }
  }

  // "+" (#zoom-in) zooms in: fewer columns, larger images.
  // "−" (#zoom-out) zooms out: more columns, smaller images.
  const refreshDisabled = (count: number) => {
    (zoomIn as HTMLButtonElement).disabled = count <= ZOOM_MIN;
    (zoomOut as HTMLButtonElement).disabled = count >= getMaxColumns();
  };

  // The per-cell title caption is only revealed at a single column.
  const syncSingleColumn = (count: number) => {
    grid.classList.toggle("is-single-column", count === ZOOM_MIN);
  };

  const setColumns = (count: number) => {
    const clamped = Math.max(ZOOM_MIN, Math.min(getMaxColumns(), count));
    flipColumnChange(grid, () => {
      grid.style.setProperty("--archive-columns", String(clamped));
      // Toggle inside the FLIP "apply" so the post-change measurement includes
      // the caption's height and the reflow animates cleanly.
      syncSingleColumn(clamped);
    });
    localStorage.setItem(ZOOM_STORAGE_KEY, String(clamped));
    refreshDisabled(clamped);
  };

  zoomIn.addEventListener("click", () => setColumns(getArchiveColumnCount(grid) - 1));
  zoomOut.addEventListener("click", () => setColumns(getArchiveColumnCount(grid) + 1));

  const initialCount = getArchiveColumnCount(grid);
  refreshDisabled(initialCount);
  syncSingleColumn(initialCount);
}

///////////////////////////////////////////////////////
/////////////// PHOTOSWIPE FUNCTIONS //////////////////
//////////////////////////////////////////////////////

// Function to build the image data source array by reading attributes from each .photo-link element
function createPhotoSwipeDataSource() {
  imageDataSource.length = 0;

  const allLinks = Array.from(
    document.querySelectorAll<HTMLAnchorElement>(".photo-link"),
  );
  const dataSources = allLinks.filter((link) => link.offsetParent !== null);

  dataSources.forEach((link, index) => {
    link.onclick = (event) => {
      event.preventDefault();
      lightbox?.loadAndOpen(index);
    };
  });

  dataSources.forEach((link) => {
    const img = link.querySelector<HTMLImageElement>("img");

    imageDataSource.push({
      src: link.getAttribute("href"),
      width: Number(link.getAttribute("data-pswp-width")) || 0,
      height: Number(link.getAttribute("data-pswp-height")) || 0,
      alt: img?.getAttribute("alt") ?? "",
      // Bottom title: resolved once at build time (description_title, else a
      // humanised project name) and exposed via data-title on the link — same
      // value the single-column grid caption uses. See archive/utils.ts.
      title: link.getAttribute("data-title") ?? "",
      description_title: link.getAttribute("data-description_title"),
      description_text: link.getAttribute("data-description_text"),
    });
  });
}

// Archive lightbox caption: a single clean title centred at the bottom. (The
// shared gallery caption in photoswipeCaption.ts renders title + full
// description text; the archive deliberately shows title-only — see the
// `title` field built in createPhotoSwipeDataSource above.)
function registerArchiveTitle(lb: InstanceType<typeof PhotoSwipeLightbox>) {
  lb.on("uiRegister", () => {
    lb.pswp.ui.registerElement({
      name: "archive-title",
      order: 9,
      isButton: false,
      appendTo: "wrapper",
      html: "",
      onInit: (element, pswp) => {
        pswp.on("change", () => {
          const data = pswp.currSlide?.data as { title?: string } | undefined;
          const title = data?.title ?? "";
          element.innerHTML = title ? `<p>${title}</p>` : "";
        });
      },
    });
  });
}

// SVG strings for the arrow and close icons
const leftArrowSVGString =
  '<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 155 139" width="39" height="35"><path d="m0 69 69 69 14-12-45-46h116V58H38l44-44L69 0 0 69Z" style="fill-rule:nonzero"/></svg>';
const CloseSVGString =
  '<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 139 139" width="139" height="139"><path d="m69 83-56 55-13-12 56-57L0 14 13 0l56 56 56-56 13 14-55 55 55 57-13 12-56-55Z"/></svg>';

// Utility function to detect phone portrait mode
function isPhonePortrait() {
  return window.matchMedia("(max-width: 650px) and (orientation: portrait)").matches;
}

/////////////////////////////////////////
////////////// page load ////////////////
////////////////////////////////////////

export function initArchiveFilters() {
  document.addEventListener("astro:page-load", () => {
    // --- START: Add Mutual Exclusivity Logic ---
    const filterButton = document.getElementById("filter");
    const sortButton = document.getElementById("sort");
    const filterSortWrapper = document.getElementById("filter-sort-wrapper");

    // Opening the filter doesn't change #filter-sort-wrapper's own grid columns
    // (both base and :has(#filter.active) resolve to "56px auto"), so WebKit/iOS
    // doesn't re-resolve the `auto` track the filter box lives in until some other
    // container-level relayout happens (e.g. opening Sort). Force a synchronous
    // layout flush after each toggle so the panel expands on first tap.
    const nudgeReflow = () => {
      if (filterSortWrapper) void filterSortWrapper.offsetWidth;
    };

    if (filterButton && sortButton) {
      // Ensure buttons exist
      filterButton.addEventListener("click", () => {
        const currentlyActive = filterButton.classList.contains("active");
        // If activating filter, deactivate sort first
        if (!currentlyActive) {
          sortButton.classList.remove("active");
        }
        // Now toggle filter's state
        filterButton.classList.toggle("active");
        nudgeReflow();
      });

      sortButton.addEventListener("click", () => {
        const currentlyActive = sortButton.classList.contains("active");
        // If activating sort, deactivate filter first
        if (!currentlyActive) {
          filterButton.classList.remove("active");
        }
        // Now toggle sort's state
        sortButton.classList.toggle("active");
        nudgeReflow();
      });
    } else {
      console.error("Could not find filter or sort button elements.");
    }
    // --- END: Add Mutual Exclusivity Logic ---

    // --- START: NEW - Close Sort dropdown when an option is clicked ---
    const sortOptionButtons = document.querySelectorAll<HTMLButtonElement>(
      "#sort-buttons .sort-button",
    ); // Get specific sort option buttons

    if (sortButton && sortOptionButtons.length > 0) {
      sortOptionButtons.forEach((optionBtn) => {
        optionBtn.addEventListener("click", () => {
          // When a sort option like 'Random', 'Project', 'Date' is clicked...
          // ...remove the 'active' class from the main Sort button to close the dropdown
          setTimeout(() => {
            sortButton.classList.remove("active");
          }, 500);
        });
      });
    } else {
      if (!sortButton)
        console.error("Main sort button (#sort) not found for close logic.");
      if (sortOptionButtons.length === 0)
        console.error("Sort option buttons not found for close logic.");
    }
    // --- END: NEW - Close Sort dropdown ---

    // Wire the +/- grid zoom control.
    initArchiveZoom();

    /////////////////////
    ///////MixItUp//////
    /////////////////////

    const containerEl = getArchiveContainer();

    mixitup.use(mixitupMultifilter);

    mixer = mixitup(containerEl, {
      selectors: {
        target: ".mix",
      },
      animation: {
        enable: false,
      },
      multifilter: {
        enable: true, // enable the multifilter extension for the mixer
      },
      debug: {
        enable: true,
      },

      load: {
        sort: "random",
      },

      callbacks: {
        onMixEnd: function () {
          createPhotoSwipeDataSource();
          updateActiveFiltersList();
          updateFilterButtonAvailability();

          // Scroll to the top of the page smoothly after the mix operation
          window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        },
      },
    });

    createPhotoSwipeDataSource();

    mixer.configure({
      animation: {
        enable: true,
        duration: 300,
      },
    });

    const filterResetButton =
      document.querySelector<HTMLButtonElement>(`#filter-reset-all`);
    filterResetButton?.addEventListener(`click`, () => {
      mixer?.show();
    });

    ////////////////////////////////////////////////////////////
    ///////////////     PHOTOSWIPE ////////////////////////////
    ///////////////////////////////////////////////////////////

    // If the lightbox is not yet initialized, create it
    if (!lightbox) {
      // Assign to the outer scoped variable (do not use "const" here)
      lightbox = new PhotoSwipeLightbox({
        dataSource: imageDataSource,
        arrowPrevSVG: leftArrowSVGString,
        arrowNextSVG: leftArrowSVGString,
        closeSVG: CloseSVGString,
        initialZoomLevel: "fit" as const,
        bgOpacity: 0.95,
        zoom: false,
        mainClass: "pswp--custom-bg pswp--custom-icon-colors",
        paddingFn: () => {
          // Larger gutters give the image room to breathe and leave space at
          // the bottom for the title caption (registerArchiveTitle).
          return isPhonePortrait()
            ? { top: 0, bottom: 56, left: 16, right: 16 }
            : { top: 56, bottom: 110, left: 160, right: 160 };
        },
        showHideAnimationType: "fade" as const,
        pswpModule: () => import("photoswipe"),
      });

      // Initialize the PhotoSwipe lightbox
      lightbox.init();

      registerArchiveTitle(lightbox);
    }
  });

  ///////////////////////////////////
  ///////before swap clean up //////
  ///////////////////////////////////

  document.addEventListener("astro:before-swap", () => {
    /////////////////////
    ///////MixItUp//////
    /////////////////////

    mixer?.destroy();
    mixer = undefined;

    imageDataSource.length = 0;

    ////////////////////////////////////////////////////////////
    ///////////////     PHOTOSWIPE ////////////////////////////
    ///////////////////////////////////////////////////////////

    if (lightbox) {
      lightbox.destroy();
      lightbox = null;
    }
  });
}
