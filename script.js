"use strict";

/* =========================================================
   FEELFRAME™
   Global JavaScript Engine
   Production Version 3.0
   ========================================================= */

const FEELFRAME = {
  data: null,
  stories: [],
  site: {},

  filters: {
    campaign: "all",
    emotion: "all",
    search: ""
  },

  coverflow: {
    stories: [],
    current: 0,
    startX: 0,
    startY: 0,
    dragging: false,
    moved: false,
    suppressClick: false,
    pointerId: null,
    initialized: false
  }
};

/* INITIALIZATION */
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

/* DATA */
async function loadFeelFrameData() {
  const response = await fetch("data.json", {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `Unable to load data.json (${response.status})`
    );
  }

  const data = await response.json();

  if (!data || typeof data !== "object") {
    throw new Error("Invalid FeelFrame data structure.");
  }

  FEELFRAME.data = data;

  FEELFRAME.site =
    data.site && typeof data.site === "object"
      ? data.site
      : {};

  FEELFRAME.stories =
    Array.isArray(data.stories)
      ? data.stories.filter(isValidStory)
      : [];
}

/* STORY VALIDATION */
function isValidStory(story) {
  return (
    story &&
    typeof story === "object" &&
    story.id &&
    (story.title ||
      story.image ||
      story.promptTitle)
  );
}

/* PAGE DETECTION */
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

/* NAVIGATION */
function initializeNavigation() {
  const currentPage = getCurrentPage();

  document
    .querySelectorAll(".bottom-nav a")
    .forEach(link => {
      const href =
        link.getAttribute("href") || "";

      const isHome =
        currentPage === "home" &&
        (
          href.includes("index") ||
          href === "/" ||
          href === "./"
        );

      const isExplore =
        currentPage === "explore" &&
        href.includes("explore");

      const isCreate =
        currentPage === "create" &&
        href.includes("create");

      if (
        isHome ||
        isExplore ||
        isCreate
      ) {
        link.classList.add("active");
      }
    });
}

function getCurrentPage() {
  const path =
    window.location.pathname.toLowerCase();

  if (path.includes("explore")) {
    return "explore";
  }

  if (path.includes("create")) {
    return "create";
  }

  if (path.includes("story")) {
    return "story";
  }

  return "home";
}

/* HOME */
function initializeHome() {
  renderFeaturedCoverflow();
  renderHomeBoard();
}

/* =========================================================
   FEATURED COVERFLOW
   ========================================================= */

function renderFeaturedCoverflow() {
  const track =
    document.querySelector("#coverflowTrack");

  if (!track) return;

  const featured =
    FEELFRAME.stories.filter(
      story => story.featured === true
    );

  FEELFRAME.coverflow.stories = featured;

  if (!featured.length) {
    FEELFRAME.coverflow.current = 0;

    track.innerHTML = `
      <div class="empty-state">
        <h2>No featured moments yet.</h2>
        <p>Mark stories as featured in data.json.</p>
      </div>
    `;

    return;
  }

  if (
    FEELFRAME.coverflow.current >=
    featured.length
  ) {
    FEELFRAME.coverflow.current = 0;
  }

  track.innerHTML =
    featured
      .map((story, index) =>
        createCoverflowCard(story, index)
      )
      .join("");

  renderCoverflowDots();

  updateCoverflow();

  initializeCoverflowControls();
}

/* COVERFLOW CARD */
function createCoverflowCard(
  story,
  index
) {
  return `
    <article
      class="coverflow-card"
      data-index="${index}"
      data-story-id="${escapeHTML(story.id)}"
      tabindex="0"
      role="button"
      aria-current="${index === 0 ? "true" : "false"}"
      aria-label="Open ${escapeHTML(
        story.title || "visual story"
      )}"
    >
      <img
        src="${escapeHTML(story.image || "")}"
        alt="${escapeHTML(
          story.title || "FeelFrame visual"
        )}"
        loading="${index === 0 ? "eager" : "lazy"}"
        draggable="false"
        onerror="handleImageError(this)"
      >

      <div class="coverflow-card-content">
        <small>
          ${escapeHTML(
            story.campaign ||
            story.moment ||
            ""
          )}
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
  const cards =
    document.querySelectorAll(
      ".coverflow-card"
    );

  if (!cards.length) return;

  const total =
    FEELFRAME.coverflow.stories.length;

  const current =
    FEELFRAME.coverflow.current;

  if (!total) return;

  cards.forEach(card => {
    card.classList.remove(
      "is-center",
      "is-left",
      "is-right",
      "is-far-left",
      "is-far-right"
    );

    const index =
      Number(card.dataset.index);

    let offset =
      index - current;

    /*
      Circular positioning keeps the Cover Flow
      continuous even when moving from the last
      card back to the first card.
    */
    if (offset > total / 2) {
      offset -= total;
    }

    if (offset < -total / 2) {
      offset += total;
    }

    if (offset === 0) {
      card.classList.add("is-center");
      card.setAttribute(
        "aria-current",
        "true"
      );
    } else {
      card.setAttribute(
        "aria-current",
        "false"
      );
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
  const total =
    FEELFRAME.coverflow.stories.length;

  if (!total) return;

  FEELFRAME.coverflow.current =
    (
      FEELFRAME.coverflow.current + 1
    ) % total;

  updateCoverflow();
}

function previousCoverflow() {
  const total =
    FEELFRAME.coverflow.stories.length;

  if (!total) return;

  FEELFRAME.coverflow.current =
    (
      FEELFRAME.coverflow.current - 1 + total
    ) % total;

  updateCoverflow();
}

function goToCoverflow(index) {
  const total =
    FEELFRAME.coverflow.stories.length;

  if (!total) return;

  const numericIndex =
    Number(index);

  if (!Number.isFinite(numericIndex)) {
    return;
  }

  FEELFRAME.coverflow.current =
    (
      numericIndex % total + total
    ) % total;

  updateCoverflow();
}

/* =========================================================
   COVERFLOW CONTROLS
   ========================================================= */

function initializeCoverflowControls() {
  const previous =
    document.querySelector(
      "#coverflowPrevious"
    );

  const next =
    document.querySelector(
      "#coverflowNext"
    );

  const track =
    document.querySelector(
      "#coverflowTrack"
    );

  if (previous) {
    previous.onclick =
      previousCoverflow;
  }

  if (next) {
    next.onclick =
      nextCoverflow;
  }

  document
    .querySelectorAll(".coverflow-card")
    .forEach(card => {
      card.onclick = event => {
        if (
          FEELFRAME.coverflow.suppressClick
        ) {
          FEELFRAME.coverflow.suppressClick =
            false;

          event.preventDefault();
          event.stopPropagation();

          return;
        }

        const index =
          Number(card.dataset.index);

        if (
          index !==
          FEELFRAME.coverflow.current
        ) {
          goToCoverflow(index);
          return;
        }

        openStory(
          card.dataset.storyId
        );
      };

      card.onkeydown = event => {
        if (
          event.key !== "Enter" &&
          event.key !== " "
        ) {
          return;
        }

        event.preventDefault();

        const index =
          Number(card.dataset.index);

        if (
          index !==
          FEELFRAME.coverflow.current
        ) {
          goToCoverflow(index);
          return;
        }

        openStory(
          card.dataset.storyId
        );
      };
    });

  if (
    !FEELFRAME.coverflow.initialized
  ) {
    document.addEventListener(
      "keydown",
      handleGlobalCoverflowKeyboard
    );

    FEELFRAME.coverflow.initialized =
      true;
  }

  if (
    track &&
    track.dataset.coverflowBound !== "true"
  ) {
    initializeCoverflowPointerEvents(
      track
    );

    track.dataset.coverflowBound =
      "true";
  }
}

/* =========================================================
   COVERFLOW POINTER ENGINE
   ========================================================= */

function initializeCoverflowPointerEvents(
  track
) {
  if (!track) return;

  track.addEventListener(
    "pointerdown",
    handleCoverflowPointerDown
  );

  track.addEventListener(
    "pointermove",
    handleCoverflowPointerMove
  );

  track.addEventListener(
    "pointerup",
    handleCoverflowPointerUp
  );

  track.addEventListener(
    "pointercancel",
    handleCoverflowPointerCancel
  );

  track.addEventListener(
    "pointerleave",
    handleCoverflowPointerLeave
  );
}

function handleCoverflowPointerDown(
  event
) {
  /*
    Ignore secondary mouse buttons.
    Touch, pen and primary mouse input remain supported.
  */
  if (
    event.pointerType === "mouse" &&
    event.button !== 0
  ) {
    return;
  }

  const coverflow =
    FEELFRAME.coverflow;

  coverflow.startX =
    event.clientX;

  coverflow.startY =
    event.clientY;

  coverflow.pointerId =
    event.pointerId;

  coverflow.dragging = true;
  coverflow.moved = false;
  coverflow.suppressClick = false;

  const track = event.currentTarget;

  if (
    track &&
    typeof track.setPointerCapture ===
      "function"
  ) {
    try {
      track.setPointerCapture(
        event.pointerId
      );
    } catch (error) {
      /*
        Pointer capture is an enhancement.
        Navigation still works without it.
      */
    }
  }
}

function handleCoverflowPointerMove(
  event
) {
  const coverflow =
    FEELFRAME.coverflow;

  if (!coverflow.dragging) {
    return;
  }

  if (
    coverflow.pointerId !==
    event.pointerId
  ) {
    return;
  }

  const differenceX =
    event.clientX -
    coverflow.startX;

  const differenceY =
    event.clientY -
    coverflow.startY;

  /*
    A small movement is ignored so normal taps
    do not become accidental swipes.
  */
  const movement =
    Math.sqrt(
      differenceX * differenceX +
      differenceY * differenceY
    );

  if (movement > 8) {
    coverflow.moved = true;
  }
}

function handleCoverflowPointerUp(
  event
) {
  const coverflow =
    FEELFRAME.coverflow;

  if (!coverflow.dragging) {
    return;
  }

  if (
    coverflow.pointerId !==
    event.pointerId
  ) {
    return;
  }

  const differenceX =
    event.clientX -
    coverflow.startX;

  const differenceY =
    event.clientY -
    coverflow.startY;

  const horizontalMovement =
    Math.abs(differenceX);

  const verticalMovement =
    Math.abs(differenceY);

  const wasDrag =
    coverflow.moved ||
    horizontalMovement > 8 ||
    verticalMovement > 8;

  coverflow.dragging = false;
  coverflow.pointerId = null;

  const track = event.currentTarget;

  if (
    track &&
    typeof track.releasePointerCapture ===
      "function"
  ) {
    try {
      if (
        track.hasPointerCapture &&
        track.hasPointerCapture(
          event.pointerId
        )
      ) {
        track.releasePointerCapture(
          event.pointerId
        );
      }
    } catch (error) {
      /*
        Safe fallback if pointer capture
        is unavailable or already released.
      */
    }
  }

  if (!wasDrag) {
    return;
  }

  /*
    Once a drag has happened, suppress the
    synthetic click generated by the browser.
  */
  coverflow.suppressClick = true;

  const swipeThreshold = 45;

  /*
    Only horizontal movement navigates the
    Cover Flow. Vertical movement is allowed
    without changing stories.
  */
  if (
    horizontalMovement >=
      swipeThreshold &&
    horizontalMovement >
      verticalMovement
  ) {
    if (differenceX < 0) {
      nextCoverflow();
    } else {
      previousCoverflow();
    }
  }

  /*
    Clear the click guard after the browser has
    had a chance to dispatch the synthetic click.
  */
  window.requestAnimationFrame(() => {
    coverflow.suppressClick = false;
  });
}

function handleCoverflowPointerCancel(
  event
) {
  resetCoverflowPointerState(
    event
  );
}

function handleCoverflowPointerLeave(
  event
) {
  const coverflow =
    FEELFRAME.coverflow;

  /*
    Do not cancel an active pointer interaction
    because pointer capture may still be active.
  */
  if (
    coverflow.dragging &&
    coverflow.pointerId ===
      event.pointerId
  ) {
    return;
  }
}

function resetCoverflowPointerState(
  event
) {
  const coverflow =
    FEELFRAME.coverflow;

  if (
    coverflow.pointerId !== null &&
    event &&
    coverflow.pointerId !==
      event.pointerId
  ) {
    return;
  }

  coverflow.dragging = false;
  coverflow.moved = false;
  coverflow.pointerId = null;

  window.requestAnimationFrame(() => {
    coverflow.suppressClick = false;
  });
}

/* =========================================================
   COVERFLOW KEYBOARD
   ========================================================= */

function handleGlobalCoverflowKeyboard(
  event
) {
  const coverflow =
    document.querySelector(
      "#coverflowTrack"
    );

  if (!coverflow) return;

  if (
    event.defaultPrevented
  ) {
    return;
  }

  if (
    event.target &&
    (
      event.target.tagName === "INPUT" ||
      event.target.tagName === "TEXTAREA" ||
      event.target.tagName === "SELECT" ||
      event.target.isContentEditable
    )
  ) {
    return;
  }

  /*
    Do not hijack browser/application shortcuts.
  */
  if (
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  ) {
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    nextCoverflow();
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    previousCoverflow();
  }

  if (event.key === "Home") {
    event.preventDefault();
    goToCoverflow(0);
  }

  if (event.key === "End") {
    event.preventDefault();

    const lastIndex =
      FEELFRAME.coverflow.stories.length -
      1;

    if (lastIndex >= 0) {
      goToCoverflow(lastIndex);
    }
  }
}

/* =========================================================
   COVERFLOW TOUCH FALLBACK
   ========================================================= */

/*
  Kept as a compatibility fallback for browsers
  where Pointer Events are unavailable.
*/
function handleCoverflowTouchStart(
  event
) {
  if (
    "PointerEvent" in window
  ) {
    return;
  }

  if (
    !event.changedTouches ||
    !event.changedTouches.length
  ) {
    return;
  }

  FEELFRAME.coverflow.startX =
    event.changedTouches[0].clientX;

  FEELFRAME.coverflow.startY =
    event.changedTouches[0].clientY;

  FEELFRAME.coverflow.dragging =
    true;

  FEELFRAME.coverflow.moved =
    false;
}

function handleCoverflowTouchEnd(
  event
) {
  if (
    "PointerEvent" in window
  ) {
    return;
  }

  const coverflow =
    FEELFRAME.coverflow;

  if (
    !coverflow.dragging ||
    !event.changedTouches ||
    !event.changedTouches.length
  ) {
    return;
  }

  const endX =
    event.changedTouches[0].clientX;

  const endY =
    event.changedTouches[0].clientY;

  const differenceX =
    endX - coverflow.startX;

  const differenceY =
    endY - coverflow.startY;

  const horizontalMovement =
    Math.abs(differenceX);

  const verticalMovement =
    Math.abs(differenceY);

  coverflow.dragging = false;

  if (
    horizontalMovement < 45 ||
    horizontalMovement <=
      verticalMovement
  ) {
    return;
  }

  coverflow.suppressClick =
    true;

  if (differenceX < 0) {
    nextCoverflow();
  } else {
    previousCoverflow();
  }

  window.requestAnimationFrame(() => {
    coverflow.suppressClick = false;
  });
}

/* =========================================================
   COVERFLOW DOTS
   ========================================================= */

function renderCoverflowDots() {
  const container =
    document.querySelector(
      "#coverflowDots"
    );

  if (!container) return;

  const stories =
    FEELFRAME.coverflow.stories;

  container.innerHTML =
    stories
      .map(
        (_, index) => `
          <button
            class="coverflow-dot"
            type="button"
            data-coverflow-index="${index}"
            aria-label="Show featured story ${index + 1}"
            aria-current="${
              index ===
              FEELFRAME.coverflow.current
                ? "true"
                : "false"
            }"
          ></button>
        `
      )
      .join("");

  container
    .querySelectorAll(
      "[data-coverflow-index]"
    )
    .forEach(button => {
      button.onclick = () => {
        goToCoverflow(
          Number(
            button.dataset
              .coverflowIndex
          )
        );
      };
    });
}

function updateCoverflowDots() {
  const dots =
    document.querySelectorAll(
      ".coverflow-dot"
    );

  dots.forEach(
    (dot, index) => {
      const active =
        index ===
        FEELFRAME.coverflow.current;

      dot.classList.toggle(
        "active",
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
}

/* =========================================================
   HOME STORY BOARD
   ========================================================= */

function renderHomeBoard() {
  const grid =
    document.querySelector(
      "#homeStoryGrid"
    );

  if (!grid) return;

  if (!FEELFRAME.stories.length) {
    renderEmptyState(
      grid,
      "No visual stories yet.",
      "Add stories to data.json to begin building the FeelFrame library."
    );

    return;
  }

  grid.innerHTML =
    FEELFRAME.stories
      .map(createStoryCard)
      .join("");

  initializeStoryCardLinks(
    grid
  );
}

/* STORY CARD */
function createStoryCard(story) {
  return `
    <article
      class="story-card"
      data-story-id="${escapeHTML(
        story.id
      )}"
      tabindex="0"
      role="button"
      aria-label="Open ${escapeHTML(
        story.title ||
        "visual story"
      )}"
    >
      <div class="story-card-image">
        <img
          src="${escapeHTML(
            story.image || ""
          )}"
          alt="${escapeHTML(
            story.title ||
            "FeelFrame visual"
          )}"
          loading="lazy"
          draggable="false"
          onerror="handleImageError(this)"
        >

        <div class="story-card-overlay"></div>
      </div>

      <div class="story-card-info">
        <div class="story-card-campaign">
          ${escapeHTML(
            story.campaign ||
            story.moment ||
            ""
          )}
        </div>

        <h3 class="story-card-title">
          ${escapeHTML(
            story.title || ""
          )}
        </h3>

        ${
          story.emotion
            ? `
              <div class="story-card-emotion">
                ${escapeHTML(
                  story.emotion
                )}
              </div>
            `
            : ""
        }
      </div>
    </article>
  `;
}

function initializeStoryCardLinks(
  container
) {
  container
    .querySelectorAll(".story-card")
    .forEach(card => {
      const open = () => {
        openStory(
          card.dataset.storyId
        );
      };

      card.onclick = open;

      card.onkeydown = event => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          open();
        }
      };
    });
}

/* STORY ROUTING */
function openStory(storyId) {
  if (!storyId) return;

  window.location.href =
    `story.html?id=${encodeURIComponent(
      storyId
    )}`;
}

/* =========================================================
   EXPLORE
   ========================================================= */

function initializeExplore() {
  const grid =
    document.querySelector(
      "#exploreStoryGrid"
    );

  if (!grid) return;

  initializeExploreFilters();
  initializeExploreSearch();

  renderExploreStories(
    getFilteredStories()
  );
}

/* DYNAMIC EXPLORE FILTERS */
function initializeExploreFilters() {
  const filterButtons =
    document.querySelectorAll(
      ".filter-button"
    );

  filterButtons.forEach(button => {
    button.onclick = () => {
      filterButtons.forEach(item => {
        item.classList.remove(
          "active"
        );
      });

      button.classList.add(
        "active"
      );

      FEELFRAME.filters.campaign =
        button.dataset.filter ||
        "all";

      renderExploreStories(
        getFilteredStories()
      );
    };
  });

  const campaignContainer =
    document.querySelector(
      "#campaignFilters"
    );

  if (campaignContainer) {
    renderDynamicCampaignFilters(
      campaignContainer
    );
  }

  const emotionContainer =
    document.querySelector(
      "#emotionFilters"
    );

  if (emotionContainer) {
    renderDynamicEmotionFilters(
      emotionContainer
    );
  }
}

function renderDynamicCampaignFilters(
  container
) {
  const campaigns =
    getUniqueValues(
      FEELFRAME.stories,
      "campaign"
    );

  container.innerHTML = `
    <button
      type="button"
      class="filter-button active"
      data-filter="all"
    >
      All
    </button>

    ${campaigns
      .map(
        campaign => `
          <button
            type="button"
            class="filter-button"
            data-filter="${escapeHTML(
              campaign
            )}"
          >
            ${escapeHTML(
              campaign
            )}
          </button>
        `
      )
      .join("")}
  `;

  container
    .querySelectorAll(
      ".filter-button"
    )
    .forEach(button => {
      button.onclick = () => {
        container
          .querySelectorAll(
            ".filter-button"
          )
          .forEach(item => {
            item.classList.remove(
              "active"
            );
          });

        button.classList.add(
          "active"
        );

        FEELFRAME.filters.campaign =
          button.dataset.filter ||
          "all";

        renderExploreStories(
          getFilteredStories()
        );
      };
    });
}

function renderDynamicEmotionFilters(
  container
) {
  const emotions =
    getUniqueValues(
      FEELFRAME.stories,
      "emotion"
    );

  container.innerHTML = `
    <button
      type="button"
      class="filter-button active"
      data-emotion-filter="all"
    >
      All emotions
    </button>

    ${emotions
      .map(
        emotion => `
          <button
            type="button"
            class="filter-button"
            data-emotion-filter="${escapeHTML(
              emotion
            )}"
          >
            ${escapeHTML(
              emotion
            )}
          </button>
        `
      )
      .join("")}
  `;

  container
    .querySelectorAll(
      "[data-emotion-filter]"
    )
    .forEach(button => {
      button.onclick = () => {
        container
          .querySelectorAll(
            "[data-emotion-filter]"
          )
          .forEach(item => {
            item.classList.remove(
              "active"
            );
          });

        button.classList.add(
          "active"
        );

        FEELFRAME.filters.emotion =
          button.dataset
            .emotionFilter ||
          "all";

        renderExploreStories(
          getFilteredStories()
        );
      };
    });
}

/* EXPLORE SEARCH */
function initializeExploreSearch() {
  const search =
    document.querySelector(
      "#exploreSearch"
    );

  if (!search) return;

  search.addEventListener(
    "input",
    () => {
      FEELFRAME.filters.search =
        search.value.trim();

      renderExploreStories(
        getFilteredStories()
      );
    }
  );
}

/* FILTER ENGINE */
function getFilteredStories() {
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
    story => {
      const storyCampaign =
        normalize(
          story.campaign
        );

      const storyEmotion =
        normalize(
          story.emotion
        );

      const campaignMatch =
        campaign === "all" ||
        storyCampaign ===
          campaign;

      const emotionMatch =
        emotion === "all" ||
        storyEmotion ===
          emotion;

      if (
        !campaignMatch ||
        !emotionMatch
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      const searchable = [
        story.title,
        story.quote,
        story.context,
        story.description,
        story.campaign,
        story.emotion,
        story.moment,
        story.style,
        story.promptTitle
      ]
        .filter(Boolean)
        .join(" ");

      return normalize(
        searchable
      ).includes(search);
    }
  );
}

/* EXPLORE RENDERING */
function renderExploreStories(
  stories
) {
  const grid =
    document.querySelector(
      "#exploreStoryGrid"
    );

  if (!grid) return;

  const count =
    document.querySelector(
      "#exploreResultCount"
    );

  const activeFilter =
    document.querySelector(
      "#exploreActiveFilter"
    );

  if (!stories.length) {
    renderEmptyState(
      grid,
      "No stories found.",
      "Try another campaign, emotion or search."
    );
  } else {
    grid.innerHTML =
      stories
        .map(createStoryCard)
        .join("");

    initializeStoryCardLinks(
      grid
    );
  }

  if (count) {
    count.textContent =
      `${stories.length} ${
        stories.length === 1
          ? "story"
          : "stories"
      }`;
  }

  if (activeFilter) {
    const activeButton =
      document.querySelector(
        ".filter-button.active"
      );

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
    document.querySelector(
      "#storyContent"
    );

  if (!container) return;

  const params =
    new URLSearchParams(
      window.location.search
    );

  const storyId =
    params.get("id");

  const story =
    FEELFRAME.stories.find(
      item =>
        String(item.id) ===
        String(storyId)
    );

  if (!story) {
    renderStoryNotFound(
      container
    );

    return;
  }

  renderStory(
    container,
    story
  );
}

/* STORY RENDERING */
function renderStory(
  container,
  story
) {
  const oldPrice =
    Number(
      story.compareAt || 0
    );

  const currentPrice =
    Number(
      story.price || 0
    );

  const hasSelar =
    isValidPurchaseURL(
      story.selarUrl
    );

  container.innerHTML = `
    <div class="story-layout">
      <div class="story-visual">
        <img
          src="${escapeHTML(
            story.image || ""
          )}"
          alt="${escapeHTML(
            story.title ||
            "FeelFrame visual"
          )}"
          draggable="false"
          onerror="handleImageError(this)"
        >
      </div>

      <article class="story-copy">
        ${
          story.campaign
            ? `
              <div class="story-campaign">
                ${escapeHTML(
                  story.campaign
                )}
              </div>
            `
            : ""
        }

        <h1 class="story-title">
          ${escapeHTML(
            story.title || ""
          )}
        </h1>

        ${
          story.quote
            ? `
              <p class="story-quote">
                “${escapeHTML(
                  story.quote
                )}”
              </p>
            `
            : ""
        }

        ${
          story.description
            ? `
              <p class="story-description">
                ${escapeHTML(
                  story.description
                )}
              </p>
            `
            : ""
        }

        ${
          story.context
            ? `
              <div class="story-context">
                ${escapeHTML(
                  story.context
                )}
              </div>
            `
            : ""
        }

        ${
          story.moment ||
          story.emotion ||
          story.style
            ? createStoryMeta(
                story
              )
            : ""
        }

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

/* STORY META */
function createStoryMeta(
  story
) {
  const values = [
    story.emotion,
    story.moment,
    story.style
  ].filter(Boolean);

  if (!values.length) {
    return "";
  }

  return `
    <div class="story-meta">
      ${values
        .map(
          value =>
            `<span class="story-tag">${escapeHTML(
              value
            )}</span>`
        )
        .join("")}
    </div>
  `;
}

/* PROMPT PRODUCT */
function createPromptProduct(
  story,
  oldPrice,
  currentPrice,
  hasSelar
) {
  const currency =
    FEELFRAME.site.currency ||
    "NGN";

  return `
    <section
      class="prompt-product"
      aria-label="FeelFrame product"
    >
      <div class="prompt-product-label">
        🔐 Paid creative prompt
      </div>

      <h3>
        ${escapeHTML(
          story.promptTitle
        )}
      </h3>

      <p class="prompt-product-description">
        The creative prompt behind this visual.
      </p>

      <div class="prompt-price-row">
        ${
          oldPrice > currentPrice
            ? `
              <span
                class="prompt-old-price"
                aria-label="Original price"
              >
                ${formatCurrency(
                  oldPrice,
                  currency
                )}
              </span>
            `
            : ""
        }

        ${
          currentPrice
            ? `
              <span
                class="prompt-current-price"
                aria-label="Current price"
              >
                ${formatCurrency(
                  currentPrice,
                  currency
                )}
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
              href="${escapeHTML(
                story.selarUrl
              )}"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get ${escapeHTML(
                story.promptTitle
              )}"
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
              title="Checkout link will be added soon"
            >
              Checkout coming soon
            </button>
          `
      }
    </section>
  `;
}

/* STORY NOT FOUND */
function renderStoryNotFound(
  container
) {
  container.innerHTML = `
    <div class="empty-state">
      <h2>Story not found.</h2>

      <p>
        This visual story may have moved
        or no longer exists.
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
    document.querySelector(
      "#feelFrameForm"
    );

  if (!form) return;

  if (
    form.dataset.initialized ===
    "true"
  ) {
    return;
  }

  form.addEventListener(
    "submit",
    event => {
      event.preventDefault();
      handleCreateSubmission(
        form
      );
    }
  );

  form.dataset.initialized =
    "true";
}

/* CHOICE CARDS */
function initializeChoiceCards() {
  document
    .querySelectorAll(
      ".choice-card"
    )
    .forEach(card => {
      const input =
        card.querySelector(
          "input"
        );

      if (!input) return;

      card.addEventListener(
        "click",
        event => {
          if (
            event.target !==
            input
          ) {
            input.checked = true;
          }

          updateChoiceGroup(
            input
          );
        }
      );

      input.addEventListener(
        "change",
        () => {
          updateChoiceGroup(
            input
          );
        }
      );

      if (input.checked) {
        updateChoiceGroup(
          input
        );
      }
    });
}

function updateChoiceGroup(
  input
) {
  const name =
    input.name;

  document
    .querySelectorAll(
      `.choice-card input[name="${CSS.escape(
        name
      )}"]`
    )
    .forEach(item => {
      const card =
        item.closest(
          ".choice-card"
        );

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
    document.querySelector(
      "#referenceImage"
    );

  const preview =
    document.querySelector(
      "#referencePreview"
    );

  const previewImage =
    document.querySelector(
      "#referencePreview img"
    );

  if (
    !input ||
    !preview ||
    !previewImage
  ) {
    return;
  }

  input.addEventListener(
    "change",
    () => {
      const file =
        input.files?.[0];

      if (!file) {
        preview.classList.remove(
          "active"
        );

        previewImage.removeAttribute(
          "src"
        );

        return;
      }

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        input.value = "";

        preview.classList.remove(
          "active"
        );

        return;
      }

      const reader =
        new FileReader();

      reader.onload =
        event => {
          previewImage.src =
            event.target.result;

          preview.classList.add(
            "active"
          );
        };

      reader.onerror = () => {
        input.value = "";

        preview.classList.remove(
          "active"
        );

        previewImage.removeAttribute(
          "src"
        );
      };

      reader.readAsDataURL(
        file
      );
    }
  );
}

/* =========================================================
   CREATE SUBMISSION
   ========================================================= */

function handleCreateSubmission(
  form
) {
  const formData =
    new FormData(form);

  const name =
    getFormValue(
      formData,
      "name"
    );

  const school =
    getFormValue(
      formData,
      "school"
    );

  const course =
    getFormValue(
      formData,
      "course"
    );

  const moment =
    getFormValue(
      formData,
      "moment"
    );

  const feeling =
    getFormValue(
      formData,
      "feeling"
    );

  const context =
    getFormValue(
      formData,
      "context"
    );

  const message =
    getFormValue(
      formData,
      "message"
    );

  const visualLanguage =
    getFormValue(
      formData,
      "visualLanguage"
    );

  const missingFields = [];

  if (!name) {
    missingFields.push(
      "Name"
    );
  }

  if (!school) {
    missingFields.push(
      "University / School"
    );
  }

  if (!course) {
    missingFields.push(
      "Course / Field"
    );
  }

  if (!moment) {
    missingFields.push(
      "Moment"
    );
  }

  if (!feeling) {
    missingFields.push(
      "Feeling"
    );
  }

  if (!context) {
    missingFields.push(
      "What you're going through"
    );
  }

  if (!message) {
    missingFields.push(
      "What you want the image to communicate"
    );
  }

  if (!visualLanguage) {
    missingFields.push(
      "Visual language"
    );
  }

  if (missingFields.length) {
    alert(
      `Please complete:\n\n${missingFields.join(
        "\n"
      )}`
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
    document.querySelector(
      "#referenceImage"
    );

  const referenceFile =
    referenceInput?.files?.[0];

  const referenceText =
    referenceFile
      ? `User will attach reference image: ${referenceFile.name}`
      : "No reference image supplied.";

  const whatsappMessage =
    buildWhatsAppMessage({
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
      FEELFRAME.site
        .whatsappNumber ||
        ""
    ).replace(
      /\D/g,
      ""
    );

  if (!whatsappNumber) {
    alert(
      "FeelFrame WhatsApp contact is not configured yet."
    );

    return;
  }

  const whatsappURL =
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      whatsappMessage
    )}`;

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
  return {
    emotion:
      emotionTranslator(
        feeling
      ),

    condition:
      conditionTranslator(
        feeling,
        context
      ),

    style:
      styleTranslator(
        visualLanguage
      )
  };
}

/* EMOTION TRANSLATOR */
function emotionTranslator(
  feeling
) {
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
      "renewal, reflection and a fresh beginning",

    "Curious":
      "curiosity, discovery and openness",

    "Reflective":
      "introspection, meaning and emotional depth",

    "Bold":
      "confidence, expression and creative presence",

    "Ambitious":
      "aspiration, momentum and future-focused energy",

    "Inspired":
      "creative energy and possibility"
  };

  return (
    map[feeling] ||
    "authentic human emotion"
  );
}

/* CONDITION TRANSLATOR */
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
      "reflective, calm and ready for change",

    "Curious":
      "observant, open and intrigued",

    "Reflective":
      "thoughtful, present and emotionally aware",

    "Bold":
      "expressive, assured and visually intentional",

    "Ambitious":
      "focused, future-oriented and driven",

    "Inspired":
      "creative, energetic and possibility-focused"
  };

  const emotionalCondition =
    base[feeling] ||
    "present and emotionally authentic";

  return `${emotionalCondition}. Context: ${truncate(
    context,
    220
  )}`;
}

/* STYLE TRANSLATOR */
function styleTranslator(
  style
) {
  const map = {
    "Cinematic":
      "cinematic realism, controlled lighting, natural depth and filmic composition",

    "Cinematic Editorial":
      "cinematic editorial photography, sophisticated art direction, controlled depth and premium composition",

    "Editorial":
      "premium editorial photography, sophisticated composition and magazine-level art direction",

    "Luxury":
      "refined luxury visual language, polished composition and understated sophistication",

    "Film":
      "35mm film character, natural imperfections, organic grain and cinematic framing",

    "Dreamlike":
      "dreamlike atmosphere, poetic composition, soft visual transitions and subtle surrealism",

    "Dark & Moody":
      "moody low-key lighting, rich shadows, intimate framing and atmospheric depth",

    "Golden Hour":
      "warm golden-hour illumination, natural backlight, soft highlights and cinematic atmosphere",

    "3D":
      "dimensional 3D composition, realistic depth, controlled perspective and commercial visual design",

    "Commercial":
      "premium commercial art direction, controlled composition, product-style lighting and polished visual hierarchy",

    "Futuristic":
      "futuristic editorial design, controlled light, glass and digital surfaces, cinematic depth",

    "Fine Art":
      "fine-art portraiture, tactile texture, restrained composition and gallery-inspired visual language",

    "Fashion":
      "high-fashion editorial direction, considered styling, sophisticated lighting and magazine composition"
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

    "Cinematic Editorial": [
      "/cinematic",
      "/editorial",
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
    ],

    "Golden Hour": [
      "/goldenhour",
      "/backlight",
      "/35mmfilm"
    ],

    "3D": [
      "/3ddepth",
      "/cinematic",
      "/editorial"
    ],

    "Commercial": [
      "/commercial",
      "/editorial",
      "/controlledlighting"
    ],

    "Futuristic": [
      "/futuristic",
      "/cinematic",
      "/rimlight"
    ],

    "Fine Art": [
      "/fineart",
      "/softlighting",
      "/35mmfilm"
    ],

    "Fashion": [
      "/fashion",
      "/editorial",
      "/magazinecover"
    ]
  };

  if (
    styleCommands[
      visualLanguage
    ]
  ) {
    commands.push(
      ...styleCommands[
        visualLanguage
      ]
    );
  }

  const feelingCommands = {
    "Determined":
      "/lowangle",

    "Exhausted":
      "/closeup",

    "Proud":
      "/backlight",

    "Hopeful":
      "/sunrise",

    "Confident":
      "/lowangle",

    "Starting Again":
      "/softlighting",

    "Curious":
      "/wideangle",

    "Reflective":
      "/softlighting",

    "Bold":
      "/lowangle",

    "Ambitious":
      "/lowangle",

    "Inspired":
      "/backlight"
  };

  if (
    feelingCommands[
      feeling
    ]
  ) {
    commands.push(
      feelingCommands[
        feeling
      ]
    );
  }

  return [
    ...new Set(commands)
  ];
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

/* FORM HELPERS */
function getFormValue(
  formData,
  name
) {
  const value =
    formData.get(name);

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}

/* =========================================================
   CURRENCY
   ========================================================= */

function formatNaira(
  amount
) {
  return formatCurrency(
    amount,
    "NGN"
  );
}

function formatCurrency(
  amount,
  currency = "NGN"
) {
  const number =
    Number(amount);

  if (
    !Number.isFinite(number)
  ) {
    return "₦0";
  }

  try {
    return new Intl.NumberFormat(
      "en-NG",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 0
      }
    ).format(number);
  } catch (error) {
    return `${currency} ${number.toLocaleString()}`;
  }
}

/* =========================================================
   NORMALIZATION
   ========================================================= */

function normalize(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}

/* =========================================================
   UNIQUE VALUES
   ========================================================= */

function getUniqueValues(
  stories,
  property
) {
  return [
    ...new Set(
      stories
        .map(
          story =>
            String(
              story[property] ||
                ""
            ).trim()
        )
        .filter(Boolean)
    )
  ].sort(
    (a, b) =>
      a.localeCompare(b)
  );
}

/* =========================================================
   TRUNCATION
   ========================================================= */

function truncate(
  value,
  length
) {
  const text =
    String(value || "");

  if (
    text.length <= length
  ) {
    return text;
  }

  return (
    text
      .slice(0, length)
      .trim() + "…"
  );
}

/* =========================================================
   PURCHASE URL VALIDATION
   ========================================================= */

function isValidPurchaseURL(
  url
) {
  if (!url) return false;

  if (
    url ===
    "REAL-SELAR-LINK"
  ) {
    return false;
  }

  try {
    const parsed =
      new URL(url);

    return (
      parsed.protocol ===
        "https:" &&
      Boolean(
        parsed.hostname
      )
    );
  } catch {
    return false;
  }
}

/* =========================================================
   IMAGE ERROR HANDLING
   ========================================================= */

function handleImageError(
  image
) {
  if (!image) return;

  image.onerror = null;

  image.classList.add(
    "image-error"
  );

  image.alt =
    "FeelFrame visual unavailable";
}

/* =========================================================
   EMPTY STATES
   ========================================================= */

function renderEmptyState(
  container,
  title,
  message
) {
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <h2>${escapeHTML(
        title
      )}</h2>

      <p>${escapeHTML(
        message
      )}</p>
    </div>
  `;
}

/* =========================================================
   SECURITY
   ========================================================= */

function escapeHTML(
  value
) {
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

  targets.forEach(
    selector => {
      const element =
        document.querySelector(
          selector
        );

      if (!element) return;

      renderEmptyState(
        element,
        "Something went wrong.",
        "FeelFrame could not load its visual stories. Please refresh the page."
      );
    }
  );
}
