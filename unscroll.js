let hideHome = false;
let hideSearch = false;
let isHomepage = false;
let isFollowingpage = false;
let isSearchpage = false;
let isReelspage = false;
let redirected = false;

let updateSettings = () => {
    let currentURL = window.location.href;
    isHomepage = /^https:\/\/www\.instagram\.com\/?$/.test(currentURL);
    isFollowingpage = currentURL.includes("variant=following");
    isSearchpage = currentURL.includes("/explore/");
    isReelspage = currentURL.includes("/reels/");
}
updateSettings();


// Retrieve user settings from storage
browser.storage.sync.get(["hideHome", "hideSearch"]).then(settings => {
    hideHome = settings.hideHome ?? false;
    hideSearch = settings.hideSearch ?? false;
    onPageUpdate();
});


let remReels = () => {
    let reelsLink = document.querySelector('a[href="/reels/"]');
    if (!reelsLink) {
        return
    }
    let container = reelsLink.parentElement.parentElement.parentElement;
    if (container) {
        container.remove();
    } else {
        reelsLink.remove();
    }
}

let remExplores = () => {
    if (isSearchpage) {
        const loader = document.querySelector('svg[aria-label="Loading..."]');
        if (loader) {
            loader.parentElement.remove();
        }
        let proposedPosts = document.querySelectorAll('a[href*="/p/"]');
        if (!proposedPosts) {
            return
        }
        proposedPosts.forEach(function (link) {
            link.remove();
        });
    }
}

let remHome = () => {
    const homeLink = document.querySelectorAll('svg[aria-label="Home"]');
    const homeLinkElement = homeLink[homeLink.length - 1]?.closest('a');
    if (!homeLink.length) {
        return;
    }
    let container = homeLinkElement.parentElement.parentElement.parentElement.parentElement;
    if (container) {
        container.remove();
    } else {
        homeLink.remove();
    }
}

let remSearch = () => {
    let searchLink = document.querySelector('a[href="/explore/"]');
    if (!searchLink) {
        return
    }
    let container = searchLink.parentElement.parentElement.parentElement;
    if (container) {
        container.remove();
    } else {
        searchLink.remove();
    }
}

let forwardToMessagesPage = () => {
    window.location.assign('https://www.instagram.com/direct/inbox/');
}

// automatically forward to following page to avoid seeing recommended posts
let forwardToFollowingPage = () => {
    window.location.assign('https://www.instagram.com/?variant=following');
}

let onPageUpdate = () => {
    updateSettings();
    if (isReelspage) {
        if (hideHome) {
            forwardToMessagesPage();
        } else {
            forwardToFollowingPage();
        }
    }

    if (isHomepage && !hideHome) {
        forwardToFollowingPage();
    }
    if (hideHome) {
        remHome();
    }
    if (hideSearch) {
        remSearch();
    }
    remReels();
    remExplores();
}

let observer = new MutationObserver(function () {
    onPageUpdate();
});

// Start observing the body for changes
observer.observe(document.body, {childList: true, subtree: true, attributes: true});

// initial run
onPageUpdate();

console.log("Unscroll active");