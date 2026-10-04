/* =========================================================
   FEELFRAME™ — CREATE PAGE
   Premium Creative Studio JavaScript
   ========================================================= */

(() => {
  "use strict";

  /* =======================================================
     CONFIG
     ======================================================= */

  const CONFIG = {
    maxMomentLength: 1000,
    maxFileSize: 10 * 1024 * 1024,

    allowedImageTypes: [
      "image/jpeg",
      "image/png",
      "image/webp"
    ],

    storageKey: "feelFrame_create_draft"
  };

  /* =======================================================
     DOM
     ======================================================= */

  const form = document.getElementById("createForm");

  if (!form) return;

  const nameInput = document.getElementById("creatorName");
  const emailInput = document.getElementById("creatorEmail");

  const momentInput = document.getElementById("storyMoment");
  const momentCount = document.getElementById("momentCount");

  const directionInput = document.getElementById("visualDirection");
  const purposeInput = document.getElementById("storyPurpose");

  const referenceInput = document.getElementById("referenceImage");
  const referenceUpload = document.getElementById("referenceUpload");

  const referencePreview = document.getElementById("referencePreview");
  const referencePreviewImage =
    document.getElementById("referencePreviewImage");

  const referenceFileName =
    document.getElementById("referenceFileName");

  const referenceFileSize =
    document.getElementById("referenceFileSize");

  const removeReference =
    document.getElementById("removeReference");

  const submitButton =
    document.getElementById("createSubmit");

  const formStatus =
    document.getElementById("createFormStatus");

  const footerYear =
    document.getElementById("footerYear");

  /* =======================================================
     STATE
     ======================================================= */

  let selectedFile = null;
  let previewUrl = null;

  /* =======================================================
     INITIALIZATION
     ======================================================= */

  init();

  function init() {
    updateMomentCount();
    setupMomentCounter();
    setupReferenceUpload();
    setupFormValidation();
    setupDraftSaving();
    restoreDraft();
    setupNavigation();
    updateFooterYear();
  }

  /* =======================================================
     FOOTER YEAR
     ======================================================= */

  function updateFooterYear() {
    if (footerYear) {
      footerYear.textContent = new Date().getFullYear();
    }
  }

  /* =======================================================
     MOMENT CHARACTER COUNTER
     ======================================================= */

  function setupMomentCounter() {
    if (!momentInput) return;

    momentInput.setAttribute(
      "maxlength",
      String(CONFIG.maxMomentLength)
    );

    momentInput.addEventListener("input", () => {
      updateMomentCount();
      saveDraft();
    });
  }

  function updateMomentCount() {
    if (!momentInput || !momentCount) return;

    const currentLength = momentInput.value.length;

    momentCount.textContent =
      `${currentLength} / ${CONFIG.maxMomentLength}`;
  }

  /* =======================================================
     REFERENCE IMAGE
     ======================================================= */

  function setupReferenceUpload() {
    if (!referenceInput) return;

    referenceInput.addEventListener("change", () => {
      const file = referenceInput.files?.[0];

      if (!file) return;

      handleFile(file);
    });

    if (removeReference) {
      removeReference.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        clearReferenceImage();
      });
    }

    setupDragAndDrop();
  }

  function setupDragAndDrop() {
    if (!referenceUpload) return;

    const dragEvents = [
      "dragenter",
      "dragover"
    ];

    dragEvents.forEach((eventName) => {
      referenceUpload.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();

        referenceUpload.classList.add("dragover");
      });
    });

    [
      "dragleave",
      "dragend",
      "drop"
    ].forEach((eventName) => {
      referenceUpload.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();

        referenceUpload.classList.remove("dragover");
      });
    });

    referenceUpload.addEventListener("drop", (event) => {
      const files = event.dataTransfer?.files;

      if (!files || !files.length) return;

      const file = files[0];

      handleFile(file);
    });
  }

  function handleFile(file) {
    clearStatus();

    if (!isValidImageType(file)) {
      showStatus(
        "Please choose a JPG, PNG, or WebP image.",
        "error"
      );

      return;
    }

    if (file.size > CONFIG.maxFileSize) {
      showStatus(
        "That image is too large. Please choose an image under 10 MB.",
        "error"
      );

      return;
    }

    selectedFile = file;

    showReferencePreview(file);
  }

  function isValidImageType(file) {
    return CONFIG.allowedImageTypes.includes(file.type);
  }

  function showReferencePreview(file) {
    if (!referencePreview || !referencePreviewImage) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    previewUrl = URL.createObjectURL(file);

    referencePreviewImage.src = previewUrl;
    referencePreviewImage.alt =
      `Reference image: ${file.name}`;

    if (referenceFileName) {
      referenceFileName.textContent = file.name;
    }

    if (referenceFileSize) {
      referenceFileSize.textContent =
        formatFileSize(file.size);
    }

    referencePreview.classList.add("is-visible");

    if (referenceUpload) {
      referenceUpload.style.display = "none";
    }
  }

  function clearReferenceImage() {
    selectedFile = null;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }

    if (referenceInput) {
      referenceInput.value = "";
    }

    if (referencePreviewImage) {
      referencePreviewImage.removeAttribute("src");
    }

    if (referencePreview) {
      referencePreview.classList.remove("is-visible");
    }

    if (referenceUpload) {
      referenceUpload.style.display = "";
    }

    clearStatus();
  }

  function formatFileSize(bytes) {
    if (!Number.isFinite(bytes)) return "";

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /* =======================================================
     FORM VALIDATION
     ======================================================= */

  function setupFormValidation() {
    form.addEventListener("submit", handleSubmit);

    const requiredFields = [
      nameInput,
      emailInput,
      momentInput,
      purposeInput
    ];

    requiredFields.forEach((field) => {
      if (!field) return;

      field.addEventListener("blur", () => {
        validateField(field);
      });

      field.addEventListener("input", () => {
        if (field.getAttribute("aria-invalid") === "true") {
          validateField(field);
        }
      });
    });

    document
      .querySelectorAll(
        'input[name="storyType"], input[name="emotion"]'
      )
      .forEach((radio) => {
        radio.addEventListener("change", () => {
          clearRadioGroupError(radio.name);
          saveDraft();
        });
      });
  }

  function validateField(field) {
    if (!field) return true;

    const value = field.value.trim();

    if (!value) {
      markInvalid(field);
      return false;
    }

    if (
      field.type === "email" &&
      !isValidEmail(value)
    ) {
      markInvalid(field);
      return false;
    }

    if (
      field === momentInput &&
      value.length > CONFIG.maxMomentLength
    ) {
      markInvalid(field);
      return false;
    }

    markValid(field);

    return true;
  }

  function validateRadioGroup(name) {
    const checked = form.querySelector(
      `input[name="${name}"]:checked`
    );

    if (!checked) {
      markRadioGroupInvalid(name);
      return false;
    }

    clearRadioGroupError(name);

    return true;
  }

  function validateForm() {
    let valid = true;

    const fields = [
      nameInput,
      emailInput,
      momentInput,
      purposeInput
    ];

    fields.forEach((field) => {
      if (!validateField(field)) {
        valid = false;
      }
    });

    if (!validateRadioGroup("storyType")) {
      valid = false;
    }

    if (!validateRadioGroup("emotion")) {
      valid = false;
    }

    if (!valid) {
      const firstInvalid =
        form.querySelector(
          '[aria-invalid="true"]'
        );

      if (firstInvalid) {
        firstInvalid.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }
    }

    return valid;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function markInvalid(field) {
    field.setAttribute("aria-invalid", "true");
  }

  function markValid(field) {
    field.removeAttribute("aria-invalid");
  }

  function markRadioGroupInvalid(name) {
    const group = form.querySelector(
      `.option-group[data-group="${name}"]`
    );

    if (group) {
      group.setAttribute(
        "aria-invalid",
        "true"
      );
    }
  }

  function clearRadioGroupError(name) {
    const group = form.querySelector(
      `.option-group[data-group="${name}"]`
    );

    if (group) {
      group.removeAttribute(
        "aria-invalid"
      );
    }
  }

  /* =======================================================
     FORM SUBMISSION
     ======================================================= */

  async function handleSubmit(event) {
    event.preventDefault();

    clearStatus();

    if (!validateForm()) {
      showStatus(
        "Please complete the highlighted fields before continuing.",
        "error"
      );

      return;
    }

    setSubmitting(true);

    /*
      FeelFrame currently has no external form backend
      connected to this page.

      We therefore prepare the submission locally and
      present a clean success state rather than pretending
      that an external request was completed.
    */

    try {
      const submission = collectFormData();

      saveSubmission(submission);

      await wait(700);

      showSuccessState();

      form.reset();

      clearReferenceImage();

      updateMomentCount();

      clearDraft();

    } catch (error) {
      console.error(
        "FeelFrame create submission error:",
        error
      );

      showStatus(
        "Something went wrong. Please try again.",
        "error"
      );

    } finally {
      setSubmitting(false);
    }
  }

  function collectFormData() {
    const storyType =
      form.querySelector(
        'input[name="storyType"]:checked'
      )?.value || "";

    const emotion =
      form.querySelector(
        'input[name="emotion"]:checked'
      )?.value || "";

    return {
      id:
        `ff-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      createdAt:
        new Date().toISOString(),

      name:
        nameInput?.value.trim() || "",

      email:
        emailInput?.value.trim() || "",

      storyType,

      emotion,

      moment:
        momentInput?.value.trim() || "",

      direction:
        directionInput?.value.trim() || "",

      purpose:
        purposeInput?.value || "",

      referenceImage:
        selectedFile
          ? {
              name: selectedFile.name,
              type: selectedFile.type,
              size: selectedFile.size
            }
          : null
    };
  }

  function saveSubmission(submission) {
    /*
      Store a lightweight local copy.

      The actual image file is intentionally NOT placed
      into localStorage because browsers impose strict
      storage limits and binary files should be handled
      by a real upload backend later.
    */

    try {
      const existing =
        JSON.parse(
          localStorage.getItem(
            "feelFrame_submissions"
          ) || "[]"
        );

      existing.push(submission);

      /*
        Keep the latest 10 local submissions only.
      */

      const trimmed =
        existing.slice(-10);

      localStorage.setItem(
        "feelFrame_submissions",
        JSON.stringify(trimmed)
      );

    } catch (error) {
      console.warn(
        "Unable to save local submission:",
        error
      );
    }
  }

  /* =======================================================
     SUCCESS STATE
     ======================================================= */

  function showSuccessState() {
    if (!formStatus) return;

    formStatus.className =
      "form-status success";

    formStatus.innerHTML = `
      <strong>Your story has been received.</strong>
      <span>
        We have your direction. The next step is shaping
        the feeling into something worth seeing.
      </span>
    `;

    formStatus.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  /* =======================================================
     SUBMIT BUTTON STATE
     ======================================================= */

  function setSubmitting(isSubmitting) {
    if (!submitButton) return;

    submitButton.disabled = isSubmitting;

    const buttonText =
      submitButton.querySelector(
        ".create-submit-text"
      );

    if (buttonText) {
      buttonText.textContent =
        isSubmitting
          ? "Preparing your story…"
          : "Start my story";
    }

    submitButton.setAttribute(
      "aria-busy",
      String(isSubmitting)
    );
  }

  /* =======================================================
     STATUS
     ======================================================= */

  function showStatus(message, type = "") {
    if (!formStatus) return;

    formStatus.textContent = message;

    formStatus.className =
      `form-status ${type}`.trim();
  }

  function clearStatus() {
    if (!formStatus) return;

    formStatus.textContent = "";
    formStatus.className = "form-status";
  }

  /* =======================================================
     DRAFT SAVING
     ======================================================= */

  function setupDraftSaving() {
    const fields = [
      nameInput,
      emailInput,
      momentInput,
      directionInput,
      purposeInput
    ];

    fields.forEach((field) => {
      if (!field) return;

      field.addEventListener(
        "input",
        debounce(saveDraft, 350)
      );

      field.addEventListener(
        "change",
        saveDraft
      );
    });
  }

  function saveDraft() {
    try {
      const draft = {
        name:
          nameInput?.value || "",

        email:
          emailInput?.value || "",

        storyType:
          form.querySelector(
            'input[name="storyType"]:checked'
          )?.value || "",

        emotion:
          form.querySelector(
            'input[name="emotion"]:checked'
          )?.value || "",

        moment:
          momentInput?.value || "",

        direction:
          directionInput?.value || "",

        purpose:
          purposeInput?.value || ""
      };

      localStorage.setItem(
        CONFIG.storageKey,
        JSON.stringify(draft)
      );

    } catch (error) {
      console.warn(
        "Unable to save FeelFrame draft:",
        error
      );
    }
  }

  function restoreDraft() {
    try {
      const stored =
        localStorage.getItem(
          CONFIG.storageKey
        );

      if (!stored) return;

      const draft =
        JSON.parse(stored);

      if (!draft) return;

      if (nameInput && draft.name) {
        nameInput.value = draft.name;
      }

      if (emailInput && draft.email) {
        emailInput.value = draft.email;
      }

      if (momentInput && draft.moment) {
        momentInput.value = draft.moment;
      }

      if (directionInput && draft.direction) {
        directionInput.value =
          draft.direction;
      }

      if (purposeInput && draft.purpose) {
        purposeInput.value =
          draft.purpose;
      }

      if (draft.storyType) {
        const radio =
          form.querySelector(
            `input[name="storyType"][value="${CSS.escape(
              draft.storyType
            )}"]`
          );

        if (radio) {
          radio.checked = true;
        }
      }

      if (draft.emotion) {
        const radio =
          form.querySelector(
            `input[name="emotion"][value="${CSS.escape(
              draft.emotion
            )}"]`
          );

        if (radio) {
          radio.checked = true;
        }
      }

      updateMomentCount();

    } catch (error) {
      console.warn(
        "Unable to restore FeelFrame draft:",
        error
      );
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(
        CONFIG.storageKey
      );
    } catch (error) {
      console.warn(
        "Unable to clear FeelFrame draft:",
        error
      );
    }
  }

  /* =======================================================
     NAVIGATION
     ======================================================= */

  function setupNavigation() {
    document
      .querySelectorAll(
        'a[href="index.html"], a[href="explore.html"], a[href="create.html"], a[href="explore.html#bookshelf"]'
      )
      .forEach((link) => {
        link.addEventListener("click", () => {
          document.body.classList.remove(
            "menu-open"
          );
        });
      });
  }

  /* =======================================================
     UTILITIES
     ======================================================= */

  function debounce(callback, delay = 300) {
    let timer;

    return (...args) => {
      clearTimeout(timer);

      timer = setTimeout(() => {
        callback(...args);
      }, delay);
    };
  }

  function wait(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

})();
