/* =========================================================
   FeelFrame™ — Story / Product
   story.js
   Production Story Detail + Locked Prompt + Checkout
   ========================================================= */

(() => {
  "use strict";

  const CORE = window.FeelFrameCore;

  if (!CORE) {
    console.error(
      "[FeelFrame] story.js requires core.js."
    );
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
          Array.from(
            scope.querySelectorAll(selector)
          );

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

  const isValidCheckoutURL =
    typeof CORE.isValidCheckoutURL === "function"
      ? CORE.isValidCheckoutURL
      : value => {
          try {
            const url = new URL(
              value,
              document.baseURI
            );

            return (
              url.protocol === "https:" &&
              Boolean(url.hostname)
            );
          } catch {
            return false;
          }
        };

  /* =========================================================
     CONFIG
     ========================================================= */

  const CONFIG = Object.freeze({
    selectors: Object.freeze({
      page: [
        ".story-page",
        "[data-story-page]"
      ],

      story: [
        "[data-story]",
        ".story-content"
      ],

      title: [
        "#storyTitle",
        ".story-title",
        "[data-story-title]"
      ],

      quote: [
        "#storyQuote",
        ".story-quote",
        "[data-story-quote]"
      ],

      image: [
        "#storyImage",
        ".story-hero-image",
        "[data-story-image]"
      ],

      imageFrame: [
        ".story-hero__image",
        ".story-image-frame",
        "[data-story-image-frame]"
      ],

      campaign: [
        "#storyCampaign",
        ".story-campaign",
        "[data-story-campaign]"
      ],

      emotion: [
        "#storyEmotion",
        ".story-emotion",
        "[data-story-emotion]"
      ],

      moment: [
        "#storyMoment",
        ".story-moment",
        "[data-story-moment]"
      ],

      context: [
        "#storyContext",
        ".story-context",
        "[data-story-context]"
      ],

      description: [
        "#storyDescription",
        ".story-description",
        "[data-story-description]"
      ],

      style: [
        "#storyStyle",
        ".story-style",
        "[data-story-style]"
      ],

      visualLanguage: [
        "#storyVisualLanguage",
        ".story-visual-language",
        "[data-story-visual-language]"
      ],

      condition: [
        "#storyCondition",
        ".story-condition",
        "[data-story-condition]"
      ],

      recipe: [
        "#storyRecipe",
        ".story-recipe",
        "[data-story-recipe]"
      ],

      productInformation: [
        "#productInformation",
        ".product-information",
        "[data-product-information]"
      ],

      promptTitle: [
        "#promptTitle",
        ".prompt-title",
        "[data-prompt-title]"
      ],

      promptLock: [
        "#lockedPrompt",
        ".locked-prompt",
        "[data-locked-prompt]"
      ],

      price: [
        "#storyPrice",
        ".story-price",
        "[data-story-price]"
      ],

      compareAt: [
        "#storyCompareAt",
        ".story-compare-at",
        "[data-story-compare-at]"
      ],

      currency: [
        "#storyCurrency",
        ".story-currency",
        "[data-story-currency]"
      ],

      purchaseButton: [
        "#purchaseButton",
        "#storyPurchase",
        ".purchase-button",
        "[data-purchase]"
      ],

      checkoutButton: [
        "#checkoutButton",
        ".checkout-button",
        "[data-checkout]"
      ],

      related: [
        "#relatedStories",
        ".related-stories",
        "[data-related-stories]"
      ],

      relatedGrid: [
        "#relatedStoriesGrid",
        ".related-stories-grid",
        "[data-related-stories-grid]"
      ],

      emptyState: [
        "#storyEmpty",
        ".story-empty",
        "[data-story-empty]"
      ],

      errorState: [
        "#storyError",
        ".story-error",
        "[data-story-error]"
      ]
    }),

    queryKeys: Object.freeze([
      "id",
      "story",
      "storyId"
    ]),

    defaultCurrency: "NGN",

    checkoutTarget:
      "_blank"
  });

  /* =========================================================
     STATE
     ========================================================= */

  const STATE = {
    initialized: false,
    rendered: false,

    storyId: "",
    story: null,

    currency: CONFIG.defaultCurrency,

    pricing: {
      price: null,
      compareAt: null
    },

    checkoutURL: "",

    checkoutAvailable: false
  };

  /* =========================================================
     ELEMENT HELPERS
     ========================================================= */

  const first = selectors => {
    if (!Array.isArray(selectors)) {
      return $(selectors);
    }

    for (const selector of selectors) {
      const element = $(selector);

      if (element) {
        return element;
      }
    }

    return null;
  };

  const all = selectors => {
    if (!Array.isArray(selectors)) {
      return $$(selectors);
    }

    const elements = [];

    selectors.forEach(selector => {
      $$(selector).forEach(element => {
        if (!elements.includes(element)) {
          elements.push(element);
        }
      });
    });

    return elements;
  };

  const setText = (
    selectors,
    value,
    {
      hideWhenEmpty = true
    } = {}
  ) => {
    const element = first(selectors);

    if (!element) return;

    const text =
      value == null
        ? ""
        : String(value);

    element.textContent = text;

    if (hideWhenEmpty) {
      element.hidden = !text;
    }
  };

  const setHTML = (
    selectors,
    html,
    {
      hideWhenEmpty = true
    } = {}
  ) => {
    const element = first(selectors);

    if (!element) return;

    const content =
      html == null
        ? ""
        : String(html);

    element.innerHTML = content;

    if (hideWhenEmpty) {
      element.hidden = !content;
    }
  };

  const getGlobalState = () => {
    return (
      window.FeelFrame?.state ||
      window.FEELFRAME ||
      null
    );
  };

  /* =========================================================
     STORY ID
     ========================================================= */

  const getStoryId = () => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    for (
      const key of CONFIG.queryKeys
    ) {
      const value =
        params.get(key);

      if (
        value &&
        value.trim()
      ) {
        return value.trim();
      }
    }

    const page =
      first(
        CONFIG.selectors.page
      );

    if (page?.dataset.storyId) {
      return page.dataset.storyId.trim();
    }

    const story =
      first(
        CONFIG.selectors.story
      );

    if (story?.dataset.storyId) {
      return story.dataset.storyId.trim();
    }

    return "";
  };

  const findStory = id => {
    if (!id) return null;

    const state =
      getGlobalState();

    const stories =
      Array.isArray(
        state?.stories
      )
        ? state.stories
        : [];

    return (
      stories.find(
        story =>
          String(
            story?.id ?? ""
          ) === String(id)
      ) || null
    );
  };

  const resolveStory = () => {
    STATE.storyId =
      getStoryId();

    STATE.story =
      findStory(
        STATE.storyId
      );

    return STATE.story;
  };

  /* =========================================================
     DATA ACCESS
     ========================================================= */

  const value = (
    ...keys
  ) => {
    const story =
      STATE.story;

    for (const key of keys) {
      const result =
        story?.[key];

      if (
        result !== undefined &&
        result !== null &&
        String(result).trim() !== ""
      ) {
        return result;
      }
    }

    return "";
  };

  const getSite = () => {
    const state =
      getGlobalState();

    return (
      state?.site || {}
    );
  };

  /* =========================================================
     PRODUCT INFORMATION
     ========================================================= */

  const getProductName = () => {
    return (
      value(
        "promptTitle",
        "title"
      ) ||
      "FeelFrame™ Visual Story"
    );
  };

  const getProductDescription = () => {
    return (
      value(
        "description",
        "context"
      ) || ""
    );
  };

  const getProductCondition = () => {
    return value(
      "condition"
    );
  };

  const getProductStyle = () => {
    return value(
      "style"
    );
  };

  const getProductVisualLanguage = () => {
    return value(
      "visualLanguage"
    );
  };

  const getProductRecipe = () => {
    return value(
      "recipe"
    );
  };

  const renderProductInformation = () => {
    setText(
      CONFIG.selectors.description,
      getProductDescription()
    );

    setText(
      CONFIG.selectors.condition,
      getProductCondition()
    );

    setText(
      CONFIG.selectors.style,
      getProductStyle()
    );

    setText(
      CONFIG.selectors.visualLanguage,
      getProductVisualLanguage()
    );

    setText(
      CONFIG.selectors.recipe,
      getProductRecipe()
    );

    const information =
      first(
        CONFIG.selectors.productInformation
      );

    if (information) {
      information.classList.add(
        "is-ready"
      );
    }
  };

  /* =========================================================
     STORY RENDERING
     ========================================================= */

  const renderStoryHeader = () => {
    setText(
      CONFIG.selectors.title,
      value("title")
    );

    setText(
      CONFIG.selectors.quote,
      value("quote")
    );

    setText(
      CONFIG.selectors.campaign,
      value("campaign")
    );

    setText(
      CONFIG.selectors.emotion,
      value("emotion")
    );

    setText(
      CONFIG.selectors.moment,
      value("moment")
    );

    setText(
      CONFIG.selectors.context,
      value("context")
    );
  };

  const renderStoryImage = () => {
    const image =
      value(
        "image",
        "coverImage",
        "thumbnail"
      );

    const imageElement =
      first(
        CONFIG.selectors.image
      );

    if (!imageElement) {
      return;
    }

    if (!image) {
      imageElement.hidden = true;

      const frame =
        first(
          CONFIG.selectors.imageFrame
        );

      if (frame) {
        frame.classList.add(
          "is-empty"
        );
      }

      return;
    }

    imageElement.src =
      image;

    imageElement.alt =
      value("title") ||
      "FeelFrame visual story";

    imageElement.hidden =
      false;

    imageElement.loading =
      "eager";

    imageElement.decoding =
      "async";

    imageElement.addEventListener(
      "error",
      () => {
        imageElement.classList.add(
          "image-error"
        );

        const frame =
          first(
            CONFIG.selectors.imageFrame
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
  };

  const renderStory = () => {
    renderStoryHeader();

    renderStoryImage();

    renderProductInformation();

    renderPricing();

    renderLockedPrompt();

    renderCheckout();

    renderRelatedStories();

    const page =
      first(
        CONFIG.selectors.page
      );

    if (page) {
      page.dataset.storyId =
        STATE.storyId;

      page.classList.add(
        "is-ready"
      );
    }

    STATE.rendered =
      true;

    document.documentElement.dataset.storyReady =
      "true";

    document.dispatchEvent(
      new CustomEvent(
        "feelframe:story-rendered",
        {
          detail: {
            story:
              STATE.story,
            storyId:
              STATE.storyId
          }
        }
      )
    );
  };

  /* =========================================================
     PRICING
     ========================================================= */

  const toNumber = value => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const number =
      Number(
        String(value)
          .replace(
            /[^\d.-]/g,
            ""
          )
      );

    return Number.isFinite(number)
      ? number
      : null;
  };

  const getPrice = () => {
    return toNumber(
      value(
        "price"
      )
    );
  };

  const getCompareAt = () => {
    return toNumber(
      value(
        "compareAt",
        "compare_at",
        "oldPrice"
      )
    );
  };

  const formatPrice = amount => {
    if (
      amount === null ||
      amount === undefined
    ) {
      return "";
    }

    const currency =
      STATE.currency ||
      CONFIG.defaultCurrency;

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
  };

  const renderPricing = () => {
    const site =
      getSite();

    STATE.currency =
      site.currency ||
      CONFIG.defaultCurrency;

    STATE.pricing.price =
      getPrice();

    STATE.pricing.compareAt =
      getCompareAt();

    const current =
      formatPrice(
        STATE.pricing.price
      );

    const compareAt =
      formatPrice(
        STATE.pricing.compareAt
      );

    setText(
      CONFIG.selectors.price,
      current
    );

    setText(
      CONFIG.selectors.compareAt,
      compareAt
    );

    setText(
      CONFIG.selectors.currency,
      STATE.currency
    );

    const compareElement =
      first(
        CONFIG.selectors.compareAt
      );

    if (compareElement) {
      const hasCompare =
        STATE.pricing.compareAt !== null &&
        (
          STATE.pricing.price === null ||
          STATE.pricing.compareAt >
            STATE.pricing.price
        );

      compareElement.hidden =
        !hasCompare;
    }

    const priceElement =
      first(
        CONFIG.selectors.price
      );

    if (priceElement) {
      priceElement.classList.toggle(
        "has-discount",
        STATE.pricing.compareAt !== null &&
          STATE.pricing.price !== null &&
          STATE.pricing.compareAt >
            STATE.pricing.price
      );
    }

    document.dispatchEvent(
      new CustomEvent(
        "feelframe:pricing-rendered",
        {
          detail: {
            price:
              STATE.pricing.price,
            compareAt:
              STATE.pricing.compareAt,
            currency:
              STATE.currency
          }
        }
      )
    );
  };

  /* =========================================================
     LOCKED PROMPT
     ========================================================= */

  const renderLockedPrompt = () => {
    const promptTitle =
      value(
        "promptTitle",
        "title"
      );

    setText(
      CONFIG.selectors.promptTitle,
      promptTitle
    );

    const locked =
      first(
        CONFIG.selectors.promptLock
      );

    if (!locked) {
      return;
    }

    locked.classList.add(
      "is-locked"
    );

    locked.setAttribute(
      "aria-label",
      "Prompt locked. Purchase to access."
    );

    locked.setAttribute(
      "aria-disabled",
      "true"
    );

    /*
     * Deliberately do not render:
     * - story.recipe
     * - story.commands
     * - complete prompt text
     * - methodology
     *
     * Those remain protected product content.
     */
    const recipe =
      first(
        CONFIG.selectors.recipe
      );

    if (recipe) {
      recipe.hidden = true;
    }

    const commands =
      document.querySelector(
        "#storyCommands, " +
        ".story-commands, " +
        "[data-story-commands]"
      );

    if (commands) {
      commands.hidden = true;
    }
  };

  /* =========================================================
     SELAR CHECKOUT
     * ========================================================= */

  const getCheckoutURL = () => {
    return String(
      value(
        "selarUrl",
        "checkoutUrl",
        "checkoutURL"
      ) || ""
    ).trim();
  };

  const setupCheckoutButton = button => {
    if (!button) {
      return;
    }

    button.addEventListener(
      "click",
      event => {
        event.preventDefault();

        if (
          !STATE.checkoutAvailable ||
          !STATE.checkoutURL
        ) {
          showCheckoutError();
          return;
        }

        window.open(
          STATE.checkoutURL,
          CONFIG.checkoutTarget,
          "noopener,noreferrer"
        );
      }
    );
  };

  const renderCheckout = () => {
    STATE.checkoutURL =
      getCheckoutURL();

    STATE.checkoutAvailable =
      isValidCheckoutURL(
        STATE.checkoutURL
      );

    const buttons =
      all([
        ...CONFIG.selectors.purchaseButton,
        ...CONFIG.selectors.checkoutButton
      ]);

    buttons.forEach(
      setupCheckoutButton
    );

    buttons.forEach(
      button => {
        button.classList.toggle(
          "is-disabled",
          !STATE.checkoutAvailable
        );

        button.setAttribute(
          "aria-disabled",
          String(
            !STATE.checkoutAvailable
          )
        );

        if (
          STATE.checkoutAvailable
        ) {
          button.removeAttribute(
            "disabled"
          );
        } else {
          button.setAttribute(
            "disabled",
            "true"
          );
        }
      }
    );

    const purchasePanel =
      document.querySelector(
        ".purchase-panel, " +
        "[data-purchase-panel]"
      );

    if (purchasePanel) {
      purchasePanel.classList.toggle(
        "is-unavailable",
        !STATE.checkoutAvailable
      );
    }
  };

  const showCheckoutError = () => {
    const message =
      "This product is temporarily unavailable for checkout.";

    if (
      typeof CORE.showGlobalError ===
      "function"
    ) {
      CORE.showGlobalError(
        message
      );
    } else {
      console.error(
        `[FeelFrame] ${message}`
      );
    }
  };

  /* =========================================================
     RELATED STORIES
     ========================================================= */

  const getRelatedStories = () => {
    const state =
      getGlobalState();

    const stories =
      Array.isArray(
        state?.stories
      )
        ? state.stories
        : [];

    if (!STATE.story) {
      return [];
    }

    const currentCampaign =
      String(
        STATE.story.campaign ||
        ""
      ).toLowerCase();

    const currentEmotion =
      String(
        STATE.story.emotion ||
        ""
      ).toLowerCase();

    return stories
      .filter(
        story =>
          story &&
          story.id !==
            STATE.story.id
      )
      .sort(
        (a, b) => {
          const scoreA =
            getRelatedScore(
              a,
              currentCampaign,
              currentEmotion
            );

          const scoreB =
            getRelatedScore(
              b,
              currentCampaign,
              currentEmotion
            );

          return scoreB - scoreA;
        }
      )
      .slice(0, 4);
  };

  const getRelatedScore = (
    story,
    campaign,
    emotion
  ) => {
    let score = 0;

    if (
      campaign &&
      String(
        story.campaign ||
        ""
      ).toLowerCase() ===
        campaign
    ) {
      score += 2;
    }

    if (
      emotion &&
      String(
        story.emotion ||
        ""
      ).toLowerCase() ===
        emotion
    ) {
      score += 1;
    }

    if (
      story.featured === true
    ) {
      score += 0.5;
    }

    return score;
  };

  const createRelatedCard = story => {
    const article =
      document.createElement(
        "article"
      );

    article.className =
      "story-card related-story-card";

    article.dataset.storyCard =
      "";

    article.dataset.storyId =
      story.id || "";

    const image =
      valueFromStory(
        story,
        "image",
        "coverImage",
        "thumbnail"
      );

    const title =
      valueFromStory(
        story,
        "title",
        "promptTitle"
      ) ||
      "Untitled story";

    const campaign =
      valueFromStory(
        story,
        "campaign",
        "moment"
      );

    const emotion =
      valueFromStory(
        story,
        "emotion"
      );

    article.innerHTML = `
      <button
        class="story-card-hit-area"
        type="button"
        aria-label="View ${escapeHTML(
          title
        )}"
      >
        <div class="story-card-media">
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
                  loading="lazy"
                  decoding="async"
                >
              `
              : `
                <div
                  class="story-card-image story-card-image--empty"
                  aria-hidden="true"
                ></div>
              `
          }
        </div>

        <div class="story-card-body">
          ${
            campaign
              ? `
                <span class="story-card-campaign">
                  ${escapeHTML(
                    campaign
                  )}
                </span>
              `
              : ""
          }

          <h3 class="story-card-title">
            ${escapeHTML(
              title
            )}
          </h3>

          ${
            emotion
              ? `
                <span class="story-card-emotion">
                  ${escapeHTML(
                    emotion
                  )}
                </span>
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
          if (!story.id) return;

          const url =
            new URL(
              "story.html",
              document.baseURI
            );

          url.searchParams.set(
            "id",
            story.id
          );

          window.location.assign(
            url.href
          );
        }
      );
    }

    return article;
  };

  const valueFromStory = (
    story,
    ...keys
  ) => {
    for (const key of keys) {
      const result =
        story?.[key];

      if (
        result !== undefined &&
        result !== null &&
        String(result).trim()
      ) {
        return result;
      }
    }

    return "";
  };

  const renderRelatedStories = () => {
    const grid =
      first(
        CONFIG.selectors.relatedGrid
      );

    const section =
      first(
        CONFIG.selectors.related
      );

    if (!grid) {
      return;
    }

    const related =
      getRelatedStories();

    grid.innerHTML = "";

    related.forEach(
      story => {
        grid.appendChild(
          createRelatedCard(
            story
          )
        );
      }
    );

    if (section) {
      section.hidden =
        related.length === 0;
    }
  };

  /* =========================================================
     EMPTY / ERROR STATES
     ========================================================= */

  const renderEmptyState = () => {
    const page =
      first(
        CONFIG.selectors.page
      );

    const empty =
      first(
        CONFIG.selectors.emptyState
      );

    if (empty) {
      empty.hidden = false;
    }

    if (page) {
      page.classList.add(
        "is-empty"
      );
    }
  };

  const renderErrorState = message => {
    const error =
      first(
        CONFIG.selectors.errorState
      );

    if (error) {
      error.hidden = false;

      const text =
        error.querySelector(
          "[data-error-message]"
        ) ||
        error.querySelector(
          ".error-state__message"
        );

      if (text) {
        text.textContent =
          message;
      }
    }

    const page =
      first(
        CONFIG.selectors.page
      );

    if (page) {
      page.classList.add(
        "has-error"
      );
    }
  };

  /* =========================================================
     DOCUMENT METADATA
     ========================================================= */

  const updateMetadata = () => {
    if (!STATE.story) {
      return;
    }

    const title =
      getProductName();

    const description =
      getProductDescription();

    document.title =
      `${title} — FeelFrame™`;

    const meta =
      document.querySelector(
        'meta[name="description"]'
      );

    if (meta && description) {
      meta.setAttribute(
        "content",
        description
      );
    }

    const canonical =
      document.querySelector(
        'link[rel="canonical"]'
      );

    if (canonical) {
      canonical.href =
        window.location.href;
    }

    const ogTitle =
      document.querySelector(
        'meta[property="og:title"]'
      );

    if (ogTitle) {
      ogTitle.setAttribute(
        "content",
        title
      );
    }

    const ogDescription =
      document.querySelector(
        'meta[property="og:description"]'
      );

    if (
      ogDescription &&
      description
    ) {
      ogDescription.setAttribute(
        "content",
        description
      );
    }

    const image =
      value(
        "image"
      );

    const ogImage =
      document.querySelector(
        'meta[property="og:image"]'
      );

    if (
      ogImage &&
      image
    ) {
      ogImage.setAttribute(
        "content",
        image
      );
    }
  };

  /* =========================================================
     INITIALIZATION
     ========================================================= */

  const isStoryPage = () => {
    return Boolean(
      first(
        CONFIG.selectors.page
      ) ||
      STATE.storyId
    );
  };

  const initialize = () => {
    if (STATE.initialized) {
      return;
    }

    if (!isStoryPage()) {
      return;
    }

    resolveStory();

    if (!STATE.storyId) {
      renderErrorState(
        "No story was specified."
      );

      STATE.initialized =
        true;

      return;
    }

    if (!STATE.story) {
      renderEmptyState();

      document.dispatchEvent(
        new CustomEvent(
          "feelframe:story-not-found",
          {
            detail: {
              storyId:
                STATE.storyId
            }
          }
        )
      );

      STATE.initialized =
        true;

      return;
    }

    renderStory();

    updateMetadata();

    STATE.initialized =
      true;

    document.dispatchEvent(
      new CustomEvent(
        "feelframe:story-ready",
        {
          detail: {
            story:
              STATE.story,
            storyId:
              STATE.storyId,
            pricing:
              STATE.pricing,
            checkoutAvailable:
              STATE.checkoutAvailable
          }
        }
      )
    );
  };

  /* =========================================================
     PUBLIC API
     ========================================================= */

  const API = Object.freeze({
    init:
      initialize,

    render:
      renderStory,

    getStoryId:
      () => STATE.storyId,

    getStory:
      () => STATE.story,

    getPrice:
      getPrice,

    getCompareAt:
      getCompareAt,

    formatPrice,

    getCheckoutURL:
      getCheckoutURL,

    isCheckoutAvailable:
      () =>
        STATE.checkoutAvailable,

    renderPricing,

    renderLockedPrompt,

    renderProductInformation,

    renderRelatedStories,

    getState: () => ({
      initialized:
        STATE.initialized,

      rendered:
        STATE.rendered,

      storyId:
        STATE.storyId,

      story:
        STATE.story,

      pricing:
        {
          ...STATE.pricing
        },

      currency:
        STATE.currency,

      checkoutURL:
        STATE.checkoutURL,

      checkoutAvailable:
        STATE.checkoutAvailable
    })
  });

  window.FeelFrame =
    window.FeelFrame || {};

  window.FeelFrame.story =
    API;

  window.FeelFrameStory =
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
          "[FeelFrame] Story initialization failed:",
          error
        );

        renderErrorState(
          "The story could not be loaded."
        );
      });
  } else if (
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
