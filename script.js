/* =========================================
   FEELFRAME™
   Main application logic
========================================= */

const WHATSAPP_NUMBER = "2349012728201";

let stories = [];


/* =========================================
   LOAD STORY DATA
========================================= */

async function loadStories() {
  try {
    const response = await fetch("data.json");

    if (!response.ok) {
      throw new Error("Could not load data.json");
    }

    stories = await response.json();

    renderPage();

  } catch (error) {
    console.error(error);

    const boards = [
      document.getElementById("homeBoard"),
      document.getElementById("exploreGrid")
    ];

    boards.forEach(board => {
      if (board) {
        board.innerHTML = `
          <div class="empty-state">
            <p>Stories are loading...</p>
          </div>
        `;
      }
    });
  }
}


/* =========================================
   ROUTER
========================================= */

function renderPage() {

  const page = document.body.dataset.page;

  if (page === "home") {
    renderHome();
  }

  if (page === "explore") {
    renderExplore();
  }

  if (page === "story") {
    renderStory();
  }

  if (page === "create") {
    initialiseCreateForm();
  }
}


/* =========================================
   HOME BOARD
========================================= */

function renderHome() {

  const board = document.getElementById("homeBoard");

  if (!board) return;

  board.innerHTML = stories.map(createStoryCard).join("");
}


/* =========================================
   EXPLORE
========================================= */

function renderExplore() {

  const grid = document.getElementById("exploreGrid");

  if (!grid) return;

  grid.innerHTML = stories.map(createStoryCard).join("");

  const filters = document.querySelectorAll(".filter");

  filters.forEach(button => {

    button.addEventListener("click", () => {

      filters.forEach(item => item.classList.remove("active"));

      button.classList.add("active");

      const filter = button.dataset.filter;

      const filtered =
        filter === "all"
          ? stories
          : stories.filter(story => story.campaign === filter);

      grid.innerHTML = filtered.map(createStoryCard).join("");

    });

  });
}


/* =========================================
   STORY CARD
========================================= */

function createStoryCard(story) {

  return `
    <article
      class="story-card ${story.ratio}"
      onclick="openStory('${story.id}')"
    >

      <div class="card-image">

        <img
          src="${story.image}"
          alt="${escapeHTML(story.quote)}"
          loading="lazy"
        >

      </div>

      <div class="card-body">

        <div class="card-meta">
          <span>${escapeHTML(story.campaign)}</span>
          <span>·</span>
          <span>${escapeHTML(story.emotion)}</span>
        </div>

        <h3>
          “${escapeHTML(story.quote)}”
        </h3>

        <p>
          ${escapeHTML(story.context)} ·
          ${escapeHTML(story.style)}
        </p>

      </div>

    </article>
  `;
}


/* =========================================
   STORY DETAIL
========================================= */

function openStory(id) {

  window.location.href = `story.html?id=${encodeURIComponent(id)}`;
}


function renderStory() {

  const container = document.getElementById("storyPage");

  if (!container) return;

  const params = new URLSearchParams(window.location.search);

  const id = params.get("id");

  const story = stories.find(item => item.id === id);

  if (!story) {

    container.innerHTML = `
      <div class="page-header">
        <p class="eyebrow">FEELFRAME</p>
        <h1>Story not found.</h1>
        <a href="index.html" class="primary-btn">
          Back home →
        </a>
      </div>
    `;

    return;
  }

  container.innerHTML = `

    <div class="story-hero">

      <div class="story-hero-image">
        <img
          src="${story.image}"
          alt="${escapeHTML(story.quote)}"
        >
      </div>

      <div class="story-copy">

        <p class="eyebrow">
          ${escapeHTML(story.campaign)}
        </p>

        <h1>
          ${escapeHTML(story.moment)}
          <em>— made visible.</em>
        </h1>

        <div class="story-quote">
          “${escapeHTML(story.quote)}”
        </div>

        <p class="story-description">
          ${escapeHTML(story.description)}
        </p>

        <div class="story-tags">

          <span class="story-tag">
            ${escapeHTML(story.emotion)}
          </span>

          <span class="story-tag">
            ${escapeHTML(story.context)}
          </span>

          <span class="story-tag">
            ${escapeHTML(story.style)}
          </span>

          <span class="story-tag">
            ${escapeHTML(story.recipe)}
          </span>

        </div>

        <p class="eyebrow" style="margin-bottom:15px;">
          MADE TO EXPRESS A MOMENT THAT DESERVED TO BE SEEN.
        </p>

        <a href="create.html" class="primary-btn">
          Make your own <span>→</span>
        </a>

      </div>

    </div>

  `;
}


/* =========================================
   CREATE FORM
========================================= */

function initialiseCreateForm() {

  const form = document.getElementById("feelFrameForm");

  if (!form) return;


  /* Reference image preview */

  const reference = document.getElementById("reference");

  const preview = document.getElementById("imagePreview");


  if (reference && preview) {

    reference.addEventListener("change", () => {

      const file = reference.files[0];

      if (!file) {

        preview.style.display = "none";
        preview.innerHTML = "";

        return;
      }

      if (!file.type.startsWith("image/")) {

        reference.value = "";

        alert("Please choose an image file.");

        return;
      }

      const imageURL = URL.createObjectURL(file);

      preview.innerHTML = `
        <img
          src="${imageURL}"
          alt="Reference preview"
        >
      `;

      preview.style.display = "block";

    });

  }


  /* Submit */

  form.addEventListener("submit", event => {

    event.preventDefault();

    const formData = new FormData(form);

    const data = {

      name: formData.get("name")?.trim(),

      university:
        formData.get("university")?.trim() || "Not provided",

      course:
        formData.get("course")?.trim() || "Not provided",

      moment:
        formData.get("moment") || "Not provided",

      feeling:
        formData.get("feeling") || "Not provided",

      goingThrough:
        formData.get("goingThrough")?.trim(),

      communicate:
        formData.get("communicate")?.trim(),

      style:
        formData.get("style") || "Not provided",

      reference:
        reference?.files?.[0]?.name || "No reference image"

    };


    const message = buildWhatsAppMessage(data);

    const whatsappURL =
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;


    window.location.href = whatsappURL;

  });

}


/* =========================================
   WHATSAPP REQUEST ENGINE
========================================= */

function buildWhatsAppMessage(data) {

  const commands = getVisualCommands(
    data.moment,
    data.feeling,
    data.style
  );


  return `
FEELFRAME™ — NEW VISUAL REQUEST

━━━━━━━━━━━━━━━━━━━━

PERSONAL DETAILS

Name: ${data.name}
University / School: ${data.university}
Course / Field: ${data.course}

━━━━━━━━━━━━━━━━━━━━

THE MOMENT

Campaign: ${data.moment}
Feeling: ${data.feeling}

WHAT I'M GOING THROUGH

${data.goingThrough}

━━━━━━━━━━━━━━━━━━━━

WHAT I WANT THE IMAGE TO COMMUNICATE

${data.communicate}

━━━━━━━━━━━━━━━━━━━━

VISUAL LANGUAGE

${data.style}

REFERENCE IMAGE

${data.reference}

━━━━━━━━━━━━━━━━━━━━

FEELFRAME CREATIVE DIRECTION

Emotion → ${data.feeling}
Condition → ${getCondition(data.moment)}
Style → ${data.style}

COMMANDS

${commands.map(command => `/` + command).join("\n")}

━━━━━━━━━━━━━━━━━━━━

Please create my FeelFrame visual.
`.trim();

}


/* =========================================
   INTERNAL VISUAL COMMAND ENGINE
========================================= */

function getVisualCommands(moment, feeling, style) {

  const commands = [
    "hdreal"
  ];


  /* Moment */

  if (moment === "Exam Era") {

    commands.push(
      "cinematic",
      "closeup",
      "35mmfilm",
      "shallowdepth"
    );

  } else if (moment === "Graduation") {

    commands.push(
      "editorial",
      "goldenhour",
      "wideangle",
      "filmgrain"
    );

  } else if (moment === "New Chapter") {

    commands.push(
      "cinematic",
      "sunrise",
      "backlight",
      "softlighting"
    );

  } else if (moment === "Personal Comeback") {

    commands.push(
      "dramaticlighting",
      "lowangle",
      "35mmfilm",
      "shallowdepth"
    );

  } else if (moment === "Entrepreneur") {

    commands.push(
      "editorial",
      "luxury",
      "studio",
      "rimlight"
    );

  } else {

    commands.push(
      "cinematic",
      "editorial",
      "softlighting"
    );

  }


  /* Emotion */

  if (feeling === "Determined") {

    commands.push("lowangle");

  }

  if (feeling === "Hopeful") {

    commands.push("sunrise");

  }

  if (feeling === "Proud") {

    commands.push("backlight");

  }

  if (feeling === "Exhausted") {

    commands.push("dramaticlighting");

  }

  if (feeling === "Confident") {

    commands.push("editorial");

  }

  if (feeling === "Starting Again") {

    commands.push("goldenhour");

  }


  /* Style */

  if (style === "Cinematic") {

    commands.push(
      "cinematic",
      "anamorphic"
    );

  }

  if (style === "Editorial") {

    commands.push(
      "editorial",
      "magazinecover"
    );

  }

  if (style === "Luxury") {

    commands.push(
      "luxury",
      "studio"
    );

  }

  if (style === "Film") {

    commands.push(
      "35mmfilm",
      "filmgrain"
    );

  }

  if (style === "Dreamlike") {

    commands.push(
      "dreamcore",
      "softlighting",
      "bokeh"
    );

  }

  if (style === "Dark & Moody") {

    commands.push(
      "dramaticlighting",
      "lowangle",
      "shallowdepth"
    );

  }


  return [...new Set(commands)];

}


/* =========================================
   CONDITION TRANSLATOR
========================================= */

function getCondition(moment) {

  const conditions = {

    "Exam Era": "Exam Season",

    "Graduation": "Graduation",

    "New Chapter": "New Beginning",

    "Entrepreneur": "Entrepreneurial Journey",

    "Personal Comeback": "Personal Comeback",

    "Something Else": "Personal Life Moment"

  };

  return conditions[moment] || moment;

}


/* =========================================
   SECURITY / TEXT CLEANING
========================================= */

function escapeHTML(value) {

  if (!value) return "";

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================
   START
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  loadStories();

});
