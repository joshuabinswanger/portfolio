# NZZ Bewerbung Scrollytelling

`/nzz-bewerbung` is a one-page application for NZZ Visuals, told as a pinned
scrollytelling sequence. This note records how the scroll behaviour works and
why it ended up this way (PRs #15–#21, 2026-11-04). Read it before changing
the page's scrolling or animation.

## Main files

- `src/pages/nzz-bewerbung.astro` — route; wraps the component in `Main`.
- `src/components/projects/NZZBewerbung.astro` — everything else: markup,
  the GSAP timeline, Lenis setup, the input gates, the flower canvas, styles.

## How it should feel (the agreed design)

1. **One item per swipe.** A trackpad or finger swipe moves exactly one item
   (image, text block), never several, however hard the flick.
2. **A pause on every item (desktop).** After an item arrives there is a
   stretch of scrolling where nothing moves, so it can be read.
3. **Items move like a scrolled page.** They come up from below the screen and
   leave over the top at a constant speed, moving 1:1 with the scroll. No
   zoom, no fade "from the back". The outgoing and incoming item move
   together, like one continuous page, with no blank screen in between,
   not even at chapter boundaries.
4. **On phones the images follow the finger at once** and settle on release:
   on to the next item if the drag went far or fast enough, otherwise back.
5. **Subtle text settle.** Text lines trail slightly and brighten one after
   the other, landing together with their item.
6. **The flower finale scrolls freely.** After the last closing text, there is
   no snapping and no cap.

## Architecture

### Timeline

One GSAP timeline (`masterTl`) is pinned to `#scrolly-container` by
ScrollTrigger and scrubbed by the scroll (`scrub: 0.8`). Four panels
(`#panel-intro`, `#panel-work`, `#panel-werdegang`, `#panel-zukunft`) are
stacked absolutely; every item is a full-screen layer.

Helpers build the sequence:

- `slideIn(selector, sync, snap)` — `y: 100vh → 0`, `ease: "none"`, 1 unit.
  `sync` starts it with the previous tween (`"<"`), otherwise after it.
  `snap` (default true) adds a resting point after it (`addStep`).
- `slideOut(selector, sync)` — `y: 0 → -100vh`, `ease: "none"`, 1 unit.
- `addStep()` — `STEP_HOLD / 2` of empty time, a `snap-N` label, another
  `STEP_HOLD / 2`. The label sits mid-hold, so a small scroll either way stays
  on the item.
- `settleText(selector)` — the text settle (see below); called by `slideIn`.

The usual pattern is `slideOut(a); slideIn(b, true)`: `a` leaves while `b`
arrives.

Chapter labels (`chapter-1/3/5/6/7/8`) drive the progress words and their
click targets. They sit at the start (`"<"`) of the last item's exit, and the
panel opacity switches sit there too, so the next chapter rises together with
the last item. In chapter 8 `#panel-werdegang` is hidden only 1 unit later,
after the portfolio link has fully left, so the link isn't cut off mid-move.

### Scroll length

`end` is derived from the timeline: `duration × SCROLL_PER_UNIT × innerHeight`.
With `SCROLL_PER_UNIT = 1`, a transition (1 unit, one screen height of
movement) takes exactly one screen of scroll, so content tracks the input 1:1.

### Resting points

`stepPoints()` = `0` plus every `snap-*` label up to the `free-scroll` label,
as progress (0–1). Chapter labels are excluded: they sit on in-between
states. `neighbourStep(p, dir)` and `nearestStep(p)` work on this list;
`inFreeZone(p)` is true past the last resting point (the finale).

### Snapping

ScrollTrigger snap with a custom `snapStep`:

- directional (`ScrollTrigger.snapDirectional`) — goes to the next resting
  point in the scroll direction;
- capped to one step from the swipe's start (`wheelBase`) for wheel input;
- returns the position unchanged during a touch gesture (touch places itself)
  and in the free zone;
- `inertia: false`, `delay: 0.1`, `duration: { min: 0.6, max: 1.2 }`.

### Wheel / trackpad: one item per swipe (`gateWheel`)

Lenis' `virtualScroll` hook sees every wheel event before Lenis applies it.
Returning `false` (after `preventDefault()`) swallows it.

- A new gesture is a gap of more than `GESTURE_GAP_MS` (180 ms) in the event
  stream, or the deltas jumping back up after decaying momentum.
- At each new gesture, `wheelBase` = the resting point nearest the **live**
  scroll position.
- Once Lenis' target reaches the neighbouring resting point, the rest of the
  gesture (including macOS momentum) is swallowed (`lockedDir`).
- Opposite direction is never blocked; the start, the free zone and positions
  outside the story scroll freely.
- `wheelMultiplier: 1` (it was 1.3, which made swipes travel further).

### Touch: follow the finger, settle on release (`gateTouch`)

`syncTouch: true` makes Lenis drive touch scrolling instead of native iOS
momentum, so touch events go through the same hook.

- Touch screens (`pointer: coarse`) get `STEP_HOLD = 0`, so a drag moves the
  images from the first pixel.
- `touchmove` follows the finger but stops at the neighbouring item.
- `touchend` decides: advance if the drag covered `ADVANCE_FRACTION` (0.25)
  of the way, or if finger speed over the last ~120 ms is at least
  `FLICK_PX_PER_MS` (0.4) in the drag direction; otherwise snap back.
- The glide is `lenis.scrollTo` with ease-out cubic, `GLIDE_SECONDS` (1.2 s)
  for a full item, scaled down for shorter distances (min 35%).
- Taps (no movement) pass through untouched, so links and progress words work.

### Text settle

For each item that slides in, its text lines (`:scope > .text-block`,
`.img-caption > h2`, `.img-caption > p`) go from `y: 32px, opacity: 0.25` to
rest, `ease: "power2.out"`, 0.75 units each, staggered over 0.25 units. That
adds up to the item's 1-unit move, so resting points and scroll length don't
change. Elements that are themselves `.text-block` (e.g. `.intro-reveal-1`)
are not double-animated. The intro heading is static.

### Free finale

A `free-scroll` label after `slideIn(".text-p8-4")` marks the end of
stepping. The flower canvas and "Vielen Dank" slide in with `snap = false`.
Past the last resting point, snapping, the wheel cap and the touch gate all
stand aside (touch falls back to Lenis inertia). Scrolling back up past that
point steps again.

## Decisions and what we learned

| Problem                                        | Cause                                                                                                                  | Fix                                                     |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| A trackpad swipe jumped several items          | ~0.9 screens per item, wheel ×1.3, momentum carried past labels                                                        | Holds per item, multiplier 1, one-item gate (#15)       |
| Snaps landed on blank frames                   | Snap used all labels, incl. chapter labels                                                                             | Snap only to `snap-*` points (#15)                      |
| iPhone swipes still skipped items              | Touch was native; the gate only saw wheel events                                                                       | `syncTouch` + touch gate (#16)                          |
| MacBook stuck at the wood image                | Base was taken from the snap's `onComplete`; a skipped or interrupted snap left it stale and every swipe was swallowed | Base from the live position at each gesture start (#16) |
| Fast scrolls/jumps snapped far ahead           | ScrollTrigger snap `inertia` projects velocity forward                                                                 | `inertia: false` (#16)                                  |
| Snap waited too long / transition too abrupt   | Long snap delay, short durations                                                                                       | Delay 0.1, glide 1.2 s, snap 0.6–1.2 s (#16, #17)       |
| Phone images stuck to the left edge            | Height-capped `<img>` in a grid cell defaults to start                                                                 | `justify-self: center` on mobile (#17)                  |
| Zoom/fade "from the back" felt wrong           | `fadeIn/fadeOut` scaled 0.8 → 1                                                                                        | Linear page-like slides, 1:1 scroll (#18)               |
| On iPhone the first part of a drag did nothing | The hold was a dead zone for the finger                                                                                | No hold on touch, settle on release (#19)               |
| Text felt static                               | —                                                                                                                      | Staggered text settle (#20)                             |
| Snapping fought the flower sequence            | Finale had snap points                                                                                                 | Free-scroll finale (#21)                                |

Rules that came out of this:

- Never derive "where the user rests" from snap callbacks. Read the live
  position.
- Keep every item transition exactly 1 unit and anything added inside it
  (like the text settle) within that unit, or resting points shift.
- Judge scroll feel on real devices (MacBook trackpad, iPhone). Synthetic
  wheel/touch events in headless browsers don't reproduce momentum, and the
  in-app browser pane throttles `requestAnimationFrame` when hidden.

## Tuning knobs

| Constant                      | Where         | Effect                                                |
| ----------------------------- | ------------- | ----------------------------------------------------- |
| `STEP_HOLD`                   | timeline      | Pause per item on desktop (0.6 units); 0 on touch     |
| `SCROLL_PER_UNIT`             | timeline      | Screens of scroll per unit; 1 = moves with the scroll |
| `GESTURE_GAP_MS`              | `gateWheel`   | Gap that starts a new trackpad gesture (180 ms)       |
| `ADVANCE_FRACTION`            | `gateTouch`   | Drag share needed to advance on release (0.25)        |
| `FLICK_PX_PER_MS`             | `gateTouch`   | Flick speed that advances (0.4 px/ms)                 |
| `GLIDE_SECONDS`               | `gateTouch`   | Release glide for a full item (1.2 s)                 |
| snap `delay` / `duration`     | ScrollTrigger | When the desktop snap starts and how long it takes    |
| `32` / `0.25` in `settleText` | text settle   | How far text trails and how dim it starts             |

## Change checklist

- New item: `slideOut(previous); slideIn(next, true)`. Pass `snap = false`
  only for items that shouldn't be a resting point.
- New chapter: put the label and panel switch at `"<"` of the last item's
  exit, and update the progress-word mapping in `onUpdate` and the click
  handler.
- Anything after `free-scroll` scrolls freely; move the label to change where
  stepping ends.
- Keep `npm run check` at 0 and `npx eslint` clean, then test on a MacBook
  trackpad and an iPhone.
