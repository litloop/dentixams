/* =========================================================
   FEELFRAME™ — APPLICATION JAVASCRIPT
   ---------------------------------------------------------
   Responsibilities:
   - Load data.json
   - Normalize application data
   - Render profile/site content
   - Render statuses
   - Render featured stories
   - Render Explore stories
   - Render social links
   - Product/story modal
   - Status viewer
   - Create form
   - Visual language persistence
   - Viewed status persistence
   - Toast feedback
   - SPA navigation
   - Browser history
   - Hash compatibility
========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
========================================================= */

const CONFIG = {
  dataUrl: "data.json",

  statusDuration: 5000,

  statusExpirationHours: 24,

  viewedStatusesKey: "feelFrame_viewed_statuses",

  visualLanguageKey: "feelFrame_visual_language",

  defaultVisualLanguage: "Cinematic",

  defaultRoute: "home",

  whatsappNumber: "2349012728201"
};


/* =========================================================
   APPLICATION STATE
========================================================= */

const state = {
  data: null,

  site: {},

  stories: [],

  featuredStories: [],

  statuses: [],

  socialLinks: [],

  currentRoute: CONFIG.defaultRoute,

  selectedVisualLanguage: CONFIG.defaultVisualLanguage,

  viewedStatuses: new Set(),

  currentStatusIndex: 0,

  statusTimer: null,

  statusStartedAt: 0,

  statusRemaining: CONFIG.statusDuration,

  statusPaused: false,

  statusTouchStartX: 0,

  statusTouchStartY: 0,

  currentStory: null,

  lastFocusedElement: null,

  dataLoaded: false
};


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector, parent = document) => {
  return parent.querySelector(selector);
};

const $$ = (selector, parent = document) => {
  return Array.from(parent.querySelectorAll(selector));
};

const byId = (id) => {
  return document.getElementById(id);
};


/* =========================================================
   DOM REFERENCES
========================================================= */

const DOM = {};

function cacheDOM() {
  DOM.body = document.body;

  DOM.profile = byId("profile");

  DOM.storiesSection = byId("stories-section");

  DOM.createSection = byId("create-section");

  DOM.siteName = byId("site-name");

  DOM.siteTagline = byId("site-tagline");

  DOM.siteDescription = byId("site-description");

  DOM.statusList = byId("status-list");

  DOM.featuredStories = byId("featured-stories");

  DOM.storyGrid = byId("story-grid");

  DOM.storyFilters = byId("story-filters");

  DOM.socialLinks = byId("social-links");

  DOM.createForm = byId("create-form");

  DOM.visualLanguage = byId("visual-language");

  DOM.visualLanguageOptions =
    byId("visual-language-options");

  DOM.statusViewer = byId("status-viewer");

  DOM.statusViewerImage =
    byId("status-viewer-image");

  DOM.statusViewerCategory =
    byId("status-viewer-category");

  DOM.statusViewerTitle =
    byId("status-viewer-title");

  DOM.statusViewerText =
    byId("status-viewer-text");

  DOM.statusViewerCTA =
    byId("status-viewer-cta");

  DOM.statusProgress =
    byId("status-progress");

  DOM.statusClose =
    byId("status-close");

  DOM.productModal =
    byId("product-modal");

  DOM.productModalImage =
    byId("product-modal-image");

  DOM.productModalCampaign =
    byId("product-modal-campaign");

  DOM.productModalEmotion =
    byId("product-modal-emotion");

  DOM.productModalTitle =
    byId("product-modal-title");

  DOM.productModalQuote =
    byId("product-modal-quote");

  DOM.productModalDescription =
    byId("product-modal-description");

  DOM.productModalCTA =
    byId("product-modal-cta");

  DOM.productModalClose =
    byId("product-modal-close");

  DOM.toast = byId("toast");

  DOM.bottomNavigation =
    byId("bottom-navigation");

  DOM.homeCreateButton =
    byId("home-create-button");
}


/* =========================================================
   SAFETY / HTML HELPERS
========================================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function safeURL(value) {
  if (!value) {
    return "#";
  }

  try {
    const url = new URL(
      String(value),
      window.location.href
    );

    const allowedProtocols = [
      "http:",
      "https:",
      "mailto:",
      "tel:"
    ];

    if (!allowedProtocols.includes(url.protocol)) {
      return "#";
    }

    return url.href;
  } catch {
    return "#";
  }
}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function loadLocalState() {
  try {
    const storedStatuses =
      localStorage.getItem(
        CONFIG.viewedStatusesKey
      );

    if (storedStatuses) {
      const parsed = JSON.parse(storedStatuses);

      if (Array.isArray(parsed)) {
        state.viewedStatuses = new Set(
          parsed.map(String)
        );
      }
    }
  } catch (error) {
    console.warn(
      "FeelFrame: unable to load viewed statuses.",
      error
    );
  }


  try {
    const storedLanguage =
      localStorage.getItem(
        CONFIG.visualLanguageKey
      );

    if (storedLanguage) {
      state.selectedVisualLanguage =
        storedLanguage;
    }
  } catch (error) {
    console.warn(
      "FeelFrame: unable to load visual language.",
      error
    );
  }
}


function saveViewedStatuses() {
  try {
    localStorage.setItem(
      CONFIG.viewedStatusesKey,
      JSON.stringify(
        Array.from(state.viewedStatuses)
      )
    );
  } catch (error) {
    console.warn(
      "FeelFrame: unable to save viewed statuses.",
      error
    );
  }
}


function saveVisualLanguage(value) {
  state.selectedVisualLanguage =
    value || CONFIG.defaultVisualLanguage;

  try {
    localStorage.setItem(
      CONFIG.visualLanguageKey,
      state.selectedVisualLanguage
    );
  } catch (error) {
    console.warn(
      "FeelFrame: unable to save visual language.",
      error
    );
  }
}


/* =========================================================
   DATA LOADING
========================================================= */

async function loadData() {
  try {
    const response = await fetch(CONFIG.dataUrl, {
      cache: "no-cache"
    });

    if (!response.ok) {
      throw new Error(
        `Unable to load ${CONFIG.dataUrl}: ${response.status}`
      );
    }

    const rawData = await response.json();

    state.data = rawData;

    normalizeData(rawData);

    state.dataLoaded = true;

    return true;

  } catch (error) {
    console.error(
      "FeelFrame data loading error:",
      error
    );

    showToast(
      "Unable to load FeelFrame content."
    );

    renderDataError();

    return false;
  }
}


/* =========================================================
   DATA NORMALIZATION
========================================================= */

function normalizeData(data) {
  const site =
    data && typeof data.site === "object"
      ? data.site
      : {};

  state.site = site;


  /* -------------------------------------------------------
     Stories
  ------------------------------------------------------- */

  const incomingStories =
    Array.isArray(data?.stories)
      ? data.stories
      : [];

  state.stories =
    incomingStories
      .filter(Boolean)
      .map(normalizeStory);


  state.featuredStories =
    state.stories.filter(
      (story) => story.featured === true
    );


  /* -------------------------------------------------------
     Status
  ------------------------------------------------------- */

  state.statuses =
    normalizeStatuses(data?.status);


  /* -------------------------------------------------------
     Social links
  ------------------------------------------------------- */

  state.socialLinks =
    normalizeSocialLinks(
      data?.socialLinks
    );
}


function normalizeStory(story) {
  return {
    id: String(
      story.id ??
      cryptoRandomId()
    ),

    title:
      story.title ||
      "Untitled story",

    description:
      story.description ||
      story.context ||
      "",

    image:
      story.image ||
      story.imageUrl ||
      "",

    featured:
      story.featured === true,

    campaign:
      story.campaign ||
      "",

    emotion:
      story.emotion ||
      "",

    moment:
      story.moment ||
      "",

    quote:
      story.quote ||
      "",

    link:
      story.link ||
      story.selar ||
      story.url ||
      "",

    price:
      story.price ??
      null,

    compareAt:
      story.compareAt ??
      null,

    style:
      story.style ||
      "",

    visualLanguage:
      story.visualLanguage ||
      story.visual_language ||
      "",

    ratio:
      story.ratio ||
      ""
  };
}


function cryptoRandomId() {
  return (
    "story-" +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}


/* =========================================================
   STATUS NORMALIZATION
========================================================= */

function normalizeStatuses(input) {
  if (!input) {
    return [];
  }

  let items = [];

  let durationHours =
    CONFIG.statusExpirationHours;


  /*
    Supported format:

    {
      enabled: true,
      durationHours: 24,
      items: []
    }
  */

  if (
    typeof input === "object" &&
    !Array.isArray(input)
  ) {
    if (input.enabled === false) {
      return [];
    }

    if (
      Number.isFinite(
        Number(input.durationHours)
      )
    ) {
      durationHours =
        Number(input.durationHours);
    }

    if (Array.isArray(input.items)) {
      items = input.items;
    }
  }


  /*
    Also support:

    status: []
  */

  if (Array.isArray(input)) {
    items = input;
  }


  const now = Date.now();

  return items
    .filter(Boolean)
    .map((item, index) => {

      const createdAt =
        item.createdAt ||
        item.created_at ||
        item.timestamp ||
        null;

      const createdTimestamp =
        createdAt
          ? new Date(createdAt).getTime()
          : now;


      return {
        id: String(
          item.id ??
          `status-${index + 1}`
        ),

        title:
          item.title ||
          "A new feeling",

        text:
          item.text ||
          item.description ||
          "",

        image:
          item.image ||
          item.imageUrl ||
          "",

        cta:
          item.cta ||
          "",

        link:
          item.link ||
          item.url ||
          "",

        category:
          item.category ||
          item.emotion ||
          "",

        createdAt:
          createdTimestamp,

        durationHours
      };
    })
    .filter((status) => {
      if (!status.createdAt) {
        return true;
      }

      const expiration =
        status.createdAt +
        status.durationHours *
        60 *
        60 *
        1000;

      return now <= expiration;
    });
}


/* =========================================================
   SOCIAL NORMALIZATION
========================================================= */

function normalizeSocialLinks(input) {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return input.map((item) => {

      if (typeof item === "string") {
        return {
          label: item,
          url: item
        };
      }

      return {
        label:
          item.label ||
          item.name ||
          item.platform ||
          "Social",

        url:
          item.url ||
          item.link ||
          "#"
      };
    });
  }


  if (
    typeof input === "object"
  ) {
    return Object.entries(input)
      .map(([label, value]) => ({
        label,
        url:
          typeof value === "string"
            ? value
            : value?.url ||
              value?.link ||
              "#"
      }));
  }

  return [];
}


/* =========================================================
   SITE RENDERING
========================================================= */

function renderSite() {
  renderSiteIdentity();

  renderStatuses();

  renderFeaturedStories();

  renderStories();

  renderSocialLinks();

  applyVisualLanguageUI();
}


function renderSiteIdentity() {
  const siteName =
    state.site.name ||
    "FeelFrame™";

  const tagline =
    state.site.tagline ||
    "Some feelings deserve to be seen.";

  const description =
    state.site.description ||
    "";


  if (DOM.siteName) {
    DOM.siteName.textContent =
      siteName;
  }

  if (DOM.siteTagline) {
    DOM.siteTagline.textContent =
      tagline;
  }

  if (DOM.siteDescription) {
    DOM.siteDescription.textContent =
      description;
  }

  document.title =
    `${siteName} — ${tagline}`;
}


/* =========================================================
   STATUS RENDERING
========================================================= */

function renderStatuses() {
  if (!DOM.statusList) {
    return;
  }

  DOM.statusList.innerHTML = "";

  if (!state.statuses.length) {
    return;
  }


  state.statuses.forEach((status, index) => {

    const wrapper =
      document.createElement("div");

    wrapper.className =
      "status-item-wrapper";

    const button =
      document.createElement("button");

    button.type = "button";

    button.className =
      "status-item";

    button.dataset.statusIndex =
      String(index);

    button.setAttribute(
      "aria-label",
      `View ${status.title}`
    );


    if (
      state.viewedStatuses.has(
        status.id
      )
    ) {
      button.classList.add("viewed");
    }


    const image =
      document.createElement("img");

    image.src =
      safeURL(status.image);

    image.alt =
      status.title;

    image.loading = "lazy";

    image.addEventListener(
      "error",
      () => {
        image.removeAttribute("src");
      }
    );


    button.appendChild(image);


    const title =
      document.createElement("div");

    title.className =
      "status-item-title";

    title.textContent =
      status.title;

    wrapper.appendChild(button);

    wrapper.appendChild(title);

    DOM.statusList.appendChild(
      wrapper
    );
  });


  $$(".status-item", DOM.statusList)
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset.statusIndex
            );

          openStatus(index);
        }
      );
    });
}


/* =========================================================
   FEATURED STORIES
========================================================= */

function renderFeaturedStories() {
  if (!DOM.featuredStories) {
    return;
  }

  DOM.featuredStories.innerHTML = "";


  if (!state.featuredStories.length) {
    DOM.featuredStories.innerHTML =
      createEmptyState(
        "Nothing featured yet.",
        "New visual stories will appear here."
      );

    return;
  }


  state.featuredStories.forEach(
    (story) => {

      DOM.featuredStories.insertAdjacentHTML(
        "beforeend",
        createStoryCard(story)
      );
    }
  );


  bindStoryCards(
    DOM.featuredStories
  );
}


/* =========================================================
   EXPLORE STORY GRID
========================================================= */

function renderStories() {
  if (!DOM.storyGrid) {
    return;
  }

  DOM.storyGrid.innerHTML = "";


  if (!state.stories.length) {
    DOM.storyGrid.innerHTML =
      createEmptyState(
        "No stories yet.",
        "Your visual stories will appear here."
      );

    return;
  }


  state.stories.forEach(
    (story) => {

      DOM.storyGrid.insertAdjacentHTML(
        "beforeend",
        createStoryCard(story)
      );
    }
  );


  bindStoryCards(
    DOM.storyGrid
  );
}


/* =========================================================
   STORY CARD
========================================================= */

function createStoryCard(story) {
  const image =
    safeURL(story.image);

  const campaign =
    story.campaign ||
    story.emotion ||
    "Visual story";

  const description =
    story.description ||
    story.quote ||
    "";


  let priceHTML = "";

  if (
    story.price !== null &&
    story.price !== undefined
  ) {
    priceHTML = `
      <div class="story-card-price">
        <span>
          ${formatCurrency(story.price)}
        </span>

        ${
          story.compareAt !== null &&
          story.compareAt !== undefined
            ? `
              <span class="compare-at">
                ${formatCurrency(story.compareAt)}
              </span>
            `
            : ""
        }
      </div>
    `;
  }


  return `
    <article
      class="story-card"
      data-story-id="${escapeHTML(story.id)}"
      tabindex="0"
      role="button"
      aria-label="View ${escapeHTML(story.title)}"
    >

      <div class="story-card-image">

        ${
          image !== "#"
            ? `
              <img
                src="${image}"
                alt="${escapeHTML(story.title)}"
                loading="lazy"
              >
            `
            : `
              <div
                class="story-image-placeholder"
                aria-hidden="true"
              ></div>
            `
        }

      </div>

      <div class="story-card-body">

        <div class="story-card-meta">
          ${escapeHTML(campaign)}
        </div>

        <h3 class="story-card-title">
          ${escapeHTML(story.title)}
        </h3>

        ${
          description
            ? `
              <p class="story-card-description">
                ${escapeHTML(description)}
              </p>
            `
            : ""
        }

        ${priceHTML}

      </div>

    </article>
  `;
}


function bindStoryCards(container) {
  if (!container) {
    return;
  }

  $$(".story-card", container)
    .forEach((card) => {

      const storyId =
        card.dataset.storyId;

      card.addEventListener(
        "click",
        () => {
          openStory(storyId);
        }
      );

      card.addEventListener(
        "keydown",
        (event) => {

          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();

            openStory(storyId);
          }
        }
      );


      const image =
        $("img", card);

      if (image) {
        image.addEventListener(
          "error",
          () => {
            image.removeAttribute("src");
          }
        );
      }
    });
}


/* =========================================================
   SOCIAL LINKS
========================================================= */

function renderSocialLinks() {
  if (!DOM.socialLinks) {
    return;
  }

  DOM.socialLinks.innerHTML = "";


  state.socialLinks.forEach(
    (social) => {

      const url =
        safeURL(social.url);

      const link =
        document.createElement("a");

      link.href = url;

      link.textContent =
        social.label;

      if (
        /^https?:\/\//i.test(url)
      ) {
        link.target = "_blank";
        link.rel =
          "noopener noreferrer";
      }

      DOM.socialLinks.appendChild(
        link
      );
    }
  );
}


/* =========================================================
   EMPTY STATE
========================================================= */

function createEmptyState(
  title,
  description
) {
  return `
    <div class="empty-state">

      <h3>
        ${escapeHTML(title)}
      </h3>

      <p>
        ${escapeHTML(description)}
      </p>

    </div>
  `;
}


/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(value) {
  const numericValue =
    Number(value);

  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  const currency =
    state.site.currency ||
    "NGN";

  try {
    return new Intl.NumberFormat(
      "en-NG",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 0
      }
    ).format(numericValue);
  } catch {
    return `${currency} ${numericValue}`;
  }
}


/* =========================================================
   PRODUCT / STORY MODAL
========================================================= */

function openStory(storyId) {
  const story =
    state.stories.find(
      (item) =>
        String(item.id) ===
        String(storyId)
    );

  if (!story) {
    return;
  }

  state.currentStory =
    story;

  state.lastFocusedElement =
    document.activeElement;


  if (!DOM.productModal) {
    return;
  }


  if (DOM.productModalImage) {
    DOM.productModalImage.src =
      safeURL(story.image);

    DOM.productModalImage.alt =
      story.title;
  }

  if (DOM.productModalCampaign) {
    DOM.productModalCampaign.textContent =
      story.campaign || "";
  }

  if (DOM.productModalEmotion) {
    DOM.productModalEmotion.textContent =
      story.emotion || "";
  }

  if (DOM.productModalTitle) {
    DOM.productModalTitle.textContent =
      story.title;
  }

  if (DOM.productModalQuote) {
    DOM.productModalQuote.textContent =
      story.quote || "";
  }

  if (DOM.productModalDescription) {
    DOM.productModalDescription.textContent =
      story.description || "";
  }


  if (DOM.productModalCTA) {

    if (story.link) {

      DOM.productModalCTA.href =
        safeURL(story.link);

      DOM.productModalCTA.hidden =
        false;

    } else {

      DOM.productModalCTA.hidden =
        true;
    }
  }


  DOM.productModal.classList.add(
    "is-open"
  );

  DOM.productModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow =
    "hidden";


  if (DOM.productModalClose) {
    DOM.productModalClose.focus();
  }
}


function closeProductModal() {
  if (!DOM.productModal) {
    return;
  }

  DOM.productModal.classList.remove(
    "is-open"
  );

  DOM.productModal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.style.overflow = "";


  if (
    state.lastFocusedElement &&
    typeof state.lastFocusedElement.focus ===
      "function"
  ) {
    state.lastFocusedElement.focus();
  }

  state.currentStory = null;
}


/* =========================================================
   STATUS VIEWER
========================================================= */

function openStatus(index) {
  if (
    !DOM.statusViewer ||
    !state.statuses.length
  ) {
    return;
  }

  const safeIndex =
    Math.max(
      0,
      Math.min(
        Number(index) || 0,
        state.statuses.length - 1
      )
    );

  state.currentStatusIndex =
    safeIndex;

  state.lastFocusedElement =
    document.activeElement;

  state.statusPaused = false;

  markStatusViewed(
    state.statuses[
      state.currentStatusIndex
    ]
  );

  renderStatusViewer();

  DOM.statusViewer.classList.add(
    "is-open"
  );

  DOM.statusViewer.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow =
    "hidden";

  startStatusTimer();

  if (DOM.statusClose) {
    DOM.statusClose.focus();
  }
}


function renderStatusViewer() {
  const status =
    state.statuses[
      state.currentStatusIndex
    ];

  if (!status) {
    return;
  }


  if (DOM.statusViewerImage) {
    DOM.statusViewerImage.src =
      safeURL(status.image);

    DOM.statusViewerImage.alt =
      status.title;
  }

  if (DOM.statusViewerCategory) {
    DOM.statusViewerCategory.textContent =
      status.category || "";
  }

  if (DOM.statusViewerTitle) {
    DOM.statusViewerTitle.textContent =
      status.title;
  }

  if (DOM.statusViewerText) {
    DOM.statusViewerText.textContent =
      status.text || "";
  }


  if (DOM.statusViewerCTA) {

    if (status.cta && status.link) {

      DOM.statusViewerCTA.textContent =
        status.cta;

      DOM.statusViewerCTA.href =
        safeURL(status.link);

      DOM.statusViewerCTA.hidden =
        false;

    } else {

      DOM.statusViewerCTA.hidden =
        true;
    }
  }


  renderStatusProgress();
}


function renderStatusProgress() {
  if (!DOM.statusProgress) {
    return;
  }

  DOM.statusProgress.innerHTML = "";


  state.statuses.forEach(
    (_, index) => {

      const item =
        document.createElement("div");

      item.className =
        "status-progress-item";

      const percentage =
        index <
        state.currentStatusIndex
          ? 100
          : index ===
            state.currentStatusIndex
            ? 0
            : 0;

      item.style.setProperty(
        "--progress",
        `${percentage}%`
      );

      DOM.statusProgress.appendChild(
        item
      );
    }
  );
}


function updateCurrentStatusProgress(
  percentage
) {
  if (!DOM.statusProgress) {
    return;
  }

  const bars =
    $$(".status-progress-item");

  const currentBar =
    bars[state.currentStatusIndex];

  if (!currentBar) {
    return;
  }

  currentBar.style.setProperty(
    "--progress",
    `${Math.max(
      0,
      Math.min(100, percentage)
    )}%`
  );
}


function startStatusTimer() {
  clearStatusTimer();

  state.statusPaused = false;

  state.statusRemaining =
    CONFIG.statusDuration;

  state.statusStartedAt =
    Date.now();

  updateCurrentStatusProgress(0);


  state.statusTimer =
    window.setInterval(
      () => {

        if (state.statusPaused) {
          return;
        }

        const elapsed =
          Date.now() -
          state.statusStartedAt;

        const percentage =
          (elapsed /
            CONFIG.statusDuration) *
          100;

        updateCurrentStatusProgress(
          percentage
        );


        if (
          elapsed >=
          CONFIG.statusDuration
        ) {
          nextStatus();
        }

      },
      50
    );
}


function clearStatusTimer() {
  if (state.statusTimer) {
    window.clearInterval(
      state.statusTimer
    );

    state.statusTimer = null;
  }
}


function pauseStatus() {
  if (
    !DOM.statusViewer ||
    !DOM.statusViewer.classList.contains(
      "is-open"
    )
  ) {
    return;
  }

  if (state.statusPaused) {
    return;
  }

  state.statusPaused = true;

  state.statusRemaining =
    Math.max(
      0,
      CONFIG.statusDuration -
        (
          Date.now() -
          state.statusStartedAt
        )
    );
}


function resumeStatus() {
  if (!state.statusPaused) {
    return;
  }

  state.statusPaused = false;

  state.statusStartedAt =
    Date.now() -
    (
      CONFIG.statusDuration -
      state.statusRemaining
    );
}


function nextStatus() {
  if (!state.statuses.length) {
    closeStatusViewer();
    return;
  }

  if (
    state.currentStatusIndex >=
    state.statuses.length - 1
  ) {
    closeStatusViewer();
    return;
  }

  state.currentStatusIndex += 1;

  markStatusViewed(
    state.statuses[
      state.currentStatusIndex
    ]
  );

  renderStatusViewer();

  startStatusTimer();
}


function previousStatus() {
  if (!state.statuses.length) {
    return;
  }

  if (
    state.currentStatusIndex <= 0
  ) {
    state.currentStatusIndex = 0;
  } else {
    state.currentStatusIndex -= 1;
  }

  markStatusViewed(
    state.statuses[
      state.currentStatusIndex
    ]
  );

  renderStatusViewer();

  startStatusTimer();
}


function closeStatusViewer() {
  clearStatusTimer();

  if (!DOM.statusViewer) {
    return;
  }

  DOM.statusViewer.classList.remove(
    "is-open"
  );

  DOM.statusViewer.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.style.overflow = "";


  if (
    state.lastFocusedElement &&
    typeof state.lastFocusedElement.focus ===
      "function"
  ) {
    state.lastFocusedElement.focus();
  }
}


function markStatusViewed(status) {
  if (!status?.id) {
    return;
  }

  state.viewedStatuses.add(
    String(status.id)
  );

  saveViewedStatuses();

  const matchingButton =
    document.querySelector(
      `.status-item[data-status-index="${state.currentStatusIndex}"]`
    );

  if (matchingButton) {
    matchingButton.classList.add(
      "viewed"
    );
  }
}


/* =========================================================
   STATUS TOUCH / SWIPE
========================================================= */

function handleStatusTouchStart(event) {
  const touch =
    event.changedTouches?.[0];

  if (!touch) {
    return;
  }

  state.statusTouchStartX =
    touch.clientX;

  state.statusTouchStartY =
    touch.clientY;
}


function handleStatusTouchEnd(event) {
  const touch =
    event.changedTouches?.[0];

  if (!touch) {
    return;
  }

  const deltaX =
    touch.clientX -
    state.statusTouchStartX;

  const deltaY =
    touch.clientY -
    state.statusTouchStartY;


  if (
    Math.abs(deltaX) < 50 ||
    Math.abs(deltaX) < Math.abs(deltaY)
  ) {
    return;
  }


  if (deltaX < 0) {
    nextStatus();
  } else {
    previousStatus();
  }
}


/* =========================================================
   VISUAL LANGUAGE
========================================================= */

function applyVisualLanguageUI() {
  const selected =
    state.selectedVisualLanguage ||
    CONFIG.defaultVisualLanguage;


  if (DOM.visualLanguage) {
    DOM.visualLanguage.value =
      selected;
  }


  if (!DOM.visualLanguageOptions) {
    return;
  }


  const options =
    $$(".visual-language-option",
      DOM.visualLanguageOptions);


  options.forEach((option) => {

    const value =
      option.dataset.visualLanguage;

    const isActive =
      value === selected;

    option.classList.toggle(
      "active",
      isActive
    );

    option.setAttribute(
      "aria-pressed",
      String(isActive)
    );
  });
}


function selectVisualLanguage(value) {
  if (!value) {
    return;
  }

  saveVisualLanguage(value);

  applyVisualLanguageUI();

  showToast(
    `${value} selected.`
  );
}


/* =========================================================
   CREATE FORM
========================================================= */

function handleCreateSubmit(event) {
  event.preventDefault();

  if (!DOM.createForm) {
    return;
  }

  const formData =
    new FormData(
      DOM.createForm
    );

  const name =
    String(
      formData.get("name") ||
      ""
    ).trim();

  const contact =
    String(
      formData.get("contact") ||
      ""
    ).trim();

  const moment =
    String(
      formData.get("moment") ||
      ""
    ).trim();

  const emotion =
    String(
      formData.get("emotion") ||
      ""
    ).trim();

  const visualLanguage =
    String(
      formData.get("visualLanguage") ||
      state.selectedVisualLanguage ||
      CONFIG.defaultVisualLanguage
    ).trim();


  if (!name) {
    showToast(
      "Please enter your name."
    );

    focusField("create-name");

    return;
  }


  if (!contact) {
    showToast(
      "Please enter your WhatsApp number."
    );

    focusField("create-contact");

    return;
  }


  if (!moment) {
    showToast(
      "Tell us a little about your moment."
    );

    focusField("create-moment");

    return;
  }


  if (!emotion) {
    showToast(
      "Please choose an emotion."
    );

    focusField("create-emotion");

    return;
  }


  saveVisualLanguage(
    visualLanguage
  );


  const message =
    buildWhatsAppMessage({
      name,
      contact,
      moment,
      emotion,
      visualLanguage
    });


  const whatsappURL =
    `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(
      message
    )}`;


  showToast(
    "Opening WhatsApp..."
  );


  window.setTimeout(() => {
    window.open(
      whatsappURL,
      "_blank",
      "noopener,noreferrer"
    );
  }, 250);
}


function buildWhatsAppMessage({
  name,
  contact,
  moment,
  emotion,
  visualLanguage
}) {
  return [
    "Hello FeelFrame™ 👋",
    "",
    "I'd like to create a visual story.",
    "",
    `Name: ${name}`,
    `WhatsApp: ${contact}`,
    `Emotion: ${emotion}`,
    `Visual language: ${visualLanguage}`,
    "",
    "My moment:",
    moment
  ].join("\n");
}


function focusField(id) {
  const field =
    byId(id);

  if (field) {
    field.focus();
  }
}


/* =========================================================
   CREATE CTA
========================================================= */

function openCreate() {
  navigateTo(
    "create"
  );
}


/* =========================================================
   TOAST SYSTEM
========================================================= */

let toastTimeout = null;

function showToast(message) {
  if (!DOM.toast) {
    return;
  }

  DOM.toast.textContent =
    message;

  DOM.toast.classList.add(
    "show"
  );

  if (toastTimeout) {
    clearTimeout(
      toastTimeout
    );
  }

  toastTimeout =
    window.setTimeout(() => {

      DOM.toast.classList.remove(
        "show"
      );

    }, 2800);
}


/* =========================================================
   ROUTING
========================================================= */

const ROUTES = {
  home: {
    page: "home",
    section: "profile"
  },

  explore: {
    page: "explore",
    section: "stories-section"
  },

  create: {
    page: "create",
    section: "create-section"
  }
};


function normalizeRoute(value) {
  if (!value) {
    return CONFIG.defaultRoute;
  }

  const route =
    String(value)
      .toLowerCase()
      .trim();


  if (ROUTES[route]) {
    return route;
  }


  switch (route) {

    case "profile":
    case "index":
    case "home-section":
      return "home";

    case "stories":
    case "story":
    case "stories-section":
    case "explore-section":
      return "explore";

    case "create-section":
    case "creation":
      return "create";

    default:
      return CONFIG.defaultRoute;
  }
}


function getRouteFromHash() {
  const hash =
    window.location.hash
      .replace(/^#/, "")
      .toLowerCase();

  if (!hash) {
    return null;
