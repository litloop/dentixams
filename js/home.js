/* =========================================================
   FeelFrame™ — Home
   home.js
   Production Homepage Controller
   ========================================================= */

(() => {
  "use strict";

  const CORE = window.FeelFrameCore;

  if (!CORE) {
    console.error("[FeelFrame] home.js requires core.js.");
    return;
  }

  /* =========================================================
     CORE REFERENCES
     ========================================================= */

  const $ =
    typeof CORE.$ === "function"
      ? CORE.$
      : (selector, scope = document) =>
          scope.querySelector(selector);

  const $$ =
    typeof CORE.$$ === "function"
      ? CORE.$$
      : (selector, scope = document) =>
          Array.from(scope.querySelectorAll(selector));

  const escapeHTML =
    typeof CORE.escapeHTML === "function"
      ? CORE.escapeHTML
      : value =>
          String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

  const openStory =
    typeof CORE.openStory === "function"
      ? CORE.openStory
      : storyId => {
          if (!storyId) return;

          const url = new URL(
            "story.html",
            document.baseURI
          );

          url.searchParams.set("id", storyId);

          window.location.assign(url.href);
        };

  /* =========================================================
     CONFIG
     ========================================================= */

  const CONFIG = Object.freeze({
    selectors: Object.freeze({
      page: ".home-page",

      hero: ".home-hero",
      heroTitle: "#homeHeroTitle",
      heroDescription: "#homeHeroDescription",
      heroCTA: "[data-hero-cta]",

      featured: ".home-featured",
      featuredGrid: "#homeStoryGrid",

      coverflowViewport: "#coverflowViewport",
      coverflowTrack: "#coverflowTrack",

      storyBoard: ".story-board",
      storyBoardTitle: "#storyBoardTitle",
      storyBoardGrid: "#homeStoryGrid",

      emptyState: "#emptyState",

      makeYours: "#make-it-yours"
    }),

    limits: Object.freeze({
      featured: 7,
      board: 12
    }),

    defaults: Object.freeze({
      heroTitle: "Some feelings deserve to be seen.",
      heroDescription:
        "Visual stories built around real emotions, milestones and human moments.",
      boardTitle: "A visual board of human moments."
    })
  });

  /* =========================================================
     STATE
     ========================================================= */

  const STATE = {
    initialized: false,
    rendered: false,

    stories: [],
    featuredStories: [],
    boardStories: [],

    hero: {
      title: "",
      description: ""
    }
  };

  /* =========================================================
     HELPERS
     ========================================================= */

  const getGlobalState = () => {
    return (
      window.FeelFrame?.state ||
      window.FEELFRAME ||
      null
    );
  };

  const getStories = () => {
    const state = getGlobalState();

    if (!state || !Array.isArray(state.stories)) {
      return [];
    }

    return state.stories.filter(Boolean);
  };

  const getSite = () => {
    const state = getGlobalState();

    return state?.site || {};
  };

  const normalize = value => {
    return String(value ?? "")
      .trim()
      .toLowerCase();
  };

  const uniqueStories = stories => {
    const seen = new Set();

    return stories.filter(story => {
      if (!story) return false;

      const key =
        story.id ||
        story.title ||
        story.image;

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    });
  };

  const getStoryImage = story => {
    if (!story) return "";

    return (
      story.image ||
      story.coverImage ||
      story.thumbnail ||
      ""
    );
  };

  const getStoryTitle = story => {
    if (!story) return "Untitled story";

    return (
      story.title ||
      story.promptTitle ||
      story.campaign ||
      story.emotion ||
      "Untitled story"
    );
  };

  const getStoryCampaign = story => {
    return (
      story?.campaign ||
      story?.moment ||
      ""
    );
  };

  const getStoryEmotion = story => {
    return (
      story?.emotion ||
      story?.feeling ||
      ""
    );
  };

  const getStoryMoment = story => {
    return (
      story?.moment ||
      story?.context ||
      ""
    );
  };

  const getStoryQuote = story => {
    return story?.quote || "";
  };

  const getStoryDescription = story => {
    return (
      story?.description ||
      story?.context ||
      ""
    );
  };

  const getStoryRatio = story => {
    return (
      story?.ratio ||
      "4:5"
    );
  };

  const isFeatured = story => {
    return (
      story?.featured === true ||
      story?.featured === "true" ||
      story?.featured === 1
    );
  };

  /* =========================================================
     PAGE DETECTION
     ========================================================= */

  const isHomePage = () => {
    if (document.body?.classList.contains("home-page")) {
      return true;
    }

    return Boolean(
      $(CONFIG.selectors.page)
    );
  };

  /* =========================================================
     HERO
     ========================================================= */

  const getHeroContent = () => {
    const site = getSite();

    return {
      title:
        site.tagline ||
        CONFIG.defaults.heroTitle,

      description:
        site.description ||
        CONFIG.defaults.heroDescription
    };
  };

  const renderHero = () => {
    const heroTitle =
      $(CONFIG.selectors.heroTitle);

    const heroDescription =
      $(CONFIG.selectors.heroDescription);

    const heroCTA =
      $(CONFIG.selectors.heroCTA);

    STATE.hero = getHeroContent();

    if (heroTitle) {
      heroTitle.textContent =
        STATE.hero.title;
    }

    if (heroDescription) {
      heroDescription.textContent =
        STATE.hero.description;
    }

    if (heroCTA) {
      heroCTA.addEventListener(
        "click",
        event => {
          const target =
            heroCTA.getAttribute("href");

          if (
            !target ||
            !target.startsWith("#")
          ) {
            return;
          }

          const section =
            document.querySelector(target);

          if (!section) return;

          event.preventDefault();

          section.scrollIntoView({
            behavior:
              window.matchMedia?.(
                "(prefers-reduced-motion: reduce)"
              ).matches
                ? "auto"
                : "smooth",
            block: "start"
          });
        }
      );
    }

    const hero =
      $(CONFIG.selectors.hero);

    if (hero) {
      hero.classList.add("is-ready");
    }
  };

  /* =========================================================
     STORY DATA PREPARATION
     ========================================================= */

  const prepareStories = () => {
    STATE.stories =
      uniqueStories(
        getStories()
      );

    const explicitlyFeatured =
      STATE.stories.filter(
        isFeatured
      );

    const fallbackStories =
      STATE.stories.filter(
        story => !isFeatured(story)
      );

    STATE.featuredStories =
      uniqueStories([
        ...explicitlyFeatured,
        ...fallbackStories
      ]).slice(
        0,
        CONFIG.limits.featured
      );

    STATE.boardStories =
      uniqueStories([
        ...STATE.stories
      ]).slice(
        0,
        CONFIG.limits.board
      );
  };

  /* =========================================================
     FEATURED STORIES
     ========================================================= */

  const createFeaturedCard = (
    story,
    index
  ) => {
    const article =
      document.createElement("article");

    article.className =
      "cover-card story-card";

    article.dataset.storyCard = "";
    article.dataset.storyId =
      story.id || "";
    article.dataset.index =
      String(index);

    article.setAttribute(
      "role",
      "group"
    );

    article.setAttribute(
      "aria-label",
      getStoryTitle(story)
    );

    article.setAttribute(
      "tabindex",
      "0"
    );

    const image =
      getStoryImage(story);

    const imageMarkup = image
      ? `
        <div class="story-card-image-wrap">
          <img
            class="story-card-image"
            src="${escapeHTML(image)}"
            alt="${escapeHTML(
              getStoryTitle(story)
            )}"
            loading="${index < 2 ? "eager" : "lazy"}"
            decoding="async"
            draggable="false"
          >
        </div>
      `
      : `
        <div
          class="story-card-image-wrap story-card-image-wrap--empty"
          aria-hidden="true"
        ></div>
      `;

    article.innerHTML = `
      ${imageMarkup}

      <div class="story-card-overlay"></div>

      <div class="story-card-meta">
        ${
          getStoryCampaign(story)
            ? `
              <span class="story-card-campaign">
                ${escapeHTML(
                  getStoryCampaign(story)
                )}
              </span>
            `
            : ""
        }

        ${
          getStoryEmotion(story)
            ? `
              <span class="story-card-emotion">
                ${escapeHTML(
                  getStoryEmotion(story)
                )}
              </span>
            `
            : ""
        }

        <h3 class="story-card-title">
          ${escapeHTML(
            getStoryTitle(story)
          )}
        </h3>

        ${
          getStoryMoment(story)
            ? `
              <span class="story-card-moment">
                ${escapeHTML(
                  getStoryMoment(story)
                )}
              </span>
            `
            : ""
        }
      </div>
    `;

    return article;
  };

  const renderFeaturedStories = () => {
    const track =
      $(CONFIG.selectors.coverflowTrack);

    if (!track) return;

    /*
     * Coverflow owns its interaction and positioning.
     * Home owns the story data and card markup.
     */
    track.innerHTML = "";

    STATE.featuredStories.forEach(
      (story, index) => {
        const card =
          createFeaturedCard(
            story,
            index
          );

        track.appendChild(card);
      }
    );

    const viewport =
      $(CONFIG.selectors.coverflowViewport);

    if (viewport) {
      viewport.hidden =
        STATE.featuredStories.length === 0;
    }

    const section =
      $(CONFIG.selectors.featured);

    if (section) {
      section.classList.toggle(
        "is-empty",
        STATE.featuredStories.length === 0
      );
    }
  };

  /* =========================================================
     STORY BOARD
     ========================================================= */

  const createBoardCard = (
    story,
    index
  ) => {
    const article =
      document.createElement("article");

    article.className =
      "story-card story-board-card";

    article.dataset.storyCard = "";
    article.dataset.storyId =
      story.id || "";

    article.dataset.index =
      String(index);

    const image =
      getStoryImage(story);

    const ratio =
      normalize(
        getStoryRatio(story)
      ).replace(
        /[^0-9a-z_-]/g,
        "-"
      );

    const quote =
      getStoryQuote(story);

    const description =
      getStoryDescription(story);

    article.innerHTML = `
      <button
        class="story-card-hit-area"
        type="button"
        aria-label="View ${escapeHTML(
          getStoryTitle(story)
        )}"
      >
        <div
          class="story-card-media story-card-media--${escapeHTML(
            ratio
          )}"
        >
          ${
            image
              ? `
                <img
                  class="story-card-image"
                  src="${escapeHTML(image)}"
                  alt="${escapeHTML(
                    getStoryTitle(story)
                  )}"
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                >
              `
              : `
                <div
                  class="story-card-image story-card-image--empty"
                  aria-hidden="true"
                ></div>
              `
          }

          <div class="story-card-overlay"></div>
        </div>

        <div class="story-card-body">

          ${
            getStoryCampaign(story)
              ? `
                <span class="story-card-campaign">
                  ${escapeHTML(
                    getStoryCampaign(story)
                  )}
                </span>
              `
              : ""
          }

          <h3 class="story-card-title">
            ${escapeHTML(
              getStoryTitle(story)
            )}
          </h3>

          ${
            getStoryEmotion(story)
              ? `
                <span class="story-card-emotion">
                  ${escapeHTML(
                    getStoryEmotion(story)
                  )}
                </span>
              `
              : ""
          }

          ${
            quote
              ? `
                <p class="story-card-quote">
                  ${escapeHTML(quote)}
                </p>
              `
              : description
                ? `
                  <p class="story-card-description">
                    ${escapeHTML(
                      description
                    )}
                  </p>
                `
                : ""
          }

        </div>
      </button>
    `;

    const trigger =
      article.querySelector(
        ".story-card-hit-area"
      );

    if (trigger) {
      trigger.addEventListener(
        "click",
        () => {
          if (story.id) {
            openStory(story.id);
          }
        }
      );
    }

    return article;
  };

  const renderStoryBoard = () => {
    const grid =
      $(CONFIG.selectors.storyBoardGrid);

    if (!grid) return;

    grid.innerHTML = "";

    STATE.boardStories.forEach(
      (story, index) => {
        grid.appendChild(
          createBoardCard(
            story,
            index
          )
        );
      }
    );

    const title =
      $(CONFIG.selectors.storyBoardTitle);

    if (title) {
      title.textContent =
        getSite().name
          ? `${getSite().name} — Stories`
          : CONFIG.defaults.boardTitle;
    }

    const emptyState =
      $(CONFIG.selectors.emptyState);

    if (emptyState) {
      emptyState.hidden =
        STATE.boardStories.length > 0;
    }

    grid.hidden =
      STATE.boardStories.length === 0;
  };

  /* =========================================================
     IMAGE HANDLING
     ========================================================= */

  const setupImageHandling = () => {
    const images = $$(
      "img[data-story-card], " +
      ".story-card img, " +
      ".cover-card img"
    );

    images.forEach(image => {
      if (
        image.dataset.ffHomeImageBound ===
        "true"
      ) {
        return;
      }

      image.dataset.ffHomeImageBound =
        "true";

      image.addEventListener(
        "error",
        () => {
          image.classList.add(
            "image-error"
          );

          const card =
            image.closest(
              "[data-story-card]"
            );

          if (card) {
            card.classList.add(
              "has-image-error"
            );
          }
        },
        { once: true }
      );
    });
  };

  /* =========================================================
     FEATURED / COVERFLOW INTEGRATION
     ========================================================= */

  const notifyCoverflow = () => {
    const coverflow =
      window.FeelFrame?.coverflow ||
      window.FeelFrameCoverflow;

    if (
      coverflow &&
      typeof coverflow.init === "function"
    ) {
      coverflow.init();
    }
  };

  /* =========================================================
     HOMEPAGE RENDERING
     ========================================================= */

  const renderHomepage = () => {
    if (!isHomePage()) {
      return false;
    }

    prepareStories();

    renderHero();

    renderFeaturedStories();

    renderStoryBoard();

    setupImageHandling();

    STATE.rendered = true;

    document.documentElement.dataset.homeReady =
      "true";

    document.body.classList.add(
      "home-ready"
    );

    document.dispatchEvent(
      new CustomEvent(
        "feelframe:home-rendered",
        {
          detail: {
            stories: STATE.stories,
            featured:
              STATE.featuredStories,
            board:
              STATE.boardStories
          }
        }
      )
    );

    /*
     * Coverflow is initialized after its cards
     * have been rendered by Home.
     */
    notifyCoverflow();

    return true;
  };

  /* =========================================================
     HOMEPAGE INITIALIZATION
     ========================================================= */

  const initialize = () => {
    if (STATE.initialized) {
      return;
    }

    if (!isHomePage()) {
      return;
    }

    renderHomepage();

    STATE.initialized = true;

    document.dispatchEvent(
      new CustomEvent(
        "feelframe:home-ready",
        {
          detail: {
            state: STATE
          }
        }
      )
    );
  };

  /* =========================================================
     PUBLIC API
     ========================================================= */

  const API = Object.freeze({
    init: initialize,

    render: renderHomepage,

    renderHero,

    renderFeaturedStories,

    renderStoryBoard,

    getStories: () =>
      [...STATE.stories],

    getFeaturedStories: () =>
      [...STATE.featuredStories],

    getBoardStories: () =>
      [...STATE.boardStories],

    getState: () => ({
      initialized:
        STATE.initialized,

      rendered:
        STATE.rendered,

      stories:
        [...STATE.stories],

      featuredStories:
        [...STATE.featuredStories],

      boardStories:
        [...STATE.boardStories]
    })
  });

  window.FeelFrame =
    window.FeelFrame || {};

  window.FeelFrame.home =
    API;

  window.FeelFrameHome =
    API;

  /* =========================================================
     BOOT
     ========================================================= */

  const boot = () => {
    initialize();
  };

  if (
    CORE.ready &&
    typeof CORE.ready.then ===
      "function"
  ) {
    CORE.ready
      .then(boot)
      .catch(error => {
        console.error(
          "[FeelFrame] Homepage initialization failed:",
          error
        );
      });
  } else if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      boot,
      { once: true }
    );
  } else {
    boot();
  }

})();
