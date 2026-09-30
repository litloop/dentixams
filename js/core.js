/* =========================================================
   FEELFRAME™
   Core Application Engine
   Production v1

   RESPONSIBILITY
   ├── Application configuration
   ├── Shared state
   ├── Data loading
   ├── Data validation
   ├── Shared DOM utilities
   ├── Text / data utilities
   ├── HTML escaping
   ├── URL validation
   ├── Image / media error handling
   ├── Global error handling
   ├── Site metadata
   ├── Shared navigation
   ├── Page detection
   └── Global FeelFrame API

   PAGE MODULES
   ├── home.js
   ├── coverflow.js
   ├── explore.js
   ├── create.js
   └── story.js

   DATA ARCHITECTURE

   data.json
      ↓
   FeelFrame Core
      ↓
   window.FeelFrame
      ↓
   Page Modules

   EXPECTED DATA SHAPE

   {
     "site": {...},
     "stories": [...]
   }

   EXPECTED PAGES

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

      globalError: [
        "#globalError",
        "#global-error",
        ".global-error",
        "[data-global-error]"
      ],

      siteName: [
        "[data-site-name]"
      ],

      siteTagline: [
        "[data-site-tagline]"
      ],

      siteDescription: [
        "[data-site-description]"
      ],

      navigation: [
        "[data-nav]",
        "[data-page-link]"
      ],

      images: [
        "img"
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

    stories: []

  };


  /* =========================================================
     DOM UTILITIES
     ========================================================= */

  const $ = (
    selectors,
    root = document
  ) => {

    if (!selectors) {
      return null;
    }


    const list =
      Array.isArray(selectors)
        ? selectors
        : [selectors];


    for (const selector of list) {

      try {

        const element =
          root.querySelector(
            selector
          );


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


  const $$ = (
    selector,
    root = document
  ) => {

    try {

      return Array.from(
        root.querySelectorAll(
          selector
        )
      );

    } catch (_) {

      return [];

    }

  };


  const first = (
    ...selectors
  ) => {

    for (const selector of selectors) {

      const element =
        $(selector);


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


  const normalize = (
    value
  ) => {

    return String(
      value ?? ""
    )
      .trim()
      .toLowerCase();

  };


  const escapeHTML = (
    value
  ) => {

    return String(
      value ?? ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );

  };


  const unique = (
    values
  ) => {

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


    if (
      path === "explore.html"
    ) {

      return "explore";

    }


    if (
      path === "create.html"
    ) {

      return "create";

    }


    if (
      path === "story.html"
    ) {

      return "story";

    }


    return "unknown";

  };


  /* =========================================================
     DATA URL
     ========================================================= */

  const getDataURL = () => {

    return new URL(
      CONFIG.dataFile,
      document.baseURI
    ).href;

  };


  /* =========================================================
     DATA VALIDATION
     ========================================================= */

  const validateData = (
    data
  ) => {

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


    if (
      !Array.isArray(
        data.stories
      )
    ) {

      throw new Error(
        "data.json is missing the required stories[] array."
      );

    }


    return true;

  };


  /* =========================================================
     STORY VALIDATION
     ========================================================= */

  const isValidStory = (
    story
  ) => {

    if (
      !story ||
      typeof story !== "object" ||
      Array.isArray(story)
    ) {

      return false;

    }


    /*
     * ID is the essential field required
     * for FeelFrame story identification
     * and routing.
     */

    return Boolean(
      story.id
    );

  };


  /* =========================================================
     LOAD DATA.JSON
     ========================================================= */

  const loadData = async () => {

    const url =
      getDataURL();


    try {

      const response =
        await fetch(
          url,
          {
            method: "GET",

            headers: {
              Accept:
                "application/json"
            },

            cache:
              "no-cache"
          }
        );


      if (!response.ok) {

        throw new Error(
          `Unable to load data.json. HTTP ${response.status}.`
        );

      }


      const data =
        await response.json();


      validateData(
        data
      );


      STATE.data =
        data;


      /*
       * FeelFrame stories are always sourced
       * from data.stories.
       */

      STATE.stories =
        data.stories
          .filter(
            isValidStory
          );


      STATE.site = {
        ...STATE.site,
        ...data.site
      };


      console.info(
        `[FeelFrame] Loaded ${STATE.stories.length} stories.`
      );


      if (
        !STATE.stories.length
      ) {

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
      $(
        CONFIG.selectors.globalError
      );


    const container =
      existing ||
      document.createElement(
        "div"
      );


    if (!existing) {

      container.id =
        "globalError";


      document.body.prepend(
        container
      );

    }


    container.hidden =
      false;


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
                ${escapeHTML(
                  url
                )}
              </span>

            `
        }

      </div>

    `;

  };


  /* =========================================================
     GLOBAL ERROR DISPLAY
     ========================================================= */

  const showGlobalError = (
    message,
    options = {}
  ) => {

    const existing =
      $(
        CONFIG.selectors.globalError
      );


    const container =
      existing ||
      document.createElement(
        "div"
      );


    if (!existing) {

      container.id =
        "globalError";


      document.body.prepend(
        container
      );

    }


    container.hidden =
      false;


    container.className =
      `global-error is-visible ${
        options.className || ""
      }`.trim();


    container.innerHTML = `

      <div class="error-state-content">

        <strong>
          ${escapeHTML(
            options.title ||
            "Something went wrong."
          )}
        </strong>

        <span>
          ${escapeHTML(
            message ||
            "Please try again."
          )}
        </span>

      </div>

    `;


    return container;

  };


  const hideGlobalError = () => {

    const container =
      $(
        CONFIG.selectors.globalError
      );


    if (!container) {
      return;
    }


    container.hidden =
      true;


    container.classList.remove(
      "is-visible"
    );

  };


  /* =========================================================
     SITE METADATA
     ========================================================= */

  const updateSiteMetadata = () => {

    const site =
      STATE.site;


    $$(
      CONFIG.selectors.siteName[0]
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
      CONFIG.selectors.siteTagline[0]
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
      CONFIG.selectors.siteDescription[0]
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

  const findStoryById = (
    id
  ) => {

    if (!id) {
      return null;
    }


    return (
      STATE.stories.find(
        story =>
          String(
            story.id
          ) ===
          String(id)
      ) ||
      null
    );

  };


  /* =========================================================
     STORY URL
     ========================================================= */

  const storyURL = (
    story
  ) => {

    if (
      !story ||
      !story.id
    ) {

      return "";

    }


    return (
      `${CONFIG.pages.story}?id=` +
      encodeURIComponent(
        story.id
      )
    );

  };


  const openStory = (
    story
  ) => {

    const url =
      storyURL(
        story
      );


    if (!url) {
      return;
    }


    window.location.href =
      url;

  };


  /* =========================================================
     URL VALIDATION
     ========================================================= */

  const isValidURL = (
    value,
    options = {}
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


      if (
        options.httpsOnly ===
        true &&
        url.protocol !==
        "https:"
      ) {

        return false;

      }


      if (
        options.httpOnly ===
        true &&
        ![
          "http:",
          "https:"
        ].includes(
          url.protocol
        )
      ) {

        return false;

      }


      if (
        options.sameOrigin ===
        true &&
        url.origin !==
        window.location.origin
      ) {

        return false;

      }


      return Boolean(
        url.hostname
      );

    } catch (_) {

      return false;

    }

  };


  const isValidCheckoutURL = (
    value
  ) => {

    return isValidURL(
      value,
      {
        httpsOnly:
          true
      }
    );

  };


  /* =========================================================
     IMAGE FALLBACKS
     ========================================================= */

  const setupImageFallbacks = (
    root = document
  ) => {

    $$(
      "img",
      root
    ).forEach(
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


            const frame =
              image.closest(
                ".media-frame, .story-card-image-wrap, .cover-card__image"
              );


            if (frame) {

              frame.classList.add(
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
     IMAGE LOAD STATE
     ========================================================= */

  const setupImageLoadState = (
    root = document
  ) => {

    $$(
      "img",
      root
    ).forEach(
      image => {

        if (
          image.complete
        ) {

          image.classList.add(
            image.naturalWidth
              ? "is-loaded"
              : "is-broken"
          );

          return;

        }


        image.addEventListener(
          "load",
          () => {

            image.classList.add(
              "is-loaded"
            );

          },
          {
            once: true
          }
        );


        image.addEventListener(
          "error",
          () => {

            image.classList.add(
              "is-broken"
            );

          },
          {
            once: true
          }
        );

      }
    );

  };


  /* =========================================================
     MEDIA SAFETY
     ========================================================= */

  const setupMediaHandling = (
    root = document
  ) => {

    setupImageFallbacks(
      root
    );

    setupImageLoadState(
      root
    );

  };


  /* =========================================================
     SHARED NAVIGATION
     ========================================================= */

  const setupNavigation = (
    root = document
  ) => {

    $(
      CONFIG.selectors.navigation,
      root
    );


    $$(
      "[data-nav], [data-page-link]",
      root
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


            /*
             * External destinations and
             * mail links are allowed to
             * behave normally.
             */

            if (
              target.startsWith(
                "http://"
              ) ||
              target.startsWith(
                "https://"
              ) ||
              target.startsWith(
                "mailto:"
              ) ||
              target.startsWith(
                "tel:"
              )
            ) {

              return;

            }


            /*
             * Preserve modifier-click behavior.
             */

            if (
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
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
     ACTIVE NAVIGATION
     ========================================================= */

  const updateActiveNavigation = (
    root = document
  ) => {

    const currentPage =
      getPage();


    $$(
      "[data-page], [data-nav-page]",
      root
    ).forEach(
      link => {

        const target =
          normalize(
            link.dataset.page ||
            link.dataset.navPage
          );


        const active =
          target ===
          normalize(
            currentPage
          );


        link.classList.toggle(
          "is-active",
          active
        );


        if (active) {

          link.setAttribute(
            "aria-current",
            "page"
          );

        } else {

          link.removeAttribute(
            "aria-current"
          );

        }

      }
    );

  };


  /* =========================================================
     ACCESSIBILITY FOUNDATION
     ========================================================= */

  const setupAccessibility = (
    root = document
  ) => {

    $$(
      "img",
      root
    ).forEach(
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


    $$(
      "[data-loading]",
      root
    ).forEach(
      element => {

        if (
          !element.hasAttribute(
            "aria-busy"
          )
        ) {

          element.setAttribute(
            "aria-busy",
            "false"
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
     SHARED INITIALIZATION
     ========================================================= */

  const initializeCore = () => {

    updateSiteMetadata();

    setupNavigation();

    updateActiveNavigation();

    setupAccessibility();

    setupReducedMotion();

    setupMediaHandling();

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

    /*
     * State
     */

    state:
      STATE,


    /*
     * Configuration
     */

    config:
      CONFIG,


    /*
     * Data
     */

    loadData,

    validateData,

    findStory:
      findStoryById,


    /*
     * Page
     */

    getPage,


    /*
     * Navigation
     */

    storyURL,

    openStory,

    setupNavigation,

    updateActiveNavigation,


    /*
     * Utilities
     */

    $, 

    $$,

    first,

    safeText,

    normalize,

    escapeHTML,

    unique,


    /*
     * URLs
     */

    isValidURL,

    isValidCheckoutURL,


    /*
     * Errors

     */

    showGlobalError,

    hideGlobalError,

    showDataError,


    /*
     * Media
     */

    setupImageFallbacks,

    setupImageLoadState,

    setupMediaHandling,


    /*
     * Shared setup
     */

    initializeCore

  };


  /* =========================================================
     BOOT
     ========================================================= */

  const boot = async () => {

    try {

      await loadData();

      initializeCore();


      document.documentElement.dataset.feelframeReady =
        "true";


      document.dispatchEvent(
        new CustomEvent(
          "feelframe:ready",
          {
            detail:
              STATE
          }
        )
      );


      console.info(
        "[FeelFrame] Core ready."
      );


    } catch (error) {

      document.documentElement.dataset.feelframeReady =
        "false";


      console.error(
        "[FeelFrame] Core failed to initialize:",
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
