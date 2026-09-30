/* =========================================================
   FeelFrame™ — Coverflow
   coverflow.js
   Production 3D Coverflow Controller
   ========================================================= */

(() => {
  "use strict";

  const CORE = window.FeelFrameCore;

  if (!CORE) {
    console.error("[FeelFrame] coverflow.js requires core.js.");
    return;
  }

  const {
    $,
    $$,
    getPage,
    openStory,
    prefersReducedMotion
  } = CORE;

  /* =========================================================
     CONFIG
     ========================================================= */

  const CONFIG = Object.freeze({
    selectors: Object.freeze({
      section: [
        ".coverflow-section",
        "#featured",
        "[data-coverflow]"
      ],

      viewport: [
        "#coverflowViewport",
        ".coverflow-viewport",
        "[data-coverflow-viewport]"
      ],

      track: [
        "#coverflowTrack",
        ".coverflow-track",
        "[data-coverflow-track]"
      ],

      previous: [
        "#coverflowPrevious",
        ".coverflow-previous",
        "[data-coverflow-prev]"
      ],

      next: [
        "#coverflowNext",
        ".coverflow-next",
        "[data-coverflow-next]"
      ],

      dots: [
        "#coverflowDots",
        ".coverflow-dots",
        "[data-coverflow-dots]"
      ]
    }),

    classes: Object.freeze({
      card: "cover-card",
      center: "is-center",
      left: "is-left",
      right: "is-right",
      farLeft: "is-far-left",
      farRight: "is-far-right",
      active: "is-active",
      dragging: "is-dragging",
      disabled: "is-disabled"
    }),

    swipeThreshold: 48,
    dragThreshold: 8,
    clickSuppressionDistance: 10,
    transitionFallback: 520,
    pointerCapture: true
  });

  /* =========================================================
     STATE
     ========================================================= */

  const STATE = {
    initialized: false,
    stories: [],
    current: 0,

    viewport: null,
    track: null,
    previousButton: null,
    nextButton: null,
    dots: null,

    cards: [],
    dotButtons: [],

    dragging: false,
    pointerId: null,
    startX: 0,
    currentX: 0,
    moved: false,
    suppressClick: false,

    keyboardBound: false,
    resizeBound: false,
    reducedMotion: false
  };

  /* =========================================================
     HELPERS
     ========================================================= */

  const normalizeIndex = (index, length = STATE.stories.length) => {
    if (!length) return 0;

    return ((index % length) + length) % length;
  };

  const getElements = () => {
    STATE.viewport = $(
      CONFIG.selectors.viewport.join(",")
    );

    STATE.track = $(
      CONFIG.selectors.track.join(",")
    );

    STATE.previousButton = $(
      CONFIG.selectors.previous.join(",")
    );

    STATE.nextButton = $(
      CONFIG.selectors.next.join(",")
    );

    STATE.dots = $(
      CONFIG.selectors.dots.join(",")
    );

    return Boolean(STATE.viewport && STATE.track);
  };

  const getStories = () => {
    const data = window.FeelFrame?.state || window.FEELFRAME;

    if (!data || !Array.isArray(data.stories)) {
      return [];
    }

    return data.stories.filter(Boolean);
  };

  const getCardStoryId = card => {
    if (!card) return "";

    return (
      card.dataset.storyId ||
      card.dataset.id ||
      ""
    ).trim();
  };

  const getCardIndex = card => {
    if (!card) return -1;

    const index = Number(card.dataset.index);

    return Number.isInteger(index) ? index : -1;
  };

  const hasCards = () => (
    Array.isArray(STATE.cards) &&
    STATE.cards.length > 0
  );

  const getCardByIndex = index => {
    const normalized = normalizeIndex(index);

    return STATE.cards[normalized] || null;
  };

  const isInteractiveTarget = target => {
    if (!target || !(target instanceof Element)) {
      return false;
    }

    return Boolean(
      target.closest(
        "a, button, input, textarea, select, option, label"
      )
    );
  };

  /* =========================================================
     CARD POSITIONING
     ========================================================= */

  const getRelativePosition = (index, activeIndex, length) => {
    if (!length) return 0;

    let difference = index - activeIndex;

    const half = Math.floor(length / 2);

    if (difference > half) {
      difference -= length;
    }

    if (difference < -half) {
      difference += length;
    }

    return difference;
  };

  const getPositionClass = relativePosition => {
    if (relativePosition === 0) {
      return CONFIG.classes.center;
    }

    if (relativePosition === -1) {
      return CONFIG.classes.left;
    }

    if (relativePosition === 1) {
      return CONFIG.classes.right;
    }

    if (relativePosition < -1) {
      return CONFIG.classes.farLeft;
    }

    return CONFIG.classes.farRight;
  };

  const updateCardClasses = () => {
    if (!hasCards()) return;

    const length = STATE.cards.length;

    STATE.cards.forEach((card, index) => {
      const relativePosition = getRelativePosition(
        index,
        STATE.current,
        length
      );

      card.classList.remove(
        CONFIG.classes.center,
        CONFIG.classes.left,
        CONFIG.classes.right,
        CONFIG.classes.farLeft,
        CONFIG.classes.farRight,
        CONFIG.classes.active
      );

      card.classList.add(
        getPositionClass(relativePosition)
      );

      if (relativePosition === 0) {
        card.classList.add(CONFIG.classes.active);
        card.setAttribute("aria-current", "true");
        card.removeAttribute("aria-hidden");
      } else {
        card.removeAttribute("aria-current");
        card.setAttribute("aria-hidden", "true");
      }

      card.dataset.position = String(relativePosition);
    });
  };

  /* =========================================================
     ACTIVE CARD
     ========================================================= */

  const setActive = (
    index,
    {
      announce = true,
      focus = false
    } = {}
  ) => {
    if (!hasCards()) return;

    STATE.current = normalizeIndex(index);

    updateCardClasses();
    updateDots();
    updateControls();

    if (announce) {
      announceActiveCard();
    }

    if (focus) {
      const card = getCardByIndex(STATE.current);

      if (card && typeof card.focus === "function") {
        card.focus({ preventScroll: true });
      }
    }

    dispatchChangeEvent();
  };

  const goTo = (index, options = {}) => {
    if (!hasCards()) return;

    setActive(index, options);
  };

  const next = () => {
    if (!hasCards()) return;

    goTo(STATE.current + 1);
  };

  const previous = () => {
    if (!hasCards()) return;

    goTo(STATE.current - 1);
  };

  /* =========================================================
     CONTROLS
     ========================================================= */

  const updateControls = () => {
    const disabled = STATE.cards.length <= 1;

    if (STATE.previousButton) {
      STATE.previousButton.disabled = disabled;
      STATE.previousButton.classList.toggle(
        CONFIG.classes.disabled,
        disabled
      );
      STATE.previousButton.setAttribute(
        "aria-disabled",
        String(disabled)
      );
    }

    if (STATE.nextButton) {
      STATE.nextButton.disabled = disabled;
      STATE.nextButton.classList.toggle(
        CONFIG.classes.disabled,
        disabled
      );
      STATE.nextButton.setAttribute(
        "aria-disabled",
        String(disabled)
      );
    }
  };

  const setupControls = () => {
    if (STATE.previousButton) {
      STATE.previousButton.addEventListener(
        "click",
        event => {
          event.preventDefault();
          previous();
        }
      );
    }

    if (STATE.nextButton) {
      STATE.nextButton.addEventListener(
        "click",
        event => {
          event.preventDefault();
          next();
        }
      );
    }
  };

  /* =========================================================
     DOTS
     ========================================================= */

  const createDots = () => {
    if (!STATE.dots || !hasCards()) return;

    STATE.dots.innerHTML = "";
    STATE.dotButtons = [];

    STATE.cards.forEach((card, index) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "coverflow-dot";

      button.dataset.index = String(index);

      button.setAttribute(
        "aria-label",
        `Go to featured story ${index + 1}`
      );

      button.setAttribute(
        "aria-controls",
        STATE.track?.id || "coverflowTrack"
      );

      button.addEventListener("click", () => {
        goTo(index);
      });

      STATE.dots.appendChild(button);
      STATE.dotButtons.push(button);
    });
  };

  const updateDots = () => {
    if (!STATE.dotButtons.length) return;

    STATE.dotButtons.forEach((dot, index) => {
      const active = index === STATE.current;

      dot.classList.toggle(
        CONFIG.classes.active,
        active
      );

      dot.setAttribute(
        "aria-current",
        active ? "true" : "false"
      );
    });
  };

  /* =========================================================
     ACTIVE STORY ANNOUNCEMENT
     ========================================================= */

  const getActiveStory = () => {
    return STATE.stories[STATE.current] || null;
  };

  const announceActiveCard = () => {
    const story = getActiveStory();

    if (!story || !STATE.viewport) return;

    const title =
      story.title ||
      story.campaign ||
      "Featured story";

    STATE.viewport.setAttribute(
      "aria-label",
      `Featured story: ${title}`
    );
  };

  /* =========================================================
     CARD NAVIGATION
     ========================================================= */

  const handleCardClick = event => {
    if (STATE.suppressClick) {
      event.preventDefault();
      event.stopPropagation();
      STATE.suppressClick = false;
      return;
    }

    const card = event.currentTarget;

    if (!card) return;

    const index = getCardIndex(card);

    if (index < 0) return;

    if (index !== STATE.current) {
      event.preventDefault();

      goTo(index);

      return;
    }

    const storyId = getCardStoryId(card);

    if (storyId && typeof openStory === "function") {
      event.preventDefault();
      openStory(storyId);
    }
  };

  const handleCardKeydown = event => {
    const card = event.currentTarget;

    if (!card) return;

    const index = getCardIndex(card);

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      if (index !== STATE.current) {
        goTo(index, {
          focus: true
        });

        return;
      }

      const storyId = getCardStoryId(card);

      if (storyId && typeof openStory === "function") {
        openStory(storyId);
      }
    }
  };

  const setupCards = () => {
    STATE.cards = $$(
      `.${CONFIG.classes.card}`,
      STATE.track
    );

    STATE.cards.forEach((card, index) => {
      card.dataset.index = String(index);

      if (!card.dataset.storyId) {
        const story = STATE.stories[index];

        if (story?.id) {
          card.dataset.storyId = story.id;
        }
      }

      if (!card.hasAttribute("tabindex")) {
        card.setAttribute("tabindex", "0");
      }

      card.addEventListener(
        "click",
        handleCardClick
      );

      card.addEventListener(
        "keydown",
        handleCardKeydown
      );
    });
  };

  /* =========================================================
     POINTER / DRAG
     ========================================================= */

  const startDrag = event => {
    if (!hasCards()) return;

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    if (
      isInteractiveTarget(event.target) &&
      event.pointerType !== "touch"
    ) {
      return;
    }

    STATE.dragging = true;
    STATE.pointerId = event.pointerId;
    STATE.startX = event.clientX;
    STATE.currentX = event.clientX;
    STATE.moved = false;
    STATE.suppressClick = false;

    STATE.viewport.classList.add(
      CONFIG.classes.dragging
    );

    if (
      CONFIG.pointerCapture &&
      STATE.viewport.setPointerCapture
    ) {
      try {
        STATE.viewport.setPointerCapture(
          event.pointerId
        );
      } catch {
        /* Pointer capture can fail harmlessly. */
      }
    }
  };

  const moveDrag = event => {
    if (!STATE.dragging) return;

    if (
      STATE.pointerId !== null &&
      event.pointerId !== STATE.pointerId
    ) {
      return;
    }

    STATE.currentX = event.clientX;

    const distance =
      STATE.currentX - STATE.startX;

    if (
      Math.abs(distance) >=
      CONFIG.dragThreshold
    ) {
      STATE.moved = true;
    }

    if (STATE.moved) {
      event.preventDefault();
    }
  };

  const finishDrag = event => {
    if (!STATE.dragging) return;

    if (
      STATE.pointerId !== null &&
      event.pointerId !== STATE.pointerId
    ) {
      return;
    }

    const distance =
      STATE.currentX - STATE.startX;

    STATE.dragging = false;

    STATE.viewport.classList.remove(
      CONFIG.classes.dragging
    );

    if (
      CONFIG.pointerCapture &&
      STATE.viewport.releasePointerCapture
    ) {
      try {
        if (
          STATE.viewport.hasPointerCapture?.(
            event.pointerId
          )
        ) {
          STATE.viewport.releasePointerCapture(
            event.pointerId
          );
        }
      } catch {
        /* Pointer capture cleanup is best effort. */
      }
    }

    STATE.pointerId = null;

    if (
      STATE.moved &&
      Math.abs(distance) >=
      CONFIG.swipeThreshold
    ) {
      STATE.suppressClick = true;

      if (distance < 0) {
        next();
      } else {
        previous();
      }
    } else if (STATE.moved) {
      STATE.suppressClick = true;
    }

    STATE.startX = 0;
    STATE.currentX = 0;
    STATE.moved = false;
  };

  const cancelDrag = event => {
    if (!STATE.dragging) return;

    STATE.dragging = false;
    STATE.pointerId = null;
    STATE.startX = 0;
    STATE.currentX = 0;
    STATE.moved = false;

    STATE.viewport.classList.remove(
      CONFIG.classes.dragging
    );

    if (
      event?.pointerId != null &&
      STATE.viewport.releasePointerCapture
    ) {
      try {
        if (
          STATE.viewport.hasPointerCapture?.(
            event.pointerId
          )
        ) {
          STATE.viewport.releasePointerCapture(
            event.pointerId
          );
        }
      } catch {
        /* Ignore pointer cleanup errors. */
      }
    }
  };

  const setupPointerControls = () => {
    if (!STATE.viewport) return;

    STATE.viewport.addEventListener(
      "pointerdown",
      startDrag,
      { passive: true }
    );

    STATE.viewport.addEventListener(
      "pointermove",
      moveDrag,
      { passive: false }
    );

    STATE.viewport.addEventListener(
      "pointerup",
      finishDrag
    );

    STATE.viewport.addEventListener(
      "pointercancel",
      cancelDrag
    );

    STATE.viewport.addEventListener(
      "lostpointercapture",
      () => {
        if (STATE.dragging) {
          cancelDrag();
        }
      }
    );
  };

  /* =========================================================
     TOUCH / SWIPE
     ========================================================= */

  /*
   * Pointer Events handle both touch and mouse input.
   * These listeners provide an additional lightweight
   * fallback for browsers/environments where pointer
   * events are unavailable.
   */

  const setupTouchFallback = () => {
    if (!STATE.viewport) return;

    if ("PointerEvent" in window) {
      return;
    }

    let startX = 0;
    let currentX = 0;
    let touching = false;

    STATE.viewport.addEventListener(
      "touchstart",
      event => {
        if (!event.touches.length) return;

        touching = true;
        startX = event.touches[0].clientX;
        currentX = startX;
      },
      { passive: true }
    );

    STATE.viewport.addEventListener(
      "touchmove",
      event => {
        if (!touching || !event.touches.length) {
          return;
        }

        currentX = event.touches[0].clientX;
      },
      { passive: true }
    );

    STATE.viewport.addEventListener(
      "touchend",
      () => {
        if (!touching) return;

        const distance =
          currentX - startX;

        touching = false;

        if (
          Math.abs(distance) <
          CONFIG.swipeThreshold
        ) {
          return;
        }

        STATE.suppressClick = true;

        if (distance < 0) {
          next();
        } else {
          previous();
        }
      },
      { passive: true }
    );

    STATE.viewport.addEventListener(
      "touchcancel",
      () => {
        touching = false;
        startX = 0;
        currentX = 0;
      },
      { passive: true }
    );
  };

  /* =========================================================
     KEYBOARD
     ========================================================= */

  const handleKeyboard = event => {
    if (!STATE.initialized || !hasCards()) {
      return;
    }

    const target = event.target;

    if (
      target &&
      target instanceof Element &&
      target.matches(
        "input, textarea, select, button, [contenteditable='true']"
      )
    ) {
      return;
    }

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        previous();
        break;

      case "ArrowRight":
        event.preventDefault();
        next();
        break;

      case "Home":
        event.preventDefault();
        goTo(0);
        break;

      case "End":
        event.preventDefault();
        goTo(STATE.stories.length - 1);
        break;

      default:
        break;
    }
  };

  const setupKeyboard = () => {
    if (STATE.keyboardBound) return;

    document.addEventListener(
      "keydown",
      handleKeyboard
    );

    STATE.keyboardBound = true;
  };

  /* =========================================================
     REDUCED MOTION
     ========================================================= */

  const getReducedMotionPreference = () => {
    if (typeof prefersReducedMotion === "function") {
      return Boolean(prefersReducedMotion());
    }

    return Boolean(
      window.matchMedia?.(
        "(prefers-reduced-motion: reduce)"
      ).matches
    );
  };

  const applyReducedMotion = () => {
    STATE.reducedMotion =
      getReducedMotionPreference();

    if (!STATE.viewport) return;

    STATE.viewport.dataset.reducedMotion =
      STATE.reducedMotion
        ? "true"
        : "false";
  };

  const setupReducedMotionListener = () => {
    if (!window.matchMedia) return;

    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const update = event => {
      STATE.reducedMotion = Boolean(
        event.matches
      );

      applyReducedMotion();
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener(
        "change",
        update
      );
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(update);
    }
  };

  /* =========================================================
     RESIZE
     ========================================================= */

  const handleResize = () => {
    if (!STATE.viewport) return;

    /*
     * The actual geometry remains CSS-driven.
     * Re-applying state ensures the active card and
     * position classes remain authoritative after a
     * responsive breakpoint change.
     */
    updateCardClasses();
  };

  const setupResize = () => {
    if (STATE.resizeBound) return;

    let frame = null;

    window.addEventListener(
      "resize",
      () => {
        if (frame !== null) {
          cancelAnimationFrame(frame);
        }

        frame = requestAnimationFrame(() => {
          frame = null;
          handleResize();
        });
      },
      { passive: true }
    );

    STATE.resizeBound = true;
  };

  /* =========================================================
     EVENT DISPATCH
     ========================================================= */

  const dispatchChangeEvent = () => {
    const story = getActiveStory();

    document.dispatchEvent(
      new CustomEvent(
        "feelframe:coverflowchange",
        {
          detail: {
            index: STATE.current,
            story,
            card: getCardByIndex(
              STATE.current
            )
          }
        }
      )
    );
  };

  /* =========================================================
     INITIALIZATION
     ========================================================= */

  const initialize = () => {
    if (STATE.initialized) return;

    if (getPage() !== "home") {
      return;
    }

    if (!getElements()) {
      return;
    }

    STATE.stories = getStories();

    if (!STATE.stories.length) {
      return;
    }

    setupCards();

    if (!STATE.cards.length) {
      return;
    }

    STATE.current = normalizeIndex(
      STATE.current,
      STATE.cards.length
    );

    applyReducedMotion();

    updateCardClasses();

    createDots();
    updateDots();
    updateControls();

    setupControls();
    setupPointerControls();
    setupTouchFallback();
    setupKeyboard();
    setupResize();
    setupReducedMotionListener();

    announceActiveCard();

    STATE.initialized = true;

    STATE.viewport.dataset.initialized = "true";

    document.dispatchEvent(
      new CustomEvent(
        "feelframe:coverflowready",
        {
          detail: {
            stories: STATE.stories,
            cards: STATE.cards,
            current: STATE.current
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

    next,
    previous,
    goTo,

    getCurrentIndex: () =>
      STATE.current,

    getActiveStory,

    getStories: () =>
      [...STATE.stories],

    getCards: () =>
      [...STATE.cards],

    getState: () => ({
      initialized: STATE.initialized,
      current: STATE.current,
      dragging: STATE.dragging,
      reducedMotion: STATE.reducedMotion
    })
  });

  window.FeelFrame = window.FeelFrame || {};
  window.FeelFrame.coverflow = API;

  window.FeelFrameCoverflow = API;

  /* =========================================================
     BOOT
     ========================================================= */

  const boot = () => {
    initialize();
  };

  if (CORE.ready && typeof CORE.ready.then === "function") {
    CORE.ready.then(boot).catch(error => {
      console.error(
        "[FeelFrame] Coverflow initialization failed:",
        error
      );
    });
  } else if (
    document.readyState === "loading"
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
