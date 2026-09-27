const api = globalThis.browser ?? globalThis.chrome;
const root = document.documentElement;

let enabled = true;
let hideHome = false;
let disableStories = false;
let ready = false;
let href = "";
let suggestedDone = false;
let suggestedTries = 0;

const style = document.createElement("style");
style.textContent = `
html.unscroll a[href="/reels/"],
html.unscroll :is(div,span):has(> :is(div,span) > :is(div,span) > a[href="/reels/"]){display:none!important}
html.unscroll-explore a[href*="/p/"],
html.unscroll-explore a[href*="/reel/"],
html.unscroll-explore svg[aria-label="Loading..."]{display:none!important}
html.unscroll-no-home a:has(svg[aria-label="Home"]),
html.unscroll-no-home :is(div,span):has(> :is(div,span) > :is(div,span) > :is(div,span) > a:has(svg[aria-label="Home"])){display:none!important}
html.unscroll-no-stories [data-pagelet="story_tray"]{display:none!important}
.unscroll-hide{display:none!important}
html.unscroll div[role="dialog"] button[aria-label*="Next" i],
html.unscroll div[role="dialog"] button[aria-label*="Previous" i],
html.unscroll div[role="dialog"] button[aria-label*="Nächste" i],
html.unscroll div[role="dialog"] button[aria-label*="Vorherige" i],
html.unscroll div[role="dialog"] div[role="button"]:has(svg[aria-label*="Next" i]),
html.unscroll div[role="dialog"] div[role="button"]:has(svg[aria-label*="Previous" i]) {
  display: none !important;
}
`;
root.prepend(style);

const inbox = "https://www.instagram.com/direct/inbox/";
const following = "https://www.instagram.com/?variant=following";

const BLOCKED_REEL_KEYS = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp"]);
const NAV_BUTTON_REGEX = /next|nächste|previous|vorherige|\bdown\b|\bup\b/i;
const CLOSE_BUTTON_REGEX = /close|schließen/i;

function getReelOverlay() {
  const dialog = document.querySelector('div[role="dialog"]');
  if (dialog && (dialog.querySelector("video") || dialog.querySelector('a[href*="/reel/"]'))) {
    return dialog;
  }

  const videos = document.querySelectorAll("video");
  for (const video of videos) {
    let el = video.parentElement;
    while (el && el !== document.body && el !== document.documentElement) {
      const rect = el.getBoundingClientRect();
      if (rect.height > window.innerHeight * 0.7 && rect.width > 300) {
        const computed = window.getComputedStyle(el);
        if (
          computed.position === "fixed" ||
          computed.position === "absolute" ||
          el.getAttribute("role") === "dialog"
        ) {
          return el;
        }
      }
      el = el.parentElement;
    }
  }
  return null;
}

function lockReelScroll(overlay) {
  if (!overlay) return;
  overlay.style.setProperty("overflow", "hidden", "important");
  overlay.style.setProperty("scroll-snap-type", "none", "important");
  overlay.style.setProperty("touch-action", "none", "important");
  overlay.style.setProperty("overscroll-behavior", "contain", "important");

  const scrollables = overlay.querySelectorAll("div, article, section");
  for (const el of scrollables) {
    if (el.scrollHeight > el.clientHeight && el.clientHeight > window.innerHeight * 0.5) {
      el.style.setProperty("overflow-y", "hidden", "important");
      el.style.setProperty("scroll-snap-type", "none", "important");
      el.style.setProperty("touch-action", "none", "important");
    }
  }
}

function isEventInReelOverlay(e) {
  const overlay = getReelOverlay();
  return Boolean(overlay && (overlay === e.target || overlay.contains(e.target)));
}

function blockReelScrollEvent(e) {
  if (!enabled || !ready) return;
  if (isEventInReelOverlay(e)) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
}

window.addEventListener("wheel", blockReelScrollEvent, { capture: true, passive: false });
window.addEventListener("touchmove", blockReelScrollEvent, { capture: true, passive: false });

window.addEventListener(
  "keydown",
  (e) => {
    if (!enabled || !ready || !BLOCKED_REEL_KEYS.has(e.key)) return;
    if (!getReelOverlay()) return;

    const activeEl = document.activeElement;
    if (
      activeEl?.tagName === "INPUT" ||
      activeEl?.tagName === "TEXTAREA" ||
      activeEl?.isContentEditable
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  },
  { capture: true }
);

window.addEventListener(
  "click",
  (e) => {
    if (!enabled || !ready) return;
    const overlay = getReelOverlay();
    if (!overlay) return;

    const btn = e.target.closest('button, [role="button"]');
    if (btn && overlay.contains(btn)) {
      const label = (
        btn.getAttribute("aria-label") ||
        btn.querySelector("svg")?.getAttribute("aria-label") ||
        ""
      );

      if (NAV_BUTTON_REGEX.test(label) && !CLOSE_BUTTON_REGEX.test(label)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    }
  },
  { capture: true }
);

function apply() {
  const path = location.pathname;
  const search = location.search;
  const feed = path === "/";
  const onFollowing = search.includes("variant=following");
  const reels = path.startsWith("/reels");
  const stories = path.startsWith("/stories");
  const explore = path.startsWith("/explore");

  root.classList.toggle("unscroll", enabled);
  root.classList.toggle("unscroll-explore", enabled && explore);
  root.classList.toggle("unscroll-no-home", enabled && hideHome);
  root.classList.toggle("unscroll-no-stories", enabled && disableStories);

  if (!enabled || !ready) return;

  const to = hideHome ? inbox : following;
  const leaveFeed = hideHome ? feed : feed && !onFollowing;
  if (reels || leaveFeed || (stories && disableStories)) {
    if (!location.href.startsWith(to)) location.replace(to);
    return;
  }

  if (hideHome) {
    const icons = document.querySelectorAll('svg[aria-label="Home"]');
    const link = icons[icons.length - 1]?.closest("a");
    const box = link?.parentElement?.parentElement?.parentElement?.parentElement || link;
    box?.classList.add("unscroll-hide");
  }

  const overlay = getReelOverlay();
  if (overlay) {
    lockReelScroll(overlay);
  }

  if (suggestedDone || !document.body) return;
  const span = document.evaluate(
    ".//span[normalize-space()='Suggested for you']",
    document.body,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE
  ).singleNodeValue;
  const box = span?.closest("div")?.parentElement?.parentElement;
  if (!box) {
    if (++suggestedTries > 40) suggestedDone = true;
    return;
  }
  box.classList.add("unscroll-hide");
  suggestedDone = true;
}

function tick() {
  if (location.href !== href) {
    href = location.href;
    suggestedDone = false;
    suggestedTries = 0;
  }
  apply();
}

function loadSettings(s) {
  enabled = s.enabled ?? true;
  hideHome = s.hideHome ?? false;
  disableStories = s.disableStories ?? false;
  ready = true;
  href = "";
  suggestedDone = false;
  suggestedTries = 0;
  tick();
}

api.storage.sync.get(["enabled", "hideHome", "disableStories"]).then(loadSettings);

api.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  if (changes.enabled) enabled = changes.enabled.newValue ?? true;
  if (changes.hideHome) hideHome = changes.hideHome.newValue ?? false;
  if (changes.disableStories) disableStories = changes.disableStories.newValue ?? false;
  href = "";
  suggestedDone = false;
  suggestedTries = 0;
  tick();
});

addEventListener("popstate", () => {
  href = "";
  tick();
});

setInterval(tick, 250);
tick();
