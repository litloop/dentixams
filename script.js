/* =========================================================
   FEELFRAME™ — GLOBAL APPLICATION ENGINE
   Production Script
   ---------------------------------------------------------
   Data source: data.json
   Pages:
   - index.html
   - explore.html
   - create.html
   - story.html

   Responsibilities:
   - Data loading
   - Global state
   - Navigation
   - Homepage rendering
   - 3D Coverflow
   - Story board
   - Explore search/filter
   - Story/product routing
   - Create / personalization engine
   - Creative direction generation
   - WhatsApp request generation
   - Checkout validation
   - Image resilience
   - Accessibility
   - Reduced motion
   - Error / empty states
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     CONFIGURATION
     ========================================================= */

  const CONFIG = {
    dataUrl: "data.json",

    pages: {
      home: "index.html",
      explore: "explore.html",
      create: "create.html",
      story: "story.html"
    },

    selectors: {
      coverflow:
        "#coverflow, .coverflow, [data-coverflow]",

      coverflowTrack:
        "#coverflowTrack, .coverflow-track, [data-coverflow-track]",

      coverflowPrev:
        "#coverflowPrev, .coverflow-prev, [data-coverflow-prev]",

      coverflowNext:
        "#coverflowNext, .coverflow-next, [data-coverflow-next]",

      coverflowDots:
        "#coverflowDots, .coverflow-dots, [data-coverflow-dots]",

      storyGrid:
        "#storyGrid, .story-grid, [data-story-grid]",

      exploreGrid:
        "#exploreGrid, .explore-grid, [data-explore-grid]",

      search:
        "#storySearch, #searchInput, .story-search, [data-story-search]",

      campaignFilter:
        "#campaignFilter, .campaign-filter, [data-campaign-filter]",

      emotionFilter:
        "#emotionFilter, .emotion-filter, [data-emotion-filter]",

      storyCount:
        "#storyCount, .story-count, [data-story-count]",

      emptyState:
        "#emptyState, .empty-state, [data-empty-state]",

      globalError:
        "#globalError, .global-error, [data-global-error]",

      createForm:
        "#createForm, form[data-create-form], [data-create-form]",

      imageInput:
        "#referenceImage, #imageUpload, input[type='file'][data-reference]",

      imagePreview:
        "#imagePreview, .image-preview, [data-image-preview]"
    }
  };


  /* =========================================================
     APPLICATION STATE
     ========================================================= */

  const FEELFRAME = {
    data: null,

    site: {
      name: "FeelFrame™",
      tagline: "Some feelings deserve to be seen.",
      description: "",
      whatsappNumber: "",
      currency: "NGN"
    },

    stories: [],

    filters: {
      campaign: "all",
      emotion: "all",
      search: ""
    },

    coverflow: {
      stories: [],
      current: 0,
      dragging: false,
      pointerId: null,
      startX: 0,
      currentX: 0,
      moved: false,
      suppressClick: false
    },

    create: {
      referenceImage: null,
      referenceName: ""
    }
  };


  /* =========================================================
     DOM HELPERS
     ========================================================= */

  const $ = (selector, root = document) => {
    if (!selector) return null;

    const selectors = selector
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    for (const item of selectors) {
      const element = root.querySelector(item);

      if (element) {
        return element;
      }
    }

    return null;
  };


  const $$ = (selector, root = document) => {
    if (!selector) return [];

    return Array.from(
      root.querySelectorAll(selector)
    );
  };


  const firstExisting = (...selectors) => {
    for (const selector of selectors) {
      const element = $(selector);

      if (element) return element;
    }

    return null;
  };


  const escapeHTML = (value) => {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };


  const safeText = (value, fallback = "") => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return fallback;
    }

    return String(value);
  };


  const normalize = (value) => {
    return String(value ?? "")
      .trim()
      .toLowerCase();
  };


  const slugify = (value) => {
    return String(value ?? "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };


  const unique = (array) => {
    return [...new Set(array.filter(Boolean))];
  };


  /* =========================================================
     PAGE DETECTION
     ========================================================= */

  const getPageName = () => {
    const path = window.location.pathname
      .split("/")
      .pop()
      .toLowerCase();

    if (!path || path === "/") {
      return "home";
    }

    if (path === "index.html") {
      return "home";
    }

    if (path === "explore.html") {
      return "explore";
    }

    if (path === "create.html") {
      return "create";
    }

    if (path === "story.html") {
      return "story";
    }

    return "unknown";
  };


  /* =========================================================
     URL HELPERS
     ========================================================= */

  const getStoryIdFromURL = () => {
    const params = new URLSearchParams(
      window.location.search
    );

    return (
      params.get("id") ||
      params.get("story") ||
      params.get("product") ||
      ""
    );
  };


  const buildStoryURL = (story) => {
    if (!story || !story.id) {
      return CONFIG.pages.story;
    }

    return `${CONFIG.pages.story}?id=${encodeURIComponent(
      story.id
    )}`;
  };


  const navigateToStory = (story) => {
    if (!story || !story.id) return;

    window.location.href = buildStoryURL(story);
  };


  const navigateTo = (page) => {
    if (!page) return;

    window.location.href = page;
  };


  /* =========================================================
     DATA VALIDATION
     ========================================================= */

  const isValidStory = (story) => {
    if (!story || typeof story !== "object") {
      return false;
    }

    return Boolean(
      story.id &&
      (
        story.title ||
        story.campaign ||
        story.image
      )
    );
  };


  const validateData = (data) => {
    if (!data || typeof data !== "object") {
      throw new Error(
        "FeelFrame data is not a valid object."
      );
    }

    if (
      data.stories !== undefined &&
      !Array.isArray(data.stories)
    ) {
      throw new Error(
        "FeelFrame stories must be an array."
      );
    }

    return true;
  };


  /* =========================================================
     DATA LOADING
     ========================================================= */

  const loadData = async () => {
    try {
      const response = await fetch(
        CONFIG.dataUrl,
        {
          method: "GET",
          headers: {
            Accept: "application/json"
          },
          cache: "no-cache"
        }
      );

      if (!response.ok) {
        throw new Error(
          `Unable to load data.json (${response.status}).`
        );
      }

      const data = await response.json();

      validateData(data);

      FEELFRAME.data = data;

      FEELFRAME.site = {
        ...FEELFRAME.site,
        ...(data.site || {})
      };

      FEELFRAME.stories = Array.isArray(data.stories)
        ? data.stories.filter(isValidStory)
        : [];

      return data;
    } catch (error) {
      console.error(
        "[FeelFrame] Data loading error:",
        error
      );

      showGlobalError(
        "FeelFrame could not load its visual library right now."
      );

      throw error;
    }
  };


  /* =========================================================
     GLOBAL ERROR HANDLING
     ========================================================= */

  const showGlobalError = (message) => {
    const errorElement = $(
      CONFIG.selectors.globalError
    );

    if (!errorElement) return;

    errorElement.hidden = false;

    errorElement.innerHTML = `
      <div class="error-state-content">
        <strong>Something went wrong.</strong>
        <span>${escapeHTML(message)}</span>
      </div>
    `;
  };


  const hideGlobalError = () => {
    const errorElement = $(
      CONFIG.selectors.globalError
    );

    if (!errorElement) return;

    errorElement.hidden = true;
  };


  /* =========================================================
     SITE METADATA
     ========================================================= */

  const updateSiteMetadata = () => {
    const title = document.title;

    if (
      !title ||
      title === "Document" ||
      title.trim() === ""
    ) {
      document.title =
        FEELFRAME.site.name ||
        "FeelFrame™";
    }

    const metaDescription = document.querySelector(
      'meta[name="description"]'
    );

    if (
      metaDescription &&
      FEELFRAME.site.description
    ) {
      metaDescription.setAttribute(
        "content",
        FEELFRAME.site.description
      );
    }

    $$("[data-site-name]").forEach((element) => {
      element.textContent =
        FEELFRAME.site.name || "FeelFrame™";
    });

    $$("[data-site-tagline]").forEach((element) => {
      element.textContent =
        FEELFRAME.site.tagline ||
        "Some feelings deserve to be seen.";
    });

    $$("[data-site-description]").forEach((element) => {
      element.textContent =
        FEELFRAME.site.description || "";
    });
  };


  /* =========================================================
     IMAGE RESILIENCE
     ========================================================= */

  const setupImageFallbacks = () => {
    $$("img").forEach((image) => {
      if (image.dataset.ffImageBound === "true") {
        return;
      }

      image.dataset.ffImageBound = "true";

      image.addEventListener(
        "error",
        () => {
          image.classList.add("image-error");

          image.setAttribute(
            "aria-hidden",
            "true"
          );

          const parent = image.closest(
            ".story-card, .cover-card, .story-visual, .visual-card, [data-story-card]"
          );

          if (parent) {
            parent.classList.add(
              "has-image-error"
            );
          }
        },
        { once: true }
      );
    });
  };


  /* =========================================================
     STORY CARD MARKUP
     ========================================================= */

  const getStoryImage = (story) => {
    return safeText(
      story.image,
      ""
    );
  };


  const createStoryCard = (
    story,
    {
      cover = false,
      index = 0
    } = {}
  ) => {
    const image = getStoryImage(story);

    const cardClass = cover
      ? "cover-card"
      : "story-card";

    return `
      <article
        class="${cardClass}"
        data-story-card
        data-story-id="${escapeHTML(story.id)}"
        data-index="${index}"
        tabindex="0"
        role="link"
        aria-label="Open ${escapeHTML(
          story.title || story.campaign || "visual story"
        )}"
      >

        <div class="story-card-image-wrap">

          ${
            image
              ? `
                <img
                  class="story-card-image"
                  src="${escapeHTML(image)}"
                  alt="${escapeHTML(
                    story.title ||
                    story.campaign ||
                    "FeelFrame visual story"
                  )}"
                  loading="${
                    cover ? "eager" : "lazy"
                  }"
                  decoding="async"
                >
              `
              : `
                <div
                  class="story-card-image story-card-image-empty"
                  aria-hidden="true"
                ></div>
              `
          }

        </div>

        <div class="story-card-overlay">

          <div class="story-card-meta">

            ${
              story.campaign
                ? `
                  <span class="story-card-campaign">
                    ${escapeHTML(story.campaign)}
                  </span>
                `
                : ""
            }

            ${
              story.emotion
                ? `
                  <span class="story-card-emotion">
                    ${escapeHTML(story.emotion)}
                  </span>
                `
                : ""
            }

          </div>

          <h3 class="story-card-title">
            ${escapeHTML(
              story.title ||
              story.campaign ||
              "Untitled Story"
            )}
          </h3>

          ${
            story.moment
              ? `
                <p class="story-card-moment">
                  ${escapeHTML(story.moment)}
                </p>
              `
              : ""
          }

        </div>

      </article>
    `;
  };


  /* =========================================================
     STORY CARD EVENTS
     ========================================================= */

  const bindStoryCardEvents = (root = document) => {
    $$(
      "[data-story-card]",
      root
    ).forEach((card) => {
      if (card.dataset.ffBound === "true") {
        return;
      }

      card.dataset.ffBound = "true";

      const open = () => {
        const storyId =
          card.dataset.storyId;

        const story =
          findStoryById(storyId);

        if (story) {
          navigateToStory(story);
        }
      };

      card.addEventListener(
        "click",
        (event) => {
          if (
            card.dataset.suppressClick ===
            "true"
          ) {
            return;
          }

          if (
            event.target.closest(
              "a, button"
            )
          ) {
            return;
          }

          open();
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
            open();
          }
        }
      );
    });
  };


  /* =========================================================
     STORY LOOKUP
     ========================================================= */

  const findStoryById = (id) => {
    if (!id) return null;

    return FEELFRAME.stories.find(
      (story) =>
        String(story.id) === String(id)
    ) || null;
  };


  /* =========================================================
     HOMEPAGE STORY BOARD
     ========================================================= */

  const renderHomeStoryBoard = () => {
    const grid =
      $(
        CONFIG.selectors.storyGrid
      );

    if (!grid) return;

    const stories = FEELFRAME.stories;

    if (!stories.length) {
      grid.innerHTML = "";
      showEmptyState(grid);
      return;
    }

    grid.innerHTML = stories
      .map((story, index) =>
        createStoryCard(
          story,
          {
            cover: false,
            index
          }
        )
      )
      .join("");

    bindStoryCardEvents(grid);
    setupImageFallbacks();
  };


  /* =========================================================
     EMPTY STATES
     ========================================================= */

  const showEmptyState = (container) => {
    if (!container) return;

    const empty =
      $(
        CONFIG.selectors.emptyState
      );

    if (empty) {
      empty.hidden = false;
    } else {
      container.innerHTML = `
        <div class="empty-state-content">
          <strong>No visual stories yet.</strong>
          <span>New FeelFrame stories will appear here.</span>
        </div>
      `;
    }
  };


  const hideEmptyState = () => {
    const empty =
      $(
        CONFIG.selectors.emptyState
      );

    if (empty) {
      empty.hidden = true;
    }
  };


  /* =========================================================
     COVERFLOW
     ========================================================= */

  const getFeaturedStories = () => {
    const featured =
      FEELFRAME.stories.filter(
        (story) =>
          story.featured === true ||
          story.featured === "true" ||
          story.featured === 1
      );

    return featured.length
      ? featured
      : FEELFRAME.stories;
  };


  const renderCoverflow = () => {
    const track =
      $(
        CONFIG.selectors.coverflowTrack
      );

    if (!track) return;

    const stories =
      getFeaturedStories();

    FEELFRAME.coverflow.stories =
      stories;

    if (!stories.length) {
      track.innerHTML = "";
      return;
    }

    if (
      FEELFRAME.coverflow.current >=
      stories.length
    ) {
      FEELFRAME.coverflow.current = 0;
    }

    track.innerHTML = stories
      .map((story, index) =>
        createStoryCard(
          story,
          {
            cover: true,
            index
          }
        )
      )
      .join("");

    bindCoverflowCards(track);
    updateCoverflow();

    renderCoverflowDots();
    setupImageFallbacks();
  };


  const getCircularOffset = (
    index,
    current,
    total
  ) => {
    if (!total) return 0;

    let offset =
      index - current;

    const half =
      Math.floor(total / 2);

    if (offset > half) {
      offset -= total;
    }

    if (offset < -half) {
      offset += total;
    }

    return offset;
  };


  const updateCoverflow = () => {
    const track =
      $(
        CONFIG.selectors.coverflowTrack
      );

    if (!track) return;

    const cards =
      $$(
        "[data-story-card]",
        track
      );

    const total =
      cards.length;

    if (!total) return;

    const current =
      FEELFRAME.coverflow.current;

    cards.forEach((card, index) => {
      const offset =
        getCircularOffset(
          index,
          current,
          total
        );

      card.classList.remove(
        "is-center",
        "is-left",
        "is-right",
        "is-far-left",
        "is-far-right"
      );

      if (offset === 0) {
        card.classList.add(
          "is-center"
        );
      } else if (offset === -1) {
        card.classList.add(
          "is-left"
        );
      } else if (offset === 1) {
        card.classList.add(
          "is-right"
        );
      } else if (offset < -1) {
        card.classList.add(
          "is-far-left"
        );
      } else if (offset > 1) {
        card.classList.add(
          "is-far-right"
        );
      }

      card.dataset.coverOffset =
        String(offset);

      card.setAttribute(
        "aria-current",
        offset === 0
          ? "true"
          : "false"
      );
    });

    updateCoverflowDots();
  };


  const moveCoverflow = (
    direction
  ) => {
    const stories =
      FEELFRAME.coverflow.stories;

    if (!stories.length) return;

    const total =
      stories.length;

    let next =
      FEELFRAME.coverflow.current +
      direction;

    if (next < 0) {
      next = total - 1;
    }

    if (next >= total) {
      next = 0;
    }

    FEELFRAME.coverflow.current =
      next;

    updateCoverflow();
  };


  const goToCoverflow = (
    index
  ) => {
    const stories =
      FEELFRAME.coverflow.stories;

    if (!stories.length) return;

    const normalized =
      (
        index % stories.length +
        stories.length
      ) %
      stories.length;

    FEELFRAME.coverflow.current =
      normalized;

    updateCoverflow();
  };


  const renderCoverflowDots = () => {
    const container =
      $(
        CONFIG.selectors.coverflowDots
      );

    if (!container) return;

    const stories =
      FEELFRAME.coverflow.stories;

    container.innerHTML =
      stories
        .map(
          (story, index) => `
            <button
              type="button"
              class="coverflow-dot"
              data-cover-index="${index}"
              aria-label="Show ${
                escapeHTML(
                  story.title ||
                  story.campaign ||
                  `story ${index + 1}`
                )
              }"
            ></button>
          `
        )
        .join("");

    $$(".coverflow-dot", container)
      .forEach((dot) => {
        dot.addEventListener(
          "click",
          () => {
            goToCoverflow(
              Number(
                dot.dataset.coverIndex
              )
            );
          }
        );
      });

    updateCoverflowDots();
  };


  const updateCoverflowDots = () => {
    const container =
      $(
        CONFIG.selectors.coverflowDots
      );

    if (!container) return;

    const dots =
      $$(".coverflow-dot", container);

    dots.forEach((dot, index) => {
      const active =
        index ===
        FEELFRAME.coverflow.current;

      dot.classList.toggle(
        "is-active",
        active
      );

      dot.setAttribute(
        "aria-current",
        active
          ? "true"
          : "false"
      );
    });
  };


  const bindCoverflowCards = (
    track
  ) => {
    const cards =
      $$(
        "[data-story-card]",
        track
      );

    cards.forEach((card) => {
      if (
        card.dataset.ffCoverBound ===
        "true"
      ) {
        return;
      }

      card.dataset.ffCoverBound =
        "true";

      card.addEventListener(
        "click",
        (event) => {
          if (
            FEELFRAME.coverflow.suppressClick
          ) {
            event.preventDefault();

            FEELFRAME.coverflow.suppressClick =
              false;

            return;
          }

          const index =
            Number(card.dataset.index);

          const offset =
            getCircularOffset(
              index,
              FEELFRAME.coverflow.current,
              cards.length
            );

          if (offset !== 0) {
            event.preventDefault();

            goToCoverflow(index);

            return;
          }

          const story =
            findStoryById(
              card.dataset.storyId
            );

          if (story) {
            navigateToStory(story);
          }
        }
      );

      card.addEventListener(
        "keydown",
        (event) => {
          if (
            event.key !== "Enter" &&
            event.key !== " "
          ) {
            return;
          }

          event.preventDefault();

          const index =
            Number(card.dataset.index);

          const offset =
            getCircularOffset(
              index,
              FEELFRAME.coverflow.current,
              cards.length
            );

          if (offset !== 0) {
            goToCoverflow(index);
            return;
          }

          const story =
            findStoryById(
              card.dataset.storyId
            );

          if (story) {
            navigateToStory(story);
          }
        }
      );
    });
  };


  const setupCoverflowControls = () => {
    const previous =
      $(
        CONFIG.selectors.coverflowPrev
      );

    const next =
      $(
        CONFIG.selectors.coverflowNext
      );

    if (previous) {
      previous.addEventListener(
        "click",
        () => moveCoverflow(-1)
      );
    }

    if (next) {
      next.addEventListener(
        "click",
        () => moveCoverflow(1)
      );
    }
  };


  const setupCoverflowKeyboard = () => {
    const container =
      $(
        CONFIG.selectors.coverflow
      );

    if (!container) return;

    if (
      container.dataset.ffKeyboardBound ===
      "true"
    ) {
      return;
    }

    container.dataset.ffKeyboardBound =
      "true";

    container.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "ArrowLeft"
        ) {
          event.preventDefault();
          moveCoverflow(-1);
        }

        if (
          event.key === "ArrowRight"
        ) {
          event.preventDefault();
          moveCoverflow(1);
        }
      }
    );
  };


  const setupCoverflowPointer = () => {
    const container =
      $(
        CONFIG.selectors.coverflow
      );

    if (!container) return;

    if (
      container.dataset.ffPointerBound ===
      "true"
    ) {
      return;
    }

    container.dataset.ffPointerBound =
      "true";

    container.addEventListener(
      "pointerdown",
      (event) => {
        if (
          event.pointerType === "mouse" &&
          event.button !== 0
        ) {
          return;
        }

        FEELFRAME.coverflow.dragging =
          true;

        FEELFRAME.coverflow.pointerId =
          event.pointerId;

        FEELFRAME.coverflow.startX =
          event.clientX;

        FEELFRAME.coverflow.currentX =
          event.clientX;

        FEELFRAME.coverflow.moved =
          false;

        try {
          container.setPointerCapture(
            event.pointerId
          );
        } catch (_) {}
      }
    );

    container.addEventListener(
      "pointermove",
      (event) => {
        if (
          !FEELFRAME.coverflow.dragging ||
          event.pointerId !==
            FEELFRAME.coverflow.pointerId
        ) {
          return;
        }

        FEELFRAME.coverflow.currentX =
          event.clientX;

        const distance =
          event.clientX -
          FEELFRAME.coverflow.startX;

        if (Math.abs(distance) > 8) {
          FEELFRAME.coverflow.moved =
            true;
        }
      }
    );

    const finishPointer =
      (event) => {
        if (
          !FEELFRAME.coverflow.dragging ||
          event.pointerId !==
            FEELFRAME.coverflow.pointerId
        ) {
          return;
        }

        const distance =
          FEELFRAME.coverflow.currentX -
          FEELFRAME.coverflow.startX;

        FEELFRAME.coverflow.dragging =
          false;

        if (
          Math.abs(distance) > 45
        ) {
          FEELFRAME.coverflow.suppressClick =
            true;

          if (distance < 0) {
            moveCoverflow(1);
          } else {
            moveCoverflow(-1);
          }
        }

        try {
          container.releasePointerCapture(
            event.pointerId
          );
        } catch (_) {}

        window.setTimeout(
          () => {
            FEELFRAME.coverflow.suppressClick =
              false;
          },
          100
        );
      };

    container.addEventListener(
      "pointerup",
      finishPointer
    );

    container.addEventListener(
      "pointercancel",
      finishPointer
    );
  };


  const setupCoverflow = () => {
    if (
      !$(
        CONFIG.selectors.coverflow
      )
    ) {
      return;
    }

    renderCoverflow();
    setupCoverflowControls();
    setupCoverflowKeyboard();
    setupCoverflowPointer();
  };


  /* =========================================================
     EXPLORE FILTER DATA
     ========================================================= */

  const getCampaigns = () => {
    return unique(
      FEELFRAME.stories.map(
        (story) => story.campaign
      )
    ).sort(
      (a, b) =>
        String(a).localeCompare(
          String(b)
        )
    );
  };


  const getEmotions = () => {
    return unique(
      FEELFRAME.stories.map(
        (story) => story.emotion
      )
    ).sort(
      (a, b) =>
        String(a).localeCompare(
          String(b)
        )
    );
  };


  /* =========================================================
     EXPLORE FILTER UI
     ========================================================= */

  const populateFilter = (
    selector,
    values,
    selected
  ) => {
    const element = $(selector);

    if (!element) return;

    if (
      element.tagName === "SELECT"
    ) {
      const firstOption =
        element.querySelector(
          "option[value='all'], option:not([value])"
        );

      element.innerHTML = `
        <option value="all">
          All
        </option>
        ${values
          .map(
            (value) => `
              <option
                value="${escapeHTML(value)}"
              >
                ${escapeHTML(value)}
              </option>
            `
          )
          .join("")}
      `;

      element.value =
        selected || "all";

      return;
    }

    const current =
      selected || "all";

    element.innerHTML = `
      <button
        type="button"
        class="filter-pill ${
          current === "all"
            ? "is-active"
            : ""
        }"
        data-filter-value="all"
      >
        All
      </button>

      ${values
        .map(
          (value) => `
            <button
              type="button"
              class="filter-pill ${
                normalize(current) ===
                normalize(value)
                  ? "is-active"
                  : ""
              }"
              data-filter-value="${escapeHTML(
                value
              )}"
            >
              ${escapeHTML(value)}
            </button>
          `
        )
        .join("")}
    `;

    $$(
      "[data-filter-value]",
      element
    ).forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const value =
            button.dataset.filterValue ||
            "all";

          if (
            element ===
            $(
              CONFIG.selectors.campaignFilter
            )
          ) {
            FEELFRAME.filters.campaign =
              value;
          } else {
            FEELFRAME.filters.emotion =
              value;
          }

          renderExplore();
        }
      );
    });
  };


  const setupExploreFilters = () => {
    populateFilter(
      CONFIG.selectors.campaignFilter,
      getCampaigns(),
      FEELFRAME.filters.campaign
    );

    populateFilter(
      CONFIG.selectors.emotionFilter,
      getEmotions(),
      FEELFRAME.filters.emotion
    );

    const search =
      $(
        CONFIG.selectors.search
      );

    if (
      search &&
      search.dataset.ffSearchBound !==
        "true"
    ) {
      search.dataset.ffSearchBound =
        "true";

      search.addEventListener(
        "input",
        () => {
          FEELFRAME.filters.search =
            search.value.trim();

          renderExplore();
        }
      );
    }
  };


  /* =========================================================
     EXPLORE SEARCH
     ========================================================= */

  const getSearchableStoryText = (
    story
  ) => {
    const fields = [
      "title",
      "quote",
      "context",
      "description",
      "campaign",
      "emotion",
      "moment",
      "style",
      "visualLanguage",
      "condition",
      "promptTitle"
    ];

    return fields
      .map(
        (field) =>
          story[field] || ""
      )
      .join(" ")
      .toLowerCase();
  };


  const getFilteredStories = () => {
    const campaign =
      normalize(
        FEELFRAME.filters.campaign
      );

    const emotion =
      normalize(
        FEELFRAME.filters.emotion
      );

    const search =
      normalize(
        FEELFRAME.filters.search
      );

    return FEELFRAME.stories.filter(
      (story) => {
        const matchesCampaign =
          campaign === "all" ||
          normalize(
            story.campaign
          ) === campaign;

        const matchesEmotion =
          emotion === "all" ||
          normalize(
            story.emotion
          ) === emotion;

        const matchesSearch =
          !search ||
          getSearchableStoryText(
            story
          ).includes(search);

        return (
          matchesCampaign &&
          matchesEmotion &&
          matchesSearch
        );
      }
    );
  };


  /* =========================================================
     EXPLORE RENDERING
     ========================================================= */

  const renderExplore = () => {
    const grid =
      firstExisting(
        CONFIG.selectors.exploreGrid,
        CONFIG.selectors.storyGrid
      );

    if (!grid) return;

    const results =
      getFilteredStories();

    const count =
      $(
        CONFIG.selectors.storyCount
      );

    if (count) {
      count.textContent =
        `${results.length} ${
          results.length === 1
            ? "story"
            : "stories"
        }`;
    }

    if (!results.length) {
      grid.innerHTML = "";

      showEmptyState(grid);

      return;
    }

    hideEmptyState();

    grid.innerHTML =
      results
        .map(
          (story, index) =>
            createStoryCard(
              story,
              {
                cover: false,
                index
              }
            )
        )
        .join("");

    bindStoryCardEvents(grid);

    setupImageFallbacks();
  };


  /* =========================================================
     CREATE — FEELING TRANSLATION ENGINE
     ========================================================= */

  const EMOTION_RULES = {
    determined: {
      emotion:
        "Quiet determination and forward movement",
      condition:
        "Focused, persistent and composed",
      commands: [
        "/lowangle"
      ]
    },

    proud: {
      emotion:
        "Confidence, achievement and self-recognition",
      condition:
        "Elevated, assured and present",
      commands: [
        "/backlight"
      ]
    },

    hopeful: {
      emotion:
        "Hope, possibility and forward movement",
      condition:
        "Open, optimistic and quietly expectant",
      commands: [
        "/sunrise"
      ]
    },

    curious: {
      emotion:
        "Curiosity, discovery and exploration",
      condition:
        "Observant, open and exploratory",
      commands: [
        "/wideangle"
      ]
    },

    reflective: {
      emotion:
        "Reflection, memory and inner awareness",
      condition:
        "Quiet, thoughtful and introspective",
      commands: [
        "/softlight"
      ]
    },

    bold: {
      emotion:
        "Boldness, presence and visual confidence",
      condition:
        "Strong, expressive and unapologetic",
      commands: [
        "/lowangle"
      ]
    },

    ambitious: {
      emotion:
        "Ambition, movement and future focus",
      condition:
        "Driven, focused and forward-looking",
      commands: [
        "/lowangle"
      ]
    },

    inspired: {
      emotion:
        "Inspiration, possibility and creative energy",
      condition:
        "Expressive, energetic and open",
      commands: [
        "/backlight"
      ]
    },

    grateful: {
      emotion:
        "Gratitude, warmth and appreciation",
      condition:
        "Warm, grounded and emotionally open",
      commands: [
        "/softlight"
      ]
    },

    calm: {
      emotion:
        "Calm presence and emotional clarity",
      condition:
        "Balanced, quiet and composed",
      commands: [
        "/softlight"
      ]
    },

    excited: {
      emotion:
        "Excitement, energy and anticipation",
      condition:
        "Energetic, expressive and forward-moving",
      commands: [
        "/wideangle"
      ]
    }
  };


  const VISUAL_LANGUAGE_RULES = {
    cinematic: {
      style:
        "Cinematic realism, controlled lighting, natural depth and filmic composition",
      commands: [
        "/cinematic",
        "/35mmfilm",
        "/shallowdepth"
      ]
    },

    editorial: {
      style:
        "Editorial composition, refined styling, intentional framing and magazine-inspired art direction",
      commands: [
        "/editorial"
      ]
    },

    film: {
      style:
        "Filmic visual language, natural grain, atmospheric lighting and cinematic composition",
      commands: [
        "/35mmfilm",
        "/cinematic"
      ]
    },

    luxury: {
      style:
        "Luxury visual direction, refined composition, controlled highlights and premium editorial styling",
      commands: [
        "/luxury",
        "/editorial",
        "/rimlight"
      ]
    },

    dreamlike: {
      style:
        "Dreamlike atmosphere, soft transitions, atmospheric light and imaginative spatial composition",
      commands: [
        "/dreamcore",
        "/backlight",
        "/wideangle"
      ]
    },

    minimal: {
      style:
        "Minimal visual composition, controlled space, restrained styling and deliberate subject placement",
      commands: [
        "/minimal"
      ]
    },

    artistic: {
      style:
        "Artistic visual interpretation, expressive composition and intentional visual abstraction",
      commands: [
        "/artistic"
      ]
    },

    "dark & moody": {
      style:
        "Dark atmospheric composition, controlled shadows, restrained highlights and cinematic depth",
      commands: [
        "/moody",
        "/cinematic"
      ]
    },

    dark: {
      style:
        "Dark atmospheric composition, controlled shadows, restrained highlights and cinematic depth",
      commands: [
        "/moody",
        "/cinematic"
      ]
    }
  };


  const getEmotionRule = (
    feeling
  ) => {
    const key =
      normalize(feeling);

    return (
      EMOTION_RULES[key] || {
        emotion:
          safeText(
            feeling,
            "A deeply personal emotional state"
          ),
        condition:
          "Present, intentional and emotionally grounded",
        commands: []
      }
    );
  };


  const getVisualLanguageRule = (
    language
  ) => {
    const key =
      normalize(language);

    return (
      VISUAL_LANGUAGE_RULES[key] || {
        style:
          safeText(
            language,
            "Intentional visual storytelling"
          ),
        commands: []
      }
    );
  };


  const uniqueCommands = (
    commands
  ) => {
    return unique(
      commands.map(
        (command) =>
          String(command).trim()
      )
    );
  };


  const buildCreativeDirection = ({
    feeling,
    visualLanguage,
    moment,
    context,
    intendedMessage
  }) => {
    const emotionRule =
      getEmotionRule(feeling);

    const visualRule =
      getVisualLanguageRule(
        visualLanguage
      );

    const commands =
      uniqueCommands([
        ...(emotionRule.commands || []),
        ...(visualRule.commands || [])
      ]);

    const parts = [
      emotionRule.emotion,
      emotionRule.condition,
      visualRule.style
    ];

    if (moment) {
      parts.push(
        `The visual should communicate the significance of ${moment}.`
      );
    }

    if (context) {
      parts.push(
        `The personal context should feel authentic and emotionally grounded: ${context}.`
      );
    }

    if (intendedMessage) {
      parts.push(
        `The final visual should communicate: ${intendedMessage}.`
      );
    }

    return {
      emotion:
        emotionRule.emotion,

      condition:
        emotionRule.condition,

      style:
        visualRule.style,

      commands,

      direction:
        parts.join(" ")
    };
  };


  /* =========================================================
     CREATE FORM HELPERS
     ========================================================= */

  const getFormValue = (
    form,
    ...names
  ) => {
    for (const name of names) {
      const field =
        form.elements[name] ||
        form.querySelector(
          `[name="${CSS.escape(name)}"], #${CSS.escape(name)}`
        );

      if (
        field &&
        typeof field.value ===
          "string"
      ) {
        return field.value.trim();
      }
    }

    return "";
  };


  const getSelectedChoice = (
    form,
    selector
  ) => {
    const selected =
      form.querySelector(
        `${selector}:checked`
      );

    return selected
      ? selected.value.trim()
      : "";
  };


  const getCreateFormData = (
    form
  ) => {
    const name =
      getFormValue(
        form,
        "name",
        "fullName",
        "fullname"
      );

    const school =
      getFormValue(
        form,
        "school",
        "university",
        "institution"
      );

    const course =
      getFormValue(
        form,
        "course",
        "field",
        "courseField"
      );

    const moment =
      getFormValue(
        form,
        "moment",
        "yourMoment"
      );

    const feeling =
      getFormValue(
        form,
        "feeling",
        "emotion"
      ) ||
      getSelectedChoice(
        form,
        'input[name="feeling"]'
      );

    const context =
      getFormValue(
        form,
        "context",
        "story",
        "whatGoingThrough",
        "whatImGoingThrough"
      );

    const intendedMessage =
      getFormValue(
        form,
        "message",
        "intendedMessage",
        "whatCommunicate",
        "whatYouWantToCommunicate"
      );

    const visualLanguage =
      getFormValue(
        form,
        "visualLanguage",
        "visual",
        "style"
      ) ||
      getSelectedChoice(
        form,
        'input[name="visualLanguage"]'
      );

    return {
      name,
      school,
      course,
      moment,
      feeling,
      context,
      intendedMessage,
      visualLanguage,
      referenceName:
        FEELFRAME.create.referenceName
    };
  };


  /* =========================================================
     CREATE VALIDATION
     ========================================================= */

  const validateCreateForm = (
    values
  ) => {
    const required = [
      ["name", "your name"],
      ["moment", "your moment"],
      ["feeling", "your feeling"],
      ["context", "your story"],
      [
        "visualLanguage",
        "your visual language"
      ]
    ];

    const missing =
      required
        .filter(
          ([key]) =>
            !String(
              values[key] || ""
            ).trim()
        )
        .map(
          ([, label]) =>
            label
        );

    if (missing.length) {
      return {
        valid: false,
        message:
          `Please complete: ${missing.join(
            ", "
          )}.`
      };
    }

    return {
      valid: true,
      message: ""
    };
  };


  /* =========================================================
     REFERENCE IMAGE HANDLING
     ========================================================= */

  const setupReferenceImage = () => {
    const input =
      $(
        CONFIG.selectors.imageInput
      );

    if (!input) return;

    if (
      input.dataset.ffImageBound ===
      "true"
    ) {
      return;
    }

    input.dataset.ffImageBound =
      "true";

    input.addEventListener(
      "change",
      () => {
        const file =
          input.files &&
          input.files[0];

        if (!file) {
          FEELFRAME.create.referenceImage =
            null;

          FEELFRAME.create.referenceName =
            "";

          clearImagePreview();

          return;
        }

        if (
          !file.type.startsWith(
            "image/"
          )
        ) {
          input.value = "";

          FEELFRAME.create.referenceImage =
            null;

          FEELFRAME.create.referenceName =
            "";

          clearImagePreview();

          return;
        }

        FEELFRAME.create.referenceImage =
          file;

        FEELFRAME.create.referenceName =
          file.name;

        previewImage(file);
      }
    );
  };


  const previewImage = (
    file
  ) => {
    const preview =
      $(
        CONFIG.selectors.imagePreview
      );

    if (!preview) return;

    const url =
      URL.createObjectURL(file);

    preview.hidden = false;

    if (
      preview.tagName === "IMG"
    ) {
      preview.src = url;
      preview.alt =
        "Selected reference image";
    } else {
      preview.innerHTML = `
        <img
          src="${url}"
          alt="Selected reference image"
        >
      `;
    }

    preview.dataset.objectUrl =
      url;
  };


  const clearImagePreview = () => {
    const preview =
      $(
        CONFIG.selectors.imagePreview
      );

    if (!preview) return;

    const oldUrl =
      preview.dataset.objectUrl;

    if (oldUrl) {
      URL.revokeObjectURL(
        oldUrl
      );
    }

    preview.hidden = true;

    if (
      preview.tagName !== "IMG"
    ) {
      preview.innerHTML = "";
    } else {
      preview.removeAttribute(
        "src"
      );
    }

    delete preview.dataset.objectUrl;
  };


  /* =========================================================
     WHATSAPP MESSAGE
     ========================================================= */

  const buildWhatsAppMessage = (
    values,
    creative
  ) => {
    const siteName =
      FEELFRAME.site.name ||
      "FeelFrame™";

    const reference =
      values.referenceName
        ? values.referenceName
        : "No reference image provided";

    return `
Hello ${siteName},

I'd like to create a personalized visual story.

━━━━━━━━━━━━━━━━
PERSONAL DETAILS
━━━━━━━━━━━━━━━━

Name:
${values.name || "Not provided"}

School / University:
${values.school || "Not provided"}

Course / Field:
${values.course || "Not provided"}

━━━━━━━━━━━━━━━━
THE MOMENT
━━━━━━━━━━━━━━━━

${values.moment || "Not provided"}

━━━━━━━━━━━━━━━━
WHAT I'M GOING THROUGH
━━━━━━━━━━━━━━━━

${values.context || "Not provided"}

━━━━━━━━━━━━━━━━
WHAT I WANT THE IMAGE TO COMMUNICATE
━━━━━━━━━━━━━━━━

${values.intendedMessage || "Not provided"}

━━━━━━━━━━━━━━━━
VISUAL LANGUAGE
━━━━━━━━━━━━━━━━

${values.visualLanguage || "Not provided"}

━━━━━━━━━━━━━━━━
REFERENCE IMAGE
━━━━━━━━━━━━━━━━

${reference}

━━━━━━━━━━━━━━━━
CREATIVE DIRECTION
━━━━━━━━━━━━━━━━

${creative.direction}

━━━━━━━━━━━━━━━━
CREATIVE INTERPRETATION
━━━━━━━━━━━━━━━━

Emotion:
${creative.emotion}

Condition:
${creative.condition}

Style:
${creative.style}

Commands:
${creative.commands.length
  ? creative.commands.join(" ")
  : "None"}

━━━━━━━━━━━━━━━━

Submitted through FeelFrame™.
Some feelings deserve to be seen.
    `.trim();
  };


  const openWhatsApp = (
    message
  ) => {
    const number =
      String(
        FEELFRAME.site.whatsappNumber ||
        ""
      )
        .replace(/\D/g, "");

    if (!number) {
      showGlobalError(
        "WhatsApp contact information is not configured."
      );

      return;
    }

    const url =
      `https://wa.me/${number}?text=${encodeURIComponent(
        message
      )}`;

    window.location.href = url;
  };


  /* =========================================================
     CREATE FORM SUBMISSION
     ========================================================= */

  const setupCreateForm = () => {
    const form =
      $(
        CONFIG.selectors.createForm
      );

    if (!form) return;

    if (
      form.dataset.ffFormBound ===
      "true"
    ) {
      return;
    }

    form.dataset.ffFormBound =
      "true";

    form.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();

        const values =
          getCreateFormData(form);

        const validation =
          validateCreateForm(
            values
          );

        if (!validation.valid) {
          showFormMessage(
            form,
            validation.message,
            "error"
          );

          return;
        }

        const creative =
          buildCreativeDirection(
            values
          );

        const message =
          buildWhatsAppMessage(
            values,
            creative
          );

        showFormMessage(
          form,
          "Your creative brief is ready. Opening WhatsApp…",
          "success"
        );

        window.setTimeout(
          () => {
            openWhatsApp(
              message
            );
          },
          250
        );
      }
    );
  };


  const showFormMessage = (
    form,
    message,
    type = "info"
  ) => {
    let element =
      form.querySelector(
        "[data-form-message]"
      );

    if (!element) {
      element =
        document.createElement(
          "div"
        );

      element.dataset.formMessage =
        "true";

      form.prepend(element);
    }

    element.className =
      `form-message form-message-${type}`;

    element.textContent =
      message;

    element.setAttribute(
      "role",
      type === "error"
        ? "alert"
        : "status"
    );
  };


  /* =========================================================
     STORY PAGE
     ========================================================= */

  const renderStoryPage = () => {
    const id =
      getStoryIdFromURL();

    const story =
      findStoryById(id);

    if (!story) {
      renderStoryNotFound();
      return;
    }

    renderStoryData(
      story
    );

    setupStoryPurchase(
      story
    );

    setupImageFallbacks();
  };


  const renderStoryData = (
    story
  ) => {
    const setText = (
      selectors,
      value,
      fallback = ""
    ) => {
      const element =
        firstExisting(
          ...selectors
        );

      if (!element) return;

      element.textContent =
        safeText(
          value,
          fallback
        );
    };


    const image =
      firstExisting(
        "#storyImage",
        ".story-image",
        "[data-story-image]"
      );

    if (image) {
      const source =
        getStoryImage(
          story
        );

      if (
        source &&
        image.tagName === "IMG"
      ) {
        image.src = source;

        image.alt =
          story.title ||
          story.campaign ||
          "FeelFrame visual story";
      }
    }


    setText(
      [
        "#storyCampaign",
        ".story-campaign",
        "[data-story-campaign]"
      ],
      story.campaign
    );

    setText(
      [
        "#storyTitle",
        ".story-title",
        "[data-story-title]"
      ],
      story.title
    );

    setText(
      [
        "#storyQuote",
        ".story-quote",
        "[data-story-quote]"
      ],
      story.quote
    );

    setText(
      [
        "#storyDescription",
        ".story-description",
        "[data-story-description]"
      ],
      story.description
    );

    setText(
      [
        "#storyContext",
        ".story-context",
        "[data-story-context]"
      ],
      story.context
    );

    setText(
      [
        "#storyEmotion",
        ".story-emotion",
        "[data-story-emotion]"
      ],
      story.emotion
    );

    setText(
      [
        "#storyMoment",
        ".story-moment",
        "[data-story-moment]"
      ],
      story.moment
    );

    setText(
      [
        "#storyStyle",
        ".story-style",
        "[data-story-style]"
      ],
      story.style
    );

    setText(
      [
        "#storyVisualLanguage",
        ".story-visual-language",
        "[data-story-visual-language]"
      ],
      story.visualLanguage
    );

    setText(
      [
        "#storyCondition",
        ".story-condition",
        "[data-story-condition]"
      ],
      story.condition
    );

    setText(
      [
        "#promptTitle",
        ".prompt-title",
        "[data-prompt-title]"
      ],
      story.promptTitle
    );


    renderCommands(
      story.commands
    );

    renderStoryPrice(
      story
    );

    renderStoryProduct(
      story
    );
  };


  const renderCommands = (
    commands
  ) => {
    const container =
      firstExisting(
        "#storyCommands",
        ".story-commands",
        "[data-story-commands]"
      );

    if (!container) return;

    let values = [];

    if (
      Array.isArray(commands)
    ) {
      values = commands;
    } else if (
      typeof commands === "string"
    ) {
      values =
        commands
          .split(/[\s,]+/)
          .filter(Boolean);
    }

    container.innerHTML =
      values
        .map(
          (command) => `
            <span class="command-tag">
              ${escapeHTML(command)}
            </span>
          `
        )
        .join("");
  };


  const formatPrice = (
    value
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "";
    }

    const number =
      Number(
        String(value)
          .replace(/,/g, "")
      );

    if (
      Number.isNaN(number)
    ) {
      return String(value);
    }

    try {
      return new Intl.NumberFormat(
        "en-NG",
        {
          style: "currency",
          currency:
            FEELFRAME.site.currency ||
            "NGN",
          maximumFractionDigits: 0
        }
      ).format(number);
    } catch (_) {
      return `${FEELFRAME.site.currency || "NGN"} ${number.toLocaleString()}`;
    }
  };


  const renderStoryPrice = (
    story
  ) => {
    const oldPrice =
      firstExisting(
        "#promptOldPrice",
        ".prompt-old-price",
        "[data-prompt-old-price]"
      );

    const currentPrice =
      firstExisting(
        "#promptCurrentPrice",
        ".prompt-current-price",
        "[data-prompt-current-price]"
      );

    if (oldPrice) {
      if (
        story.compareAt !== undefined &&
        story.compareAt !== null &&
        story.compareAt !== ""
      ) {
        oldPrice.textContent =
          formatPrice(
            story.compareAt
          );

        oldPrice.hidden = false;
      } else {
        oldPrice.hidden = true;
      }
    }

    if (currentPrice) {
      currentPrice.textContent =
        formatPrice(
          story.price
        );
    }
  };


  const renderStoryProduct = (
    story
  ) => {
    const productTitle =
      firstExisting(
        "#promptProductTitle",
        ".prompt-product-title",
        "[data-prompt-product-title]"
      );

    const productDescription =
      firstExisting(
        "#promptProductDescription",
        ".prompt-product-description",
        "[data-prompt-product-description]"
      );

    if (productTitle) {
      productTitle.textContent =
        story.promptTitle ||
        "Creative Prompt System";
    }

    if (productDescription) {
      productDescription.textContent =
        "Access the complete creative system behind this visual experience.";
    }
  };


  const renderStoryNotFound = () => {
    const container =
      firstExisting(
        "#storyContent",
        ".story-content",
        "main"
      );

    if (!container) return;

    container.innerHTML = `
      <section class="empty-state story-not-found">
        <div class="empty-state-content">
          <strong>Story not found.</strong>
          <span>
            This FeelFrame visual story may no longer be available.
          </span>
          <a href="${CONFIG.pages.explore}">
            Explore visual stories
          </a>
        </div>
      </section>
    `;
  };


  /* =========================================================
     CHECKOUT / PRODUCT VALIDATION
     ========================================================= */

  const isValidCheckoutURL = (
    url
  ) => {
    if (!url || typeof url !== "string") {
      return false;
    }

    try {
      const parsed =
        new URL(
          url,
          window.location.href
        );

      return (
        parsed.protocol === "https:" &&
        parsed.hostname.length > 0
      );
    } catch (_) {
      return false;
    }
  };


  const setupStoryPurchase = (
    story
  ) => {
    const buttons =
      $$(
        [
          "[data-buy-product]",
          "[data-checkout]",
          "#buyPrompt",
          ".buy-prompt"
        ].join(",")
      );

    buttons.forEach((button) => {
      if (
        button.dataset.ffPurchaseBound ===
        "true"
      ) {
        return;
      }

      button.dataset.ffPurchaseBound =
        "true";

      button.addEventListener(
        "click",
        (event) => {
          event.preventDefault();

          if (
            !isValidCheckoutURL(
              story.selarUrl
            )
          ) {
            showGlobalError(
              "This product does not currently have a valid checkout destination."
            );

            return;
          }

          window.location.href =
            story.selarUrl;
        }
      );
    });
  };


  /* =========================================================
     NAVIGATION
     ========================================================= */

  const setupNavigation = () => {
    $$(
      "[data-nav], [data-page-link]"
    ).forEach((link) => {
      if (
        link.dataset.ffNavBound ===
        "true"
      ) {
        return;
      }

      link.dataset.ffNavBound =
        "true";

      link.addEventListener(
        "click",
        (event) => {
          const target =
            link.dataset.nav ||
            link.dataset.pageLink;

          if (!target) return;

          if (
            target.startsWith(
              "http"
            ) ||
            target.startsWith(
              "mailto:"
            ) ||
            target.startsWith(
              "https://wa.me"
            )
          ) {
            return;
          }

          event.preventDefault();

          navigateTo(target);
        }
      );
    });
  };


  /* =========================================================
     CREATE → CREATIVE DIRECTION PREVIEW
     ========================================================= */

  const setupCreativePreview = () => {
    const form =
      $(
        CONFIG.selectors.createForm
      );

    if (!form) return;

    const preview =
      firstExisting(
        "#creativeDirection",
        ".creative-direction",
        "[data-creative-direction]"
      );

    if (!preview) return;

    const update = () => {
      const values =
        getCreateFormData(form);

      if (
        !values.feeling &&
        !values.visualLanguage
      ) {
        preview.textContent =
          "Your creative direction will appear here as you shape your story.";

        return;
      }

      const creative =
        buildCreativeDirection(
          values
        );

      preview.textContent =
        creative.direction;
    };

    form.addEventListener(
      "input",
      update
    );

    form.addEventListener(
      "change",
      update
    );

    update();
  };


  /* =========================================================
     REDUCED MOTION
     ========================================================= */

  const prefersReducedMotion = () => {
    return (
      window.matchMedia &&
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    );
  };


  const applyReducedMotionState = () => {
    document.documentElement.classList.toggle(
      "reduced-motion",
      prefersReducedMotion()
    );
  };


  const setupReducedMotionListener = () => {
    if (
      !window.matchMedia
    ) {
      return;
    }

    const media =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

    const handler = () => {
      applyReducedMotionState();
    };

    if (
      media.addEventListener
    ) {
      media.addEventListener(
        "change",
        handler
      );
    } else if (
      media.addListener
    ) {
      media.addListener(
        handler
      );
    }
  };


  /* =========================================================
     GENERAL ACCESSIBILITY
     ========================================================= */

  const setupAccessibility = () => {
    $$(
      "[data-story-card]"
    ).forEach((card) => {
      if (
        !card.hasAttribute(
          "tabindex"
        )
      ) {
        card.setAttribute(
          "tabindex",
          "0"
        );
      }
    });

    $$("img").forEach((image) => {
      if (
        !image.hasAttribute(
          "decoding"
        )
      ) {
        image.setAttribute(
          "decoding",
          "async"
        );
      }
    });
  };


  /* =========================================================
     FORM AUTOFILL SAFETY
     ========================================================= */

  const setupFormSafety = () => {
    $$("form").forEach((form) => {
      form.addEventListener(
        "invalid",
        (event) => {
          const field =
            event.target;

          if (
            field &&
            typeof field.focus ===
              "function"
          ) {
            window.setTimeout(
              () => field.focus(),
              0
            );
          }
        },
        true
      );
    });
  };


  /* =========================================================
     PAGE INITIALIZATION
     ========================================================= */

  const initializePage = () => {
    const page =
      getPageName();

    hideGlobalError();

    updateSiteMetadata();

    setupNavigation();

    setupReducedMotionState();

    setupReducedMotionListener();

    setupAccessibility();

    setupFormSafety();

    switch (page) {
      case "home":
        renderHomeStoryBoard();
        setupCoverflow();
        break;

      case "explore":
        setupExploreFilters();
        renderExplore();
        break;

      case "create":
        setupReferenceImage();
        setupCreateForm();
        setupCreativePreview();
        break;

      case "story":
        renderStoryPage();
        break;

      default:
        /*
         * Some pages may use the global script
         * without matching one of the four
         * primary routes.
         */
        renderHomeStoryBoard();
        setupCoverflow();
        break;
    }

    setupImageFallbacks();
  };


  /* =========================================================
     RESIZE HANDLING
     ========================================================= */

  let resizeTimer = null;

  const setupResizeHandling = () => {
    window.addEventListener(
      "resize",
      () => {
        window.clearTimeout(
          resizeTimer
        );

        resizeTimer =
          window.setTimeout(
            () => {
              if (
                $(
                  CONFIG.selectors.coverflow
                )
              ) {
                updateCoverflow();
              }
            },
            120
          );
      },
      {
        passive: true
      }
    );
  };


  /* =========================================================
     INITIAL APPLICATION BOOT
     ========================================================= */

  const boot = async () => {
    try {
      await loadData();

      initializePage();

      setupResizeHandling();

      document.documentElement.dataset.feelframeReady =
        "true";

      document.dispatchEvent(
        new CustomEvent(
          "feelframe:ready",
          {
            detail: FEELFRAME
          }
        )
      );

    } catch (error) {
      document.documentElement.dataset.feelframeReady =
        "false";

      console.error(
        "[FeelFrame] Application boot failed:",
        error
      );
    }
  };


  /* =========================================================
     GLOBAL ERROR SAFETY
     ========================================================= */

  window.addEventListener(
    "error",
    (event) => {
      console.error(
        "[FeelFrame] Runtime error:",
        event.error || event.message
      );
    }
  );


  window.addEventListener(
    "unhandledrejection",
    (event) => {
      console.error(
        "[FeelFrame] Unhandled promise rejection:",
        event.reason
      );
    }
  );


  /* =========================================================
     PUBLIC API
     ========================================================= */

  window.FEELFRAME =
    FEELFRAME;

  window.FeelFrame = {
    state: FEELFRAME,

    findStory:
      findStoryById,

    navigateToStory,

    renderExplore,

    renderCoverflow,

    moveCoverflow,

    goToCoverflow,

    buildCreativeDirection,

    buildWhatsAppMessage,

    formatPrice
  };


  /* =========================================================
     START
     ========================================================= */

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      boot,
      {
        once: true
      }
    );
  } else {
    boot();
  }

})();
