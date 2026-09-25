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
`;
root.prepend(style);

const inbox = "https://www.instagram.com/direct/inbox/";
const following = "https://www.instagram.com/?variant=following";

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
