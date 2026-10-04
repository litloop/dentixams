/* ============================================================
   FEELFRAME™
   HOMEPAGE / STOREFRONT JAVASCRIPT
   ------------------------------------------------------------
   index.html
   home.css
   home.js

   Responsibilities:
   - Load data.json
   - Build 3D Coverflow
   - Handle active / previous / next states
   - Mouse dragging
   - Touch swiping
   - Keyboard navigation
   - Coverflow controls
   - Story navigation
   - Featured bento grid
   - Mobile navigation
   - Footer year
   ============================================================ */

(() => {
  "use strict";


  /* ==========================================================
     01. CONFIGURATION
     ========================================================== */

  const CONFIG = {
    dataUrl: "data.json",

    coverflow: {
      autoplay: false,
      autoplayDelay: 5000,

      visibleSideCards: 2,

      desktop: {
        sideOffset: 300,
        farOffset: 510,

        sideRotation: 42,
        farRotation: 58,

        sideScale: 0.82,
        farScale: 0.66,

        sideDepth: -80,
        farDepth: -160
      },

      mobile: {
        sideOffset: 205,
        farOffset: 340,

        sideRotation: 34,
        farRotation: 48,

        sideScale: 0.78,
        farScale: 0.62,

        sideDepth: -70,
        farDepth: -140
      },

      swipeThreshold: 45
    },

    featuredLimit: 6
  };


  /* ==========================================================
     02. STATE
     ========================================================== */

  const state = {

    data: null,

    stories: [],

    featuredStories: [],

    activeIndex: 0,

    isDragging: false,

    dragStartX: 0,

    dragCurrentX: 0,

    dragDeltaX: 0,

    hasMovedDuringDrag: false,

    autoplayTimer: null,

    touchStartX: 0,

    touchStartY: 0,

    touchCurrentX: 0,

    touchCurrentY: 0,

    isTouching: false,

    mobileMenuOpen: false

  };


  /* ==========================================================
     03. DOM
     ========================================================== */

  const DOM = {};


  function cacheDOM() {

    DOM.body = document.body;

    DOM.siteShell =
      document.getElementById("site-shell");

    DOM.coverflow =
      document.getElementById("coverflow");

    DOM.coverflowTrack =
      document.getElementById("coverflow-track");

    DOM.coverflowPrev =
      document.getElementById("coverflow-prev");

    DOM.coverflowNext =
      document.getElementById("coverflow-next");

    DOM.coverflowProgress =
      document.getElementById("coverflow-progress");

    DOM.progressCurrent =
      document.querySelector(
        ".coverflow-progress-current"
      );

    DOM.progressTotal =
      document.querySelector(
        ".coverflow-progress-total"
      );

    DOM.featuredGrid =
      document.getElementById("featured-grid");

    DOM.featuredEmpty =
      document.getElementById("featured-empty");

    DOM.mobileMenuToggle =
      document.getElementById("mobile-menu-toggle");

    DOM.mobileNavigation =
      document.getElementById("mobile-navigation");

    DOM.footerYear =
      document.getElementById("footer-year");

    DOM.toast =
      document.getElementById("site-toast");

    DOM.toastMessage =
      document.getElementById("site-toast-message");

  }


  /* ==========================================================
     04. INITIALIZATION
     ========================================================== */

  async function init() {

    cacheDOM();

    setFooterYear();

    setupNavigation();

    setupCoverflowInteraction();

    setupKeyboardNavigation();

    try {

      const data = await loadData();

      state.data = data;

      normalizeStories(data);

      renderCoverflow();

      renderFeaturedStories();

      updateCoverflow();

      startAutoplay();

    } catch (error) {

      console.error(
        "FeelFrame™ homepage failed to initialize:",
        error
      );

      showHomepageError();

    }

  }


  /* ==========================================================
     05. LOAD DATA.JSON
     ========================================================== */

  async function loadData() {

    const response =
      await fetch(CONFIG.dataUrl, {
        cache: "no-store"
      });

    if (!response.ok) {

      throw new Error(
        `Unable to load ${CONFIG.dataUrl}`
      );

    }

    return await response.json();

  }


  /* ==========================================================
     06. NORMALIZE STORIES
     ========================================================== */

  function normalizeStories(data) {

    const rawStories =
      Array.isArray(data?.stories)
        ? data.stories
        : [];

    state.stories =
      rawStories
        .filter(Boolean)
        .map((story, index) => {

          return normalizeStory(
            story,
            index
          );

        })
        .filter(story => story.id);

    state.featuredStories =
      state.stories
        .filter(story => story.featured)
        .slice(0, CONFIG.featuredLimit);

    /*
      If data.json doesn't have enough explicitly
      featured stories, use the first stories as a
      graceful fallback for the homepage.
    */

    if (
      state.featuredStories.length === 0
      &&
      state.stories.length > 0
    ) {

      state.featuredStories =
        state.stories.slice(
          0,
          CONFIG.featuredLimit
        );

    }

  }


  function normalizeStory(story, index) {

    const id =
      story.id ||
      story.slug ||
      `story-${index + 1}`;

    const title =
      story.title ||
      story.name ||
      "Untitled Story";

    const image =
      story.image ||
      story.cover ||
      story.coverImage ||
      story.thumbnail ||
      "";

    const category =
      story.category ||
      story.campaign ||
      story.type ||
      "Visual Story";

    const description =
      story.description ||
      story.moment ||
      story.quote ||
      "";

    const link =
      story.link ||
      story.url ||
      story.selarUrl ||
      story.purchaseUrl ||
      "";

    return {
      ...story,

      id,
      title,
      image,
      category,
      description,
      link,

      featured:
        Boolean(story.featured)
    };

  }


  /* ==========================================================
     07. COVERFLOW RENDERING
     ========================================================== */

  function renderCoverflow() {

    if (!DOM.coverflowTrack) {
      return;
    }

    DOM.coverflowTrack.innerHTML = "";

    if (state.stories.length === 0) {

      renderEmptyCoverflow();

      return;
    }


    /*
      Featured stories should drive the hero whenever
      possible.

      If there are featured stories, use them first.
      Otherwise use all stories.
    */

    const coverflowStories =
      state.featuredStories.length > 0
        ? state.featuredStories
        : state.stories;

    state.coverflowStories =
      coverflowStories;


    coverflowStories.forEach(
      (story, index) => {

        const card =
          createCoverflowCard(
            story,
            index
          );

        DOM.coverflowTrack.appendChild(card);

      }
    );


    updateProgress();

  }


  function createCoverflowCard(
    story,
    index
  ) {

    const card =
      document.createElement("article");

    card.className =
      "coverflow-card";

    card.dataset.index =
      String(index);

    card.dataset.storyId =
      story.id;

    card.tabIndex = 0;

    card.setAttribute(
      "role",
      "button"
    );

    card.setAttribute(
      "aria-label",
      `Open story: ${story.title}`
    );


    /*
      Image
    */

    const image =
      document.createElement("img");

    image.className =
      "coverflow-card-image";

    image.alt =
      story.title;

    image.loading =
      index === state.activeIndex
        ? "eager"
        : "lazy";

    image.decoding =
      "async";

    if (story.image) {

      image.src =
        story.image;

    }


    /*
      Overlay
    */

    const overlay =
      document.createElement("div");

    overlay.className =
      "coverflow-card-overlay";


    /*
      Number
    */

    const number =
      document.createElement("span");

    number.className =
      "coverflow-card-number";

    number.textContent =
      formatNumber(index + 1);


    /*
      Content
    */

    const content =
      document.createElement("div");

    content.className =
      "coverflow-card-content";


    const category =
      document.createElement("span");

    category.className =
      "coverflow-card-category";

    category.textContent =
      story.category;


    const title =
      document.createElement("h2");

    title.className =
      "coverflow-card-title";

    title.textContent =
      story.title;


    content.appendChild(category);

    content.appendChild(title);

    card.appendChild(image);

    card.appendChild(overlay);

    card.appendChild(number);

    card.appendChild(content);


    /*
      Clicking the active card opens the story.

      Clicking a side card makes it active first.
    */

    card.addEventListener(
      "click",
      event => {

        if (state.hasMovedDuringDrag) {

          event.preventDefault();

          return;

        }

        const clickedIndex =
          Number(card.dataset.index);

        if (
          clickedIndex !==
          state.activeIndex
        ) {

          setActiveIndex(
            clickedIndex
          );

          return;

        }

        openStory(story.id);

      }
    );


    /*
      Keyboard support
    */

    card.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {

          event.preventDefault();

          const clickedIndex =
            Number(card.dataset.index);

          if (
            clickedIndex !==
            state.activeIndex
          ) {

            setActiveIndex(
              clickedIndex
            );

          } else {

            openStory(story.id);

          }

        }

      }
    );


    return card;

  }


  /* ==========================================================
     08. COVERFLOW STATE
     ========================================================== */

  function updateCoverflow() {

    const cards =
      DOM.coverflowTrack?.querySelectorAll(
        ".coverflow-card"
      );

    if (!cards || cards.length === 0) {
      return;
    }

    const total =
      cards.length;

    cards.forEach(
      (card, index) => {

        const position =
          getRelativePosition(
            index,
            state.activeIndex,
            total
          );

        applyCardPosition(
          card,
          position
        );

      }
    );

    updateProgress();

  }


  function getRelativePosition(
    index,
    activeIndex,
    total
  ) {

    let difference =
      index - activeIndex;


    /*
      Circular wrap-around.

      Example:

      [01] [02] [03] [04]

      Active = 01

      04 becomes previous,
      rather than being treated
      as a far-away card.
    */

    if (
      difference >
      total / 2
    ) {

      difference -= total;

    }

    if (
      difference <
      -total / 2
    ) {

      difference += total;

    }

    return difference;

  }


  function applyCardPosition(
    card,
    position
  ) {

    card.classList.remove(
      "is-active",
      "is-prev",
      "is-next",
      "is-far",
      "is-hidden"
    );


    const isMobile =
      window.innerWidth <= 800;

    const settings =
      isMobile
        ? CONFIG.coverflow.mobile
        : CONFIG.coverflow.desktop;


    /*
      CENTER
    */

    if (position === 0) {

      card.classList.add(
        "is-active"
      );

      card.style.transform =
        "translate3d(-50%, -50%, 0) " +
        "rotateY(0deg) " +
        "scale(1)";

      card.style.zIndex =
        "20";

      return;

    }


    /*
      PREVIOUS
    */

    if (position === -1) {

      card.classList.add(
        "is-prev"
      );

      card.style.transform =
        `
        translate3d(
          calc(-50% - ${settings.sideOffset}px),
          -50%,
          ${settings.sideDepth}px
        )
        rotateY(${settings.sideRotation}deg)
        scale(${settings.sideScale})
        `;

      card.style.zIndex =
        "10";

      return;

    }


    /*
      NEXT
    */

    if (position === 1) {

      card.classList.add(
        "is-next"
      );

      card.style.transform =
        `
        translate3d(
          calc(-50% + ${settings.sideOffset}px),
          -50%,
          ${settings.sideDepth}px
        )
        rotateY(-${settings.sideRotation}deg)
        scale(${settings.sideScale})
        `;

      card.style.zIndex =
        "10";

      return;

    }


    /*
      FAR LEFT
    */

    if (position < -1) {

      card.classList.add(
        "is-far"
      );

      card.style.transform =
        `
        translate3d(
          calc(-50% - ${settings.farOffset}px),
          -50%,
          ${settings.farDepth}px
        )
        rotateY(${settings.farRotation}deg)
        scale(${settings.farScale})
        `;

      card.style.zIndex =
        "3";

      return;

    }


    /*
      FAR RIGHT
    */

    if (position > 1) {

      card.classList.add(
        "is-far"
      );

      card.style.transform =
        `
        translate3d(
          calc(-50% + ${settings.farOffset}px),
          -50%,
          ${settings.farDepth}px
        )
        rotateY(-${settings.farRotation}deg)
        scale(${settings.farScale})
        `;

      card.style.zIndex =
        "3";

      return;

    }


    /*
      Anything outside the visible range
    */

    card.classList.add(
      "is-hidden"
    );

    card.style.transform =
      "translate3d(-50%, -50%, -300px)";

  }


  /* ==========================================================
     09. ACTIVE STORY
     ========================================================== */

  function setActiveIndex(
    newIndex,
    options = {}
  ) {

    const stories =
      state.coverflowStories || [];

    if (stories.length === 0) {
      return;
    }

    const total =
      stories.length;


    /*
      Circular navigation
    */

    let nextIndex =
      newIndex;

    if (nextIndex < 0) {

      nextIndex =
        total - 1;

    }

    if (nextIndex >= total) {

      nextIndex =
        0;

    }


    state.activeIndex =
      nextIndex;


    updateCoverflow();


    if (!options.silent) {

      restartAutoplay();

    }

  }


  /* ==========================================================
     10. NEXT / PREVIOUS
     ========================================================== */

  function nextStory() {

    setActiveIndex(
      state.activeIndex + 1
    );

  }


  function previousStory() {

    setActiveIndex(
      state.activeIndex - 1
    );

  }


  /* ==========================================================
     11. PROGRESS
     ========================================================== */

  function updateProgress() {

    const stories =
      state.coverflowStories || [];

    if (
      !DOM.progressCurrent ||
      !DOM.progressTotal
    ) {

      return;

    }

    const total =
      stories.length;

    if (total === 0) {
      return;
    }

    DOM.progressCurrent.textContent =
      formatNumber(
        state.activeIndex + 1
      );

    DOM.progressTotal.textContent =
      formatNumber(total);

  }


  /* ==========================================================
     12. COVERFLOW CONTROLS
     ========================================================== */

  function setupCoverflowInteraction() {

    if (!DOM.coverflow) {
      return;
    }


    /*
      Buttons
    */

    DOM.coverflowPrev?.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        previousStory();

      }
    );


    DOM.coverflowNext?.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        nextStory();

      }
    );


    /*
      Mouse dragging
    */

    DOM.coverflow.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    window.addEventListener(
      "pointermove",
      handlePointerMove
    );

    window.addEventListener(
      "pointerup",
      handlePointerUp
    );

    window.addEventListener(
      "pointercancel",
      handlePointerUp
    );


    /*
      Touch events.

      Pointer events handle most modern
      touch devices, but these listeners
      provide additional reliability for
      mobile browsers.
    */

    DOM.coverflow.addEventListener(
      "touchstart",
      handleTouchStart,
      { passive: true }
    );

    DOM.coverflow.addEventListener(
      "touchmove",
      handleTouchMove,
      { passive: true }
    );

    DOM.coverflow.addEventListener(
      "touchend",
      handleTouchEnd,
      { passive: true }
    );

  }


  /* ==========================================================
     13. POINTER DRAGGING
     ========================================================== */

  function handlePointerDown(
    event
  ) {

    if (
      event.pointerType === "mouse" &&
      event.button !== 0
    ) {

      return;

    }

    state.isDragging = true;

    state.hasMovedDuringDrag = false;

    state.dragStartX =
      event.clientX;

    state.dragCurrentX =
      event.clientX;

    state.dragDeltaX = 0;

    DOM.coverflow.classList.add(
      "is-dragging"
    );

    stopAutoplay();

  }


  function handlePointerMove(
    event
  ) {

    if (!state.isDragging) {
      return;
    }

    state.dragCurrentX =
      event.clientX;

    state.dragDeltaX =
      state.dragCurrentX -
      state.dragStartX;


    if (
      Math.abs(state.dragDeltaX) >
      8
    ) {

      state.hasMovedDuringDrag =
        true;

    }

  }


  function handlePointerUp() {

    if (!state.isDragging) {
      return;
    }

    state.isDragging = false;

    DOM.coverflow.classList.remove(
      "is-dragging"
    );


    const threshold =
      CONFIG.coverflow.swipeThreshold;


    if (
      Math.abs(state.dragDeltaX) >=
      threshold
    ) {

      if (
        state.dragDeltaX < 0
      ) {

        nextStory();

      } else {

        previousStory();

      }

    } else {

      restartAutoplay();

    }


    /*
      Give the click event time to
      complete before resetting this.
    */

    window.setTimeout(
      () => {

        state.hasMovedDuringDrag =
          false;

      },
      80
    );

  }


  /* ==========================================================
     14. TOUCH SWIPING
     ========================================================== */

  function handleTouchStart(
    event
  ) {

    if (
      !event.touches ||
      !event.touches[0]
    ) {

      return;

    }

    const touch =
      event.touches[0];

    state.isTouching = true;

    state.touchStartX =
      touch.clientX;

    state.touchStartY =
      touch.clientY;

    state.touchCurrentX =
      touch.clientX;

    state.touchCurrentY =
      touch.clientY;

    stopAutoplay();

  }


  function handleTouchMove(
    event
  ) {

    if (
      !state.isTouching ||
      !event.touches ||
      !event.touches[0]
    ) {

      return;

    }

    const touch =
      event.touches[0];

    state.touchCurrentX =
      touch.clientX;

    state.touchCurrentY =
      touch.clientY;

  }


  function handleTouchEnd() {

    if (!state.isTouching) {
      return;
    }

    state.isTouching = false;


    const deltaX =
      state.touchCurrentX -
      state.touchStartX;

    const deltaY =
      state.touchCurrentY -
      state.touchStartY;


    /*
      Only treat the gesture as a horizontal
      swipe when horizontal movement is
      stronger than vertical movement.
    */

    if (
      Math.abs(deltaX) >
      Math.abs(deltaY) &&
      Math.abs(deltaX) >=
      CONFIG.coverflow.swipeThreshold
    ) {

      if (deltaX < 0) {

        nextStory();

      } else {

        previousStory();

      }

    } else {

      restartAutoplay();

    }

  }


  /* ==========================================================
     15. KEYBOARD NAVIGATION
     ========================================================== */

  function setupKeyboardNavigation() {

    document.addEventListener(
      "keydown",
      event => {

        /*
          Don't hijack keyboard controls when
          someone is typing in a form field.
        */

        const target =
          event.target;

        const tag =
          target?.tagName;

        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target?.isContentEditable
        ) {

          return;

        }


        switch (event.key) {

          case "ArrowLeft":

            event.preventDefault();

            previousStory();

            break;


          case "ArrowRight":

            event.preventDefault();

            nextStory();

            break;


          case "Enter":

            if (
              document.activeElement &&
              document.activeElement.classList.contains(
                "coverflow-card"
              )
            ) {

              event.preventDefault();

              openActiveStory();

            }

            break;

        }

      }
    );

  }


  /* ==========================================================
     16. OPEN STORY
     ========================================================== */

  function openActiveStory() {

    const stories =
      state.coverflowStories || [];

    const story =
      stories[state.activeIndex];

    if (!story) {
      return;
    }

    openStory(
      story.id
    );

  }


  function openStory(
    storyId
  ) {

    if (!storyId) {
      return;
    }

    /*
      Encode the ID safely so special characters
      don't break the URL.
    */

    const encodedId =
      encodeURIComponent(
        String(storyId)
      );

    window.location.href =
      `story.html?id=${encodedId}`;

  }


  /* ==========================================================
     17. FEATURED BENTO
     ========================================================== */

  function renderFeaturedStories() {

    if (!DOM.featuredGrid) {
      return;
    }

    DOM.featuredGrid.innerHTML = "";


    const stories =
      state.featuredStories.length > 0
        ? state.featuredStories
        : state.stories.slice(
            0,
            CONFIG.featuredLimit
          );


    if (stories.length === 0) {

      if (DOM.featuredEmpty) {
        DOM.featuredEmpty.hidden =
          false;
      }

      return;

    }


    if (DOM.featuredEmpty) {
      DOM.featuredEmpty.hidden =
        true;
    }


    stories.forEach(
      (story, index) => {

        const card =
          createFeaturedCard(
            story,
            index
          );

        DOM.featuredGrid.appendChild(
          card
        );

      }
    );

  }


  function createFeaturedCard(
    story,
    index
  ) {

    const card =
      document.createElement("article");


    /*
      Bento layout pattern.

      First story:
      large

      Second:
      standard

      Third:
      tall

      Fourth:
      standard

      Fifth:
      wide

      Sixth:
      standard
    */

    const layoutClasses = [
      "bento-large",
      "bento-standard",
      "bento-tall",
      "bento-standard",
      "bento-wide",
      "bento-standard"
    ];


    card.className =
      `featured-card ${
        layoutClasses[
          index % layoutClasses.length
        ]
      }`;


    card.dataset.storyId =
      story.id;

    card.tabIndex =
      0;

    card.setAttribute(
      "role",
      "button"
    );

    card.setAttribute(
      "aria-label",
      `Open story: ${story.title}`
    );


    /*
      Image
    */

    const image =
      document.createElement("img");

    image.className =
      "featured-card-image";

    image.alt =
      story.title;

    image.loading =
      index < 2
        ? "eager"
        : "lazy";

    image.decoding =
      "async";

    if (story.image) {

      image.src =
        story.image;

    }


    /*
      Overlay
    */

    const overlay =
      document.createElement("div");

    overlay.className =
      "featured-card-overlay";


    /*
      Number
    */

    const number =
      document.createElement("span");

    number.className =
      "featured-card-number";

    number.textContent =
      formatNumber(
        index + 1
      );


    /*
      Arrow
    */

    const arrow =
      document.createElement("span");

    arrow.className =
      "featured-card-arrow";

    arrow.setAttribute(
      "aria-hidden",
      "true"
    );

    arrow.textContent =
      "↗";


    /*
      Content
    */

    const content =
      document.createElement("div");

    content.className =
      "featured-card-content";


    const category =
      document.createElement("span");

    category.className =
      "featured-card-category";

    category.textContent =
      story.category;


    const title =
      document.createElement("h3");

    title.className =
      "featured-card-title";

    title.textContent =
      story.title;


    content.appendChild(
      category
    );

    content.appendChild(
      title
    );


    card.appendChild(
      image
    );

    card.appendChild(
      overlay
    );

    card.appendChild(
      number
    );

    card.appendChild(
      arrow
    );

    card.appendChild(
      content
    );


    /*
      Open story
    */

    const activate =
      () => {

        openStory(
          story.id
        );

      };


    card.addEventListener(
      "click",
      activate
    );


    card.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {

          event.preventDefault();

          activate();

        }

      }
    );


    return card;

  }


  /* ==========================================================
     18. MOBILE NAVIGATION
     ========================================================== */

  function setupNavigation() {

    if (!DOM.mobileMenuToggle) {
      return;
    }


    DOM.mobileMenuToggle.addEventListener(
      "click",
      toggleMobileMenu
    );


    /*
      Close menu when a navigation link
      is selected.
    */

    DOM.mobileNavigation
      ?.querySelectorAll("a")
      .forEach(link => {

        link.addEventListener(
          "click",
          () => {

            closeMobileMenu();

          }
        );

      });


    /*
      Close mobile menu with Escape.
    */

    document.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Escape" &&
          state.mobileMenuOpen
        ) {

          closeMobileMenu();

        }

      }
    );

  }


  function toggleMobileMenu() {

    if (
      state.mobileMenuOpen
    ) {

      closeMobileMenu();

    } else {

      openMobileMenu();

    }

  }


  function openMobileMenu() {

    state.mobileMenuOpen =
      true;

    DOM.body.classList.add(
      "menu-open"
    );

    DOM.mobileMenuToggle?.setAttribute(
      "aria-expanded",
      "true"
    );

    DOM.mobileNavigation?.setAttribute(
      "aria-hidden",
      "false"
    );

  }


  function closeMobileMenu() {

    state.mobileMenuOpen =
      false;

    DOM.body.classList.remove(
      "menu-open"
    );

    DOM.mobileMenuToggle?.setAttribute(
      "aria-expanded",
      "false"
    );

    DOM.mobileNavigation?.setAttribute(
      "aria-hidden",
      "true"
    );

  }


  /* ==========================================================
     19. AUTOPLAY
     ========================================================== */

  function startAutoplay() {

    if (
      !CONFIG.coverflow.autoplay
    ) {

      return;

    }

    stopAutoplay();


    state.autoplayTimer =
      window.setInterval(
        () => {

          nextStory();

        },
        CONFIG.coverflow.autoplayDelay
      );

  }


  function stopAutoplay() {

    if (
      state.autoplayTimer
    ) {

      window.clearInterval(
        state.autoplayTimer
      );

      state.autoplayTimer =
        null;

    }

  }


  function restartAutoplay() {

    if (
      !CONFIG.coverflow.autoplay
    ) {

      return;

    }

    stopAutoplay();

    startAutoplay();

  }


  /* ==========================================================
     20. RESPONSIVE COVERFLOW REFRESH
     ========================================================== */

  let resizeTimer = null;

  window.addEventListener(
    "resize",
    () => {

      window.clearTimeout(
        resizeTimer
      );

      resizeTimer =
        window.setTimeout(
          () => {

            updateCoverflow();

          },
          120
        );

    }
  );


  /* ==========================================================
     21. VISIBILITY HANDLING
     ========================================================== */

  document.addEventListener(
    "visibilitychange",
    () => {

      if (
        document.hidden
      ) {

        stopAutoplay();

      } else {

        restartAutoplay();

      }

    }
  );


  /* ==========================================================
     22. FOOTER YEAR
     ========================================================== */

  function setFooterYear() {

    if (!DOM.footerYear) {
      return;
    }

    DOM.footerYear.textContent =
      new Date()
        .getFullYear()
        .toString();

  }


  /* ==========================================================
     23. EMPTY COVERFLOW
     ========================================================== */

  function renderEmptyCoverflow() {

    if (!DOM.coverflowTrack) {
      return;
    }

    const empty =
      document.createElement("div");

    empty.className =
      "coverflow-card is-active";

    empty.style.transform =
      "translate3d(-50%, -50%, 0)";


    const content =
      document.createElement("div");

    content.className =
      "coverflow-card-content";


    const title =
      document.createElement("h2");

    title.className =
      "coverflow-card-title";

    title.textContent =
      "Stories are coming.";


    content.appendChild(
      title
    );

    empty.appendChild(
      content
    );

    DOM.coverflowTrack.appendChild(
      empty
    );

  }


  /* ==========================================================
     24. ERROR STATE
     ========================================================== */

  function showHomepageError() {

    if (DOM.coverflowTrack) {

      DOM.coverflowTrack.innerHTML = "";

      const errorCard =
        document.createElement("div");

      errorCard.className =
        "coverflow-card is-active";

      errorCard.style.transform =
        "translate3d(-50%, -50%, 0)";


      const content =
        document.createElement("div");

      content.className =
        "coverflow-card-content";


      const category =
        document.createElement("span");

      category.className =
        "coverflow-card-category";

      category.textContent =
        "FEELFRAME™";


      const title =
        document.createElement("h2");

      title.className =
        "coverflow-card-title";

      title.textContent =
        "The stories are being prepared.";


      content.appendChild(
        category
      );

      content.appendChild(
        title
      );

      errorCard.appendChild(
        content
      );

      DOM.coverflowTrack.appendChild(
        errorCard
      );

    }


    showToast(
      "Unable to load the FeelFrame™ stories."
    );

  }


  /* ==========================================================
     25. TOAST
     ========================================================== */

  let toastTimer = null;

  function showToast(
    message
  ) {

    if (
      !DOM.toast ||
      !DOM.toastMessage
    ) {

      return;

    }

    DOM.toastMessage.textContent =
      message;

    DOM.toast.classList.add(
      "is-visible"
    );

    DOM.toast.setAttribute(
      "aria-hidden",
      "false"
    );


    window.clearTimeout(
      toastTimer
    );


    toastTimer =
      window.setTimeout(
        () => {

          DOM.toast.classList.remove(
            "is-visible"
          );

          DOM.toast.setAttribute(
            "aria-hidden",
            "true"
          );

        },
        3500
      );

  }


  /* ==========================================================
     26. UTILITIES
     ========================================================== */

  function formatNumber(
    number
  ) {

    return String(number)
      .padStart(2, "0");

  }


  /* ==========================================================
     27. START
     ========================================================== */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );

  } else {

    init();

  }

})();
