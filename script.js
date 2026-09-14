const state = {
  moment: "Exam Season",
  emotion: "Determined",
  style: "Cinematic",
  recipe: "Exam Era",
  package: "One Moment"
};


const moments = [
  {
    id: "exam-era",
    icon: "🎓",
    name: "Exam Era",
    description: "Tired. Determined. Still showing up.",
    featured: true
  },
  {
    id: "graduation",
    icon: "🎉",
    name: "Graduation",
    description: "The chapter you've worked for."
  },
  {
    id: "new-chapter",
    icon: "🚀",
    name: "New Chapter",
    description: "Something ended. Something begins."
  },
  {
    id: "future",
    icon: "💼",
    name: "Building My Future",
    description: "Ambition, work and becoming."
  },
  {
    id: "personal",
    icon: "❤️",
    name: "Personal Story",
    description: "A moment that only you understand."
  },
  {
    id: "something",
    icon: "✨",
    name: "Something Else",
    description: "Tell us what your moment is."
  }
];


const commandsByEmotion = {

  determined: [
    "/cinematic",
    "/closeup",
    "/dramaticlighting",
    "/35mmfilm",
    "/shallowdepth"
  ],

  exhausted: [
    "/cinematic",
    "/softlighting",
    "/mist",
    "/closeup",
    "/filmgrain"
  ],

  hopeful: [
    "/cinematic",
    "/sunrise",
    "/goldenhour",
    "/wideangle",
    "/35mmfilm"
  ],

  proud: [
    "/editorial",
    "/dramaticlighting",
    "/lowangle",
    "/studio",
    "/magazinecover"
  ],

  almost: [
    "/cinematic",
    "/backlight",
    "/motionblur",
    "/closeup",
    "/anamorphic"
  ]
};


const emotionNames = {
  determined: "Determined",
  exhausted: "Exhausted",
  hopeful: "Hopeful",
  proud: "Making Myself Proud",
  almost: "Almost There"
};


const momentGrid = document.getElementById("momentGrid");

const engineMoment = document.getElementById("engineMoment");
const engineEmotion = document.getElementById("engineEmotion");
const engineStyle = document.getElementById("engineStyle");
const engineRecipe = document.getElementById("engineRecipe");

const commandList = document.getElementById("commandList");

const resultTitle = document.getElementById("resultTitle");


/* MOMENT CARDS */

function renderMoments() {

  momentGrid.innerHTML = "";

  moments.forEach(moment => {

    const card = document.createElement("article");

    card.className =
      `moment-card ${moment.featured ? "featured" : ""}`;

    card.innerHTML = `
      <div class="moment-icon">${moment.icon}</div>

      <h3>${moment.name}</h3>

      <p>${moment.description}</p>
    `;

    card.addEventListener("click", () => {

      state.moment = moment.name;

      state.recipe =
        moment.name === "Exam Era"
          ? "Exam Era"
          : "Cinematic Story";

      updateEngine();

      document
        .getElementById("engine")
        .scrollIntoView({ behavior: "smooth" });

    });

    momentGrid.appendChild(card);

  });

}


/* ENGINE */

function updateEngine() {

  engineMoment.textContent = state.moment;

  engineEmotion.textContent = state.emotion;

  engineStyle.textContent = state.style;

  engineRecipe.textContent = state.recipe;

  const emotionKey =
    Object.keys(emotionNames).find(
      key => emotionNames[key].toLowerCase() === state.emotion.toLowerCase()
    ) || "determined";

  const commands =
    commandsByEmotion[emotionKey] ||
    commandsByEmotion.determined;

  commandList.innerHTML = "";

  commands.forEach(command => {

    const element = document.createElement("span");

    element.className = "command";

    element.textContent = command;

    commandList.appendChild(element);

  });

  const titles = {
    Determined: "Still Showing Up.",
    Exhausted: "You Made It This Far.",
    Hopeful: "Something Better Is Coming.",
    "Making Myself Proud": "I Did This For Me.",
    "Almost There": "Don't Stop Now."
  };

  resultTitle.textContent =
    titles[state.emotion] || "Your Story, Your Way.";

}


/* STYLE BUTTONS */

document
  .querySelectorAll(".style-option")
  .forEach(button => {

    button.addEventListener("click", () => {

      document
        .querySelectorAll(".style-option")
        .forEach(item => {
          item.classList.remove("active");
        });

      button.classList.add("active");

      state.style =
        button.dataset.style;

      updateEngine();

    });

  });


/* EMOTION SELECT */

document
  .getElementById("emotion")
  .addEventListener("change", event => {

    const value = event.target.value;

    state.emotion =
      emotionNames[value];

    updateEngine();

  });


/* FORM */

document
  .getElementById("visualForm")
  .addEventListener("submit", event => {

    event.preventDefault();

    const name =
      document.getElementById("name").value.trim();

    const school =
      document.getElementById("school").value.trim();

    const course =
      document.getElementById("course").value.trim();

    const story =
      document.getElementById("story").value.trim();

    const message =
      document.getElementById("message").value.trim();


    if (!name || !school || !course || !story || !message) {

      alert(
        "Tell us a little more about your moment first."
      );

      return;
    }


    resultTitle.textContent =
      `${name}'s story.`;


    document
      .getElementById("engine")
      .scrollIntoView({
        behavior: "smooth"
      });


    setTimeout(() => {

      const modal =
        document.getElementById("experienceModal");

      document
        .getElementById("modalTitle")
        .textContent =
        `We see the moment, ${name}.`;

      document
        .getElementById("modalText")
        .textContent =
        `${school} · ${course} · ${state.emotion}`;

      modal.classList.add("active");

    }, 900);

  });


/* EXPERIENCE BUTTONS */

document
  .querySelectorAll(".experience-btn")
  .forEach(button => {

    button.addEventListener("click", () => {

      state.package =
        button.dataset.package;

      document
        .getElementById("selectedPackage")
        .textContent =
        state.package;

      document
        .getElementById("experienceModal")
        .classList.add("active");

    });

  });


/* FEATURED CTA */

document
  .getElementById("startExperience")
  .addEventListener("click", () => {

    document
      .getElementById("create")
      .scrollIntoView({
        behavior: "smooth"
      });

  });


/* CLOSE MODAL */

document
  .getElementById("closeModal")
  .addEventListener("click", () => {

    document
      .getElementById("experienceModal")
      .classList.remove("active");

  });


document
  .getElementById("experienceModal")
  .addEventListener("click", event => {

    if (
      event.target.id === "experienceModal"
    ) {

      event.currentTarget
        .classList
        .remove("active");

    }

  });


/* INITIALIZE */

renderMoments();

updateEngine();
