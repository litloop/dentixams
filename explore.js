/* =========================================================
   FEELFRAME™
   EXPLORE.JS
   Explore Page Application
   ========================================================= */

(() => {

  "use strict";


  /* =======================================================
     DATA SOURCES
  ======================================================= */

  const EXPLORE_CONTENT_URL = "./explore.json";
  const STORIES_CONTENT_URL = "./data.json";


  /* =======================================================
     STATE
  ======================================================= */

  const state = {

    explore: null,

    stories: [],

    featuredStories: [],

    activeFilter: "All"

  };


  /* =======================================================
     HELPERS
  ======================================================= */

  const $ = (
    selector,
    parent = document
  ) => parent.querySelector(selector);


  const $$ = (
    selector,
    parent = document
  ) => Array.from(
    parent.querySelectorAll(selector)
  );


  function setText(
    selector,
    value
  ) {

    const element = $(selector);

    if (!element) {
      return;
    }

    element.textContent =
      value !== undefined &&
      value !== null
        ? String(value)
        : "";

  }


  function escapeHTML(value) {

    return String(value ?? "")

      .replace(/&/g, "&amp;")

      .replace(/</g, "&lt;")

      .replace(/>/g, "&gt;")

      .replace(/"/g, "&quot;")

      .replace(/'/g, "&#039;");

  }


  function safeURL(url) {

    if (
      !url ||
      typeof url !== "string"
    ) {
      return "";
    }


    try {

      const parsed =
        new URL(
          url,
          window.location.href
        );


      if (
        parsed.protocol === "https:" ||
        parsed.protocol === "http:"
      ) {

        return parsed.href;

      }

    } catch (error) {

      return "";

    }


    return "";

  }


  async function loadJSON(url) {

    const response =
      await fetch(
        url,
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        `Unable to load ${url} (${response.status})`
      );

    }


    const data =
      await response.json();


    if (
      !data ||
      typeof data !== "object"
    ) {

      throw new Error(
        `${url} contains invalid JSON.`
      );

    }


    return data;

  }



  /* =======================================================
     META / SEO
     ======================================================= */

  function renderMeta(content) {

    const site =
      content.site || {};

    const seo =
      content.seo || {};


    document.title =
      seo.title ||
      `Explore — ${site.name || "FeelFrame™"}`;


    const descriptionMeta =
      $('meta[name="description"]');


    if (descriptionMeta) {

      descriptionMeta.content =
        seo.description || "";

    }


    const ogTitle =
      $('meta[property="og:title"]');


    if (ogTitle) {

      ogTitle.content =
        seo.title ||
        site.name ||
        "FeelFrame™";

    }


    const ogDescription =
      $('meta[property="og:description"]');


    if (ogDescription) {

      ogDescription.content =
        seo.description || "";

    }


    const themeColor =
      $('meta[name="theme-color"]');


    if (
      themeColor &&
      site.themeColor
    ) {

      themeColor.content =
        site.themeColor;

    }

  }



  /* =======================================================
     NAVIGATION
     ======================================================= */

  function renderNavigation(content) {

    const navigation =
      content.navigation || {};


    const primaryAction =
      navigation.primaryAction;


    const headerCTA =
      $('[data-header-cta]');


    if (
      headerCTA &&
      primaryAction
    ) {

      headerCTA.textContent =
        primaryAction.label ||
        "Create ↗";


      const target =
        safeURL(
          primaryAction.target ||
          "create.html"
        );


      if (target) {

        headerCTA.href =
          target;

      }

    }


    const primaryExploreCTA =
      $('[data-explore-primary-cta]');


    if (
      primaryExploreCTA &&
      navigation.exploreAction
    ) {

      primaryExploreCTA.textContent =
        navigation.exploreAction.label ||
        "Make It Yours";


      primaryExploreCTA.href =
        navigation.exploreAction.target ||
        "create.html";

    }

  }



  /* =======================================================
     HERO
     ======================================================= */

  function renderHero(content) {

    const hero =
      content.hero || {};


    setText(
      "#explore-eyebrow",
      hero.eyebrow ||
      "THE FEELFRAME ARCHIVE"
    );


    setText(
      "#explore-title",
      hero.title ||
      "Moments worth seeing."
    );


    setText(
      "#explore-description",
      hero.description ||
      ""
    );


    const primaryCTA =
      $('[data-explore-primary-cta]');


    if (primaryCTA) {

      primaryCTA.textContent =
        hero.primaryCTA ||
        "Make It Yours";


      primaryCTA.href =
        hero.primaryTarget ||
        "create.html";

    }

  }



  /* =======================================================
     FEATURED SECTION COPY
     ======================================================= */

  function renderFeaturedHeading(content) {

    const featured =
      content.featured || {};


    setText(
      "#featured-eyebrow",
      featured.eyebrow ||
      "FEATURED"
    );


    setText(
      "#featured-title",
      featured.title ||
      "A moment, framed."
    );


    setText(
      "#featured-description",
      featured.description ||
      ""
    );

  }



  /* =======================================================
     FEATURED STORY
     ======================================================= */

  function getFeaturedStories(stories) {

    return stories.filter(
      story =>
        story &&
        story.featured === true
    );

  }


  function renderFeaturedStory(story) {

    const container =
      $("#exploreFeatured");


    if (!container) {
      return;
    }


    if (!story) {

      container.innerHTML = `

        <div class="story-empty">

          <h3>
            No featured story yet.
          </h3>

          <p>
            The FeelFrame archive is waiting for
            its next featured moment.
          </p>

        </div>

      `;

      return;

    }


    const image =
      safeURL(story.image);


    const storyURL =
      `story.html?id=${
        encodeURIComponent(
          story.id || ""
        )
      }`;


    container.innerHTML = `

      <article
        class="explore-featured-card"
        data-story-id="${escapeHTML(story.id)}"
      >


        <a
          href="${storyURL}"
          class="explore-featured-image-link"
          aria-label="Open ${escapeHTML(
            story.title ||
            "FeelFrame story"
          )}"
        >

          <img
            class="explore-featured-image"
            src="${escapeHTML(image)}"
            alt="${escapeHTML(
              story.title ||
              "FeelFrame visual story"
            )}"
            loading="eager"
          >

        </a>


        <div class="explore-featured-content">


          <p class="eyebrow">
            ${escapeHTML(
              story.campaign ||
              "FEATURED"
            )}
          </p>


          <h3>
            ${escapeHTML(
              story.title ||
              ""
            )}
          </h3>


          ${
            story.quote
              ? `
                <blockquote>
                  “${escapeHTML(
                    story.quote
                  )}”
                </blockquote>
              `
              : ""
          }


          <p>
            ${escapeHTML(
              story.description ||
              story.context ||
              ""
            )}
          </p>


          <div class="explore-story-meta">


            ${
              story.emotion
                ? `
                  <span>
                    ${escapeHTML(
                      story.emotion
                    )}
                  </span>
                `
                : ""
            }


            ${
              story.style
                ? `
                  <span>
                    ${escapeHTML(
                      story.style
                    )}
                  </span>
                `
                : ""
            }


          </div>


          <a
            href="${storyURL}"
            class="button button-primary"
          >
            View Story →
          </a>


        </div>


      </article>

    `;


    setupImageFallbacks();

  }



  /* =======================================================
     COLLECTION COPY
     ======================================================= */

  function renderCollectionHeading(content) {

    const collection =
      content.collection || {};


    setText(
      "#collection-eyebrow",
      collection.eyebrow ||
      "THE COLLECTION"
    );


    setText(
      "#collection-title",
      collection.title ||
      "Explore the archive."
    );


    setText(
      "#collection-description",
      collection.description ||
      ""
    );

  }



  /* =======================================================
     FILTERS
     ======================================================= */

  function renderFilters(content) {

    const collection =
      content.collection || {};


    const filters =
      Array.isArray(
        collection.filters
      )
        ? collection.filters
        : [];


    const container =
      $("#exploreFilters");


    if (!container) {
      return;
    }


    container.innerHTML = "";


    filters.forEach(
      filter => {

        const button =
          document.createElement(
            "button"
          );


        button.type = "button";


        button.className =
          "filter-button";


        button.dataset.filter =
          filter;


        button.textContent =
          filter;


        const active =
          filter ===
          state.activeFilter;


        button.classList.toggle(
          "is-active",
          active
        );


        button.setAttribute(
          "aria-pressed",
          String(active)
        );


        container.appendChild(
          button
        );

      }
    );


    bindFilters();

  }



  function bindFilters() {

    $$(".filter-button")
      .forEach(
        button => {

          if (
            button.dataset.bound ===
            "true"
          ) {

            return;

          }


          button.dataset.bound =
            "true";


          button.addEventListener(
            "click",
            () => {

              state.activeFilter =
                button.dataset.filter ||
                "All";


              updateFilterState();


              renderStoryGrid();

            }
          );

        }
      );

  }



  function updateFilterState() {

    $$(".filter-button")
      .forEach(
        button => {

          const active =
            button.dataset.filter ===
            state.activeFilter;


          button.classList.toggle(
            "is-active",
            active
          );


          button.setAttribute(
            "aria-pressed",
            String(active)
          );

        }
      );

  }



  /* =======================================================
     STORY FILTERING
     ======================================================= */

  function getFilteredStories() {

    if (
      state.activeFilter ===
      "All"
    ) {

      return state.stories;

    }


    return state.stories.filter(
      story =>
        story.campaign ===
        state.activeFilter
    );

  }



  /* =======================================================
     STORY GRID
     ======================================================= */

  function renderStoryGrid() {

    const container =
      $("#exploreStoryGrid");


    const empty =
      $("#exploreEmpty");


    if (!container) {
      return;
    }


    const stories =
      getFilteredStories();


    container.innerHTML =
      "";


    setText(
      "#exploreResultCount",
      `${stories.length} ${
        stories.length === 1
          ? "story"
          : "stories"
      }`
    );


    if (!stories.length) {

      if (empty) {
        empty.hidden = false;
      }

      return;

    }


    if (empty) {
      empty.hidden = true;
    }


    stories.forEach(
      story => {

        const card =
          document.createElement(
            "article"
          );


        card.className =
          "story-card";


        const storyURL =
          `story.html?id=${
            encodeURIComponent(
              story.id || ""
            )
          }`;


        const image =
          safeURL(story.image);


        card.innerHTML = `

          <a
            href="${storyURL}"
            class="story-card-link"
            aria-label="Open ${escapeHTML(
              story.title ||
              "FeelFrame story"
            )}"
          >


            <div class="story-card-image-wrap">

              <img
                class="story-card-image"
                src="${escapeHTML(image)}"
                alt="${escapeHTML(
                  story.title ||
                  "FeelFrame visual story"
                )}"
                loading="lazy"
              >

            </div>


            <div class="story-card-content">


              <p class="eyebrow">

                ${escapeHTML(
                  story.campaign ||
                  ""
                )}

              </p>


              <h3 class="story-card-title">

                ${escapeHTML(
                  story.title ||
                  ""
                )}

              </h3>


              <p class="story-card-description">

                ${escapeHTML(
                  story.description ||
                  story.context ||
                  ""
                )}

              </p>


              <div class="story-card-meta">


                ${
                  story.emotion
                    ? `
                      <span>
                        ${escapeHTML(
                          story.emotion
                        )}
                      </span>
                    `
                    : ""
                }


                ${
                  story.style
                    ? `
                      <span>
                        ${escapeHTML(
                          story.style
                        )}
                      </span>
                    `
                    : ""
                }


              </div>


            </div>


          </a>

        `;


        container.appendChild(
          card
        );

      }
    );


    setupImageFallbacks();

  }



  /* =======================================================
     MANIFESTO
     ======================================================= */

  function renderManifesto(content) {

    const manifesto =
      content.manifesto || {};


    setText(
      "#manifesto-eyebrow",
      manifesto.eyebrow ||
      "WHY FEELFRAME"
    );


    setText(
      "#manifesto-title",
      manifesto.title ||
      ""
    );


    setText(
      "#manifesto-text",
      manifesto.text ||
      ""
    );

  }



  /* =======================================================
     FINAL CTA
     ======================================================= */

  function renderCTA(content) {

    const cta =
      content.cta || {};


    setText(
      "#explore-cta-eyebrow",
      cta.eyebrow ||
      "YOUR TURN"
    );


    setText(
      "#explore-cta-title",
      cta.title ||
      "Your moment could be next."
    );


    setText(
      "#explore-cta-description",
      cta.description ||
      ""
    );


    const button =
      $("#explore-cta-button");


    if (!button) {
      return;
    }


    button.textContent =
      cta.button ||
      "Create My FeelFrame";


    button.href =
      cta.target ||
      "create.html";

  }



  /* =======================================================
     IMAGE FALLBACKS
     ======================================================= */

  function setupImageFallbacks() {

    $$("img").forEach(
      image => {

        if (
          image.dataset.fallbackBound ===
          "true"
        ) {

          return;

        }


        image.dataset.fallbackBound =
          "true";


        image.addEventListener(
          "error",
          () => {

            image.classList.add(
              "image-error"
            );


            console.warn(
              "FeelFrame image could not be loaded:",
              image.src
            );

          }
        );

      }
    );

  }



  /* =======================================================
     LOADING STATE
     ======================================================= */

  function showLoading() {

    document.body.classList.add(
      "content-loading"
    );

  }


  function hideLoading() {

    document.body.classList.remove(
      "content-loading"
    );


    document.body.classList.add(
      "content-loaded"
    );

  }



  /* =======================================================
     ERROR STATE
     ======================================================= */

  function showError(error) {

    console.error(
      "FeelFrame Explore error:",
      error
    );


    document.body.classList.remove(
      "content-loading"
    );


    document.body.classList.add(
      "content-error"
    );


    const grid =
      $("#exploreStoryGrid");


    if (grid) {

      grid.innerHTML = `

        <div class="empty-state">

          <h3>
            Explore is temporarily unavailable.
          </h3>

          <p>
            Please refresh the page and try again.
          </p>

        </div>

      `;

    }

  }



  /* =======================================================
     RENDER EVERYTHING
     ======================================================= */

  function renderSite() {

    renderMeta(
      state.explore
    );


    renderNavigation(
      state.explore
    );


    renderHero(
      state.explore
    );


    renderFeaturedHeading(
      state.explore
    );


    renderFeaturedStory(
      state.featuredStories[0]
    );


    renderCollectionHeading(
      state.explore
    );


    renderFilters(
      state.explore
    );


    renderStoryGrid();


    renderManifesto(
      state.explore
    );


    renderCTA(
      state.explore
    );

  }



  /* =======================================================
     INITIALIZATION
     ======================================================= */

  async function init() {

    showLoading();


    try {


      const [
        exploreContent,
        storyContent
      ] = await Promise.all([

        loadJSON(
          EXPLORE_CONTENT_URL
        ),

        loadJSON(
          STORIES_CONTENT_URL
        )

      ]);


      state.explore =
        exploreContent;


      state.stories =
        Array.isArray(
          storyContent.stories
        )
          ? storyContent.stories
          : [];


      /*
        Featured status is independent
        of story order.

        This means a newly added story can
        be placed at index 0 in data.json
        without automatically becoming
        featured unless featured:true.
      */

      state.featuredStories =
        getFeaturedStories(
          state.stories
        );


      renderSite();


      hideLoading();


    } catch (error) {

      showError(
        error
      );

    }

  }



  /* =======================================================
     START
     ======================================================= */

  function start() {

    init();

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      start,
      {
        once: true
      }
    );

  } else {

    start();

  }


})();
