/* =========================================================
   FEELFRAME™
   LINK-IN-BIO + STATUS
   PRODUCTION JAVASCRIPT
========================================================= */

(() => {
  "use strict";


  /* =======================================================
     01. CONFIGURATION
  ======================================================== */

  const CONFIG = {
    dataUrl: "data.json",

    statusDuration: 5000,

    storageKeys: {
      viewedStatuses: "feelFrame_viewed_statuses",
      selectedLanguage: "feelFrame_visual_language"
    }
  };


  /* =======================================================
     02. STATE
  ======================================================== */

  const state = {
    data: null,

    stories: [],
    featuredStories: [],
    statuses: [],

    currentStatusIndex: 0,
    statusTimer: null,
    statusStartedAt: 0,
    statusRemaining: CONFIG.statusDuration,

    statusPaused: false,

    statusTouchStartX: 0,
    statusTouchStartY: 0,
    statusTouchStartTime: 0,

    selectedVisualLanguage:
      localStorage.getItem(
        CONFIG.storageKeys.selectedLanguage
      ) || "Cinematic",

    viewedStatuses: loadViewedStatuses(),

    toastTimer: null
  };


  /* =======================================================
     03. DOM
  ======================================================== */

  const dom = {};


  function cacheDOM() {

    dom.app =
      document.getElementById("app");

    dom.siteName =
      document.getElementById("site-name");

    dom.siteTagline =
      document.getElementById("site-tagline");

    dom.siteDescription =
      document.getElementById("site-description");

    dom.statusSection =
      document.getElementById("status-section");

    dom.statusList =
      document.getElementById("status-list");

    dom.statusCount =
      document.getElementById("status-count");

    dom.featuredList =
      document.getElementById("featured-list");

    dom.storiesList =
      document.getElementById("stories-list");

    dom.socialLinks =
      document.getElementById("social-links");

    dom.makeItYours =
      document.getElementById("make-it-yours");

    dom.viewAll =
      document.getElementById("view-all");

    dom.createSection =
      document.getElementById("create-section");

    dom.createForm =
      document.getElementById("create-form");

    dom.currentYear =
      document.getElementById("current-year");


    /* Status viewer */

    dom.statusViewer =
      document.getElementById("status-viewer");

    dom.statusProgress =
      document.getElementById("status-progress");

    dom.statusImage =
      document.getElementById("status-image");

    dom.statusLoading =
      document.getElementById("status-loading");

    dom.viewerAvatar =
      document.getElementById("viewer-avatar");

    dom.viewerName =
      document.getElementById("viewer-name");

    dom.viewerTime =
      document.getElementById("viewer-time");

    dom.statusCategory =
      document.getElementById("status-category");

    dom.statusTitle =
      document.getElementById("status-title");

    dom.statusText =
      document.getElementById("status-text");

    dom.statusCTA =
      document.getElementById("status-cta");

    dom.statusClose =
      document.getElementById("status-close");

    dom.statusPrevious =
      document.getElementById("status-prev");

    dom.statusNext =
      document.getElementById("status-next");


    /* Product modal */

    dom.productModal =
      document.getElementById("product-modal");

    dom.productClose =
      document.getElementById("product-close");

    dom.productImage =
      document.getElementById("product-image");

    dom.productCampaign =
      document.getElementById("product-campaign");

    dom.productTitle =
      document.getElementById("product-title");

    dom.productQuote =
      document.getElementById("product-quote");

    dom.productDescription =
      document.getElementById("product-description");

    dom.productStyle =
      document.getElementById("product-style");

    dom.productEmotion =
      document.getElementById("product-emotion");

    dom.productPrice =
      document.getElementById("product-price");

    dom.productCompare =
      document.getElementById("product-compare");

    dom.productBuy =
      document.getElementById("product-buy");


    /* Toast */

    dom.toast =
      document.getElementById("toast");
  }


  /* =======================================================
     04. INITIALIZATION
  ======================================================== */

  document.addEventListener("DOMContentLoaded", init);


  async function init() {

    cacheDOM();

    setCurrentYear();

    bindStaticEvents();

    setSelectedVisualLanguage(
      state.selectedVisualLanguage
    );

    try {

      const data = await loadData();

      state.data = data;

      normalizeData();

      renderSite();

      renderStatuses();

      renderFeatured();

      renderStories();

      renderSocialLinks();

    } catch (error) {

      console.error(
        "FeelFrame™ initialization error:",
        error
      );

      renderErrorState();
    }
  }


  /* =======================================================
     05. DATA
  ======================================================== */

  async function loadData() {

    const response =
      await fetch(
        CONFIG.dataUrl,
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {

      throw new Error(
        `Unable to load ${CONFIG.dataUrl}`
      );
    }

    const data =
      await response.json();

    if (!data || typeof data !== "object") {

      throw new Error(
        "Invalid FeelFrame™ data."
      );
    }

    return data;
  }


  function normalizeData() {

    state.stories =
      Array.isArray(state.data.stories)
        ? state.data.stories.filter(Boolean)
        : [];

    state.featuredStories =
      state.stories.filter(
        story => story.featured === true
      );

    state.statuses =
      normalizeStatuses(
        state.data.status
      );
  }


  function normalizeStatuses(statusData) {

    if (!statusData) {
      return [];
    }


    /*
      Supported structure:

      "status": {
        "enabled": true,
        "durationHours": 24,
        "items": []
      }
    */

    if (
      typeof statusData === "object" &&
      Array.isArray(statusData.items)
    ) {

      if (statusData.enabled === false) {
        return [];
      }

      const durationHours =
        Number(statusData.durationHours) || 24;

      return statusData.items
        .filter(Boolean)
        .map((item, index) => {

          const normalized =
            normalizeStatusItem(
              item,
              index
            );

          normalized.durationHours =
            durationHours;

          return normalized;
        })
        .filter(status => !isStatusExpired(status));
    }


    /*
      Also supports:

      "status": [
        {...},
        {...}
      ]
    */

    if (Array.isArray(statusData)) {

      return statusData
        .filter(Boolean)
        .map(normalizeStatusItem)
        .filter(status => !isStatusExpired(status));
    }


    return [];
  }


  function normalizeStatusItem(item, index) {

    return {
      id:
        item.id ||
        `status-${index + 1}`,

      title:
        item.title ||
        "A new visual",

      text:
        item.text ||
        item.description ||
        item.quote ||
        "",

      image:
        item.image ||
        "",

      cta:
        item.cta ||
        "View visual",

      link:
        item.link ||
        item.selarUrl ||
        "#",

      category:
        item.category ||
        item.campaign ||
        "FEELFRAME",

      createdAt:
        item.createdAt ||
        null,

      durationHours:
        Number(item.durationHours) || 24
    };
  }


  function isStatusExpired(status) {

    if (!status.createdAt) {
      return false;
    }

    const created =
      new Date(
        status.createdAt
      ).getTime();

    if (Number.isNaN(created)) {
      return false;
    }

    const duration =
      (
        Number(status.durationHours) ||
        24
      ) *
      60 *
      60 *
      1000;

    return (
      Date.now() >
      created + duration
    );
  }


  /* =======================================================
     06. SITE RENDERING
  ======================================================== */

  function renderSite() {

    const site =
      state.data.site || {};

    if (site.name) {
      dom.siteName.textContent =
        site.name;
    }

    if (site.tagline) {
      dom.siteTagline.textContent =
        site.tagline;
    }

    if (site.description) {
      dom.siteDescription.textContent =
        site.description;
    }
  }


  function setCurrentYear() {

    if (dom.currentYear) {

      dom.currentYear.textContent =
        new Date().getFullYear();
    }
  }


  /* =======================================================
     07. STATUS RENDERING
  ======================================================== */

  function renderStatuses() {

    dom.statusList.innerHTML = "";

    if (!state.statuses.length) {

      dom.statusSection.hidden = true;

      return;
    }

    dom.statusSection.hidden = false;

    const count =
      state.statuses.length;

    dom.statusCount.textContent =
      `${count} ${count === 1 ? "update" : "updates"}`;


    state.statuses.forEach(
      (status, index) => {

        const item =
          document.createElement("button");

        item.type = "button";

        item.className =
          "status-item";

        item.setAttribute(
          "role",
          "listitem"
        );

        item.setAttribute(
          "aria-label",
          `View status: ${status.title}`
        );

        if (
          state.viewedStatuses.has(
            status.id
          )
        ) {

          item.classList.add(
            "is-viewed"
          );
        }


        const ring =
          document.createElement("span");

        ring.className =
          "status-item__ring";


        const image =
          document.createElement("img");

        image.className =
          "status-item__image";

        image.src =
          status.image;

        image.alt =
          status.title;

        image.loading =
          index < 4
            ? "eager"
            : "lazy";

        image.decoding =
          "async";


        const label =
          document.createElement("span");

        label.className =
          "status-item__label";

        label.textContent =
          status.title;


        ring.appendChild(image);

        item.appendChild(ring);
        item.appendChild(label);

        item.addEventListener(
          "click",
          () => openStatus(index)
        );

        dom.statusList.appendChild(item);
      }
    );
  }


  /* =======================================================
     08. STATUS VIEWER
  ======================================================== */

  function openStatus(index) {

    if (!state.statuses.length) {
      return;
    }

    state.currentStatusIndex =
      clamp(
        index,
        0,
        state.statuses.length - 1
      );

    state.statusPaused = false;

    markStatusViewed(
      state.statuses[
        state.currentStatusIndex
      ].id
    );

    dom.statusViewer.classList.add(
      "is-open"
    );

    dom.statusViewer.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "is-locked"
    );

    renderCurrentStatus();

    requestAnimationFrame(() => {

      dom.statusClose.focus();
    });
  }


  function closeStatus() {

    stopStatusTimer();

    dom.statusViewer.classList.remove(
      "is-open"
    );

    dom.statusViewer.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "is-locked"
    );

    dom.statusImage.removeAttribute(
      "src"
    );

    dom.statusImage.classList.remove(
      "is-loaded"
    );
  }


  function renderCurrentStatus() {

    const status =
      state.statuses[
        state.currentStatusIndex
      ];

    if (!status) {
      closeStatus();
      return;
    }


    stopStatusTimer();

    state.statusPaused = false;

    dom.statusImage.classList.remove(
      "is-loaded"
    );

    dom.statusLoading.hidden = false;

    dom.viewerName.textContent =
      getSiteName();

    dom.viewerAvatar.textContent =
      getAvatarLetter();

    dom.viewerTime.textContent =
      formatStatusTime(
        status.createdAt
      );

    dom.statusCategory.textContent =
      status.category;

    dom.statusTitle.textContent =
      status.title;

    dom.statusText.textContent =
      status.text;

    dom.statusCTA.textContent =
      "";

    const ctaText =
      document.createElement("span");

    ctaText.textContent =
      status.cta;

    const ctaArrow =
      document.createElement("span");

    ctaArrow.setAttribute(
      "aria-hidden",
      "true"
    );

    ctaArrow.textContent =
      "↗";

    dom.statusCTA.append(
      ctaText,
      ctaArrow
    );

    dom.statusCTA.href =
      isSafeExternalUrl(status.link)
        ? status.link
        : "#";


    renderStatusProgress();


    dom.statusImage.onload =
      () => {

        dom.statusLoading.hidden = true;

        dom.statusImage.classList.add(
          "is-loaded"
        );

        startStatusTimer();
      };


    dom.statusImage.onerror =
      () => {

        dom.statusLoading.hidden = true;

        dom.statusImage.alt =
          "Unable to load this visual.";

        startStatusTimer();
      };


    dom.statusImage.src =
      status.image;
  }


  function renderStatusProgress() {

    dom.statusProgress.innerHTML = "";

    state.statuses.forEach(
      (status, index) => {

        const progress =
          document.createElement("span");

        progress.className =
          "status-progress-item";


        const fill =
          document.createElement("span");

        fill.className =
          "status-progress-item__fill";


        if (
          index <
          state.currentStatusIndex
        ) {

          progress.classList.add(
            "is-complete"
          );
        }


        if (
          index ===
          state.currentStatusIndex
        ) {

          progress.classList.add(
            "is-active"
          );
        }


        progress.appendChild(fill);

        dom.statusProgress.appendChild(
          progress
        );
      }
    );
  }


  function startStatusTimer() {

    stopStatusTimer();

    if (state.statusPaused) {
      return;
    }

    state.statusRemaining =
      CONFIG.statusDuration;

    state.statusStartedAt =
      Date.now();

    state.statusTimer =
      window.setTimeout(
        () => {

          goToNextStatus();

        },
        state.statusRemaining
      );


    animateCurrentProgress(
      state.statusRemaining
    );
  }


  function animateCurrentProgress(
    duration
  ) {

    const active =
      dom.statusProgress.querySelector(
        ".is-active .status-progress-item__fill"
      );

    if (!active) {
      return;
    }

    active.style.transition =
      "none";

    active.style.width =
      "0%";


    requestAnimationFrame(() => {

      active.style.transition =
        `width ${duration}ms linear`;

      active.style.width =
        "100%";
    });
  }


  function stopStatusTimer() {

    if (state.statusTimer) {

      window.clearTimeout(
        state.statusTimer
      );

      state.statusTimer =
        null;
    }

    const active =
      dom.statusProgress.querySelector(
        ".is-active .status-progress-item__fill"
      );

    if (active) {

      const elapsed =
        Date.now() -
        state.statusStartedAt;

      const percentage =
        Math.min(
          100,
          Math.max(
            0,
            (
              elapsed /
              CONFIG.statusDuration
            ) *
            100
          )
        );

      active.style.transition =
        "none";

      active.style.width =
        `${percentage}%`;
    }
  }


  function pauseStatus() {

    if (
      state.statusPaused ||
      !dom.statusViewer.classList.contains(
        "is-open"
      )
    ) {
      return;
    }

    state.statusPaused = true;

    const elapsed =
      Date.now() -
      state.statusStartedAt;

    state.statusRemaining =
      Math.max(
        300,
        CONFIG.statusDuration -
        elapsed
      );

    if (state.statusTimer) {

      window.clearTimeout(
        state.statusTimer
      );

      state.statusTimer =
        null;
    }


    const active =
      dom.statusProgress.querySelector(
        ".is-active .status-progress-item__fill"
      );

    if (active) {

      const percentage =
        Math.min(
          100,
          (
            elapsed /
            CONFIG.statusDuration
          ) *
          100
        );

      active.style.transition =
        "none";

      active.style.width =
        `${percentage}%`;
    }
  }


  function resumeStatus() {

    if (!state.statusPaused) {
      return;
    }

    state.statusPaused = false;

    state.statusStartedAt =
      Date.now();

    state.statusTimer =
      window.setTimeout(
        () => goToNextStatus(),
        state.statusRemaining
      );


    const active =
      dom.statusProgress.querySelector(
        ".is-active .status-progress-item__fill"
      );

    if (active) {

      active.style.transition =
        `width ${state.statusRemaining}ms linear`;

      active.style.width =
        "100%";
    }
  }


  function goToNextStatus() {

    if (
      state.currentStatusIndex <
      state.statuses.length - 1
    ) {

      state.currentStatusIndex++;

      markStatusViewed(
        state.statuses[
          state.currentStatusIndex
        ].id
      );

      renderCurrentStatus();

      updateStatusBubbleState();

      return;
    }

    closeStatus();
  }


  function goToPreviousStatus() {

    if (
      state.currentStatusIndex > 0
    ) {

      state.currentStatusIndex--;

      markStatusViewed(
        state.statuses[
          state.currentStatusIndex
        ].id
      );

      renderCurrentStatus();

      updateStatusBubbleState();

      return;
    }

    renderCurrentStatus();
  }


  /* =======================================================
     09. STATUS TOUCH / SWIPE
  ======================================================== */

  function handleStatusTouchStart(event) {

    const touch =
      event.changedTouches[0];

    if (!touch) {
      return;
    }

    state.statusTouchStartX =
      touch.clientX;

    state.statusTouchStartY =
      touch.clientY;

    state.statusTouchStartTime =
      Date.now();

    pauseStatus();
  }


  function handleStatusTouchEnd(event) {

    const touch =
      event.changedTouches[0];

    if (!touch) {
      resumeStatus();
      return;
    }

    const deltaX =
      touch.clientX -
      state.statusTouchStartX;

    const deltaY =
      touch.clientY -
      state.statusTouchStartY;

    const elapsed =
      Date.now() -
      state.statusTouchStartTime;

    const horizontal =
      Math.abs(deltaX) >
      Math.abs(deltaY);

    const swipe =
      horizontal &&
      Math.abs(deltaX) > 45 &&
      elapsed < 700;


    if (swipe) {

      if (deltaX < 0) {
        goToNextStatus();
      } else {
        goToPreviousStatus();
      }

      return;
    }


    resumeStatus();
  }


  /* =======================================================
     10. STATUS STORAGE
  ======================================================== */

  function loadViewedStatuses() {

    try {

      const stored =
        localStorage.getItem(
          CONFIG.storageKeys.viewedStatuses
        );

      if (!stored) {
        return new Set();
      }

      const parsed =
        JSON.parse(stored);

      return new Set(
        Array.isArray(parsed)
          ? parsed
          : []
      );

    } catch {

      return new Set();
    }
  }


  function saveViewedStatuses() {

    try {

      localStorage.setItem(
        CONFIG.storageKeys.viewedStatuses,
        JSON.stringify(
          Array.from(
            state.viewedStatuses
          )
        )
      );

    } catch {
      /* Storage may be unavailable. */
    }
  }


  function markStatusViewed(id) {

    if (!id) {
      return;
    }

    state.viewedStatuses.add(id);

    saveViewedStatuses();
  }


  function updateStatusBubbleState() {

    const items =
      dom.statusList.querySelectorAll(
        ".status-item"
      );

    items.forEach(
      (item, index) => {

        const status =
          state.statuses[index];

        if (!status) {
          return;
        }

        item.classList.toggle(
          "is-viewed",
          state.viewedStatuses.has(
            status.id
          )
        );
      }
    );
  }


  /* =======================================================
     11. FEATURED STORIES
  ======================================================== */

  function renderFeatured() {

    dom.featuredList.innerHTML = "";

    if (!state.featuredStories.length) {

      dom.featuredList.innerHTML =
        createEmptyState(
          "Featured visuals will appear here."
        );

      return;
    }


    state.featuredStories.forEach(
      story => {

        const card =
          createFeaturedCard(story);

        dom.featuredList.appendChild(card);
      }
    );
  }


  function createFeaturedCard(story) {

    const card =
      document.createElement("article");

    card.className =
      "featured-card";

    card.tabIndex = 0;

    card.setAttribute(
      "role",
      "button"
    );

    card.setAttribute(
      "aria-label",
      `View ${story.title}`
    );


    const media =
      document.createElement("div");

    media.className =
      "featured-card__media";


    const image =
      createImage(
        story.image,
        story.title
      );

    image.className =
      "featured-card__image";


    const overlay =
      document.createElement("div");

    overlay.className =
      "featured-card__overlay";


    const badge =
      document.createElement("span");

    badge.className =
      "featured-card__badge";

    badge.textContent =
      story.emotion ||
      "Featured";


    media.append(
      image,
      overlay,
      badge
    );


    const body =
      document.createElement("div");

    body.className =
      "featured-card__body";


    const campaign =
      document.createElement("div");

    campaign.className =
      "featured-card__campaign";

    campaign.textContent =
      story.campaign ||
      "FeelFrame";


    const title =
      document.createElement("h3");

    title.className =
      "featured-card__title";

    title.textContent =
      story.title ||
      "Visual story";


    const bottom =
      document.createElement("div");

    bottom.className =
      "featured-card__bottom";


    const pricing =
      document.createElement("div");

    pricing.className =
      "featured-card__price";

    pricing.appendChild(
      document.createTextNode(
        formatPrice(
          story.price
        )
      )
    );


    if (
      story.compareAt !== undefined &&
      story.compareAt !== null
    ) {

      const compare =
        document.createElement("span");

      compare.className =
        "featured-card__compare";

      compare.textContent =
        formatPrice(
          story.compareAt
        );

      pricing.appendChild(compare);
    }


    const cta =
      document.createElement("span");

    cta.className =
      "featured-card__cta";

    cta.innerHTML =
      `<span aria-hidden="true">🔐</span> View visual`;


    bottom.append(
      pricing,
      cta
    );


    body.append(
      campaign,
      title,
      bottom
    );


    card.append(
      media,
      body
    );


    bindProductCard(
      card,
      story
    );

    return card;
  }


  /* =======================================================
     12. STORY GRID
  ======================================================== */

  function renderStories() {

    dom.storiesList.innerHTML = "";

    if (!state.stories.length) {

      dom.storiesList.innerHTML =
        createEmptyState(
          "Visual stories will appear here."
        );

      return;
    }


    state.stories.forEach(
      story => {

        const card =
          createStoryCard(story);

        dom.storiesList.appendChild(card);
      }
    );
  }


  function createStoryCard(story) {

    const card =
      document.createElement("article");

    card.className =
      "story-card";

    card.tabIndex = 0;

    card.setAttribute(
      "role",
      "button"
    );

    card.setAttribute(
      "aria-label",
      `View ${story.title}`
    );


    const media =
      document.createElement("div");

    media.className =
      "story-card__media";


    const image =
      createImage(
        story.image,
        story.title
      );

    image.className =
      "story-card__image";


    const lock =
      document.createElement("span");

    lock.className =
      "story-card__lock";

    lock.setAttribute(
      "aria-label",
      "Prompt locked"
    );

    lock.textContent =
      "🔐";


    media.append(
      image,
      lock
    );


    const body =
      document.createElement("div");

    body.className =
      "story-card__body";


    const campaign =
      document.createElement("div");

    campaign.className =
      "story-card__campaign";

    campaign.textContent =
      story.campaign ||
      "Visual Story";


    const title =
      document.createElement("h3");

    title.className =
      "story-card__title";

    title.textContent =
      story.title ||
      "Untitled visual";


    const price =
      document.createElement("div");

    price.className =
      "story-card__price";

    price.textContent =
      formatPrice(
        story.price
      );


    body.append(
      campaign,
      title,
      price
    );


    card.append(
      media,
      body
    );


    bindProductCard(
      card,
      story
    );


    return card;
  }


  function bindProductCard(
    element,
    story
  ) {

    const open =
      () => openProduct(story);

    element.addEventListener(
      "click",
      open
    );

    element.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {

          event.preventDefault();

          open();
        }
      }
    );
  }


  /* =======================================================
     13. PRODUCT MODAL
  ======================================================== */

  function openProduct(story) {

    if (!story) {
      return;
    }


    dom.productImage.src =
      story.image || "";

    dom.productImage.alt =
      story.title || "FeelFrame visual";


    dom.productCampaign.textContent =
      story.campaign ||
      "FEELFRAME";


    dom.productTitle.textContent =
      story.title ||
      "Visual story";


    dom.productQuote.textContent =
      story.quote ||
      "";


    dom.productDescription.textContent =
      story.description ||
      story.context ||
      "";


    dom.productStyle.textContent =
      story.style ||
      "Visual";


    dom.productEmotion.textContent =
      story.emotion ||
      "Feel";


    dom.productPrice.textContent =
      formatPrice(
        story.price
      );


    if (
      story.compareAt !== undefined &&
      story.compareAt !== null
    ) {

      dom.productCompare.textContent =
        formatPrice(
          story.compareAt
        );

      dom.productCompare.hidden =
        false;

    } else {

      dom.productCompare.hidden =
        true;
    }


    dom.productBuy.href =
      isSafeExternalUrl(
        story.selarUrl
      )
        ? story.selarUrl
        : "#";


    dom.productModal.classList.add(
      "is-open"
    );

    dom.productModal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "is-locked"
    );


    requestAnimationFrame(() => {

      dom.productClose.focus();
    });
  }


  function closeProduct() {

    dom.productModal.classList.remove(
      "is-open"
    );

    dom.productModal.setAttribute(
      "aria-hidden",
      "true"
    );

    if (
      !dom.statusViewer.classList.contains(
        "is-open"
      )
    ) {

      document.body.classList.remove(
        "is-locked"
      );
    }
  }


  /* =======================================================
     14. SOCIAL LINKS
  ======================================================== */

  function renderSocialLinks() {

    dom.socialLinks.innerHTML = "";

    const links =
      state.data.links ||
      state.data.socials ||
      state.data.socialLinks ||
      [];


    if (
      !Array.isArray(links) ||
      !links.length
    ) {

      dom.socialLinks.hidden =
        true;

      return;
    }


    dom.socialLinks.hidden =
      false;


    links
      .filter(Boolean)
      .forEach(link => {

        if (
          !link.url ||
          !isSafeExternalUrl(link.url)
        ) {
          return;
        }


        const anchor =
          document.createElement("a");

        anchor.className =
          "social-link";

        anchor.href =
          link.url;

        anchor.target =
          "_blank";

        anchor.rel =
          "noopener noreferrer";

        anchor.textContent =
          link.label ||
          link.name ||
          "Open";


        dom.socialLinks.appendChild(
          anchor
        );
      });
  }


  /* =======================================================
     15. MAKE IT YOURS
  ======================================================== */

  function setSelectedVisualLanguage(
    language
  ) {

    state.selectedVisualLanguage =
      language;

    const options =
      document.querySelectorAll(
        ".visual-option"
      );

    options.forEach(
      option => {

        const active =
          option.dataset.value ===
          language;

        option.classList.toggle(
          "is-active",
          active
        );

        option.setAttribute(
          "aria-checked",
          String(active)
        );
      }
    );
  }


  function handleVisualLanguageClick(
    event
  ) {

    const option =
      event.target.closest(
        ".visual-option"
      );

    if (!option) {
      return;
    }


    const language =
      option.dataset.value;

    if (!language) {
      return;
    }


    setSelectedVisualLanguage(
      language
    );


    try {

      localStorage.setItem(
        CONFIG.storageKeys.selectedLanguage,
        language
      );

    } catch {
      /* Ignore storage errors. */
    }
  }


  function handleCreateSubmit(event) {

    event.preventDefault();


    const formData =
      new FormData(
        dom.createForm
      );


    const site =
      state.data?.site || {};


    const name =
      cleanValue(
        formData.get("name")
      );

    const school =
      cleanValue(
        formData.get("school")
      );

    const course =
      cleanValue(
        formData.get("course")
      );

    const feeling =
      cleanValue(
        formData.get("feeling")
      );

    const story =
      cleanValue(
        formData.get("story")
      );

    const message =
      cleanValue(
        formData.get("message")
      );


    if (!name) {

      showToast(
        "Please enter your name first."
      );

      document
        .getElementById("create-name")
        ?.focus();

      return;
    }


    const whatsappNumber =
      String(
        site.whatsappNumber ||
        ""
      ).replace(
        /\D/g,
        ""
      );


    if (!whatsappNumber) {

      showToast(
        "WhatsApp contact is not configured yet."
      );

      return;
    }


    const text =
      [
        "Hello FeelFrame™.",
        "",
        "I'd like to create a visual.",
        "",
        `Name: ${name}`,
        `School / University: ${school || "Not provided"}`,
        `Course / Field: ${course || "Not provided"}`,
        `Feeling: ${feeling || "Not provided"}`,
        `What's going on: ${story || "Not provided"}`,
        `What the visual should say: ${message || "Not provided"}`,
        `Visual language: ${state.selectedVisualLanguage}`
      ].join("\n");


    const whatsappUrl =
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;


    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }


  /* =======================================================
     16. NAVIGATION
  ======================================================== */

  function scrollToCreate() {

    dom.createSection?.scrollIntoView({
      behavior:
        prefersReducedMotion()
          ? "auto"
          : "smooth",
      block: "start"
    });
  }


  function scrollToStories() {

    document
      .getElementById("stories-section")
      ?.scrollIntoView({
        behavior:
          prefersReducedMotion()
            ? "auto"
            : "smooth",
        block: "start"
      });
  }


  /* =======================================================
     17. EVENTS
  ======================================================== */

  function bindStaticEvents() {

    dom.makeItYours?.addEventListener(
      "click",
      scrollToCreate
    );


    dom.viewAll?.addEventListener(
      "click",
      scrollToStories
    );


    document
      .getElementById("visual-language")
      ?.addEventListener(
        "click",
        handleVisualLanguageClick
      );


    dom.createForm?.addEventListener(
      "submit",
      handleCreateSubmit
    );


    /* Status */

    dom.statusClose?.addEventListener(
      "click",
      closeStatus
    );


    dom.statusPrevious?.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        goToPreviousStatus();
      }
    );


    dom.statusNext?.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        goToNextStatus();
      }
    );


    dom.statusViewer?.addEventListener(
      "touchstart",
      handleStatusTouchStart,
      {
        passive: true
      }
    );


    dom.statusViewer?.addEventListener(
      "touchend",
      handleStatusTouchEnd,
      {
        passive: true
      }
    );


    /*
      Mouse hold support for desktop.
    */

    dom.statusViewer?.addEventListener(
      "mousedown",
      event => {

        if (
          event.target.closest(
            ".status-viewer__close"
          )
        ) {
          return;
        }

        pauseStatus();
      }
    );


    dom.statusViewer?.addEventListener(
      "mouseup",
      () => {

        if (
          dom.statusViewer.classList.contains(
            "is-open"
          )
        ) {

          resumeStatus();
        }
      }
    );


    dom.statusViewer?.addEventListener(
      "mouseleave",
      () => {

        if (
          dom.statusViewer.classList.contains(
            "is-open"
          )
        ) {

          resumeStatus();
        }
      }
    );


    /*
      Backdrops.
    */

    document
      .querySelectorAll(
        "[data-status-close]"
      )
      .forEach(element => {

        element.addEventListener(
          "click",
          closeStatus
        );
      });


    document
      .querySelectorAll(
        "[data-product-close]"
      )
      .forEach(element => {

        element.addEventListener(
          "click",
          closeProduct
        );
      });


    dom.productClose?.addEventListener(
      "click",
      closeProduct
    );


    /* Escape */

    document.addEventListener(
      "keydown",
      event => {

        if (
          event.key !== "Escape"
        ) {
          return;
        }


        if (
          dom.statusViewer.classList.contains(
            "is-open"
          )
        ) {

          closeStatus();

          return;
        }


        if (
          dom.productModal.classList.contains(
            "is-open"
          )
        ) {

          closeProduct();
        }
      }
    );


    /*
      Status keyboard navigation.
    */

    document.addEventListener(
      "keydown",
      event => {

        if (
          !dom.statusViewer.classList.contains(
            "is-open"
          )
        ) {
          return;
        }


        if (
          event.key === "ArrowRight"
        ) {

          event.preventDefault();

          goToNextStatus();

        } else if (
          event.key === "ArrowLeft"
        ) {

          event.preventDefault();

          goToPreviousStatus();

        } else if (
          event.key === " "
        ) {

          event.preventDefault();

          if (state.statusPaused) {
            resumeStatus();
          } else {
            pauseStatus();
          }
        }
      }
    );
  }


  /* =======================================================
     18. ERROR STATE
  ======================================================== */

  function renderErrorState() {

    const sections = [
      dom.statusSection,
      dom.featuredList,
      dom.storiesList
    ];


    if (dom.statusSection) {
      dom.statusSection.hidden = true;
    }


    if (dom.featuredList) {

      dom.featuredList.innerHTML =
        createErrorState(
          "We couldn't load the FeelFrame collection right now."
        );
    }


    if (dom.storiesList) {

      dom.storiesList.innerHTML =
        createErrorState(
          "Please refresh the page and try again."
        );
    }


    void sections;
  }


  function createEmptyState(message) {

    const wrapper =
      document.createElement("div");

    wrapper.className =
      "empty-state";

    wrapper.textContent =
      message;

    return wrapper;
  }


  function createErrorState(message) {

    const wrapper =
      document.createElement("div");

    wrapper.className =
      "error-state";

    wrapper.textContent =
      message;

    return wrapper;
  }


  /* =======================================================
     19. UTILITIES
  ======================================================== */

  function createImage(
    src,
    alt
  ) {

    const image =
      document.createElement("img");

    image.src =
      src || "";

    image.alt =
      alt || "FeelFrame visual";

    image.loading =
      "lazy";

    image.decoding =
      "async";

    image.addEventListener(
      "error",
      () => {

        image.removeAttribute(
          "src"
        );

        image.setAttribute(
          "aria-label",
          "Image unavailable"
        );
      },
      {
        once: true
      }
    );

    return image;
  }


  function getSiteName() {

    return (
      state.data?.site?.name ||
      "FeelFrame™"
    );
  }


  function getAvatarLetter() {

    const name =
      getSiteName()
        .replace(
          /[™®]/g,
          ""
        )
        .trim();

    return (
      name.charAt(0) ||
      "F"
    ).toUpperCase();
  }


  function formatPrice(value) {

    const amount =
      Number(value);

    if (
      !Number.isFinite(amount)
    ) {

      return "";
    }


    const currency =
      state.data?.site?.currency ||
      "NGN";


    try {

      return new Intl.NumberFormat(
        "en-NG",
        {
          style: "currency",
          currency,
          maximumFractionDigits: 0
        }
      ).format(amount);

    } catch {

      return `${currency} ${amount.toLocaleString()}`;
    }
  }


  function formatStatusTime(
    createdAt
  ) {

    if (!createdAt) {
      return "Just now";
    }


    const created =
      new Date(
        createdAt
      ).getTime();


    if (
      Number.isNaN(created)
    ) {
      return "Just now";
    }


    const difference =
      Math.max(
        0,
        Date.now() -
        created
      );


    const seconds =
      Math.floor(
        difference / 1000
      );

    const minutes =
      Math.floor(
        seconds / 60
      );

    const hours =
      Math.floor(
        minutes / 60
      );

    const days =
      Math.floor(
        hours / 24
      );


    if (seconds < 60) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    if (hours < 24) {
      return `${hours}h ago`;
    }

    if (days === 1) {
      return "Yesterday";
    }

    return `${days}d ago`;
  }


  function cleanValue(value) {

    return String(
      value ?? ""
    )
      .trim()
      .replace(
        /\s+/g,
        " "
      );
  }


  function clamp(
    value,
    min,
    max
  ) {

    return Math.min(
      Math.max(
        value,
        min
      ),
      max
    );
  }


  function prefersReducedMotion() {

    return window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }


  function isSafeExternalUrl(
    value
  ) {

    if (!value) {
      return false;
    }


    try {

      const url =
        new URL(
          value,
          window.location.href
        );


      return (
        url.protocol === "https:" ||
        url.protocol === "http:"
      );

    } catch {

      return false;
    }
  }


  /* =======================================================
     20. TOAST
  ======================================================== */

  function showToast(
    message
  ) {

    if (!dom.toast) {
      return;
    }


    dom.toast.textContent =
      message;


    dom.toast.classList.add(
      "is-visible"
    );


    if (state.toastTimer) {

      clearTimeout(
        state.toastTimer
      );
    }


    state.toastTimer =
      window.setTimeout(
        () => {

          dom.toast.classList.remove(
            "is-visible"
          );

        },
        2800
      );
  }

})();
