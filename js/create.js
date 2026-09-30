/* =========================================================
   FeelFrame™ — Create / Make it Yours
   create.js
   Production Make-it-Yours Controller
   ========================================================= */

(() => {
  "use strict";

  const CORE = window.FeelFrameCore;

  if (!CORE) {
    console.error("[FeelFrame] create.js requires core.js.");
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
          Array.from(scope.querySelectorAll(selector));

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

  const normalize =
    typeof CORE.normalize === "function"
      ? CORE.normalize
      : value =>
          String(value ?? "")
            .trim()
            .toLowerCase();

  /* =========================================================
     CONFIG
     ========================================================= */

  const CONFIG = Object.freeze({
    selectors: Object.freeze({
      page: [
        ".create-page",
        ".make-yours-page",
        "[data-create-page]"
      ],

      form: [
        "#makeYoursForm",
        "#createForm",
        "[data-make-yours-form]"
      ],

      name: [
        "#makeYoursName",
        "#createName",
        '[name="name"]',
        '[name="fullName"]'
      ],

      school: [
        "#makeYoursSchool",
        "#createSchool",
        '[name="school"]',
        '[name="university"]'
      ],

      course: [
        "#makeYoursCourse",
        "#createCourse",
        '[name="course"]',
        '[name="field"]'
      ],

      feeling: [
        "#makeYoursFeeling",
        "#createFeeling",
        '[name="feeling"]',
        '[name="emotion"]'
      ],

      experience: [
        "#makeYoursExperience",
        "#createExperience",
        '[name="experience"]',
        '[name="goingThrough"]',
        '[name="whatGoingThrough"]'
      ],

      message: [
        "#makeYoursMessage",
        "#createMessage",
        '[name="message"]',
        '[name="intendedMessage"]'
      ],

      visualLanguage: [
        '[name="visualLanguage"]',
        '[data-visual-language]',
        'input[type="radio"][value]'
      ],

      referenceImage: [
        "#referenceImage",
        "#imageUpload",
        '[name="referenceImage"]',
        'input[type="file"][data-reference]'
      ],

      imagePreview: [
        "#imagePreview",
        ".image-preview",
        "[data-image-preview]"
      ],

      imagePreviewImage: [
        "#imagePreview img",
        ".image-preview img",
        "[data-image-preview] img"
      ],

      imageName: [
        "#referenceImageName",
        ".reference-image-name",
        "[data-reference-image-name]"
      ],

      imageRemove: [
        "#removeReferenceImage",
        "[data-remove-reference]"
      ],

      submit: [
        "#makeYoursSubmit",
        "#createSubmit",
        'button[type="submit"]',
        '[data-make-yours-submit]'
      ],

      status: [
        "#makeYoursStatus",
        "#createStatus",
        ".form-status",
        "[data-form-status]"
      ],

      visualLanguageGroup: [
        "[data-visual-language-group]",
        ".visual-language-group"
      ],

      emotionGroup: [
        "[data-emotion-group]",
        ".emotion-group"
      ]
    }),

    fields: Object.freeze({
      name: "name",
      school: "school",
      course: "course",
      feeling: "feeling",
      experience: "experience",
      message: "message",
      visualLanguage: "visualLanguage"
    }),

    visualLanguages: Object.freeze({
      cinematic: Object.freeze({
        label: "Cinematic",
        direction:
          "cinematic composition, controlled depth, dramatic framing, intentional lighting and film-like atmosphere"
      }),

      editorial: Object.freeze({
        label: "Editorial",
        direction:
          "editorial composition, refined art direction, deliberate styling, clean visual hierarchy and magazine-level presentation"
      }),

      film: Object.freeze({
        label: "Film",
        direction:
          "film-inspired storytelling, natural visual tension, atmospheric lighting, expressive framing and narrative depth"
      }),

      luxury: Object.freeze({
        label: "Luxury",
        direction:
          "premium art direction, restrained composition, sophisticated materials, polished lighting and elevated visual detail"
      }),

      dreamlike: Object.freeze({
        label: "Dreamlike",
        direction:
          "dreamlike atmosphere, softened reality, poetic composition, imaginative depth and subtle surreal visual language"
      }),

      minimal: Object.freeze({
        label: "Minimal",
        direction:
          "minimal composition, visual restraint, negative space, precise hierarchy and intentional simplicity"
      }),

      artistic: Object.freeze({
        label: "Artistic",
        direction:
          "expressive artistic composition, distinctive visual treatment, layered meaning and intentional creative interpretation"
      }),

      "dark & moody": Object.freeze({
        label: "Dark & Moody",
        direction:
          "dark atmospheric composition, controlled contrast, restrained highlights, deep visual mood and emotional depth"
      })
    }),

    emotions: Object.freeze({
      proud: Object.freeze({
        label: "Proud",
        direction:
          "quiet confidence, accomplishment, earned pride and a sense of personal significance"
      }),

      hopeful: Object.freeze({
        label: "Hopeful",
        direction:
          "forward-looking optimism, possibility, renewal and emotional lightness"
      }),

      grateful: Object.freeze({
        label: "Grateful",
        direction:
          "warm appreciation, meaningful connection, sincerity and emotional warmth"
      }),

      reflective: Object.freeze({
        label: "Reflective",
        direction:
          "introspection, memory, personal meaning and contemplative atmosphere"
      }),

      determined: Object.freeze({
        label: "Determined",
        direction:
          "focus, resilience, forward movement, resolve and purposeful energy"
      }),

      excited: Object.freeze({
        label: "Excited",
        direction:
          "anticipation, positive energy, momentum and a sense of possibility"
      }),

      emotional: Object.freeze({
        label: "Emotional",
        direction:
          "human vulnerability, emotional presence, sincerity and visual intimacy"
      }),

      calm: Object.freeze({
        label: "Calm",
        direction:
          "stillness, balance, softness, clarity and peaceful visual rhythm"
      }),

      nostalgic: Object.freeze({
        label: "Nostalgic",
        direction:
          "memory, familiarity, emotional warmth, personal history and reflective atmosphere"
      }),

      loved: Object.freeze({
        label: "Loved",
        direction:
          "connection, affection, belonging, warmth and human closeness"
      }),

      unseen: Object.freeze({
        label: "Unseen",
        direction:
          "quiet emotional weight, personal significance, visibility and the feeling of being noticed"
      }),

      respected: Object.freeze({
        label: "Respected",
        direction:
          "dignity, presence, recognition, credibility and quiet strength"
      }),

      seen: Object.freeze({
        label: "Seen",
        direction:
          "recognition, presence, authenticity and the feeling of being understood"
      })
    }),

    acceptedImageTypes: Object.freeze([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif"
    ]),

    maxImageSize: 10 * 1024 * 1024,

    whatsappBase:
      "https://wa.me/"
  });

  /* =========================================================
     STATE
     ========================================================= */

  const STATE = {
    initialized: false,

    form: null,

    fields: {
      name: null,
      school: null,
      course: null,
      feeling: null,
      experience: null,
      message: null,
      visualLanguage: []
    },

    referenceImage: null,
    referenceName: "",

    selectedVisualLanguage: "",
    selectedEmotion: "",

    submitting: false
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

  const getValue = element => {
    if (!element) return "";

    return String(element.value ?? "").trim();
  };

  const getFieldValue = field => {
    return getValue(
      STATE.fields[field]
    );
  };

  const setStatus = (
    message,
    type = "info"
  ) => {
    const status =
      first(CONFIG.selectors.status);

    if (!status) return;

    status.textContent =
      message || "";

    status.dataset.status =
      type;

    status.classList.toggle(
      "is-visible",
      Boolean(message)
    );

    status.classList.toggle(
      "is-error",
      type === "error"
    );

    status.classList.toggle(
      "is-success",
      type === "success"
    );

    status.classList.toggle(
      "is-info",
      type === "info"
    );
  };

  /* =========================================================
     VISUAL-LANGUAGE MAPPING
     ========================================================= */

  const resolveVisualLanguage = value => {
    const key = normalize(value);

    if (
      CONFIG.visualLanguages[key]
    ) {
      return CONFIG.visualLanguages[key];
    }

    const match =
      Object.values(
        CONFIG.visualLanguages
      ).find(
        item =>
          normalize(item.label) === key
      );

    return (
      match || {
        label:
          value || "Cinematic",
        direction:
          value
            ? `${value} visual language`
            : "cinematic visual storytelling"
      }
    );
  };

  const getSelectedVisualLanguage = () => {
    const checked =
      all(
        CONFIG.selectors.visualLanguage
      ).find(
        input =>
          input.type === "radio" &&
          input.checked
      );

    return checked
      ? getValue(checked)
      : STATE.selectedVisualLanguage;
  };

  const updateVisualLanguageState = () => {
    STATE.selectedVisualLanguage =
      getSelectedVisualLanguage();

    const group =
      first(
        CONFIG.selectors.visualLanguageGroup
      );

    if (group) {
      group.dataset.selected =
        STATE.selectedVisualLanguage;
    }

    return resolveVisualLanguage(
      STATE.selectedVisualLanguage
    );
  };

  const bindVisualLanguage = () => {
    const inputs =
      all(
        CONFIG.selectors.visualLanguage
      ).filter(
        input =>
          input.type === "radio"
      );

    STATE.fields.visualLanguage =
      inputs;

    inputs.forEach(input => {
      input.addEventListener(
        "change",
        () => {
          updateVisualLanguageState();
          clearFieldError(input);
        }
      );
    });

    updateVisualLanguageState();
  };

  /* =========================================================
     EMOTION MAPPING
     ========================================================= */

  const resolveEmotion = value => {
    const key = normalize(value);

    if (
      CONFIG.emotions[key]
    ) {
      return CONFIG.emotions[key];
    }

    const match =
      Object.values(
        CONFIG.emotions
      ).find(
        item =>
          normalize(item.label) === key
      );

    return (
      match || {
        label:
          value || "Not specified",
        direction:
          value
            ? `${value} emotional tone`
            : "authentic emotional presence"
      }
    );
  };

  const updateEmotionState = () => {
    const value =
      getFieldValue(
        CONFIG.fields.feeling
      );

    STATE.selectedEmotion =
      value;

    const group =
      first(
        CONFIG.selectors.emotionGroup
      );

    if (group) {
      group.dataset.selected =
        value;
    }

    return resolveEmotion(value);
  };

  const bindEmotion = () => {
    const field =
      STATE.fields.feeling;

    if (!field) return;

    field.addEventListener(
      "input",
      updateEmotionState
    );

    field.addEventListener(
      "change",
      updateEmotionState
    );

    updateEmotionState();
  };

  /* =========================================================
     FORM COLLECTION
     ========================================================= */

  const collectForm = () => {
    updateVisualLanguageState();
    updateEmotionState();

    return {
      name:
        getFieldValue(
          CONFIG.fields.name
        ),

      school:
        getFieldValue(
          CONFIG.fields.school
        ),

      course:
        getFieldValue(
          CONFIG.fields.course
        ),

      feeling:
        getFieldValue(
          CONFIG.fields.feeling
        ),

      experience:
        getFieldValue(
          CONFIG.fields.experience
        ),

      message:
        getFieldValue(
          CONFIG.fields.message
        ),

      visualLanguage:
        STATE.selectedVisualLanguage,

      referenceImage:
        STATE.referenceImage
          ? {
              name:
                STATE.referenceImage.name,
              type:
                STATE.referenceImage.type,
              size:
                STATE.referenceImage.size
            }
          : null
    };
  };

  /* =========================================================
     VALIDATION
     ========================================================= */

  const clearFieldError = field => {
    if (!field) return;

    field.classList.remove(
      "is-invalid",
      "has-error"
    );

    field.removeAttribute(
      "aria-invalid"
    );

    const wrapper =
      field.closest(
        ".form-field"
      );

    if (wrapper) {
      wrapper.classList.remove(
        "is-invalid",
        "has-error"
      );
    }

    const error =
      wrapper?.querySelector(
        ".form-field__error"
      );

    if (error) {
      error.remove();
    }
  };

  const setFieldError = (
    field,
    message
  ) => {
    if (!field) return;

    field.classList.add(
      "is-invalid",
      "has-error"
    );

    field.setAttribute(
      "aria-invalid",
      "true"
    );

    const wrapper =
      field.closest(
        ".form-field"
      );

    if (!wrapper) return;

    wrapper.classList.add(
      "is-invalid",
      "has-error"
    );

    let error =
      wrapper.querySelector(
        ".form-field__error"
      );

    if (!error) {
      error =
        document.createElement(
          "span"
        );

      error.className =
        "form-field__error";

      wrapper.appendChild(
        error
      );
    }

    error.textContent =
      message;
  };

  const validateRequiredField = (
    field,
    label
  ) => {
    if (!field) {
      return true;
    }

    const value =
      getValue(field);

    if (!value) {
      setFieldError(
        field,
        `${label} is required.`
      );

      return false;
    }

    clearFieldError(field);

    return true;
  };

  const validateForm = data => {
    let valid = true;

    const requiredFields = [
      [
        CONFIG.fields.name,
        "Name"
      ],
      [
        CONFIG.fields.feeling,
        "Feeling"
      ],
      [
        CONFIG.fields.experience,
        "What you're going through"
      ],
      [
        CONFIG.fields.message,
        "Intended message"
      ]
    ];

    requiredFields.forEach(
      ([fieldName, label]) => {
        const field =
          STATE.fields[fieldName];

        if (
          !validateRequiredField(
            field,
            label
          )
        ) {
          valid = false;
        }
      }
    );

    const visualInputs =
      STATE.fields.visualLanguage;

    const hasVisualLanguage =
      visualInputs.some(
        input => input.checked
      );

    if (!hasVisualLanguage) {
      const group =
        first(
          CONFIG.selectors.visualLanguageGroup
        );

      if (group) {
        group.classList.add(
          "is-invalid"
        );
      }

      valid = false;
    } else {
      const group =
        first(
          CONFIG.selectors.visualLanguageGroup
        );

      if (group) {
        group.classList.remove(
          "is-invalid"
        );
      }
    }

    if (
      data.name.length > 100
    ) {
      setFieldError(
        STATE.fields.name,
        "Please keep your name under 100 characters."
      );

      valid = false;
    }

    if (
      data.experience.length > 2000
    ) {
      setFieldError(
        STATE.fields.experience,
        "Please keep this under 2,000 characters."
      );

      valid = false;
    }

    if (
      data.message.length > 1000
    ) {
      setFieldError(
        STATE.fields.message,
        "Please keep this under 1,000 characters."
      );

      valid = false;
    }

    if (
      STATE.referenceImage &&
      !CONFIG.acceptedImageTypes.includes(
        STATE.referenceImage.type
      )
    ) {
      setStatus(
        "Please choose a JPG, PNG, WEBP or GIF image.",
        "error"
      );

      valid = false;
    }

    if (
      STATE.referenceImage &&
      STATE.referenceImage.size >
        CONFIG.maxImageSize
    ) {
      setStatus(
        "Your reference image must be 10 MB or smaller.",
        "error"
      );

      valid = false;
    }

    return valid;
  };

  /* =========================================================
     CREATIVE COMMANDS
     ========================================================= */

  const buildCreativeCommands = data => {
    const visual =
      resolveVisualLanguage(
        data.visualLanguage
      );

    const emotion =
      resolveEmotion(
        data.feeling
      );

    const commands = [
      `Create a visual story centered on ${data.name || "the subject"}.`,

      data.school
        ? `Place the subject within the context of ${data.school}.`
        : "",

      data.course
        ? `Reflect the subject's connection to ${data.course}.`
        : "",

      data.experience
        ? `Interpret the lived experience as: ${data.experience}.`
        : "",

      data.message
        ? `Communicate this intended message: ${data.message}.`
        : "",

      `Use ${visual.label.toLowerCase()} visual language.`,

      visual.direction,

      `Build the image around ${emotion.label.toLowerCase()} emotional direction.`,

      emotion.direction,

      "Prioritize authentic human storytelling over generic AI aesthetics.",

      "Preserve the subject's identity and emotional context.",

      "Use intentional composition, hierarchy, depth and visual storytelling.",

      "Avoid generic stock-photo composition, unnecessary text and decorative elements that do not support the story."
    ].filter(Boolean);

    return commands;
  };

  /* =========================================================
     WHATSAPP BRIEF
     ========================================================= */

  const getWhatsAppNumber = () => {
    const state =
      getGlobalState();

    return String(
      state?.site?.whatsappNumber ||
      "2349012728201"
    )
      .replace(
        /[^\d]/g,
        ""
      );
  };

  const buildWhatsAppBrief = data => {
    const visual =
      resolveVisualLanguage(
        data.visualLanguage
      );

    const emotion =
      resolveEmotion(
        data.feeling
      );

    const commands =
      buildCreativeCommands(data);

    const lines = [
      "FEELFRAME™ — MAKE IT YOURS",
      "",
      "I want to create a visual story.",
      "",
      "PERSONAL DETAILS",
      `Name: ${data.name || "Not provided"}`,
      `School / University: ${data.school || "Not provided"}`,
      `Course / Field: ${data.course || "Not provided"}`,
      "",
      "EMOTIONAL DIRECTION",
      `Feeling: ${emotion.label}`,
      `Experience: ${data.experience || "Not provided"}`,
      "",
      "MESSAGE",
      data.message || "Not provided",
      "",
      "VISUAL LANGUAGE",
      `Style: ${visual.label}`,
      `Direction: ${visual.direction}`,
      "",
      "CREATIVE DIRECTION",
      ...commands.map(
        (command, index) =>
          `${index + 1}. ${command}`
      ),
      "",
      data.referenceImage
        ? `Reference image: ${data.referenceImage.name}`
        : "Reference image: None",
      "",
      "Sent from FeelFrame™."
    ];

    return lines.join("\n");
  };

  const buildWhatsAppURL = brief => {
    const number =
      getWhatsAppNumber();

    if (!number) {
      return "";
    }

    return (
      CONFIG.whatsappBase +
      number +
      "?text=" +
      encodeURIComponent(
        brief
      )
    );
  };

  const openWhatsAppBrief = data => {
    const brief =
      buildWhatsAppBrief(data);

    const url =
      buildWhatsAppURL(brief);

    if (!url) {
      setStatus(
        "WhatsApp contact details are unavailable.",
        "error"
      );

      return false;
    }

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );

    return true;
  };

  /* =========================================================
     REFERENCE IMAGE
     ========================================================= */

  const clearImagePreview = () => {
    const preview =
      first(
        CONFIG.selectors.imagePreview
      );

    const previewImage =
      first(
        CONFIG.selectors.imagePreviewImage
      );

    const imageName =
      first(
        CONFIG.selectors.imageName
      );

    if (preview) {
      preview.hidden = true;
      preview.classList.remove(
        "is-visible"
      );
    }

    if (previewImage) {
      previewImage.removeAttribute(
        "src"
      );
      previewImage.removeAttribute(
        "alt"
      );
    }

    if (imageName) {
      imageName.textContent = "";
    }
  };

  const renderImagePreview = file => {
    const preview =
      first(
        CONFIG.selectors.imagePreview
      );

    const previewImage =
      first(
        CONFIG.selectors.imagePreviewImage
      );

    const imageName =
      first(
        CONFIG.selectors.imageName
      );

    if (
      !preview ||
      !previewImage ||
      !file
    ) {
      return;
    }

    const objectURL =
      URL.createObjectURL(file);

    previewImage.src =
      objectURL;

    previewImage.alt =
      `Reference image: ${file.name}`;

    if (imageName) {
      imageName.textContent =
        file.name;
    }

    preview.hidden = false;

    preview.classList.add(
      "is-visible"
    );

    previewImage.addEventListener(
      "load",
      () => {
        URL.revokeObjectURL(
          objectURL
        );
      },
      { once: true }
    );
  };

  const validateReferenceImage = file => {
    if (!file) {
      return {
        valid: true,
        message: ""
      };
    }

    if (
      !CONFIG.acceptedImageTypes.includes(
        file.type
      )
    ) {
      return {
        valid: false,
        message:
          "Please choose a JPG, PNG, WEBP or GIF image."
      };
    }

    if (
      file.size >
      CONFIG.maxImageSize
    ) {
      return {
        valid: false,
        message:
          "Your reference image must be 10 MB or smaller."
      };
    }

    return {
      valid: true,
      message: ""
    };
  };

  const handleReferenceImage = event => {
    const input =
      event.currentTarget;

    const file =
      input?.files?.[0] ||
      null;

    STATE.referenceImage =
      null;

    STATE.referenceName =
      "";

    clearImagePreview();

    if (!file) {
      return;
    }

    const result =
      validateReferenceImage(
        file
      );

    if (!result.valid) {
      input.value = "";

      setStatus(
        result.message,
        "error"
      );

      return;
    }

    STATE.referenceImage =
      file;

    STATE.referenceName =
      file.name;

    renderImagePreview(file);

    setStatus(
      "Reference image added.",
      "success"
    );
  };

  const removeReferenceImage = () => {
    STATE.referenceImage =
      null;

    STATE.referenceName =
      "";

    const input =
      first(
        CONFIG.selectors.referenceImage
      );

    if (input) {
      input.value = "";
    }

    clearImagePreview();

    setStatus(
      "",
      "info"
    );
  };

  const setupReferenceImage = () => {
    const input =
      first(
        CONFIG.selectors.referenceImage
      );

    if (input) {
      input.addEventListener(
        "change",
        handleReferenceImage
      );
    }

    const removeButton =
      first(
        CONFIG.selectors.imageRemove
      );

    if (removeButton) {
      removeButton.addEventListener(
        "click",
        event => {
          event.preventDefault();
          removeReferenceImage();
        }
      );
    }
  };

  /* =========================================================
     FORM FIELD SETUP
     ========================================================= */

  const setupFields = () => {
    STATE.fields.name =
      first(
        CONFIG.selectors.name
      );

    STATE.fields.school =
      first(
        CONFIG.selectors.school
      );

    STATE.fields.course =
      first(
        CONFIG.selectors.course
      );

    STATE.fields.feeling =
      first(
        CONFIG.selectors.feeling
      );

    STATE.fields.experience =
      first(
        CONFIG.selectors.experience
      );

    STATE.fields.message =
      first(
        CONFIG.selectors.message
      );
  };

  const setupLiveValidation = () => {
    Object.values(
      STATE.fields
    ).forEach(field => {
      if (!field) return;

      if (Array.isArray(field)) {
        field.forEach(input => {
          input.addEventListener(
            "change",
            () =>
              clearFieldError(
                input
              )
          );
        });

        return;
      }

      field.addEventListener(
        "input",
        () => {
          if (
            getValue(field)
          ) {
            clearFieldError(
              field
            );
          }
        }
      );

      field.addEventListener(
        "blur",
        () => {
          if (
            field.hasAttribute(
              "required"
            )
          ) {
            validateRequiredField(
              field,
              field
                .getAttribute(
                  "aria-label"
                ) ||
                field
                  .closest(
                    ".form-field"
                  )
                  ?.querySelector(
                    "label"
                  )
                  ?.textContent
                  ?.trim() ||
                "This field"
            );
          }
        }
      );
    });
  };

  /* =========================================================
     SUBMISSION
     ========================================================= */

  const setSubmitting = submitting => {
    STATE.submitting =
      submitting;

    const submit =
      first(
        CONFIG.selectors.submit
      );

    if (!submit) return;

    submit.disabled =
      submitting;

    submit.classList.toggle(
      "is-loading",
      submitting
    );

    submit.setAttribute(
      "aria-busy",
      String(submitting)
    );
  };

  const handleSubmit = event => {
    event.preventDefault();

    if (STATE.submitting) {
      return;
    }

    const data =
      collectForm();

    setStatus(
      "",
      "info"
    );

    if (
      !validateForm(data)
    ) {
      setStatus(
        "Please complete the highlighted fields.",
        "error"
      );

      const firstInvalid =
        document.querySelector(
          ".form-field.is-invalid input, " +
          ".form-field.is-invalid textarea, " +
          ".form-field.is-invalid select, " +
          "[aria-invalid='true']"
        );

      firstInvalid?.focus?.();

      return;
    }

    setSubmitting(true);

    const opened =
      openWhatsAppBrief(
        data
      );

    if (opened) {
      setStatus(
        "Your brief is ready in WhatsApp.",
        "success"
      );
    }

    setSubmitting(false);
  };

  const setupForm = () => {
    STATE.form =
      first(
        CONFIG.selectors.form
      );

    if (!STATE.form) {
      return;
    }

    STATE.form.addEventListener(
      "submit",
      handleSubmit
    );
  };

  /* =========================================================
     MAKE IT YOURS PAGE
     ========================================================= */

  const isCreatePage = () => {
    return Boolean(
      first(
        CONFIG.selectors.page
      ) ||
      first(
        CONFIG.selectors.form
      )
    );
  };

  const renderCreatePage = () => {
    if (!isCreatePage()) {
      return false;
    }

    setupFields();

    bindVisualLanguage();

    bindEmotion();

    setupLiveValidation();

    setupReferenceImage();

    setupForm();

    const page =
      first(
        CONFIG.selectors.page
      );

    if (page) {
      page.classList.add(
        "is-ready"
      );
    }

    document.documentElement.dataset.createReady =
      "true";

    document.dispatchEvent(
      new CustomEvent(
        "feelframe:create-rendered",
        {
          detail: {
            state: STATE
          }
        }
      )
    );

    return true;
  };

  /* =========================================================
     INITIALIZATION
     ========================================================= */

  const initialize = () => {
    if (STATE.initialized) {
      return;
    }

    if (!isCreatePage()) {
      return;
    }

    renderCreatePage();

    STATE.initialized =
      true;

    document.dispatchEvent(
      new CustomEvent(
        "feelframe:create-ready",
        {
          detail: {
            state: STATE
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
      renderCreatePage,

    collect:
      collectForm,

    validate:
      validateForm,

    buildCommands:
      buildCreativeCommands,

    buildBrief:
      buildWhatsAppBrief,

    buildWhatsAppURL,

    resolveVisualLanguage,

    resolveEmotion,

    getReferenceImage:
      () =>
        STATE.referenceImage,

    removeReferenceImage,

    getState: () => ({
      initialized:
        STATE.initialized,

      submitting:
        STATE.submitting,

      selectedVisualLanguage:
        STATE.selectedVisualLanguage,

      selectedEmotion:
        STATE.selectedEmotion,

      referenceName:
        STATE.referenceName
    })
  });

  window.FeelFrame =
    window.FeelFrame || {};

  window.FeelFrame.create =
    API;

  window.FeelFrameCreate =
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
          "[FeelFrame] Create initialization failed:",
          error
        );
      });
  } else if (
    document.readyState ===
    "loading"
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
