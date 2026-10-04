/* =========================================================
   FEELFRAME™
   STORY EXPERIENCE JAVASCRIPT
   ========================================================= */

(() => {
  "use strict";

  /* =======================================================
     01. CONFIG
     ======================================================= */

  const CONFIG = {
    dataUrl: "data.json",

    homeUrl: "index.html",
    exploreUrl: "explore.html",
    createUrl: "create.html",

    relatedStoriesLimit: 3,

    selectors: {
      content: "#storyContent",
      footerYear: "#footer-year"
    }
  };


  /* =======================================================
     02. STATE
     ======================================================= */

  const state = {
    data: null,
    stories: [],
    story: null,
    storyId: null
  };


  /* =======================================================
     03. DOM
     ======================================================= */

  const content = document.querySelector(CONFIG.selectors.content);
  const footerYear = document.querySelector(CONFIG.selectors.footerYear);


  /* =======================================================
     04. INITIALIZATION
     ======================================================= */

  document.addEventListener("DOMContentLoaded", init);


  async function init() {
    setFooterYear();

    state.storyId = getStoryId();

    if (!state.storyId) {
      renderError(
        "A story is waiting.",
        "Choose a visual story from FeelFrame™ to begin."
      );
      return;
    }

    try {
      const data = await loadData();

      state.data = data;
      state.stories = normalizeStories(data);

      state.story = state.stories.find(
        story => String(story.id) === String(state.storyId)
      );

      if (!state.story) {
        renderError(
          "Story not found.",
          "This story may have moved or no longer exists."
        );
        return;
      }

      updatePageMeta(state.story);

      renderStory(state.story);

      setupStoryInteractions();

    } catch (error) {
      console.error("FeelFrame story error:", error);

      renderError(
        "Something went wrong.",
        "We couldn't load this visual story right now. Please try again."
      );
    }
  }


  /* =======================================================
     05. GET STORY ID
     ======================================================= */

  function getStoryId() {
    const params = new URLSearchParams(window.location.search);

    return (
      params.get("id") ||
      params.get("story") ||
      params.get("storyId")
    );
  }


  /* =======================================================
     06. LOAD DATA
     ======================================================= */

  async function loadData() {
    const response = await fetch(CONFIG.dataUrl, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(
        `Unable to load data.json (${response.status})`
      );
    }

    return await response.json();
  }


  /* =======================================================
     07. NORMALIZE STORIES
     ======================================================= */

  function normalizeStories(data) {
    const rawStories = Array.isArray(data)
      ? data
      : Array.isArray(data?.stories)
        ? data.stories
        : [];

    return rawStories
      .map((raw, index) => normalizeStory(raw, index))
      .filter(Boolean);
  }


  function normalizeStory(raw, index) {
    if (!raw || typeof raw !== "object") {
      return null;
    }

    const id =
      raw.id ||
      raw.slug ||
      raw.storyId ||
      `story-${index + 1}`;

    const title =
      raw.title ||
      raw.name ||
      raw.headline ||
      "Untitled Story";

    const category =
      raw.category ||
      raw.campaign ||
      raw.type ||
      raw.collection ||
      "Visual Story";

    const emotion =
      raw.emotion ||
      raw.feeling ||
      raw.mood ||
      "";

    const moment =
      raw.moment ||
      raw.context ||
      raw.description ||
      raw.excerpt ||
      "";

    const description =
      raw.description ||
      raw.context ||
      raw.moment ||
      raw.excerpt ||
      "";

    const quote =
      raw.quote ||
      raw.pullQuote ||
      raw.testimonial ||
      "";

    const image =
      raw.image ||
      raw.cover ||
      raw.coverImage ||
      raw.thumbnail ||
      raw.imageUrl ||
      raw.visual ||
      "";

    const link =
      raw.link ||
      raw.url ||
      raw.selarUrl ||
      raw.purchaseUrl ||
      raw.ctaLink ||
      "";

    const cta =
      raw.cta ||
      raw.ctaText ||
      raw.buttonText ||
      "Make this story yours";

    const subtitle =
      raw.subtitle ||
      raw.tagline ||
      raw.shortDescription ||
      "";

    return {
      ...raw,

      id,
      title,
      category,
      emotion,
      moment,
      description,
      quote,
      image,
      link,
      cta,
      subtitle,

      featured: Boolean(raw.featured)
    };
  }


  /* =======================================================
     08. PAGE META
     ======================================================= */

  function updatePageMeta(story) {
    const cleanTitle = stripHtml(story.title);

    document.title =
      `${cleanTitle} — FeelFrame™`;

    const description =
      story.description ||
      story.moment ||
      "A FeelFrame™ visual story — some feelings deserve to be seen.";

    setMeta(
      "description",
      cleanText(description).slice(0, 155)
    );

    setMeta(
      "og:title",
      `${cleanTitle} — FeelFrame™`,
      true
    );

    setMeta(
      "og:description",
      cleanText(description).slice(0, 155),
      true
    );

    if (story.image) {
      setMeta(
        "og:image",
        story.image,
        true
      );
    }
  }


  function setMeta(name, contentValue, property = false) {
    const attribute = property ? "property" : "name";

    let element = document.querySelector(
      `meta[${attribute}="${name}"]`
    );

    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(attribute, name);
      document.head.appendChild(element);
    }

    element.setAttribute(
      "content",
      contentValue || ""
    );
  }


  /* =======================================================
     09. RENDER STORY
     ======================================================= */

  function renderStory(story) {
    if (!content) {
      return;
    }

    const relatedStories = getRelatedStories(story);

    content.innerHTML = `
      ${renderHero(story)}

      ${renderMoment(story)}

      ${story.quote ? renderQuote(story) : ""}

      ${story.image ? renderLargeImage(story) : ""}

      ${renderNarrative(story)}

      ${renderPurchase(story)}

      ${relatedStories.length
        ? renderRelatedStories(relatedStories)
        : ""}
    `;
  }


  /* =======================================================
     10. HERO
     ======================================================= */

  function renderHero(story) {
    const image = story.image
      ? `
        <div class="story-visual-stage">

          <figure class="story-hero-image">
            <img
              src="${escapeAttribute(story.image)}"
              alt="${escapeAttribute(story.title)}"
              loading="eager"
              decoding="async"
            >

            <div
              class="story-image-overlay"
              aria-hidden="true"
            ></div>

            <span class="story-number">
              ${formatStoryNumber(story)}
            </span>
          </figure>

        </div>
      `
      : `
        <div class="story-visual-stage story-visual-stage-empty">
          <div class="story-visual story-visual-placeholder">
            <span>FeelFrame™</span>
          </div>
        </div>
      `;

    return `
      <section class="story-hero">

        <div class="story-hero-copy">

          <p class="story-eyebrow">
            ${escapeHtml(story.category)}
          </p>

          <h1 class="story-title">
            ${formatTitle(story.title)}
          </h1>

          ${
            story.subtitle
              ? `
                <p class="story-intro">
                  ${escapeHtml(story.subtitle)}
                </p>
              `
              : story.moment
                ? `
                  <p class="story-intro">
                    ${escapeHtml(story.moment)}
                  </p>
                `
                : ""
          }

          ${renderMeta(story)}

        </div>

        ${image}

      </section>
    `;
  }


  /* =======================================================
     11. META
     ======================================================= */

  function renderMeta(story) {
    const items = [];

    if (story.emotion) {
      items.push(story.emotion);
    }

    if (story.campaign && story.campaign !== story.category) {
      items.push(story.campaign);
    }

    if (!items.length) {
      return "";
    }

    return `
      <div class="story-meta">

        ${items
          .map(item => `
            <span class="story-meta-item">
              ${escapeHtml(item)}
            </span>
          `)
          .join("")}

      </div>
    `;
  }


  /* =======================================================
     12. MOMENT
     ======================================================= */

  function renderMoment(story) {
    const moment =
      story.moment ||
      story.description ||
      story.subtitle ||
      "";

    if (!moment) {
      return "";
    }

    return `
      <section class="story-moment">

        <p class="story-section-label">
          The Moment
        </p>

        <h2 class="story-moment-title">
          ${getMomentHeadline(story)}
        </h2>

        <p class="story-moment-copy">
          ${escapeHtml(moment)}
        </p>

      </section>
    `;
  }


  function getMomentHeadline(story) {
    if (story.momentHeadline) {
      return escapeHtml(story.momentHeadline);
    }

    if (story.emotion) {
      return `A moment that feels ${escapeHtml(
        story.emotion.toLowerCase()
      )}.`;
    }

    return "A moment worth seeing.";
  }


  /* =======================================================
     13. QUOTE
     ======================================================= */

  function renderQuote(story) {
    return `
      <section class="story-quote-section">

        <div
          class="story-quote-mark"
          aria-hidden="true"
        >
          “
        </div>

        <blockquote class="story-quote">
          ${escapeHtml(story.quote)}
        </blockquote>

        <p class="story-quote-author">
          FeelFrame™
        </p>

      </section>
    `;
  }


  /* =======================================================
     14. LARGE IMAGE
     ======================================================= */

  function renderLargeImage(story) {
    /*
      We deliberately use the same source again only when
      there isn't a dedicated secondary image.

      If your data.json later contains:
      story.galleryImage
      story.heroImage
      story.detailImage

      this function will automatically prefer it.
    */

    const secondaryImage =
      story.galleryImage ||
      story.detailImage ||
      story.heroImage ||
      story.image;

    if (!secondaryImage) {
      return "";
    }

    return `
      <section class="story-image-section">

        <figure class="story-image-frame">

          <img
            src="${escapeAttribute(secondaryImage)}"
            alt="${escapeAttribute(story.title)}"
            loading="lazy"
            decoding="async"
          >

        </figure>

        <div class="story-image-caption">

          <span>
            ${escapeHtml(story.category)}
          </span>

          <span>
            FeelFrame™ visual story
          </span>

        </div>

      </section>
    `;
  }


  /* =======================================================
     15. NARRATIVE
     ======================================================= */

  function renderNarrative(story) {
    const narrative =
      story.story ||
      story.storyText ||
      story.narrative ||
      story.description ||
      story.context ||
      "";

    if (!narrative) {
      return "";
    }

    const paragraphs = splitNarrative(narrative);

    return `
      <section class="story-narrative">

        <h2>
          Why this story matters
        </h2>

        ${paragraphs
          .map(paragraph => `
            <p>
              ${escapeHtml(paragraph)}
            </p>
          `)
          .join("")}

      </section>
    `;
  }


  function splitNarrative(text) {
    if (Array.isArray(text)) {
      return text
        .map(item => String(item).trim())
        .filter(Boolean);
    }

    return String(text)
      .split(/\n\s*\n|\r\n\s*\r\n/)
      .map(paragraph => paragraph.trim())
      .filter(Boolean);
  }


  /* =======================================================
     16. PURCHASE CTA
     ======================================================= */

  function renderPurchase(story) {
    const purchaseLink =
      story.link ||
      story.url ||
      story.selarUrl ||
      "";

    const hasPurchaseLink = Boolean(
      purchaseLink &&
      isSafeHttpUrl(purchaseLink)
    );

    return `
      <section class="story-purchase">

        <div class="story-purchase-inner">

          <div>

            <p class="story-purchase-label">
              Make it yours
            </p>

            <h2 class="story-purchase-title">
              This story can become yours.
            </h2>

            <p class="story-purchase-copy">
              Take this visual idea and turn it into
              your own FeelFrame™ experience.
            </p>

          </div>

          ${
            hasPurchaseLink
              ? `
                <a
                  class="story-purchase-button"
                  href="${escapeAttribute(purchaseLink)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-story-purchase
                >
                  <span>
                    ${escapeHtml(story.cta)}
                  </span>

                  <span aria-hidden="true">
                    ↗
                  </span>
                </a>
              `
              : `
                <a
                  class="story-purchase-button"
                  href="${CONFIG.createUrl}"
                >
                  <span>
                    Create your story
                  </span>

                  <span aria-hidden="true">
                    ↗
                  </span>
                </a>
              `
          }

        </div>

      </section>
    `;
  }


  /* =======================================================
     17. RELATED STORIES
     ======================================================= */

  function getRelatedStories(currentStory) {
    const others = state.stories.filter(
      story =>
        String(story.id) !== String(currentStory.id)
    );

    /*
      First preference:
      same category / campaign.

      Second preference:
      featured stories.

      Third preference:
      remaining stories.
    */

    const sameCategory = others.filter(story => {
      return (
        story.category &&
        currentStory.category &&
        story.category.toLowerCase() ===
          currentStory.category.toLowerCase()
      );
    });

    const featured = others.filter(
      story =>
        story.featured &&
        !sameCategory.includes(story)
    );

    const remaining = others.filter(
      story =>
        !sameCategory.includes(story) &&
        !featured.includes(story)
    );

    return [
      ...sameCategory,
      ...featured,
      ...remaining
    ].slice(
      0,
      CONFIG.relatedStoriesLimit
    );
  }


  function renderRelatedStories(stories) {
    return `
      <section class="story-related">

        <div class="story-related-header">

          <h2 class="story-related-heading">
            More stories
          </h2>

          <a
            href="${CONFIG.exploreUrl}"
            class="story-related-link"
          >
            Explore all
            <span aria-hidden="true">→</span>
          </a>

        </div>

        <div class="story-related-grid">

          ${stories
            .map(story => renderRelatedCard(story))
            .join("")}

        </div>

      </section>
    `;
  }


  function renderRelatedCard(story) {
    const image = story.image
      ? `
        <div class="story-related-card-image">

          <img
            src="${escapeAttribute(story.image)}"
            alt="${escapeAttribute(story.title)}"
            loading="lazy"
            decoding="async"
          >

        </div>
      `
      : `
        <div
          class="story-related-card-image
                 story-related-card-image-empty"
        >
        </div>
      `;

    return `
      <a
        href="story.html?id=${encodeURIComponent(story.id)}"
        class="story-related-card"
        data-related-story
        data-story-id="${escapeAttribute(story.id)}"
      >

        ${image}

        <div class="story-related-card-body">

          <p class="story-related-card-category">
            ${escapeHtml(story.category)}
          </p>

          <h3 class="story-related-card-title">
            ${escapeHtml(story.title)}
          </h3>

          <div
            class="story-related-card-arrow"
            aria-hidden="true"
          >
            ↗
          </div>

        </div>

      </a>
    `;
  }


  /* =======================================================
     18. TITLE FORMATTING
     ======================================================= */

  function formatTitle(title) {
    const clean = stripHtml(title);

    /*
      We keep the title itself intact.

      The small enhancement below gives titles with
      punctuation a more editorial rhythm without
      changing the actual wording.
    */

    if (clean.includes(" — ")) {
      const parts = clean.split(" — ");

      return `
        ${escapeHtml(parts[0])}
        <br>
        <em>${escapeHtml(parts.slice(1).join(" — "))}</em>
      `;
    }

    return escapeHtml(clean);
  }


  /* =======================================================
     19. STORY NUMBER
     ======================================================= */

  function formatStoryNumber(story) {
    const index = state.stories.findIndex(
      item =>
        String(item.id) === String(story.id)
    );

    if (index === -1) {
      return "01";
    }

    return String(index + 1).padStart(2, "0");
  }


  /* =======================================================
     20. INTERACTIONS
     ======================================================= */

  function setupStoryInteractions() {
    setupImageTilt();
    setupPurchaseTracking();
  }


  /* =======================================================
     21. SUBTLE IMAGE TILT
     ======================================================= */

  function setupImageTilt() {
    const images = document.querySelectorAll(
      ".story-hero-image"
    );

    if (!images.length) {
      return;
    }

    if (
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    ) {
      return;
    }

    if (
      window.matchMedia(
        "(pointer: coarse)"
      ).matches
    ) {
      return;
    }

    images.forEach(image => {

      image.addEventListener(
        "pointermove",
        event => {

          const rect =
            image.getBoundingClientRect();

          const x =
            (event.clientX - rect.left) /
            rect.width;

          const y =
            (event.clientY - rect.top) /
            rect.height;

          const rotateY =
            (x - 0.5) * 3;

          const rotateX =
            (0.5 - y) * 3;

          image.style.transform =
            `perspective(1000px)
             rotateX(${rotateX}deg)
             rotateY(${rotateY}deg)
             translateY(-5px)`;
        }
      );

      image.addEventListener(
        "pointerleave",
        () => {
          image.style.transform = "";
        }
      );
    });
  }


  /* =======================================================
     22. PURCHASE TRACKING
     ======================================================= */

  function setupPurchaseTracking() {
    const button = document.querySelector(
      "[data-story-purchase]"
    );

    if (!button) {
      return;
    }

    button.addEventListener("click", () => {
      try {
        sessionStorage.setItem(
          "feelFrame_last_story",
          String(state.story.id)
        );
      } catch (error) {
        /*
          Storage is optional.
          Nothing should break if unavailable.
        */
      }
    });
  }


  /* =======================================================
     23. ERROR PAGE
     ======================================================= */

  function renderError(title, message) {
    if (!content) {
      return;
    }

    content.innerHTML = `
      <section class="story-error">

        <p class="story-section-label">
          FeelFrame™
        </p>

        <h1>
          ${escapeHtml(title)}
        </h1>

        <p>
          ${escapeHtml(message)}
        </p>

        <a
          href="${CONFIG.homeUrl}"
          class="story-error-link"
        >
          Back to FeelFrame™
        </a>

      </section>
    `;
  }


  /* =======================================================
     24. FOOTER YEAR
     ======================================================= */

  function setFooterYear() {
    if (!footerYear) {
      return;
    }

    footerYear.textContent =
      new Date().getFullYear();
  }


  /* =======================================================
     25. SECURITY / TEXT HELPERS
     ======================================================= */

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function escapeAttribute(value) {
    return escapeHtml(value);
  }


  function stripHtml(value) {
    const div = document.createElement("div");

    div.innerHTML = String(value ?? "");

    return div.textContent || div.innerText || "";
  }


  function cleanText(value) {
    return String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();
  }


  function isSafeHttpUrl(url) {
    try {
      const parsed = new URL(
        url,
        window.location.href
      );

      return (
        parsed.protocol === "http:" ||
        parsed.protocol === "https:"
      );
    } catch {
      return false;
    }
  }

})();
