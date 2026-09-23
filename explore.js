/* =========================================================
   FEELFRAME™ — EXPLORE / STOREFRONT
   explore.js
   ========================================================= */

"use strict";


/* =========================================================
   01. CONFIG
   ========================================================= */

const DATA_URL = "./explore.json";


/* =========================================================
   02. DOM
   ========================================================= */

const DOM = {
  pageTitle: document.getElementById("page-title"),
  metaDescription: document.getElementById("meta-description"),
  metaKeywords: document.getElementById("meta-keywords"),

  siteNames: document.querySelectorAll("[data-site-name]"),

  desktopNavigation:
    document.getElementById("desktop-navigation"),

  primaryAction:
    document.querySelector("[data-primary-action]"),

  heroEyebrow:
    document.getElementById("hero-eyebrow"),

  heroTitle:
    document.getElementById("hero-title"),

  heroSubtitle:
    document.getElementById("hero-subtitle"),

  heroDescription:
    document.getElementById("hero-description"),

  heroPrimary:
    document.querySelector("[data-hero-primary]"),

  heroSecondary:
    document.querySelector("[data-hero-secondary]"),

  bookshelfEyebrow:
    document.getElementById("bookshelf-eyebrow"),

  bookshelfTitle:
    document.getElementById("bookshelf-title"),

  bookshelfDescription:
    document.getElementById("bookshelf-description"),

  bookshelfGrid:
    document.getElementById("bookshelf-grid"),

  bookshelfEmpty:
    document.getElementById("bookshelf-empty"),

  aboutEyebrow:
    document.getElementById("about-eyebrow"),

  aboutTitle:
    document.getElementById("about-title"),

  aboutText:
    document.getElementById("about-text"),

  faqList:
    document.getElementById("faq-list"),

  disclaimer:
    document.getElementById("disclaimer-text"),

  footerCopyright:
    document.getElementById("footer-copyright"),

  privacyLink:
    document.getElementById("privacy-link"),

  modal:
    document.getElementById("product-modal"),

  modalClose:
    document.getElementById("modal-close"),

  modalCover:
    document.getElementById("modal-cover"),

  modalBadge:
    document.getElementById("modal-badge"),

  modalNumber:
    document.getElementById("modal-number"),

  modalTitle:
    document.getElementById("modal-title"),

  modalDescription:
    document.getElementById("modal-description"),

  modalTags:
    document.getElementById("modal-tags"),

  modalHighlights:
    document.getElementById("modal-highlights-list"),

  modalPrice:
    document.getElementById("modal-price"),

  modalBuy:
    document.getElementById("modal-buy")
};


/* =========================================================
   03. STORE STATE
   ========================================================= */

let storeData = null;

let books = [];


/* =========================================================
   04. INITIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", init);


async function init() {

  try {

    const response = await fetch(DATA_URL, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(
        `Unable to load ${DATA_URL}`
      );
    }

    storeData = await response.json();

    books = Array.isArray(
      storeData?.bookshelf?.books
    )
      ? storeData.bookshelf.books
      : [];

    renderSiteMeta();
    renderNavigation();
    renderHero();
    renderBookshelf();
    renderAbout();
    renderFAQ();
    renderDisclaimer();
    renderFooter();

    bindGlobalEvents();

  } catch (error) {

    console.error(
      "FeelFrame™ storefront error:",
      error
    );

    showLoadError();

  }

}


/* =========================================================
   05. SITE META
   ========================================================= */

function renderSiteMeta() {

  const site = storeData.site || {};
  const seo = storeData.seo || {};

  const siteName =
    site.name || "FeelFrame™";

  const title =
    seo.title || siteName;

  const description =
    seo.description || "";

  const keywords =
    Array.isArray(seo.keywords)
      ? seo.keywords.join(", ")
      : "";

  document.documentElement.lang =
    site.language || "en";

  document.title = title;

  if (DOM.pageTitle) {
    DOM.pageTitle.textContent = title;
  }

  if (DOM.metaDescription) {
    DOM.metaDescription.setAttribute(
      "content",
      description
    );
  }

  if (DOM.metaKeywords) {
    DOM.metaKeywords.setAttribute(
      "content",
      keywords
    );
  }

  DOM.siteNames.forEach((element) => {
    element.textContent = siteName;
  });

}


/* =========================================================
   06. NAVIGATION
   ========================================================= */

function renderNavigation() {

  const navigation =
    storeData.navigation || {};

  const links =
    Array.isArray(navigation.links)
      ? navigation.links
      : [];

  DOM.desktopNavigation.innerHTML = "";

  links.forEach((link) => {

    if (!link?.label || !link?.target) {
      return;
    }

    const anchor =
      document.createElement("a");

    anchor.href = link.target;
    anchor.textContent = link.label;

    DOM.desktopNavigation.appendChild(
      anchor
    );

  });

  if (
    navigation.primaryAction &&
    DOM.primaryAction
  ) {

    DOM.primaryAction.textContent =
      navigation.primaryAction.label || "Shop Now";

    DOM.primaryAction.href =
      navigation.primaryAction.target || "#bookshelf";

  }

}


/* =========================================================
   07. HERO
   ========================================================= */

function renderHero() {

  const hero =
    storeData.hero || {};

  DOM.heroEyebrow.textContent =
    hero.eyebrow || "";

  DOM.heroTitle.textContent =
    hero.title || "";

  DOM.heroSubtitle.textContent =
    hero.subtitle || "";

  DOM.heroDescription.textContent =
    hero.description || "";

  DOM.heroPrimary.textContent =
    hero.primaryCTA || "Shop Now";

  DOM.heroSecondary.textContent =
    hero.secondaryCTA || "View Collection";

  DOM.heroPrimary.href =
    "#bookshelf";

  DOM.heroSecondary.href =
    "#bookshelf";

}


/* =========================================================
   08. BOOKSHELF
   ========================================================= */

function renderBookshelf() {

  const bookshelf =
    storeData.bookshelf || {};

  DOM.bookshelfEyebrow.textContent =
    bookshelf.eyebrow || "";

  DOM.bookshelfTitle.textContent =
    bookshelf.title || "";

  DOM.bookshelfDescription.textContent =
    bookshelf.description || "";

  DOM.bookshelfGrid.innerHTML = "";

  if (!books.length) {

    DOM.bookshelfEmpty.hidden = false;

    return;

  }

  DOM.bookshelfEmpty.hidden = true;

  const sortedBooks =
    [...books].sort(
      sortFeaturedFirst
    );

  sortedBooks.forEach((book, index) => {

    const card =
      createBookCard(book, index);

    DOM.bookshelfGrid.appendChild(card);

  });

}


/* =========================================================
   09. PRODUCT CARD
   ========================================================= */

function createBookCard(book, index) {

  const article =
    document.createElement("article");

  article.className = "product-card";

  article.dataset.bookId =
    book.id || "";

  article.style.animationDelay =
    `${Math.min(index * 80, 500)}ms`;


  /* -----------------------------------------
     Cover
  ----------------------------------------- */

  const coverWrap =
    document.createElement("div");

  coverWrap.className =
    "product-cover-wrap";


  const image =
    document.createElement("img");

  image.className =
    "product-cover";

  image.src =
    book.cover || "";

  image.alt =
    book.title
      ? `${book.title} cover`
      : "Book cover";

  image.loading =
    index < 2
      ? "eager"
      : "lazy";

  image.decoding =
    "async";


  const overlay =
    document.createElement("div");

  overlay.className =
    "product-cover-overlay";


  const viewButton =
    document.createElement("button");

  viewButton.type =
    "button";

  viewButton.className =
    "product-view";

  viewButton.textContent =
    "View Details";

  viewButton.addEventListener(
    "click",
    () => openProduct(book)
  );


  overlay.appendChild(
    viewButton
  );

  coverWrap.appendChild(image);
  coverWrap.appendChild(overlay);


  /* -----------------------------------------
     Information
  ----------------------------------------- */

  const information =
    document.createElement("div");

  information.className =
    "product-information";


  const topline =
    document.createElement("div");

  topline.className =
    "product-topline";


  if (book.badge) {

    const badge =
      document.createElement("span");

    badge.className =
      "product-badge";

    badge.textContent =
      book.badge;

    topline.appendChild(badge);

  } else {

    const spacer =
      document.createElement("span");

    spacer.className =
      "product-badge";

    spacer.style.visibility =
      "hidden";

    spacer.textContent =
      "BOOK";

    topline.appendChild(spacer);

  }


  const number =
    document.createElement("span");

  number.className =
    "product-number";

  number.textContent =
    book.number
      ? `NO. ${book.number}`
      : "";

  topline.appendChild(number);


  const title =
    document.createElement("h3");

  title.className =
    "product-title";

  title.textContent =
    book.title || "Untitled";


  const description =
    document.createElement("p");

  description.className =
    "product-description";

  description.textContent =
    book.shortDescription || "";


  information.appendChild(topline);
  information.appendChild(title);
  information.appendChild(description);


  /* -----------------------------------------
     Hook
  ----------------------------------------- */

  if (book.hook) {

    const hook =
      document.createElement("p");

    hook.className =
      "product-hook";

    hook.textContent =
      book.hook;

    information.appendChild(hook);

  }


  /* -----------------------------------------
     Tags
  ----------------------------------------- */

  if (
    Array.isArray(book.tags) &&
    book.tags.length
  ) {

    const tags =
      document.createElement("div");

    tags.className =
      "product-tags";

    book.tags.forEach((tag) => {

      const tagElement =
        document.createElement("span");

      tagElement.className =
        "product-tag";

      tagElement.textContent =
        tag;

      tags.appendChild(
        tagElement
      );

    });

    information.appendChild(tags);

  }


  /* -----------------------------------------
     Bottom / Purchase
  ----------------------------------------- */

  const bottom =
    document.createElement("div");

  bottom.className =
    "product-bottom";


  const price =
    document.createElement("div");

  price.className =
    "product-price";


  const priceLabel =
    document.createElement("span");

  priceLabel.className =
    "product-price-label";

  priceLabel.textContent =
    "Digital Edition";


  const priceValue =
    document.createElement("strong");

  priceValue.className =
    "product-price-value";

  priceValue.textContent =
    book.price || "See current price";


  price.appendChild(
    priceLabel
  );

  price.appendChild(
    priceValue
  );


  const actions =
    document.createElement("div");

  actions.className =
    "product-actions";


  const infoButton =
    document.createElement("button");

  infoButton.type =
    "button";

  infoButton.className =
    "product-info-button";

  infoButton.textContent =
    "Details";

  infoButton.addEventListener(
    "click",
    () => openProduct(book)
  );


  const buyButton =
    document.createElement("a");

  buyButton.className =
    "product-buy-button";

  buyButton.textContent =
    book.cta || "Get the Book";

  buyButton.href =
    book.checkout || "#";

  buyButton.target =
    "_blank";

  buyButton.rel =
    "noopener noreferrer";


  actions.appendChild(
    infoButton
  );

  actions.appendChild(
    buyButton
  );


  bottom.appendChild(price);
  bottom.appendChild(actions);

  information.appendChild(bottom);


  article.appendChild(coverWrap);
  article.appendChild(information);


  return article;

}


/* =========================================================
   10. PRODUCT SORT
   ========================================================= */

function sortFeaturedFirst(a, b) {

  if (a.featured && !b.featured) {
    return -1;
  }

  if (!a.featured && b.featured) {
    return 1;
  }

  return (
    Number(a.number || 999) -
    Number(b.number || 999)
  );

}


/* =========================================================
   11. PRODUCT MODAL
   ========================================================= */

function openProduct(book) {

  if (!book || !DOM.modal) {
    return;
  }

  DOM.modalCover.src =
    book.cover || "";

  DOM.modalCover.alt =
    book.title
      ? `${book.title} cover`
      : "Book cover";


  /* Badge */

  if (book.badge) {

    DOM.modalBadge.textContent =
      book.badge;

    DOM.modalBadge.style.display =
      "inline-flex";

  } else {

    DOM.modalBadge.style.display =
      "none";

  }


  /* Number */

  DOM.modalNumber.textContent =
    book.number
      ? `NO. ${book.number}`
      : "";


  /* Main information */

  DOM.modalTitle.textContent =
    book.title || "";

  DOM.modalDescription.textContent =
    book.shortDescription || "";


  /* Tags */

  DOM.modalTags.innerHTML = "";

  if (
    Array.isArray(book.tags)
  ) {

    book.tags.forEach((tag) => {

      const element =
        document.createElement("span");

      element.className =
        "product-tag";

      element.textContent =
        tag;

      DOM.modalTags.appendChild(
        element
      );

    });

  }


  /* Highlights */

  DOM.modalHighlights.innerHTML = "";

  if (
    Array.isArray(book.highlights)
  ) {

    book.highlights.forEach(
      (highlight) => {

        const li =
          document.createElement("li");

        li.textContent =
          highlight;

        DOM.modalHighlights.appendChild(
          li
        );

      }
    );

  }


  /* Price */

  DOM.modalPrice.textContent =
    book.price || "See current price";


  /* Checkout */

  DOM.modalBuy.textContent =
    book.cta || "Get the Book";

  DOM.modalBuy.href =
    book.checkout || "#";


  DOM.modal.classList.add(
    "active"
  );

  DOM.modal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "modal-open"
  );

  DOM.modalClose.focus();

}


/* =========================================================
   12. CLOSE PRODUCT MODAL
   ========================================================= */

function closeProduct() {

  if (!DOM.modal) {
    return;
  }

  DOM.modal.classList.remove(
    "active"
  );

  DOM.modal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "modal-open"
  );

}


/* =========================================================
   13. ABOUT
   ========================================================= */

function renderAbout() {

  const about =
    storeData.about || {};

  DOM.aboutEyebrow.textContent =
    about.eyebrow || "";

  DOM.aboutTitle.textContent =
    about.title || "";

  DOM.aboutText.textContent =
    about.text || "";

}


/* =========================================================
   14. FAQ
   ========================================================= */

function renderFAQ() {

  const faq =
    storeData.faq || {};

  const items =
    Array.isArray(faq.items)
      ? faq.items
      : [];

  DOM.faqList.innerHTML = "";

  items.forEach((item, index) => {

    if (
      !item?.question ||
      !item?.answer
    ) {
      return;
    }

    const wrapper =
      document.createElement("div");

    wrapper.className =
      "faq-item";

    if (index === 0) {
      wrapper.classList.add("open");
    }


    const question =
      document.createElement("button");

    question.type =
      "button";

    question.className =
      "faq-question";

    question.setAttribute(
      "aria-expanded",
      index === 0
        ? "true"
        : "false"
    );


    const questionText =
      document.createElement("span");

    questionText.textContent =
      item.question;


    const icon =
      document.createElement("span");

    icon.className =
      "faq-icon";

    icon.setAttribute(
      "aria-hidden",
      "true"
    );


    question.appendChild(
      questionText
    );

    question.appendChild(
      icon
    );


    const answer =
      document.createElement("div");

    answer.className =
      "faq-answer";


    const answerInner =
      document.createElement("div");

    answerInner.className =
      "faq-answer-inner";


    const answerText =
      document.createElement("p");

    answerText.textContent =
      item.answer;


    answerInner.appendChild(
      answerText
    );

    answer.appendChild(
      answerInner
    );


    question.addEventListener(
      "click",
      () => {

        const isOpen =
          wrapper.classList.contains(
            "open"
          );

        closeAllFAQs();

        if (!isOpen) {

          wrapper.classList.add(
            "open"
          );

          question.setAttribute(
            "aria-expanded",
            "true"
          );

        }

      }
    );


    wrapper.appendChild(question);
    wrapper.appendChild(answer);

    DOM.faqList.appendChild(
      wrapper
    );

  });

}


/* =========================================================
   15. CLOSE ALL FAQ ITEMS
   ========================================================= */

function closeAllFAQs() {

  const items =
    DOM.faqList.querySelectorAll(
      ".faq-item"
    );

  items.forEach((item) => {

    item.classList.remove(
      "open"
    );

    const button =
      item.querySelector(
        ".faq-question"
      );

    if (button) {

      button.setAttribute(
        "aria-expanded",
        "false"
      );

    }

  });

}


/* =========================================================
   16. DISCLAIMER
   ========================================================= */

function renderDisclaimer() {

  const disclaimer =
    storeData.disclaimer || {};

  DOM.disclaimer.textContent =
    disclaimer.text || "";

}


/* =========================================================
   17. FOOTER
   ========================================================= */

function renderFooter() {

  const footer =
    storeData.footer || {};

  DOM.footerCopyright.textContent =
    footer.copyright || "";

  if (footer.privacy) {

    DOM.privacyLink.textContent =
      footer.privacy;

  }

}


/* =========================================================
   18. GLOBAL EVENTS
   ========================================================= */

function bindGlobalEvents() {


  /* -----------------------------------------
     Modal close buttons
  ----------------------------------------- */

  document.querySelectorAll(
    "[data-close-modal]"
  ).forEach((element) => {

    element.addEventListener(
      "click",
      closeProduct
    );

  });


  /* -----------------------------------------
     Escape closes modal
  ----------------------------------------- */

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Escape" &&
        DOM.modal.classList.contains(
          "active"
        )
      ) {

        closeProduct();

      }

    }
  );


  /* -----------------------------------------
     Prevent broken checkout links
  ----------------------------------------- */

  document.addEventListener(
    "click",
    (event) => {

      const link =
        event.target.closest(
          "a"
        );

      if (!link) {
        return;
      }

      const href =
        link.getAttribute("href");

      if (
        href === "#" &&
        link.id !== "privacy-link"
      ) {

        event.preventDefault();

      }

    }
  );


  /* -----------------------------------------
     Smooth internal navigation
  ----------------------------------------- */

  document.addEventListener(
    "click",
    (event) => {

      const link =
        event.target.closest(
          'a[href^="#"]'
        );

      if (!link) {
        return;
      }

      const targetId =
        link.getAttribute("href");

      if (
        !targetId ||
        targetId === "#"
      ) {
        return;
      }

      const target =
        document.querySelector(
          targetId
        );

      if (!target) {
        return;
      }

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }
  );

}


/* =========================================================
   19. LOAD ERROR
   ========================================================= */

function showLoadError() {

  if (!DOM.bookshelfGrid) {
    return;
  }

  DOM.bookshelfGrid.innerHTML = "";

  DOM.bookshelfEmpty.hidden =
    false;

  DOM.bookshelfEmpty.innerHTML = `
    <span class="empty-number">!</span>

    <h3>
      The collection could not be loaded.
    </h3>

    <p>
      Please refresh the page and try again.
    </p>
  `;

}


/* =========================================================
   20. IMAGE FALLBACK
   ========================================================= */

document.addEventListener(
  "error",
  (event) => {

    if (
      event.target &&
      event.target.tagName === "IMG"
    ) {

      event.target.classList.add(
        "image-error"
      );

    }

  },
  true
);


/* =========================================================
   21. PUBLIC STORE API
   ========================================================= */

window.FeelFrameStorefront = {

  getData() {
    return storeData;
  },

  getBooks() {
    return [...books];
  },

  openProduct(bookId) {

    const book =
      books.find(
        (item) =>
          item.id === bookId
      );

    if (book) {
      openProduct(book);
    }

  },

  closeProduct() {
    closeProduct();
  }

};
