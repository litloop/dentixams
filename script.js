"use strict";

/* =========================================================
   FEELFRAME™
   Global JavaScript Engine
   ========================================================= */

const FEELFRAME = {
  data: null,
  stories: [],
  site: {},
  coverflow: {
    stories: [],
    current: 0,
    startX: 0,
    dragging: false
  }
};


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadFeelFrameData();

    initializeNavigation();
    initializePage();
  } catch (error) {
    console.error("FeelFrame initialization failed:", error);
    showGlobalError();
  }
});


/* =========================================================
   DATA
   ========================================================= */

async function loadFeelFrameData() {
  const response = await fetch("data.json", {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Unable to load data.json (${response.status})`);
  }

  const data = await response.json();

  FEELFRAME.data = data;
  FEELFRAME.site = data.site || {};
  FEELFRAME.stories = Array.isArray(data.stories)
    ? data.stories
    : [];
}


/* =========================================================
   PAGE DETECTION
   ========================================================= */

function initializePage() {
  const body = document.body;

  if (body.classList.contains("home-page")) {
    initializeHome();
  }

  if (body.classList.contains("explore-page")) {
    initializeExplore();
  }

  if (body.classList.contains("story-page")) {
    initializeStory();
  }

  if (body.classList.contains("create-page")) {
    initializeCreate();
  }
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function initializeNavigation() {
  const currentPage = getCurrentPage();

  document.querySelectorAll(".bottom-nav a").forEach(link => {
    const href = link.getAttribute("href") || "";

    if (
      (currentPage === "home" && href.includes("index")) ||
      (currentPage === "explore" && href.includes("explore")) ||
      (currentPage === "create" && href.includes("create"))
    ) {
      link.classList.add("active");
    }
  });
}

function getCurrentPage() {
  const path = window.location.pathname.toLowerCase();

  if (path.includes("explore")) return "explore";
  if (path.includes("create")) return "create";
  if (path.includes("story")) return "story";

  return "home";
}


/* =========================================================
   HOME
   ========================================================= */

function initializeHome() {
  renderFeaturedCoverflow();
  renderHomeBoard();
}


/* =========================================================
   FEATURED COVERFLOW
   ========================================================= */

function renderFeaturedCoverflow() {
  const track = document.querySelector("#coverflowTrack");

  if (!track) return;

  const featured = FEELFRAME.stories.filter(
    story => story.featured === true
  );

  FEELFRAME.coverflow.stories = featured;
  FEELFRAME.coverflow.current = 0;

  if (!featured.length) {
    track.innerHTML = `
      <div class="empty-state">
        <h2>No featured moments yet.</h2>
        <p>Mark stories as featured in data.json.</p>
      </div>
    `;
    return;
  }

  track.innerHTML = featured
    .map((story, index) => createCoverflowCard(story, index))
    .join("");

  renderCoverflowDots();
  updateCoverflow();

  initializeCoverflowControls();
}

function createCoverflowCard(story, index) {
  return `
    <article
      class="coverflow-card"
      data-index="${index}"
      data-story-id="${escapeHTML(story.id)}"
      tabindex="0"
      role="button"
      aria-label="Open ${escapeHTML(story.title)}"
    >

      <img
        src="${escapeHTML(story.image)}"
        alt="${escapeHTML(story.title)}"
        loading="${index === 0 ? "eager" : "lazy"}"
      >

      <div class="coverflow-card-content">
        <small>
          ${escapeHTML(story.campaign || story.moment || "")}
        </small>

        <h3>
          ${escapeHTML(story.title || "")}
        </h3>
      </div>

    </article>
  `;
}


/* =========================================================
   COVERFLOW STATE
   ========================================================= */

function updateCoverflow() {
  const cards = document.querySelectorAll(".coverflow-card");

  if (!cards.length) return;

  const total = FEELFRAME.coverflow.stories.length;
  const current = FEELFRAME.coverflow.current;

  cards.forEach(card => {
    card.classList.remove(
      "is-center",
      "is-left",
      "is-right",
      "is-far-left",
      "is-far-right"
    );

    const index = Number(card.dataset.index);

    let offset = index - current;

    /*
      Circular positioning.
      This allows the last card to move naturally
      beside the first card.
    */

    if (offset > total / 2) {
      offset -= total;
    }

    if (offset < -total / 2) {
      offset += total;
    }

    if (offset === 0) {
      card.classList.add("is-center");
    }

    if (offset === -1) {
      card.classList.add("is-left");
    }

    if (offset === 1) {
      card.classList.add("is-right");
    }

    if (offset === -2) {
      card.classList.add("is-far-left");
    }

    if (offset === 2) {
      card.classList.add("is-far-right");
    }
  });

  updateCoverflowDots();
}


/* =========================================================
   COVERFLOW NAVIGATION
   ========================================================= */

function nextCoverflow() {
  const total = FEELFRAME.coverflow.stories.length;

  if (!total) return;

  FEELFRAME.coverflow.current =
    (FEELFRAME.coverflow.current + 1) % total;

  updateCoverflow();
}

function previousCoverflow() {
  const total = FEELFRAME.coverflow.stories.length;

  if (!total) return;

  FEELFRAME.coverflow.current =
    (FEELFRAME.coverflow.current - 1 + total) % total;

  updateCoverflow();
}

function goToCoverflow(index) {
  const total = FEELFRAME.coverflow.stories.length;

  if (!total) return;

  FEELFRAME.coverflow.current =
    ((index % total) + total) % total;

  updateCoverflow();
}


/* =========================================================
   COVERFLOW CONTROLS
   ========================================================= */

function initializeCoverflowControls() {
  const previous = document.querySelector("#coverflowPrevious");
  const next = document.querySelector("#coverflowNext");
  const track = document.querySelector("#coverflowTrack");

  if (previous) {
    previous.addEventListener("click", previousCoverflow);
  }

  if (next) {
    next.addEventListener("click", nextCoverflow);
  }

  /*
    Clicking a Coverflow card:
    center card -> open story
    side card -> bring it to center
  */

  document.querySelectorAll(".coverflow-card").forEach(card => {
    card.addEventListener("click", () => {
      const index = Number(card.dataset.index);

      if (index !== FEELFRAME.coverflow.current) {
        goToCoverflow(index);
        return;
      }

      const storyId = card.dataset.storyId;

      if (storyId) {
        window.location.href =
          `story.html?id=${encodeURIComponent(storyId)}`;
      }
    });

    card.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();

      const index = Number(card.dataset.index);

      if (index !== FEELFRAME.coverflow.current) {
        goToCoverflow(index);
        return;
      }

      const storyId = card.dataset.storyId;

      if (storyId) {
        window.location.href =
          `story.html?id=${encodeURIComponent(storyId)}`;
      }
    });
  });


  /* Keyboard navigation */

  document.addEventListener("keydown", event => {
    if (event.key === "ArrowRight") {
      nextCoverflow();
    }

    if (event.key === "ArrowLeft") {
      previousCoverflow();
    }
  });


  /* Touch / swipe */

  if (track) {
    track.addEventListener(
      "touchstart",
      handleCoverflowTouchStart,
      { passive: true }
    );

    track.addEventListener(
      "touchend",
      handleCoverflowTouchEnd,
      { passive: true }
    );
  }
}

function handleCoverflowTouchStart(event) {
  FEELFRAME.coverflow.startX =
    event.changedTouches[0].clientX;

  FEELFRAME.coverflow.dragging = true;
}

function handleCoverflowTouchEnd(event) {
  if (!FEELFRAME.coverflow.dragging) return;

  const endX = event.changedTouches[0].clientX;

  const difference =
    endX - FEELFRAME.coverflow.startX;

  FEELFRAME.coverflow.dragging = false;

  if (Math.abs(difference) < 45) {
    return;
  }

  if (difference < 0) {
    nextCoverflow();
  } else {
    previousCoverflow();
  }
}


/* =========================================================
   COVERFLOW DOTS
   ========================================================= */

function renderCoverflowDots() {
  const container =
    document.querySelector("#coverflowDots");

  if (!container) return;

  const stories = FEELFRAME.coverflow.stories;

  container.innerHTML = stories
    .map(
      (_, index) => `
        <button
          class="coverflow-dot"
          type="button"
          data-coverflow-index="${index}"
          aria-label="Show featured story ${index + 1}"
        ></button>
      `
    )
    .join("");

  container
    .querySelectorAll("[data-coverflow-index]")
    .forEach(button => {
      button.addEventListener("click", () => {
        goToCoverflow(
          Number(button.dataset.coverflowIndex)
        );
      });
    });
}

function updateCoverflowDots() {
  const dots =
    document.querySelectorAll(".coverflow-dot");

  dots.forEach((dot, index) => {
    dot.classList.toggle(
      "active",
      index === FEELFRAME.coverflow.current
    );
  });
}


/* =========================================================
   HOME STORY BOARD
   ========================================================= */

function renderHomeBoard() {
  const grid =
    document.querySelector("#homeStoryGrid");

  if (!grid) return;

  grid.innerHTML = FEELFRAME.stories
    .map(createStoryCard)
    .join("");

  initializeStoryCardLinks(grid);
}


/* =========================================================
   STORY CARD
   ========================================================= */

function createStoryCard(story) {
  return `
    <article
      class="story-card"
      data-story-id="${escapeHTML(story.id)}"
      tabindex="0"
      role="button"
      aria-label="Open ${escapeHTML(story.title)}"
    >

      <div class="story-card-image">

        <img
          src="${escapeHTML(story.image)}"
          alt="${escapeHTML(story.title || "")}"
          loading="lazy"
        >

        <div class="story-card-overlay"></div>

      </div>

      <div class="story-card-info">

        <div class="story-card-campaign">
          ${escapeHTML(
            story.campaign || story.moment || ""
          )}
        </div>

        <h3 class="story-card-title">
          ${escapeHTML(story.title || "")}
        </h3>

        <div class="story-card-emotion">
          ${escapeHTML(story.emotion || "")}
        </div>

      </div>

    </article>
  `;
}

function initializeStoryCardLinks(container) {
  container
    .querySelectorAll(".story-card")
    .forEach(card => {

      const openStory = () => {
        const id = card.dataset.storyId;

        if (!id) return;

        window.location.href =
          `story.html?id=${encodeURIComponent(id)}`;
      };

      card.addEventListener("click", openStory);

      card.addEventListener("keydown", event => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          openStory();
        }
      });
    });
}


/* =========================================================
   EXPLORE
   ========================================================= */

function initializeExplore() {
  const grid =
    document.querySelector("#exploreStoryGrid");

  if (!grid) return;

  const filterButtons =
    document.querySelectorAll(".filter-button");

  renderExploreStories(FEELFRAME.stories);

  filterButtons.forEach(button => {
    button.addEventListener("click", () => {

      filterButtons.forEach(item => {
        item.classList.remove("active");
      });

      button.classList.add("active");

      const filter =
        button.dataset.filter || "all";

      let results;

      if (filter === "all") {
        results = FEELFRAME.stories;
      } else {
        results = FEELFRAME.stories.filter(story => {
          return normalize(story.campaign) ===
            normalize(filter);
        });
      }

      renderExploreStories(results);
    });
  });
}

function renderExploreStories(stories) {
  const grid =
    document.querySelector("#exploreStoryGrid");

  if (!grid) return;

  const count =
    document.querySelector("#exploreResultCount");

  const activeFilter =
    document.querySelector("#exploreActiveFilter");

  if (!stories.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <h2>No stories yet.</h2>
        <p>Try another moment or check back soon.</p>
      </div>
    `;
  } else {
    grid.innerHTML =
      stories.map(createStoryCard).join("");

    initializeStoryCardLinks(grid);
  }

  if (count) {
    count.textContent =
      `${stories.length} ${
        stories.length === 1 ? "story" : "stories"
      }`;
  }

  if (activeFilter) {
    const activeButton =
      document.querySelector(".filter-button.active");

    activeFilter.textContent =
      activeButton
        ? activeButton.textContent.trim()
        : "All";
  }
}


/* =========================================================
   STORY PAGE
   ========================================================= */

function initializeStory() {
  const container =
    document.querySelector("#storyContent");

  if (!container) return;

  const params =
    new URLSearchParams(window.location.search);

  const storyId =
    params.get("id");

  const story =
    FEELFRAME.stories.find(
      item => item.id === storyId
    );

  if (!story) {
    renderStoryNotFound(container);
    return;
  }

  renderStory(container, story);
}


/* =========================================================
   STORY RENDERING
   ========================================================= */

function renderStory(container, story) {
  const oldPrice =
    Number(story.compareAt || 0);

  const currentPrice =
    Number(story.price || 0);

  const hasSelar =
    story.selarUrl &&
    story.selarUrl !== "REAL-SELAR-LINK";

  container.innerHTML = `

    <div class="story-layout">

      <div class="story-visual">

        <img
          src="${escapeHTML(story.image)}"
          alt="${escapeHTML(story.title || "")}"
        >

      </div>


      <article class="story-copy">

        <div class="story-campaign">
          ${escapeHTML(story.campaign || "")}
        </div>

        <h1 class="story-title">
          ${escapeHTML(story.title || "")}
        </h1>

        ${
          story.quote
            ? `
              <p class="story-quote">
                “${escapeHTML(story.quote)}”
              </p>
            `
            : ""
        }

        ${
          story.description
            ? `
              <p class="story-description">
                ${escapeHTML(story.description)}
              </p>
            `
            : ""
        }

        ${
          story.context
            ? `
              <div class="story-context">
                ${escapeHTML(story.context)}
              </div>
            `
            : ""
        }


        <div class="story-meta">

          ${
            story.emotion
              ? `
                <span class="story-tag">
                  ${escapeHTML(story.emotion)}
                </span>
              `
              : ""
          }

          ${
            story.moment
              ? `
                <span class="story-tag">
                  ${escapeHTML(story.moment)}
                </span>
              `
              : ""
          }

          ${
            story.style
              ? `
                <span class="story-tag">
                  ${escapeHTML(story.style)}
                </span>
              `
              : ""
          }

        </div>


        ${
          story.promptTitle
            ? createPromptProduct(
                story,
                oldPrice,
                currentPrice,
                hasSelar
              )
            : ""
        }

      </article>

    </div>
  `;
}


/* =========================================================
   PROMPT PRODUCT
   ========================================================= */

function createPromptProduct(
  story,
  oldPrice,
  currentPrice,
  hasSelar
) {
  return `

    <section class="prompt-product">

      <div class="prompt-product-label">
        🔐 Paid creative prompt
      </div>

      <h3>
        ${escapeHTML(story.promptTitle)}
      </h3>

      <p class="prompt-product-description">
        The creative prompt behind this visual.
      </p>


      <div class="prompt-price-row">

        ${
          oldPrice > currentPrice
            ? `
              <span class="prompt-old-price">
                ${formatNaira(oldPrice)}
              </span>
            `
            : ""
        }

        ${
          currentPrice
            ? `
              <span class="prompt-current-price">
                ${formatNaira(currentPrice)}
              </span>
            `
            : ""
        }

      </div>


      ${
        hasSelar
          ? `
            <a
              class="prompt-buy"
              href="${escapeHTML(story.selarUrl)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get prompt
              <span>→</span>
            </a>
          `
          : `
            <button
              class="prompt-buy"
              type="button"
              disabled
              aria-disabled="true"
              title="Selar link will be added soon"
            >
              Checkout coming soon
            </button>
          `
      }

    </section>
  `;
}


/* =========================================================
   STORY NOT FOUND
   ========================================================= */

function renderStoryNotFound(container) {
  container.innerHTML = `
    <div class="empty-state">

      <h2>
        Story not found.
      </h2>

      <p>
        This visual story may have moved or no longer exists.
      </p>

      <a
        href="explore.html"
        class="hero-cta"
        style="margin-top: 20px;"
      >
        Explore stories →
      </a>

    </div>
  `;
}


/* =========================================================
   CREATE PAGE
   ========================================================= */

function initializeCreate() {

  initializeChoiceCards();

  initializeReferenceUpload();

  const form =
    document.querySelector("#feelFrameForm");

  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    handleCreateSubmission(form);
  });
}


/* =========================================================
   CHOICE CARDS
   ========================================================= */

function initializeChoiceCards() {
  document
    .querySelectorAll(".choice-card")
    .forEach(card => {

      const input =
        card.querySelector("input");

      if (!input) return;

      card.addEventListener("click", event => {

        if (event.target !== input) {
          input.checked = true;
        }

        updateChoiceGroup(input);
      });

      input.addEventListener("change", () => {
        updateChoiceGroup(input);
      });

      if (input.checked) {
        updateChoiceGroup(input);
      }
    });
}

function updateChoiceGroup(input) {
  const name = input.name;

  document
    .querySelectorAll(
      `.choice-card input[name="${CSS.escape(name)}"]`
    )
    .forEach(item => {

      const card =
        item.closest(".choice-card");

      if (!card) return;

      card.classList.toggle(
        "selected",
        item.checked
      );
    });
}


/* =========================================================
   REFERENCE IMAGE
   ========================================================= */

function initializeReferenceUpload() {
  const input =
    document.querySelector("#referenceImage");

  const preview =
    document.querySelector("#referencePreview");

  const previewImage =
    document.querySelector("#referencePreview img");

  if (!input || !preview || !previewImage) {
    return;
  }

  input.addEventListener("change", () => {

    const file = input.files?.[0];

    if (!file) {
      preview.classList.remove("active");
      previewImage.removeAttribute("src");
      return;
    }

    if (!file.type.startsWith("image/")) {
      input.value = "";
      preview.classList.remove("active");
      return;
    }

    const reader =
      new FileReader();

    reader.onload = event => {

      previewImage.src =
        event.target.result;

      preview.classList.add("active");
    };

    reader.readAsDataURL(file);
  });
}


/* =========================================================
   CREATE SUBMISSION
   ========================================================= */

function handleCreateSubmission(form) {

  const formData =
    new FormData(form);

  const name =
    getFormValue(formData, "name");

  const school =
    getFormValue(formData, "school");

  const course =
    getFormValue(formData, "course");

  const moment =
    getFormValue(formData, "moment");

  const feeling =
    getFormValue(formData, "feeling");

  const context =
    getFormValue(formData, "context");

  const message =
    getFormValue(formData, "message");

  const visualLanguage =
    getFormValue(formData, "visualLanguage");


  const missingFields = [];

  if (!name) missingFields.push("Name");
  if (!school) missingFields.push("University / School");
  if (!course) missingFields.push("Course / Field");
  if (!moment) missingFields.push("Moment");
  if (!feeling) missingFields.push("Feeling");
  if (!context) missingFields.push(
    "What you're going through"
  );
  if (!message) missingFields.push(
    "What you want the image to communicate"
  );
  if (!visualLanguage) missingFields.push(
    "Visual language"
  );


  if (missingFields.length) {

    alert(
      `Please complete:\n\n${missingFields.join("\n")}`
    );

    return;
  }


  const direction =
    generateCreativeDirection({
      feeling,
      context,
      visualLanguage
    });


  const commands =
    generateVisualCommands({
      feeling,
      visualLanguage
    });


  const referenceInput =
    document.querySelector("#referenceImage");

  const referenceFile =
    referenceInput?.files?.[0];


  const referenceText =
    referenceFile
      ? `User will attach reference image: ${referenceFile.name}`
      : "No reference image supplied.";


  const whatsappMessage = buildWhatsAppMessage({
    name,
    school,
    course,
    moment,
    feeling,
    context,
    message,
    visualLanguage,
    direction,
    commands,
    referenceText
  });


  const whatsappNumber =
    String(
      FEELFRAME.site.whatsappNumber ||
      "2349012728201"
    ).replace(/\D/g, "");


  const whatsappURL =
    `https://wa.me/${whatsappNumber}?text=${
      encodeURIComponent(whatsappMessage)
    }`;


  window.open(
    whatsappURL,
    "_blank",
    "noopener,noreferrer"
  );
}


/* =========================================================
   CREATIVE DIRECTION ENGINE
   ========================================================= */

function generateCreativeDirection({
  feeling,
  context,
  visualLanguage
}) {

  const emotion =
    emotionTranslator(feeling);

  const condition =
    conditionTranslator(feeling, context);

  const style =
    styleTranslator(visualLanguage);


  return {
    emotion,
    condition,
    style
  };
}


/* =========================================================
   EMOTION TRANSLATOR
   ========================================================= */

function emotionTranslator(feeling) {

  const map = {
    "Determined":
      "quiet determination and forward movement",

    "Exhausted":
      "visible fatigue balanced with resilience",

    "Proud":
      "earned pride and personal accomplishment",

    "Hopeful":
      "quiet optimism and anticipation",

    "Confident":
      "self-assurance and controlled confidence",

    "Starting Again":
      "renewal, reflection and a fresh beginning"
  };

  return (
    map[feeling] ||
    "authentic human emotion"
  );
}


/* =========================================================
   CONDITION TRANSLATOR
   ========================================================= */

function conditionTranslator(
  feeling,
  context
) {

  const base = {
    "Determined":
      "focused, persistent and composed",

    "Exhausted":
      "physically and mentally tired but continuing",

    "Proud":
      "reflective, accomplished and present",

    "Hopeful":
      "uncertain yet optimistic",

    "Confident":
      "grounded, self-assured and intentional",

    "Starting Again":
      "reflective, calm and ready for change"
  };


  const emotionalCondition =
    base[feeling] ||
    "present and emotionally authentic";


  return `${emotionalCondition}. Context: ${
    truncate(context, 220)
  }`;
}


/* =========================================================
   STYLE TRANSLATOR
   ========================================================= */

function styleTranslator(style) {

  const map = {
    "Cinematic":
      "cinematic realism, controlled lighting, natural depth and filmic composition",

    "Editorial":
      "premium editorial photography, sophisticated composition and magazine-level art direction",

    "Luxury":
      "refined luxury visual language, polished composition and understated sophistication",

    "Film":
      "35mm film character, natural imperfections, organic grain and cinematic framing",

    "Dreamlike":
      "dreamlike atmosphere, poetic composition, soft visual transitions and subtle surrealism",

    "Dark & Moody":
      "moody low-key lighting, rich shadows, intimate framing and atmospheric depth"
  };

  return (
    map[style] ||
    "cinematic visual storytelling"
  );
}


/* =========================================================
   INTERNAL VISUAL COMMAND ENGINE
   ========================================================= */

function generateVisualCommands({
  feeling,
  visualLanguage
}) {

  const commands = [
    "/hdreal"
  ];


  const styleCommands = {
    "Cinematic": [
      "/cinematic",
      "/35mmfilm",
      "/shallowdepth"
    ],

    "Editorial": [
      "/editorial",
      "/magazinecover",
      "/softlighting"
    ],

    "Luxury": [
      "/luxury",
      "/editorial",
      "/rimlight"
    ],

    "Film": [
      "/35mmfilm",
      "/filmgrain",
      "/shallowdepth"
    ],

    "Dreamlike": [
      "/dreamcore",
      "/backlight",
      "/wideangle"
    ],

    "Dark & Moody": [
      "/dramaticlighting",
      "/closeup",
      "/filmgrain"
    ]
  };


  if (styleCommands[visualLanguage]) {
    commands.push(
      ...styleCommands[visualLanguage]
    );
  }


  const feelingCommands = {
    "Determined": "/lowangle",
    "Exhausted": "/closeup",
    "Proud": "/backlight",
    "Hopeful": "/sunrise",
    "Confident": "/lowangle",
    "Starting Again": "/softlighting"
  };


  if (feelingCommands[feeling]) {
    commands.push(
      feelingCommands[feeling]
    );
  }


  return [...new Set(commands)];
}


/* =========================================================
   WHATSAPP MESSAGE
   ========================================================= */

function buildWhatsAppMessage({
  name,
  school,
  course,
  moment,
  feeling,
  context,
  message,
  visualLanguage,
  direction,
  commands,
  referenceText
}) {

  return `FEELFRAME™ — NEW VISUAL REQUEST

PERSONAL DETAILS

Name: ${name}
University / School: ${school}
Course / Field: ${course}

THE MOMENT

Campaign: ${moment}
Feeling: ${feeling}

WHAT I'M GOING THROUGH

${context}

WHAT I WANT THE IMAGE TO COMMUNICATE

${message}

VISUAL LANGUAGE

${visualLanguage}

REFERENCE IMAGE

${referenceText}

FEELFRAME CREATIVE DIRECTION

Emotion → ${direction.emotion}

Condition → ${direction.condition}

Style → ${direction.style}

COMMANDS

${commands.join("\n")}

Please create my FeelFrame visual.`;
}


/* =========================================================
   FORM HELPERS
   ========================================================= */

function getFormValue(formData, name) {
  const value = formData.get(name);

  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}


/* =========================================================
   FORMATTING
   ========================================================= */

function formatNaira(amount) {
  const number = Number(amount);

  if (!Number.isFinite(number)) {
    return "₦0";
  }

  return new Intl.NumberFormat(
    "en-NG",
    {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }
  ).format(number);
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function truncate(value, length) {
  const text = String(value || "");

  if (text.length <= length) {
    return text;
  }

  return text.slice(0, length).trim() + "…";
}


/* =========================================================
   SECURITY
   ========================================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   GLOBAL ERROR
   ========================================================= */

function showGlobalError() {

  const targets = [
    "#homeStoryGrid",
    "#exploreStoryGrid",
    "#storyContent",
    "#coverflowTrack"
  ];

  targets.forEach(selector => {

    const element =
      document.querySelector(selector);

    if (!element) return;

    element.innerHTML = `
      <div class="empty-state">

        <h2>
          Something went wrong.
        </h2>

        <p>
          FeelFrame could not load its visual stories.
          Please refresh the page.
        </p>

      </div>
    `;
  });
}
