/* =========================================================
   FEELFRAME™
   Global Application / Interaction Engine
   Production v4

   DATA ARCHITECTURE
   data.json
      ↓
   FeelFrame State
      ↓
   Page Initialization
      ↓
   ├── Navigation
   ├── Coverflow
   ├── Story Board
   ├── Explore
   ├── Search
   ├── Filters
   ├── Story Pages
   ├── Product / Checkout
   └── Create / Personalization

   EXPECTED DATA SHAPE

   {
     "site": {...},
     "stories": [...]
   }

   Expected pages:

   index.html
   explore.html
   create.html
   story.html

   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     CONFIGURATION
     ========================================================= */

  const CONFIG = Object.freeze({

    dataFile: "data.json",

    pages: Object.freeze({
      home: "index.html",
      explore: "explore.html",
      create: "create.html",
      story: "story.html"
    }),

    selectors: Object.freeze({

      coverflow: [
        "#coverflow",
        ".coverflow",
        "[data-coverflow]"
      ],

      coverflowTrack: [
        "#coverflowTrack",
        ".coverflow-track",
        "[data-coverflow-track]"
      ],

      coverflowPrev: [
        "#coverflowPrev",
        ".coverflow-prev",
        "[data-coverflow-prev]"
      ],

      coverflowNext: [
        "#coverflowNext",
        ".coverflow-next",
        "[data-coverflow-next]"
      ],

      coverflowDots: [
        "#coverflowDots",
        ".coverflow-dots",
        "[data-coverflow-dots]"
      ],

      storyGrid: [
        "#storyGrid",
        ".story-grid",
        "[data-story-grid]"
      ],

      exploreGrid: [
        "#exploreGrid",
        ".explore-grid",
        "[data-explore-grid]"
      ],

      search: [
        "#storySearch",
        "#searchInput",
        ".story-search",
        "[data-story-search]"
      ],

      campaignFilter: [
        "#campaignFilter",
        ".campaign-filter",
        "[data-campaign-filter]"
      ],

      emotionFilter: [
        "#emotionFilter",
        ".emotion-filter",
        "[data-emotion-filter]"
      ],

      storyCount: [
        "#storyCount",
        ".story-count",
        "[data-story-count]"
      ],

      emptyState: [
        "#emptyState",
        ".empty-state",
        "[data-empty-state]"
      ],

      globalError: [
        "#globalError",
        ".global-error",
        "[data-global-error]"
      ],

      createForm: [
        "#createForm",
        "form[data-create-form]",
        "[data-create-form]"
      ],

      imageInput: [
        "#referenceImage",
        "#imageUpload",
        'input[type="file"][data-reference]'
      ],

      imagePreview: [
        "#imagePreview",
        ".image-preview",
        "[data-image-preview]"
      ]

    })

  });


  /* =========================================================
     APPLICATION STATE
     ========================================================= */

  const STATE = {

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
     DOM UTILITIES
     ========================================================= */

  const $ = (selectors, root = document) => {

    if (!selectors) {
      return null;
    }

    const list = Array.isArray(selectors)
      ? selectors
      : [selectors];

    for (const selector of list) {

      try {

        const element =
          root.querySelector(selector);

        if (element) {
          return element;
        }

      } catch (error) {

        console.warn(
          "[FeelFrame] Invalid selector:",
          selector,
          error
        );

      }

    }

    return null;
  };


  const $$ = (selector, root = document) => {

    try {
      return Array.from(
        root.querySelectorAll(selector)
      );
    } catch (_) {
      return [];
    }

  };


  const first = (...selectors) => {

    for (const selector of selectors) {

      const element = $(selector);

      if (element) {
        return element;
      }

    }

    return null;
  };


  /* =========================================================
     TEXT / DATA UTILITIES
     ========================================================= */

  const safeText = (
    value,
    fallback = ""
  ) => {

    if (
      value === undefined ||
      value === null ||
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


  const escapeHTML = (value) => {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  };


  const unique = (values) => {

    return [
      ...new Set(
        values.filter(
          value =>
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        )
      )
    ];

  };


  /* =========================================================
     PAGE DETECTION
     ========================================================= */

  const getPage = () => {

    const path =
      window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();

    if (
      !path ||
      path === "index.html"
    ) {
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
     DATA PATH
     ========================================================= */

  const getDataURL = () => {

    /*
     * Relative URL keeps data.json beside the current
     * HTML page when the pages are deployed normally.
     */

    return new URL(
      CONFIG.dataFile,
      document.baseURI
    ).href;

  };


  /* =========================================================
     DATA VALIDATION
     ========================================================= */

  const validateData = (data) => {

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {

      throw new Error(
        "data.json must contain a JSON object."
      );

    }


    if (
      !data.site ||
      typeof data.site !== "object" ||
      Array.isArray(data.site)
    ) {

      throw new Error(
        "data.json is missing the required site object."
      );

    }


    if (!Array.isArray(data.stories)) {

      throw new Error(
        "data.json is missing the required stories[] array."
      );

    }


    return true;

  };


  /* =========================================================
     STORY VALIDATION
     ========================================================= */

  const isValidStory = (story) => {

    if (
      !story ||
      typeof story !== "object" ||
      Array.isArray(story)
    ) {
      return false;
    }

    /*
     * ID is the only truly essential field for routing.
     * Other fields may safely be absent.
     */

    return Boolean(
      story.id
    );

  };


  /* =========================================================
     LOAD DATA.JSON
     ========================================================= */

  const loadData = async () => {

    const url = getDataURL();

    try {

      const response =
        await fetch(
          url,
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
          `Unable to load data.json. HTTP ${response.status}.`
        );

      }


      const data =
        await response.json();


      validateData(data);


      STATE.data = data;


      /*
       * CRITICAL:
       *
       * FeelFrame's stories are ONLY taken from:
       *
       * data.stories
       *
       * Never:
       * data
       * data.products
       * data.items
       */

      STATE.stories =
        data.stories
          .filter(isValidStory);


      STATE.site = {
        ...STATE.site,
        ...data.site
      };


      console.info(
        `[FeelFrame] Loaded ${STATE.stories.length} stories.`
      );


      if (!STATE.stories.length) {

        console.warn(
          "[FeelFrame] data.json loaded successfully, but stories[] is empty."
        );

      }


      return data;

    } catch (error) {

      console.error(
        "[FeelFrame] data.json failed:",
        error
      );


      showDataError(
        error,
        url
      );


      throw error;

    }

  };


  /* =========================================================
     DATA ERROR
     ========================================================= */

  const showDataError = (
    error,
    url
  ) => {

    const existing =
      $(CONFIG.selectors.globalError);

    const container =
      existing ||
      document.createElement("div");


    if (!existing) {

      container.id =
        "globalError";

      document.body.prepend(
        container
      );

    }


    container.hidden = false;

    container.className =
      "global-error is-visible";


    const isFile =
      window.location.protocol ===
      "file:";


    container.innerHTML = `

      <div class="error-state-content">

        <strong>
          FeelFrame could not load its visual library.
        </strong>

        <span>
          ${escapeHTML(
            error?.message ||
            "Unable to load data.json."
          )}
        </span>

        ${
          isFile
            ? `
              <span>
                You are opening the site directly as a local file.
                Run the project through a local web server before testing data.json.
              </span>
            `
            : `
              <span>
                Expected data source:
                ${escapeHTML(url)}
              </span>
            `
        }

      </div>

    `;

  };


  /* =========================================================
     SITE METADATA
     ========================================================= */

  const updateSiteMetadata = () => {

    const site =
      STATE.site;


    $$(
      "[data-site-name]"
    ).forEach(
      element => {
        element.textContent =
          safeText(
            site.name,
            "FeelFrame™"
          );
      }
    );


    $$(
      "[data-site-tagline]"
    ).forEach(
      element => {
        element.textContent =
          safeText(
            site.tagline,
            "Some feelings deserve to be seen."
          );
      }
    );


    $$(
      "[data-site-description]"
    ).forEach(
      element => {
        element.textContent =
          safeText(
            site.description
          );
      }
    );


    const description =
      document.querySelector(
        'meta[name="description"]'
      );


    if (
      description &&
      site.description
    ) {

      description.setAttribute(
        "content",
        site.description
      );

    }

  };


  /* =========================================================
     STORY LOOKUP
     ========================================================= */

  const findStoryById = (id) => {

    if (!id) {
      return null;
    }

    return (
      STATE.stories.find(
        story =>
          String(story.id) ===
          String(id)
      ) ||
      null
    );

  };


  /* =========================================================
     STORY URL
     ========================================================= */

  const storyURL = (story) => {

    return (
      `${CONFIG.pages.story}?id=` +
      encodeURIComponent(
        story.id
      )
    );

  };


  const openStory = (story) => {

    if (
      !story ||
      !story.id
    ) {
      return;
    }

    window.location.href =
      storyURL(story);

  };


  /* =========================================================
     STORY CARD
     ========================================================= */

  const createStoryCard = (
    story,
    options = {}
  ) => {

    const cover =
      options.cover === true;


    const index =
      Number(
        options.index || 0
      );


    const image =
      safeText(
        story.image
      );


    const title =
      safeText(
        story.title,
        story.campaign ||
        "Visual Story"
      );


    return `

      <article

        class="${
          cover
            ? "cover-card"
            : "story-card"
        }"

        data-story-card

        data-story-id="${escapeHTML(
          story.id
        )}"

        data-index="${index}"

        tabindex="0"

        role="link"

        aria-label="Open ${escapeHTML(
          title
        )}"

      >

        <div class="story-card-image-wrap">

          ${
            image

              ? `

                <img

                  class="story-card-image"

                  src="${escapeHTML(
                    image
                  )}"

                  alt="${escapeHTML(
                    title
                  )}"

                  loading="${
                    cover
                      ? "eager"
                      : "lazy"
                  }"

                  decoding="async"

                >

              `

              : `

                <div
                  class="
                    story-card-image
                    story-card-image-empty
                  "
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
                    ${escapeHTML(
                      story.campaign
                    )}
                  </span>
                `
                : ""
            }


            ${
              story.emotion
                ? `
                  <span class="story-card-emotion">
                    ${escapeHTML(
                      story.emotion
                    )}
                  </span>
                `
                : ""
            }

          </div>


          <h3 class="story-card-title">

            ${escapeHTML(
              title
            )}

          </h3>


          ${
            story.moment
              ? `
                <p class="story-card-moment">

                  ${escapeHTML(
                    story.moment
                  )}

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

  const bindStoryCards = (
    root = document
  ) => {

    $$(
      "[data-story-card]",
      root
    ).forEach(
      card => {

        if (
          card.dataset.ffBound ===
          "true"
        ) {
          return;
        }


        card.dataset.ffBound =
          "true";


        const open = () => {

          const story =
            findStoryById(
              card.dataset.storyId
            );


          if (story) {
            openStory(story);
          }

        };


        card.addEventListener(
          "click",
          event => {

            if (
              event.target.closest(
                "a, button"
              )
            ) {
              return;
            }


            if (
              card.dataset.suppressClick ===
              "true"
            ) {
              return;
            }


            open();

          }
        );


        card.addEventListener(
          "keydown",
          event => {

            if (
              event.key ===
                "Enter" ||
              event.key ===
                " "
            ) {

              event.preventDefault();

              open();

            }

          }
        );

      }
    );

  };


  /* =========================================================
     IMAGE FALLBACKS
     ========================================================= */

  const setupImageFallbacks = () => {

    $$("img").forEach(
      image => {

        if (
          image.dataset.ffImageBound ===
          "true"
        ) {
          return;
        }


        image.dataset.ffImageBound =
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
          {
            once: true
          }
        );

      }
    );

  };


  /* =========================================================
     HOME STORY BOARD
     ========================================================= */

  const renderStoryBoard = () => {

    const grid =
      $(
        CONFIG.selectors.storyGrid
      );


    if (!grid) {
      return;
    }


    const stories =
      STATE.stories;


    if (!stories.length) {

      grid.innerHTML = "";

      showEmptyState(
        grid
      );

      return;

    }


    hideEmptyState();


    grid.innerHTML =
      stories
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


    bindStoryCards(
      grid
    );


    setupImageFallbacks();

  };


  /* =========================================================
     EMPTY STATE
     ========================================================= */

  const showEmptyState = (
    container
  ) => {

    const existing =
      $(
        CONFIG.selectors.emptyState
      );


    if (existing) {

      existing.hidden =
        false;

      return;

    }


    container.innerHTML = `

      <div class="empty-state-content">

        <strong>
          No visual stories found.
        </strong>

        <span>
          New FeelFrame stories will appear here.
        </span>

      </div>

    `;

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
     FEATURED STORIES
     ========================================================= */

  const getFeaturedStories = () => {

    const featured =
      STATE.stories.filter(
        story =>
          story.featured === true
      );


    /*
     * IMPORTANT:
     *
     * If no stories are marked featured,
     * we do NOT return an empty homepage.
     *
     * We gracefully fall back to the
     * complete story collection.
     */

    return featured.length
      ? featured
      : STATE.stories;

  };


  /* =========================================================
     COVERFLOW
     ========================================================= */

  const renderCoverflow = () => {

    const track =
      $(
        CONFIG.selectors.coverflowTrack
      );


    if (!track) {
      return;
    }


    const stories =
      getFeaturedStories();


    STATE.coverflow.stories =
      stories;


    STATE.coverflow.current =
      0;


    if (!stories.length) {

      track.innerHTML = "";

      return;

    }


    track.innerHTML =
      stories
        .map(
          (story, index) =>
            createStoryCard(
              story,
              {
                cover: true,
                index
              }
            )
        )
        .join("");


    bindCoverflowCards(
      track
    );


    renderCoverflowDots();

    updateCoverflow();

    setupImageFallbacks();

  };


  const getCircularOffset = (
    index,
    current,
    total
  ) => {

    if (!total) {
      return 0;
    }


    let offset =
      index - current;


    const half =
      Math.floor(
        total / 2
      );


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


    if (!track) {
      return;
    }


    const cards =
      $$(
        "[data-story-card]",
        track
      );


    const total =
      cards.length;


    if (!total) {
      return;
    }


    const current =
      STATE.coverflow.current;


    cards.forEach(
      (card, index) => {

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

        } else if (
          offset === -1
        ) {

          card.classList.add(
            "is-left"
          );

        } else if (
          offset === 1
        ) {

          card.classList.add(
            "is-right"
          );

        } else if (
          offset < -1
        ) {

          card.classList.add(
            "is-far-left"
          );

        } else {

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

      }
    );


    updateCoverflowDots();

  };


  const moveCoverflow = (
    direction
  ) => {

    const total =
      STATE.coverflow.stories.length;


    if (!total) {
      return;
    }


    let next =
      STATE.coverflow.current +
      direction;


    if (next < 0) {
      next = total - 1;
    }


    if (next >= total) {
      next = 0;
    }


    STATE.coverflow.current =
      next;


    updateCoverflow();

  };


  const goToCoverflow = (
    index
  ) => {

    const total =
      STATE.coverflow.stories.length;


    if (!total) {
      return;
    }


    STATE.coverflow.current =
      (
        index % total +
        total
      ) %
      total;


    updateCoverflow();

  };


  /* =========================================================
     COVERFLOW CARDS
     ========================================================= */

  const bindCoverflowCards = (
    track
  ) => {

    $$(
      "[data-story-card]",
      track
    ).forEach(
      card => {

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
          event => {

            if (
              STATE.coverflow.suppressClick
            ) {

              event.preventDefault();

              STATE.coverflow.suppressClick =
                false;

              return;

            }


            const index =
              Number(
                card.dataset.index
              );


            const cards =
              $$(
                "[data-story-card]",
                track
              );


            const offset =
              getCircularOffset(
                index,
                STATE.coverflow.current,
                cards.length
              );


            if (offset !== 0) {

              event.preventDefault();

              goToCoverflow(
                index
              );

              return;

            }


            const story =
              findStoryById(
                card.dataset.storyId
              );


            if (story) {
              openStory(story);
            }

          }
        );


        card.addEventListener(
          "keydown",
          event => {

            if (
              event.key !== "Enter" &&
              event.key !== " "
            ) {
              return;
            }


            event.preventDefault();


            const index =
              Number(
                card.dataset.index
              );


            const cards =
              $$(
                "[data-story-card]",
                track
              );


            const offset =
              getCircularOffset(
                index,
                STATE.coverflow.current,
                cards.length
              );


            if (offset !== 0) {

              goToCoverflow(
                index
              );

              return;

            }


            const story =
              findStoryById(
                card.dataset.storyId
              );


            if (story) {
              openStory(story);
            }

          }
        );

      }
    );

  };


  /* =========================================================
     COVERFLOW DOTS
     ========================================================= */

  const renderCoverflowDots = () => {

    const container =
      $(
        CONFIG.selectors.coverflowDots
      );


    if (!container) {
      return;
    }


    container.innerHTML =
      STATE.coverflow.stories
        .map(
          (story, index) => `

            <button

              type="button"

              class="coverflow-dot"

              data-cover-index="${index}"

              aria-label="Show ${escapeHTML(
                story.title ||
                story.campaign ||
                `story ${index + 1}`
              )}"

            ></button>

          `
        )
        .join("");


    $$(
      "[data-cover-index]",
      container
    ).forEach(
      dot => {

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

      }
    );

  };


  const updateCoverflowDots = () => {

    const container =
      $(
        CONFIG.selectors.coverflowDots
      );


    if (!container) {
      return;
    }


    $$(
      "[data-cover-index]",
      container
    ).forEach(
      (dot, index) => {

        const active =
          index ===
          STATE.coverflow.current;


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

      }
    );

  };


  /* =========================================================
     COVERFLOW CONTROLS
     ========================================================= */

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


  /* =========================================================
     COVERFLOW KEYBOARD
     ========================================================= */

  const setupCoverflowKeyboard = () => {

    const container =
      $(
        CONFIG.selectors.coverflow
      );


    if (!container) {
      return;
    }


    container.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "ArrowLeft"
        ) {

          event.preventDefault();

          moveCoverflow(-1);

        }


        if (
          event.key ===
          "ArrowRight"
        ) {

          event.preventDefault();

          moveCoverflow(1);

        }

      }
    );

  };


  /* =========================================================
     COVERFLOW POINTER / TOUCH
     ========================================================= */

  const setupCoverflowPointer = () => {

    const container =
      $(
        CONFIG.selectors.coverflow
      );


    if (!container) {
      return;
    }


    container.addEventListener(
      "pointerdown",
      event => {

        if (
          event.pointerType ===
            "mouse" &&
          event.button !== 0
        ) {
          return;
        }


        STATE.coverflow.dragging =
          true;


        STATE.coverflow.pointerId =
          event.pointerId;


        STATE.coverflow.startX =
          event.clientX;


        STATE.coverflow.currentX =
          event.clientX;


        STATE.coverflow.moved =
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
      event => {

        if (
          !STATE.coverflow.dragging ||
          event.pointerId !==
            STATE.coverflow.pointerId
        ) {
          return;
        }


        STATE.coverflow.currentX =
          event.clientX;


        const distance =
          event.clientX -
          STATE.coverflow.startX;


        if (
          Math.abs(distance) >
          8
        ) {

          STATE.coverflow.moved =
            true;

        }

      }
    );


    const finish =
      event => {

        if (
          !STATE.coverflow.dragging ||
          event.pointerId !==
            STATE.coverflow.pointerId
        ) {
          return;
        }


        const distance =
          STATE.coverflow.currentX -
          STATE.coverflow.startX;


        STATE.coverflow.dragging =
          false;


        if (
          Math.abs(distance) >
          45
        ) {

          STATE.coverflow.suppressClick =
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

            STATE.coverflow.suppressClick =
              false;

          },
          120
        );

      };


    container.addEventListener(
      "pointerup",
      finish
    );


    container.addEventListener(
      "pointercancel",
      finish
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
     EXPLORE — FILTER DATA
     ========================================================= */

  const getCampaigns = () => {

    return unique(
      STATE.stories.map(
        story => story.campaign
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
      STATE.stories.map(
        story => story.emotion
      )
    ).sort(
      (a, b) =>
        String(a).localeCompare(
          String(b)
        )
    );

  };


  /* =========================================================
     EXPLORE FILTERS
     ========================================================= */

  const populateFilter = (
    selector,
    values,
    selected,
    type
  ) => {

    const element =
      $(selector);


    if (!element) {
      return;
    }


    if (
      element.tagName ===
      "SELECT"
    ) {

      element.innerHTML = `

        <option value="all">
          All
        </option>

        ${values
          .map(
            value => `

              <option
                value="${escapeHTML(
                  value
                )}"
              >

                ${escapeHTML(
                  value
                )}

              </option>

            `
          )
          .join("")}

      `;


      element.value =
        selected ||
        "all";


      return;

    }


    element.innerHTML = `

      <button

        type="button"

        class="filter-pill ${
          normalize(selected) ===
          "all"
            ? "is-active"
            : ""
        }"

        data-filter-value="all"

      >
        All
      </button>

      ${values
        .map(
          value => `

            <button

              type="button"

              class="filter-pill ${
                normalize(
                  selected
                ) ===
                normalize(
                  value
                )
                  ? "is-active"
                  : ""
              }"

              data-filter-value="${escapeHTML(
                value
              )}"

            >

              ${escapeHTML(
                value
              )}

            </button>

          `
        )
        .join("")}

    `;


    $$(
      "[data-filter-value]",
      element
    ).forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const value =
              button.dataset
                .filterValue ||
              "all";


            if (
              type ===
              "campaign"
            ) {

              STATE.filters.campaign =
                value;

            } else {

              STATE.filters.emotion =
                value;

            }


            renderExplore();

          }
        );

      }
    );

  };


  /* =========================================================
     EXPLORE FILTER EVENTS
     ========================================================= */

  const setupExploreFilters = () => {

    populateFilter(
      CONFIG.selectors.campaignFilter,
      getCampaigns(),
      STATE.filters.campaign,
      "campaign"
    );


    populateFilter(
      CONFIG.selectors.emotionFilter,
      getEmotions(),
      STATE.filters.emotion,
      "emotion"
    );


    const search =
      $(
        CONFIG.selectors.search
      );


    if (!search) {
      return;
    }


    if (
      search.dataset.ffSearchBound ===
      "true"
    ) {
      return;
    }


    search.dataset.ffSearchBound =
      "true";


    search.addEventListener(
      "input",
      () => {

        STATE.filters.search =
          search.value.trim();


        renderExplore();

      }
    );


    if (
      STATE.filters.search
    ) {

      search.value =
        STATE.filters.search;

    }

  };


  /* =========================================================
     EXPLORE SEARCH
     ========================================================= */

  const searchableText = (
    story
  ) => {

    return [

      story.id,
      story.campaign,
      story.emotion,
      story.moment,
      story.title,
      story.quote,
      story.context,
      story.description,
      story.style,
      story.visualLanguage,
      story.condition,
      story.recipe,
      story.promptTitle

    ]
      .map(
        value =>
          Array.isArray(value)
            ? value.join(" ")
            : safeText(value)
      )
      .join(" ")
      .toLowerCase();

  };


  /* =========================================================
     FILTER STORIES
     ========================================================= */

  const getFilteredStories = () => {

    const campaign =
      normalize(
        STATE.filters.campaign
      );


    const emotion =
      normalize(
        STATE.filters.emotion
      );


    const search =
      normalize(
        STATE.filters.search
      );


    return STATE.stories.filter(
      story => {

        const campaignMatch =
          campaign === "all" ||
          normalize(
            story.campaign
          ) === campaign;


        const emotionMatch =
          emotion === "all" ||
          normalize(
            story.emotion
          ) === emotion;


        const searchMatch =
          !search ||
          searchableText(
            story
          ).includes(
            search
          );


        return (
          campaignMatch &&
          emotionMatch &&
          searchMatch
        );

      }
    );

  };


  /* =========================================================
     EXPLORE RENDER
     ========================================================= */

  const renderExplore = () => {

    const grid =
      first(
        CONFIG.selectors.exploreGrid,
        CONFIG.selectors.storyGrid
      );


    if (!grid) {
      return;
    }


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

      showEmptyState(
        grid
      );

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


    bindStoryCards(
      grid
    );


    setupImageFallbacks();

  };


  /* =========================================================
     STORY PAGE
     ========================================================= */

  const getStoryIdFromURL = () => {

    const params =
      new URLSearchParams(
        window.location.search
      );


    return (
      params.get("id") ||
      params.get("story") ||
      params.get("product") ||
      ""
    );

  };


  const renderStoryPage = () => {

    const id =
      getStoryIdFromURL();


    const story =
      findStoryById(id);


    if (!story) {

      renderStoryNotFound();

      return;

    }


    renderStory(story);

    setupStoryPurchase(story);

    setupImageFallbacks();

  };


  const setStoryText = (
    selectors,
    value
  ) => {

    const element =
      first(
        ...selectors
      );


    if (!element) {
      return;
    }


    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {

      element.hidden = true;

      return;

    }


    element.hidden = false;

    element.textContent =
      String(value);

  };


  const renderStory = (
    story
  ) => {

    const image =
      first(
        "#storyImage",
        ".story-image",
        "[data-story-image]"
      );


    if (
      image &&
      image.tagName ===
        "IMG" &&
      story.image
    ) {

      image.src =
        story.image;


      image.alt =
        story.title ||
        story.campaign ||
        "FeelFrame visual story";

    }


    setStoryText(
      [
        "#storyCampaign",
        ".story-campaign",
        "[data-story-campaign]"
      ],
      story.campaign
    );


    setStoryText(
      [
        "#storyTitle",
        ".story-title",
        "[data-story-title]"
      ],
      story.title
    );


    setStoryText(
      [
        "#storyQuote",
        ".story-quote",
        "[data-story-quote]"
      ],
      story.quote
    );


    setStoryText(
      [
        "#storyContext",
        ".story-context",
        "[data-story-context]"
      ],
      story.context
    );


    setStoryText(
      [
        "#storyDescription",
        ".story-description",
        "[data-story-description]"
      ],
      story.description
    );


    setStoryText(
      [
        "#storyEmotion",
        ".story-emotion",
        "[data-story-emotion]"
      ],
      story.emotion
    );


    setStoryText(
      [
        "#storyMoment",
        ".story-moment",
        "[data-story-moment]"
      ],
      story.moment
    );


    setStoryText(
      [
        "#storyStyle",
        ".story-style",
        "[data-story-style]"
      ],
      story.style
    );


    setStoryText(
      [
        "#storyVisualLanguage",
        ".story-visual-language",
        "[data-story-visual-language]"
      ],
      story.visualLanguage
    );


    setStoryText(
      [
        "#storyCondition",
        ".story-condition",
        "[data-story-condition]"
      ],
      story.condition
    );


    setStoryText(
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


    renderPrice(
      story
    );


    renderProduct(
      story
    );

  };


  /* =========================================================
     COMMANDS
     ========================================================= */

  const normalizeCommands = (
    commands
  ) => {

    if (
      Array.isArray(commands)
    ) {

      return commands
        .map(
          command =>
            String(command).trim()
        )
        .filter(Boolean);

    }


    if (
      typeof commands ===
      "string"
    ) {

      return commands
        .split(/[\s,]+/)
        .map(
          command =>
            command.trim()
        )
        .filter(Boolean);

    }


    return [];

  };


  const renderCommands = (
    commands
  ) => {

    const container =
      first(
        "#storyCommands",
        ".story-commands",
        "[data-story-commands]"
      );


    if (!container) {
      return;
    }


    container.innerHTML =
      unique(
        normalizeCommands(
          commands
        )
      )
        .map(
          command => `

            <span class="command-tag">

              ${escapeHTML(
                command
              )}

            </span>

          `
        )
        .join("");

  };


  /* =========================================================
     PRICE
     ========================================================= */

  const formatPrice = (
    value
  ) => {

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return "";
    }


    const numeric =
      Number(
        String(value)
          .replace(/,/g, "")
      );


    if (
      Number.isNaN(numeric)
    ) {

      return String(value);

    }


    try {

      return new Intl.NumberFormat(
        "en-NG",
        {
          style: "currency",
          currency:
            STATE.site.currency ||
            "NGN",
          maximumFractionDigits: 0
        }
      ).format(
        numeric
      );

    } catch (_) {

      return `${
        STATE.site.currency ||
        "NGN"
      } ${numeric.toLocaleString()}`;

    }

  };


  const renderPrice = (
    story
  ) => {

    const oldPrice =
      first(
        "#promptOldPrice",
        ".prompt-old-price",
        "[data-prompt-old-price]"
      );


    const currentPrice =
      first(
        "#promptCurrentPrice",
        ".prompt-current-price",
        "[data-prompt-current-price]"
      );


    if (oldPrice) {

      const value =
        story.compareAt;


      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {

        oldPrice.textContent =
          formatPrice(value);

        oldPrice.hidden =
          false;

      } else {

        oldPrice.hidden =
          true;

      }

    }


    if (currentPrice) {

      currentPrice.textContent =
        formatPrice(
          story.price
        );

    }

  };


  /* =========================================================
     PRODUCT
     ========================================================= */

  const renderProduct = (
    story
  ) => {

    const title =
      first(
        "#promptProductTitle",
        ".prompt-product-title",
        "[data-prompt-product-title]"
      );


    if (title) {

      title.textContent =
        story.promptTitle ||
        "Creative Prompt System";

    }


    const description =
      first(
        "#promptProductDescription",
        ".prompt-product-description",
        "[data-prompt-product-description]"
      );


    if (description) {

      description.textContent =
        "Access the complete creative system behind this visual experience.";

    }

  };


  /* =========================================================
     STORY NOT FOUND
     ========================================================= */

  const renderStoryNotFound = () => {

    const container =
      first(
        "#storyContent",
        ".story-content",
        "main"
      );


    if (!container) {
      return;
    }


    container.innerHTML = `

      <section class="empty-state story-not-found">

        <div class="empty-state-content">

          <strong>
            Story not found.
          </strong>

          <span>
            This FeelFrame visual story may not be available.
          </span>

          <a href="${CONFIG.pages.explore}">
            Explore visual stories
          </a>

        </div>

      </section>

    `;

  };


  /* =========================================================
     CHECKOUT VALIDATION
     ========================================================= */

  const isValidCheckoutURL = (
    value
  ) => {

    if (
      !value ||
      typeof value !==
        "string"
    ) {
      return false;
    }


    try {

      const url =
        new URL(
          value,
          window.location.href
        );


      return (
        url.protocol ===
          "https:" &&
        Boolean(
          url.hostname
        )
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


    buttons.forEach(
      button => {

        if (
          button.dataset
            .ffPurchaseBound ===
          "true"
        ) {
          return;
        }


        button.dataset
          .ffPurchaseBound =
          "true";


        button.addEventListener(
          "click",
          event => {

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

      }
    );

  };


  /* =========================================================
     CREATE ENGINE — VISUAL RULES
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


  const VISUAL_RULES = {

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

    return (
      EMOTION_RULES[
        normalize(feeling)
      ] || {
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


  const getVisualRule = (
    language
  ) => {

    return (
      VISUAL_RULES[
        normalize(language)
      ] || {
        style:
          safeText(
            language,
            "Intentional visual storytelling"
          ),
        commands: []
      }
    );

  };


  const buildCreativeDirection = (
    values
  ) => {

    const emotionRule =
      getEmotionRule(
        values.feeling
      );


    const visualRule =
      getVisualRule(
        values.visualLanguage
      );


    const commands =
      unique([
        ...emotionRule.commands,
        ...visualRule.commands
      ]);


    const parts = [

      emotionRule.emotion,

      emotionRule.condition,

      visualRule.style

    ];


    if (values.moment) {

      parts.push(
        `The visual should communicate the significance of ${values.moment}.`
      );

    }


    if (values.context) {

      parts.push(
        `The personal context should feel authentic and emotionally grounded: ${values.context}.`
      );

    }


    if (values.intendedMessage) {

      parts.push(
        `The final visual should communicate: ${values.intendedMessage}.`
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
     CREATE FORM VALUE
     ========================================================= */

  const formValue = (
    form,
    names
  ) => {

    for (
      const name of names
    ) {

      const element =
        form.elements[name] ||
        form.querySelector(
          `[name="${name}"]`
        );


      if (
        element &&
        typeof element.value ===
          "string"
      ) {

        return element.value.trim();

      }

    }


    return "";

  };


  /* =========================================================
     CREATE FORM DATA
     ========================================================= */

  const getCreateValues = (
    form
  ) => {

    return {

      name:
        formValue(
          form,
          [
            "name",
            "fullName",
            "fullname"
          ]
        ),

      school:
        formValue(
          form,
          [
            "school",
            "university",
            "institution"
          ]
        ),

      course:
        formValue(
          form,
          [
            "course",
            "field",
            "courseField"
          ]
        ),

      moment:
        formValue(
          form,
          [
            "moment",
            "yourMoment"
          ]
        ),

      feeling:
        formValue(
          form,
          [
            "feeling",
            "emotion"
          ]
        ),

      context:
        formValue(
          form,
          [
            "context",
            "story",
            "whatGoingThrough",
            "whatImGoingThrough"
          ]
        ),

      intendedMessage:
        formValue(
          form,
          [
            "message",
            "intendedMessage",
            "whatCommunicate",
            "whatYouWantToCommunicate"
          ]
        ),

      visualLanguage:
        formValue(
          form,
          [
            "visualLanguage",
            "visual",
            "style"
          ]
        ),

      referenceName:
        STATE.create.referenceName

    };

  };


  /* =========================================================
     CREATE VALIDATION
     ========================================================= */

  const validateCreateValues = (
    values
  ) => {

    const required = [

      [
        "name",
        "your name"
      ],

      [
        "moment",
        "your moment"
      ],

      [
        "feeling",
        "your feeling"
      ],

      [
        "context",
        "your story"
      ],

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
              values[key] ||
              ""
            ).trim()
        )
        .map(
          ([, label]) =>
            label
        );


    if (
      missing.length
    ) {

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
     REFERENCE IMAGE
     ========================================================= */

  const setupReferenceImage = () => {

    const input =
      $(
        CONFIG.selectors.imageInput
      );


    if (!input) {
      return;
    }


    input.addEventListener(
      "change",
      () => {

        const file =
          input.files?.[0];


        if (!file) {

          STATE.create.referenceImage =
            null;

          STATE.create.referenceName =
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

          STATE.create.referenceImage =
            null;

          STATE.create.referenceName =
            "";

          clearImagePreview();

          return;

        }


        STATE.create.referenceImage =
          file;


        STATE.create.referenceName =
          file.name;


        previewImage(
          file
        );

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


    if (!preview) {
      return;
    }


    const url =
      URL.createObjectURL(
        file
      );


    preview.hidden =
      false;


    if (
      preview.tagName ===
      "IMG"
    ) {

      preview.src =
        url;

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


    if (!preview) {
      return;
    }


    const oldURL =
      preview.dataset.objectUrl;


    if (oldURL) {

      URL.revokeObjectURL(
        oldURL
      );

    }


    preview.hidden =
      true;


    if (
      preview.tagName ===
      "IMG"
    ) {

      preview.removeAttribute(
        "src"
      );

    } else {

      preview.innerHTML =
        "";

    }

  };


  /* =========================================================
     WHATSAPP
     ========================================================= */

  const buildWhatsAppMessage = (
    values,
    creative
  ) => {

    return `

Hello ${STATE.site.name || "FeelFrame™"},

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

${values.referenceName || "No reference image provided"}

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
${
  creative.commands.length
    ? creative.commands.join(" ")
    : "None"
}

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
        STATE.site.whatsappNumber ||
        ""
      ).replace(
        /\D/g,
        ""
      );


    if (!number) {

      showGlobalError(
        "FeelFrame WhatsApp contact is not configured."
      );

      return;

    }


    const url =
      `https://wa.me/${number}?text=${encodeURIComponent(
        message
      )}`;


    window.location.href =
      url;

  };


  /* =========================================================
     CREATE FORM
     ========================================================= */

  const setupCreateForm = () => {

    const form =
      $(
        CONFIG.selectors.createForm
      );


    if (!form) {
      return;
    }


    form.addEventListener(
      "submit",
      event => {

        event.preventDefault();


        const values =
          getCreateValues(
            form
          );


        const validation =
          validateCreateValues(
            values
          );


        if (
          !validation.valid
        ) {

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


  /* =========================================================
     CREATE FORM MESSAGE
     ========================================================= */

  const showFormMessage = (
    form,
    message,
    type
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


      form.prepend(
        element
      );

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
     CREATIVE DIRECTION PREVIEW
     ========================================================= */

  const setupCreativePreview = () => {

    const form =
      $(
        CONFIG.selectors.createForm
      );


    if (!form) {
      return;
    }


    const preview =
      first(
        "#creativeDirection",
        ".creative-direction",
        "[data-creative-direction]"
      );


    if (!preview) {
      return;
    }


    const update = () => {

      const values =
        getCreateValues(
          form
        );


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
     NAVIGATION
     ========================================================= */

  const setupNavigation = () => {

    $$(
      "[data-nav], [data-page-link]"
    ).forEach(
      link => {

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
          event => {

            const target =
              link.dataset.nav ||
              link.dataset.pageLink;


            if (!target) {
              return;
            }


            if (
              target.startsWith(
                "http"
              ) ||
              target.startsWith(
                "mailto:"
              )
            ) {
              return;
            }


            event.preventDefault();


            window.location.href =
              target;

          }
        );

      }
    );

  };


  /* =========================================================
     ACCESSIBILITY
     ========================================================= */

  const setupAccessibility = () => {

    $$(
      "[data-story-card]"
    ).forEach(
      card => {

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

      }
    );


    $$("img").forEach(
      image => {

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

      }
    );

  };


  /* =========================================================
     REDUCED MOTION
     ========================================================= */

  const setupReducedMotion = () => {

    if (
      !window.matchMedia
    ) {
      return;
    }


    const media =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );


    const update = () => {

      document.documentElement.classList.toggle(
        "reduced-motion",
        media.matches
      );

    };


    update();


    if (
      media.addEventListener
    ) {

      media.addEventListener(
        "change",
        update
      );

    } else if (
      media.addListener
    ) {

      media.addListener(
        update
      );

    }

  };


  /* =========================================================
     PAGE INITIALIZATION
     ========================================================= */

  const initializePage = () => {

    const page =
      getPage();


    updateSiteMetadata();

    setupNavigation();

    setupAccessibility();

    setupReducedMotion();


    switch (page) {

      case "home":

        renderStoryBoard();

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
         * Safe fallback for pages that
         * use the global script.
         */

        renderStoryBoard();

        setupCoverflow();

        break;

    }


    setupImageFallbacks();

  };


  /* =========================================================
     GLOBAL ERROR HANDLING
     ========================================================= */

  window.addEventListener(
    "error",
    event => {

      console.error(
        "[FeelFrame] Runtime error:",
        event.error ||
        event.message
      );

    }
  );


  window.addEventListener(
    "unhandledrejection",
    event => {

      console.error(
        "[FeelFrame] Promise error:",
        event.reason
      );

    }
  );


  /* =========================================================
     PUBLIC API
     ========================================================= */

  window.FEELFRAME =
    STATE;


  window.FeelFrame = {

    state:
      STATE,

    findStory:
      findStoryById,

    openStory,

    renderExplore,

    renderCoverflow,

    moveCoverflow,

    goToCoverflow,

    buildCreativeDirection,

    buildWhatsAppMessage,

    formatPrice

  };


  /* =========================================================
     BOOT
     ========================================================= */

  const boot = async () => {

    try {

      await loadData();

      initializePage();


      document.documentElement.dataset.feelframeReady =
        "true";


      document.dispatchEvent(
        new CustomEvent(
          "feelframe:ready",
          {
            detail: STATE
          }
        )
      );


      console.info(
        "[FeelFrame] Application ready."
      );


    } catch (error) {

      document.documentElement.dataset.feelframeReady =
        "false";


      console.error(
        "[FeelFrame] Application failed to initialize:",
        error
      );

    }

  };


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
