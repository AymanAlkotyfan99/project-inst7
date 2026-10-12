"use strict";

/*
 * EDIT YOUR INVITATION HERE.
 * Dates use YYYY-MM-DD; times use 24-hour HH:MM in the timeZone below.
 * Leave unknown details as null. The invitation will display a quiet announcement
 * instead of an invented date, countdown, calendar event, or map destination.
 */
const invitationData = Object.freeze({
  brideName: "آلاء",
  groomName: "ياسر",
  brideInitial: "آ",
  groomInitial: "ي",
  date: "2026-11-01",
  time: "17:00",
  timeZone: "Asia/Damascus",
  venue: "إيليت بلازا",
  city: null,
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("إيليت بلازا"),
  openingPhrase: "ومن بين كل الحكايات... بدأت حكايتنا",
  closingPhrase: "بعض الليالي تُعاش مرة… وتبقى في القلب عمرًا",
  // Replace these images with your own photographs whenever you wish.
  photos: Object.freeze([
    Object.freeze({ src: "assets/gallery-roses.webp", width: 1200, height: 800, alt: "ورود عاجية بتفاصيل ناعمة", title: "تفاصيل تشبه الحب", caption: "وفي كل تفصيلة… شيءٌ من فرحتنا" }),
    Object.freeze({ src: "assets/gallery-garden.webp", width: 1200, height: 900, alt: "ورود حديقة كريمية بين أوراق خضراء داكنة", title: "حكاية تزهر", caption: "للحكايات الجميلة أماكن تشبهها" }),
    Object.freeze({ src: "assets/gallery-ceremony.webp", width: 1200, height: 798, alt: "تنسيق زفاف أنيق بين الزهور والضوء", title: "ليلة من العمر", caption: "وكل ما نتمناه… أن تكونوا معنا" })
  ]),
  // Milliseconds: the complete tap-to-invitation sequence lasts 5 seconds.
  motion: Object.freeze({ press: 100, sealRelease: 350, opening: 1900, sunlightHold: 350, entry: 1450, reveal: 850 }),
  // Optional assets are requested only when their path is configured.
  // Transparent door assets should be tightly cropped to their object.
  assets: Object.freeze({
    interior: "assets/interior.webp",
    floralArch: "assets/floral-arch.webp",
    embossedPaper: "assets/embossed-paper-landscape.webp",
    waxSeal: "assets/wax-seal.webp",
    doorLeft: null,
    doorRight: null,
    paperTexture: "assets/paper-texture.webp",
    monogram: null,
    hand: null
  })
});

(() => {
  const body = document.body;
  const motion = invitationData.motion;
  body.style.setProperty("--envelope-opening", `${motion.opening}ms`);
  body.style.setProperty("--seal-release", `${motion.sealRelease}ms`);
  body.style.setProperty("--paper-entry", `${motion.entry}ms`);
  body.style.setProperty("--invitation-reveal", `${motion.reveal}ms`);
  const cinematic = document.getElementById("cinematic");
  const invitation = document.getElementById("invitation");
  const card = document.getElementById("invitation-card");
  if (!cinematic || !invitation || !card) return;

  const hint = document.getElementById("card-hint");
  const liveStatus = document.getElementById("live-status");
  const skipButton = document.getElementById("skip-intro");
  const replayButton = document.getElementById("replay");
  const soundButton = document.getElementById("sound-toggle");
  const parallaxLayers = [...document.querySelectorAll(".interior-image, .paper-plane")];
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const phaseClasses = [
    "scene-started", "doors-open", "camera-entered",
    "approached", "card-pressed", "card-presented", "seal-released", "card-opened", "sunlight-bloom",
    "foil-drawn", "entering-card", "invitation-active", "hint-visible",
    "skip-entry"
  ];
  const STATES = Object.freeze({
    LOADING: "LOADING",
    DOOR_SCENE: "DOOR_SCENE",
    DOOR_OPENING: "DOOR_OPENING",
    CAMERA_ENTERING: "CAMERA_ENTERING",
    CARD_APPROACH: "CARD_APPROACH",
    CARD_READY: "CARD_READY",
    CARD_PRESENTING: "CARD_PRESENTING",
    CARD_OPENING: "CARD_OPENING",
    CARD_OPEN: "CARD_OPEN",
    ENTERING_CARD: "ENTERING_CARD",
    INVITATION_ACTIVE: "INVITATION_ACTIVE"
  });

  let state = STATES.LOADING;
  let transitioning = true;
  let epoch = 0;
  let reducedMotion = motionQuery.matches;
  let pointerFrame = 0;
  let revealObserver = null;
  let countdownTimer = null;
  const music = document.getElementById("wedding-music");
  const musicStart = 22;
  let musicStarted = false;
  let musicRequest = 0;
  let soundEnabled = false;
  let activationGateUntil = 0;
  let optionalHand = null;
  let updateGallery = () => {};
  const waits = new Map();
  const invitationTitle = "دعوة إلى حكاية جميلة | لتكتمل الحكاية";

  // Every delayed action belongs to one run. Skipping, replaying, and a motion
  // preference change cancel pending actions, including interaction hints.
  function cancelRun() {
    epoch += 1;
    waits.forEach((resolve, timer) => {
      window.clearTimeout(timer);
      resolve(false);
    });
    waits.clear();
    return epoch;
  }

  function wait(milliseconds, token = epoch) {
    if (token !== epoch) return Promise.resolve(false);
    return new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        waits.delete(timer);
        resolve(token === epoch);
      }, milliseconds);
      waits.set(timer, resolve);
    });
  }

  function setState(nextState, announcement = "") {
    state = nextState;
    body.dataset.state = nextState;
    if (announcement && liveStatus) liveStatus.textContent = announcement;
  }

  function setHint(text, visible) {
    if (hint) {
      hint.textContent = text;
      hint.setAttribute("aria-hidden", visible ? "false" : "true");
    }
    body.classList.toggle("hint-visible", visible);
  }

  function resetPointer() {
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    parallaxLayers.forEach((layer) => {
      layer.style.setProperty("--pointer-x", "0");
      layer.style.setProperty("--pointer-y", "0");
    });
  }

  function assetUrl(path) {
    if (typeof path !== "string" || !path.trim()) return null;
    try {
      const url = new URL(path, document.baseURI);
      if (["http:", "https:", "file:", "blob:"].includes(url.protocol) ||
          (url.protocol === "data:" && /^data:image\//i.test(path))) return url.href;
    } catch { /* Keep the existing material fallback for invalid paths. */ }
    return null;
  }

  function configureImage(image, path, onReady = () => {}, onFailure = () => {}) {
    const url = assetUrl(path);
    if (!image) return;
    if (!url) {
      image.hidden = true;
      image.removeAttribute("src");
      onFailure();
      return;
    }
    const ready = () => {
      image.hidden = false;
      image.dataset.assetState = "ready";
      onReady();
    };
    const failed = () => {
      image.hidden = true;
      image.dataset.assetState = "unavailable";
      onFailure();
    };
    image.addEventListener("load", ready);
    image.addEventListener("error", failed);
    if (image.src !== url) image.src = url;
    // An image can fail before a defer script runs. Catch that case as well.
    if (image.complete) queueMicrotask(() => image.naturalWidth ? ready() : failed());
  }

  function appendAsset(parent, path, className, onReady = () => {}) {
    if (!parent || !assetUrl(path)) return null;
    const image = document.createElement("img");
    image.className = className;
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    image.decoding = "async";
    image.hidden = true;
    Object.assign(image.style, {
      position: "absolute", inset: "0", width: "100%", height: "100%",
      objectFit: "contain", pointerEvents: "none"
    });
    parent.append(image);
    configureImage(image, path, onReady);
    return image;
  }

  function configureAssets() {
    const assets = invitationData.assets;
    configureImage(document.querySelector(".floral-arch"), assets.floralArch);
    configureImage(document.querySelector(".wax-seal img"), assets.waxSeal);
    const embossUrl = assetUrl(assets.embossedPaper);
    if (embossUrl) {
      const texture = new Image();
      configureImage(texture, embossUrl, () => {
        document.querySelectorAll(".embossed-paper").forEach((layer) => {
          layer.style.backgroundImage = `url(${JSON.stringify(embossUrl)})`;
        });
      });
    }
    document.querySelectorAll(".interior-image, .architecture-detail img").forEach((image) => {
      configureImage(image, assets.interior);
    });
    [[".door-left", assets.doorLeft], [".door-right", assets.doorRight]].forEach(([selector, path]) => {
      const door = document.querySelector(selector);
      const image = appendAsset(door, path, "door-asset", () => {
        door.classList.add("has-door-asset");
        door.querySelectorAll(".door-panel, .door-handle").forEach((part) => { part.hidden = true; });
      });
      if (image) {
        image.dataset.critical = "";
        Object.assign(image.style, { objectFit: "fill", borderRadius: "inherit", zIndex: "2" });
      }
    });
    document.querySelectorAll(".monogram").forEach((monogram) => {
      const image = appendAsset(monogram, assets.monogram, "monogram-asset", () => {
        monogram.querySelectorAll("[data-bind]").forEach((letter) => { letter.hidden = true; });
        monogram.classList.add("has-custom-monogram");
      });
      if (image) image.alt = `${invitationData.brideInitial} + ${invitationData.groomInitial}`;
    });
    const textureUrl = assetUrl(assets.paperTexture);
    const paperLayers = document.querySelectorAll(".paper, .scene-grain");
    if (textureUrl) {
      const texture = new Image();
      configureImage(texture, textureUrl, () => {
        paperLayers.forEach((layer) => { layer.style.backgroundImage = `url(${JSON.stringify(textureUrl)})`; });
      });
    } else {
      paperLayers.forEach((layer) => { layer.style.backgroundImage = "none"; });
    }
    optionalHand = appendAsset(document.querySelector(".card-lift"), assets.hand, "optional-hand");
    if (optionalHand) Object.assign(optionalHand.style, {
      inset: "auto -48% -56% auto", width: "90%", height: "auto", zIndex: "6",
      opacity: "0", transform: "translateY(65%)", transition: "opacity .55s ease, transform .7s ease"
    });
  }

  function setHandVisible(visible) {
    if (!optionalHand) return;
    optionalHand.style.opacity = visible ? "1" : "0";
    optionalHand.style.transform = visible ? "translateY(0)" : "translateY(65%)";
  }

  async function waitForOpeningAssets(token) {
    let images = [...cinematic.querySelectorAll("img[data-critical], img[fetchpriority='high']")];
    if (!images.length) {
      images = [...cinematic.querySelectorAll("img")].filter((image) => image.loading !== "lazy");
    }
    const decoding = images.map((image) => {
      if (typeof image.decode === "function") return image.decode().catch(() => undefined);
      if (image.complete) return Promise.resolve();
      return new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    });
    if (document.fonts) {
      decoding.push(document.fonts.load('400 30px "Amiri"', `${invitationData.brideName} ${invitationData.groomName}`));
      decoding.push(document.fonts.load('300 12px "IBM Plex Sans Arabic"', "دعوة زفاف"));
    }
    await Promise.race([Promise.allSettled(decoding), wait(2000, token)]);
    return token === epoch;
  }

  function prepareScene() {
    body.classList.add("resetting");
    if (revealObserver) revealObserver.disconnect();
    invitation.querySelectorAll(".reveal").forEach((section) => section.classList.remove("revealed"));
    invitation.querySelectorAll(".names-reveal").forEach((section) => section.setAttribute("aria-hidden", "true"));
    const names = document.getElementById("couple-names");
    if (names) names.setAttribute("aria-label", "حكاية قلبين");
    document.title = invitationTitle;
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
    body.classList.remove(...phaseClasses);
    body.classList.toggle("reduced-motion", reducedMotion);
    cinematic.hidden = false;
    cinematic.inert = false;
    cinematic.removeAttribute("aria-hidden");
    if (skipButton) skipButton.hidden = false;
    if (invitation.contains(document.activeElement) && skipButton) skipButton.focus({ preventScroll: true });
    invitation.inert = true;
    invitation.setAttribute("inert", "");
    invitation.setAttribute("aria-hidden", "true");
    card.disabled = true;
    activationGateUntil = 0;
    card.setAttribute("aria-label", "افتح دعوة الزفاف");
    setHint("", false);
    resetPointer();
    setHandVisible(false);
    // The reset is deliberately committed before transitions are re-enabled.
    void cinematic.offsetWidth;
    body.classList.remove("resetting");
  }

  async function makeCardReady(token) {
    if (token !== epoch) return;
    transitioning = false;
    card.disabled = false;
    card.setAttribute("aria-label", "افتح دعوة الزفاف");
    setState(STATES.CARD_READY, "الدعوة أمامك. المس الختم لفتحها.");
    setHint("المس الختم… لتبدأ الحكاية", true);
  }

  async function runOpening() {
    const token = cancelRun();
    transitioning = true;
    prepareScene();
    setState(STATES.LOADING);
    if (!(await waitForOpeningAssets(token))) return;
    setState(STATES.DOOR_SCENE);
    body.classList.add("scene-started");

    if (reducedMotion) {
      body.classList.add("doors-open", "card-presented", "camera-entered", "approached");
      await makeCardReady(token);
      return;
    }

    if (!(await wait(300, token))) return;
    setState(STATES.DOOR_OPENING);
    body.classList.add("doors-open");
    if (!(await wait(800, token))) return;
    setState(STATES.CAMERA_ENTERING);
    body.classList.add("camera-entered");
    if (!(await wait(550, token))) return;
    setState(STATES.CARD_APPROACH);
    body.classList.add("approached", "card-presented");
    if (!(await wait(950, token))) return;
    await makeCardReady(token);
  }

  async function openCard() {
    // Keep play() inside the original tap, before any animation awaits (iOS).
    if (!musicStarted) void startMusic();
    const token = epoch;
    transitioning = true;
    card.disabled = true;
    body.classList.add("card-pressed");
    setHint("", false);
    setState(STATES.CARD_OPENING, "تُفتح الدعوة.");
    if (!(await wait(reducedMotion ? 30 : motion.press, token))) return;
    body.classList.remove("card-pressed");
    setHandVisible(false);
    body.classList.add("seal-released");
    if (!(await wait(reducedMotion ? 70 : motion.sealRelease, token))) return;
    body.classList.add("card-opened");
    if (!(await wait(reducedMotion ? 240 : motion.opening, token))) return;
    setState(STATES.CARD_OPEN);
    body.classList.add("foil-drawn", "sunlight-bloom");
    if (!(await wait(reducedMotion ? 200 : motion.sunlightHold, token))) return;
    setState(STATES.ENTERING_CARD);
    // Paper must cover wide screens too; center and cover travel independently.
    const cardWidth = card.offsetWidth;
    const anchor = document.querySelector(".card-anchor").getBoundingClientRect();
    const travelCenterY = anchor.top + anchor.height / 2 + window.innerHeight * .1;
    const verticalFill = 2 * Math.max(travelCenterY, window.innerHeight - travelCenterY) / card.offsetHeight;
    body.style.setProperty("--entry-scale", String(Math.max(6.6, window.innerWidth / cardWidth * 1.2, verticalFill * 1.05)));
    body.classList.add("entering-card");
    if (!(await wait(reducedMotion ? 220 : motion.entry, token))) return;
    await activateInvitation(token);
  }

  async function activateInvitation(token, skipped = false) {
    if (token !== epoch) return;
    if (skipped) body.classList.add("skip-entry");
    body.classList.remove("card-pressed", "hint-visible");
    body.classList.add("invitation-active");
    invitation.hidden = false;
    invitation.inert = false;
    invitation.removeAttribute("inert");
    invitation.removeAttribute("aria-hidden");
    const title = document.getElementById("invitation-title");
    if (title) title.focus({ preventScroll: true });
    cinematic.inert = true;
    cinematic.setAttribute("aria-hidden", "true");
    card.disabled = true;
    if (skipButton) skipButton.hidden = true;
    transitioning = false;
    setState(STATES.INVITATION_ACTIVE, "أهلًا بكم في حكايتنا. يمكنكم الآن التمرير لقراءة الدعوة.");
    resetPointer();
    revealSections();
    requestAnimationFrame(updateGallery);
    if (await wait(reducedMotion ? 260 : motion.reveal, token)) cinematic.hidden = true;
  }

  function skipIntro() {
    if (state === STATES.INVITATION_ACTIVE) return;
    const token = cancelRun();
    void activateInvitation(token, true);
  }

  function replayIntro() {
    void runOpening();
    if (skipButton) skipButton.focus({ preventScroll: true });
  }

  card.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || transitioning || card.disabled) return;
    if (state === STATES.CARD_READY) body.classList.add("card-pressed");
  });
  card.addEventListener("pointercancel", () => body.classList.remove("card-pressed"));
  card.addEventListener("pointerleave", () => {
    if (!transitioning) body.classList.remove("card-pressed");
  });
  window.addEventListener("pointerup", () => {
    if (!transitioning) body.classList.remove("card-pressed");
  }, { passive: true });
  card.addEventListener("click", (event) => {
    if (transitioning || card.disabled || event.detail > 1 || performance.now() < activationGateUntil) return;
    activationGateUntil = performance.now() + 650;
    if (state === STATES.CARD_READY) void openCard();
  });
  if (skipButton) skipButton.addEventListener("click", skipIntro);
  if (replayButton) replayButton.addEventListener("click", replayIntro);

  function handleMotionChange(event) {
    reducedMotion = event.matches;
    body.classList.toggle("reduced-motion", reducedMotion);
    updatePetalMotion();
    resetPointer();
    if (!reducedMotion || state === STATES.INVITATION_ACTIVE) {
      if (reducedMotion) revealSections();
      return;
    }
    const previousState = state;
    const token = cancelRun();
    body.classList.remove("card-pressed");
    if ([STATES.CARD_OPENING, STATES.CARD_OPEN, STATES.ENTERING_CARD].includes(previousState)) {
      void activateInvitation(token, true);
    } else {
      body.classList.add("scene-started", "doors-open", "card-presented", "camera-entered", "approached");
      void makeCardReady(token);
    }
  }
  if (motionQuery.addEventListener) motionQuery.addEventListener("change", handleMotionChange);
  else motionQuery.addListener(handleMotionChange);

  window.addEventListener("pointermove", (event) => {
    if (reducedMotion || event.pointerType === "touch" || transitioning || pointerFrame) return;
    if (state !== STATES.CARD_READY) return;
    const x = Math.max(-1, Math.min(1, (event.clientX / window.innerWidth - 0.5) * 2));
    const y = Math.max(-1, Math.min(1, (event.clientY / window.innerHeight - 0.5) * 2));
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      parallaxLayers.forEach((layer) => {
        layer.style.setProperty("--pointer-x", x.toFixed(3));
        layer.style.setProperty("--pointer-y", y.toFixed(3));
      });
    });
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", resetPointer);

  function revealSections() {
    if (revealObserver) revealObserver.disconnect();
    const sections = invitation.querySelectorAll(".reveal");
    const reveal = (section) => {
      section.classList.add("revealed");
      if (section.matches(".names-reveal")) {
        section.removeAttribute("aria-hidden");
        const names = document.getElementById("couple-names");
        if (names) names.setAttribute("aria-label", `${invitationData.brideName} و${invitationData.groomName}`);
        document.title = `${invitationData.brideName} و${invitationData.groomName} | لتكتمل الحكاية`;
      }
    };
    if (!("IntersectionObserver" in window)) {
      sections.forEach(reveal);
      return;
    }
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && state === STATES.INVITATION_ACTIVE) {
          reveal(entry.target);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.13, rootMargin: "0px 0px -24px 0px" });
    sections.forEach((section) => revealObserver.observe(section));
  }

  function initializeGallery() {
    const track = document.getElementById("photo-gallery");
    if (!track) return;
    const dots = document.getElementById("gallery-dots");
    const previous = document.getElementById("gallery-prev");
    const next = document.getElementById("gallery-next");
    const current = document.getElementById("gallery-current");
    const total = document.getElementById("gallery-total");
    const status = document.getElementById("gallery-status");
    const photos = invitationData.photos.filter((photo) => photo && assetUrl(photo.src));
    const number = (value) => String(value).padStart(2, "0");
    const slides = [];
    const dotButtons = [];
    let activeIndex = 0;
    let requestedIndex = null;
    let scrollFrame = 0;
    let settleTimer = 0;

    track.replaceChildren();
    if (dots) dots.replaceChildren();
    track.dir = "ltr";
    track.tabIndex = 0;
    track.setAttribute("role", "region");
    track.setAttribute("aria-roledescription", "معرض صور");
    if (!track.hasAttribute("aria-label")) track.setAttribute("aria-label", "صور من أجواء حكايتنا");
    if (status) {
      status.setAttribute("aria-live", "polite");
      status.setAttribute("aria-atomic", "true");
    }

    photos.forEach((photo, index) => {
      const slide = document.createElement("figure");
      slide.className = "gallery-slide";
      slide.id = `gallery-photo-${index + 1}`;
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "صورة");
      slide.setAttribute("aria-label", `${index + 1} من ${photos.length}`);
      const picture = document.createElement("img");
      picture.className = "gallery-image";
      picture.alt = photo.alt || "تفاصيل من أجواء الزفاف";
      picture.width = photo.width || 1200;
      picture.height = photo.height || 1500;
      picture.loading = "lazy";
      picture.decoding = "async";
      picture.draggable = false;
      picture.addEventListener("load", () => slide.classList.add("image-loaded"), { once: true });
      picture.addEventListener("error", () => slide.classList.add("image-unavailable"), { once: true });
      picture.src = assetUrl(photo.src);

      const caption = document.createElement("figcaption");
      caption.className = "gallery-caption";
      caption.dir = "rtl";
      const indexLabel = document.createElement("span");
      indexLabel.className = "gallery-index";
      indexLabel.textContent = number(index + 1);
      indexLabel.setAttribute("aria-hidden", "true");
      const title = document.createElement("h3");
      title.className = "gallery-title";
      title.textContent = photo.title || "من حكايتنا";
      const note = document.createElement("p");
      note.className = "gallery-note";
      note.textContent = photo.caption || "";
      caption.append(indexLabel, title, note);
      slide.append(picture, caption);
      track.append(slide);
      slides.push(slide);

      if (dots) {
        const dot = document.createElement("button");
        dot.className = "gallery-dot";
        dot.type = "button";
        dot.setAttribute("aria-label", `انتقل إلى الصورة ${index + 1}: ${photo.title || "من حكايتنا"}`);
        dot.setAttribute("aria-controls", slide.id);
        dot.addEventListener("click", () => goTo(index));
        dots.append(dot);
        dotButtons.push(dot);
      }
    });

    const targetPosition = (index) => {
      const slide = slides[index];
      if (!slide) return 0;
      // Layout offsets stay stable while the active image scales visually.
      const padding = parseFloat(window.getComputedStyle(track).paddingLeft) || 0;
      const left = slide.offsetLeft - slides[0].offsetLeft + padding
        - (track.clientWidth - slide.offsetWidth) / 2;
      return Math.max(0, Math.min(left, track.scrollWidth - track.clientWidth));
    };

    const announce = () => {
      if (status && photos[activeIndex]) {
        status.textContent = `الصورة ${activeIndex + 1} من ${photos.length}، ${photos[activeIndex].title || "من حكايتنا"}`;
      }
    };

    const renderPosition = () => {
      if (current) current.textContent = number(slides.length ? activeIndex + 1 : 0);
      if (total) total.textContent = number(slides.length);
      if (previous) previous.disabled = activeIndex === 0 || !slides.length;
      if (next) next.disabled = activeIndex === slides.length - 1 || !slides.length;
      slides.forEach((slide, index) => slide.classList.toggle("is-active", index === activeIndex));
      dotButtons.forEach((dot, index) => {
        dot.classList.toggle("is-active", index === activeIndex);
        if (index === activeIndex) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
    };

    updateGallery = () => {
      if (!track.clientWidth || !slides.length) return;
      let nearest = 0;
      let distance = Infinity;
      slides.forEach((slide, index) => {
        const offset = Math.abs(targetPosition(index) - track.scrollLeft);
        if (offset < distance) {
          distance = offset;
          nearest = index;
        }
      });
      activeIndex = nearest;
      renderPosition();
    };

    function goTo(index, immediate = false) {
      if (!slides.length) return;
      activeIndex = Math.max(0, Math.min(index, slides.length - 1));
      requestedIndex = activeIndex;
      track.scrollTo({ left: targetPosition(activeIndex), behavior: reducedMotion || immediate ? "instant" : "smooth" });
      renderPosition();
      announce();
    }

    track.addEventListener("scroll", () => {
      if (!scrollFrame) {
        scrollFrame = requestAnimationFrame(() => {
          scrollFrame = 0;
          updateGallery();
        });
      }
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        requestedIndex = null;
        updateGallery();
        announce();
      }, 180);
    }, { passive: true });
    track.addEventListener("pointerdown", () => { requestedIndex = null; }, { passive: true });
    track.addEventListener("keydown", (event) => {
      const navigationIndex = requestedIndex ?? activeIndex;
      const destinations = { ArrowLeft: navigationIndex - 1, ArrowRight: navigationIndex + 1, Home: 0, End: slides.length - 1 };
      if (!Object.prototype.hasOwnProperty.call(destinations, event.key)) return;
      event.preventDefault();
      goTo(destinations[event.key]);
    });
    if (previous) previous.addEventListener("click", () => goTo((requestedIndex ?? activeIndex) - 1));
    if (next) next.addEventListener("click", () => goTo((requestedIndex ?? activeIndex) + 1));
    let previousWidth = 0;
    const resize = () => {
      if (!track.clientWidth || track.clientWidth === previousWidth) return;
      previousWidth = track.clientWidth;
      goTo(activeIndex, true);
    };
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(track);
    else window.addEventListener("resize", resize, { passive: true });
    renderPosition();
  }

  function updatePetalMotion() {
    const field = document.getElementById("petal-field");
    if (!field) return;
    field.classList.toggle("petals-paused", reducedMotion || document.hidden);
    field.hidden = reducedMotion;
  }

  function initializePetals() {
    const field = document.getElementById("petal-field");
    if (!field) return;
    const fragment = document.createDocumentFragment();
    const count = window.matchMedia("(max-width: 699px), (pointer: coarse)").matches ? 7 : 16;
    for (let index = 0; index < count; index += 1) {
      const petal = document.createElement("i");
      petal.className = "petal";
      petal.style.setProperty("--x", `${(index / count * 94 + Math.random() * 4).toFixed(2)}vw`);
      petal.style.setProperty("--size", `${(7 + Math.random() * 8).toFixed(2)}px`);
      petal.style.setProperty("--duration", `${(17 + Math.random() * 15).toFixed(2)}s`);
      petal.style.setProperty("--delay", `${(-Math.random() * 32).toFixed(2)}s`);
      petal.style.setProperty("--drift", `${(-70 + Math.random() * 140).toFixed(2)}px`);
      petal.style.setProperty("--rotation", `${(120 + Math.random() * 400).toFixed(2)}deg`);
      fragment.append(petal);
    }
    field.replaceChildren(fragment);
    updatePetalMotion();
  }

  function validEventDate() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(invitationData.date || "") ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(invitationData.time || "")) return null;
    const [year, month, day] = invitationData.date.split("-").map(Number);
    const [hour, minute] = invitationData.time.split(":").map(Number);
    const local = Date.UTC(year, month - 1, day, hour, minute);
    const check = new Date(local);
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
    try {
      const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: invitationData.timeZone, year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
      });
      let timestamp = local;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const parts = Object.fromEntries(formatter.formatToParts(new Date(timestamp)).map((part) => [part.type, part.value]));
        const represented = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
        timestamp += local - represented;
      }
      const verification = Object.fromEntries(formatter.formatToParts(new Date(timestamp)).map((part) => [part.type, part.value]));
      if (+verification.year !== year || +verification.month !== month || +verification.day !== day ||
          +verification.hour !== hour || +verification.minute !== minute) return null;
      return new Date(timestamp);
    } catch {
      return null;
    }
  }

  function updateInvitationDetails() {
    document.querySelectorAll("[data-bind]").forEach((element) => {
      const key = element.dataset.bind;
      if (Object.prototype.hasOwnProperty.call(invitationData, key)) {
        element.textContent = invitationData[key] ?? "";
      }
    });
    document.title = invitationTitle;
    const eventDate = validEventDate();
    const dateDisplay = document.getElementById("date-display");
    const timeDisplay = document.getElementById("time-display");
    const venueDisplay = document.getElementById("venue-display");
    const cityDisplay = document.getElementById("city-display");
    const pending = document.getElementById("event-pending");
    const eventDetails = document.getElementById("event-details");
    const mapLink = document.getElementById("map-link");
    const saveDate = document.getElementById("save-date");
    if (venueDisplay) venueDisplay.textContent = invitationData.venue || "المكان… بداية الحكاية";
    if (cityDisplay) {
      cityDisplay.textContent = invitationData.city || "";
      cityDisplay.hidden = !invitationData.city;
    }
    if (dateDisplay) dateDisplay.textContent = eventDate
      ? new Intl.DateTimeFormat("ar-SY", { timeZone: invitationData.timeZone, day: "numeric", month: "long", year: "numeric" }).format(eventDate)
      : "نعلن التاريخ قريبًا";
    if (timeDisplay) {
      timeDisplay.hidden = false;
      timeDisplay.textContent = eventDate
        ? new Intl.DateTimeFormat("ar-SY", { timeZone: invitationData.timeZone, hour: "numeric", minute: "2-digit" }).format(eventDate)
        : "نعلن الساعة قريبًا";
    }
    if (pending) {
      pending.hidden = Boolean(eventDate);
      pending.textContent = "سنشارككم تفاصيل موعدنا قريبًا";
    }
    if (eventDetails) eventDetails.dataset.pending = eventDate ? "false" : "true";
    if (mapLink) {
      mapLink.hidden = true;
      mapLink.removeAttribute("href");
      try {
        const url = new URL(invitationData.mapsUrl);
        if (url.protocol === "https:") {
          mapLink.href = url.href;
          mapLink.target = "_blank";
          mapLink.rel = "noopener noreferrer";
          mapLink.hidden = false;
        }
      } catch { /* An unconfigured map remains hidden. */ }
    }
    if (saveDate) {
      saveDate.hidden = !eventDate;
      if (eventDate) saveDate.addEventListener("click", (event) => {
        event.preventDefault();
        downloadCalendar(eventDate);
      });
    }
    initializeCountdown(eventDate);
  }

  function initializeCountdown(eventDate) {
    const countdown = document.getElementById("countdown");
    const section = document.getElementById("the-moment");
    if (!countdown || !section) return;
    section.hidden = !eventDate;
    if (!eventDate) return;
    const dateLabel = document.getElementById("countdown-date");
    dateLabel.dateTime = eventDate.toISOString();
    dateLabel.textContent = invitationData.date.split("-").reverse().join(" . ");
    let inView = false;
    const units = [
      ["days", "يوم"], ["hours", "ساعة"], ["minutes", "دقيقة"], ["seconds", "ثانية"]
    ];
    const values = {};
    const numbers = new Intl.NumberFormat("ar-SY", { minimumIntegerDigits: 2, useGrouping: false });
    countdown.replaceChildren();
    countdown.setAttribute("role", "timer");
    countdown.setAttribute("aria-live", "off");
    units.forEach(([unit, label], index) => {
      const part = document.createElement("div");
      part.className = "countdown-part";
      part.style.setProperty("--unit-index", index);
      const value = document.createElement("span");
      value.className = "countdown-number countdown-value";
      value.dataset.countdown = unit;
      const caption = document.createElement("span");
      caption.className = "countdown-label";
      caption.textContent = label;
      part.append(value, caption);
      countdown.append(part);
      values[unit] = value;
    });
    const update = () => {
      const seconds = Math.max(0, Math.floor((eventDate.getTime() - Date.now()) / 1000));
      const remaining = {
        days: Math.floor(seconds / 86400), hours: Math.floor(seconds / 3600) % 24,
        minutes: Math.floor(seconds / 60) % 60, seconds: seconds % 60
      };
      units.forEach(([unit]) => {
        const next = numbers.format(remaining[unit]);
        if (values[unit].textContent === next) return;
        values[unit].textContent = next;
        if (inView && !reducedMotion && values[unit].animate) {
          values[unit].getAnimations().forEach((animation) => animation.cancel());
          values[unit].animate([
            { opacity: .25, transform: "translateY(9px) scale(.96)" },
            { opacity: 1, transform: "translateY(0) scale(1)" }
          ], { duration: 480, easing: "cubic-bezier(.16,1,.3,1)" });
        }
      });
      countdown.setAttribute("aria-label", seconds > 0
        ? `بقي ${numbers.format(remaining.days)} يوم و${numbers.format(remaining.hours)} ساعة على موعدنا`
        : "حلّ يوم حكايتنا");
      if (!seconds) {
        section.classList.add("moment-arrived");
        document.getElementById("countdown-heading").textContent = "وحانت لحظة حكايتنا.";
        document.getElementById("countdown-message").textContent = "اليوم يبدأ العمر الجميل… وبكم تكتمل الفرحة.";
        window.clearInterval(countdownTimer);
        countdownTimer = null;
      }
    };
    const sync = () => {
      window.clearInterval(countdownTimer);
      countdownTimer = null;
      const running = inView && !document.hidden && state === STATES.INVITATION_ACTIVE;
      section.classList.toggle("moment-running", running);
      if (running) {
        update();
        if (eventDate.getTime() > Date.now()) countdownTimer = window.setInterval(update, 1000);
      }
    };
    update();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        sync();
      }, { threshold: 0 }).observe(section);
    } else {
      inView = true;
    }
    new MutationObserver(sync).observe(body, { attributes: true, attributeFilter: ["data-state"] });
    document.addEventListener("visibilitychange", sync);
  }

  function downloadCalendar(eventDate) {
    const escape = (value) => String(value).replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
    const timestamp = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Their Story//Wedding Invitation//AR",
      "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
      `UID:${eventDate.getTime()}-wedding@invitation.local`,
      `DTSTAMP:${timestamp(new Date())}`, `DTSTART:${timestamp(eventDate)}`,
      `SUMMARY:${escape(`حفل زفاف ${invitationData.brideName} و${invitationData.groomName}`)}`,
      `DESCRIPTION:${escape(invitationData.openingPhrase)}`,
      `LOCATION:${escape([invitationData.venue, invitationData.city].filter(Boolean).join("، "))}`,
      "END:VEVENT", "END:VCALENDAR"
    ];
    // Fold at UTF-8 byte boundaries for calendar apps that enforce RFC 5545.
    const encoder = new TextEncoder();
    const foldLine = (line) => {
      const folded = [];
      let segment = "";
      let bytes = 0;
      for (const character of line) {
        const length = encoder.encode(character).length;
        if (bytes + length > 73) {
          folded.push(segment);
          segment = " ";
          bytes = 1;
        }
        segment += character;
        bytes += length;
      }
      folded.push(segment);
      return folded.join("\r\n");
    };
    const blob = new Blob([lines.map(foldLine).join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${invitationData.brideName}-${invitationData.groomName}.ics`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  function updateSoundButton() {
    if (soundButton) {
      soundButton.setAttribute("aria-pressed", String(soundEnabled));
      soundButton.setAttribute("aria-label", soundEnabled ? "إيقاف الأغنية" : "تشغيل الأغنية");
      soundButton.dataset.enabled = String(soundEnabled);
    }
  }

  async function startMusic() {
    if (!music) return;
    const request = ++musicRequest;
    if (!musicStarted || music.ended) {
      try { music.currentTime = musicStart; } catch { /* Metadata handler retries. */ }
    }
    soundEnabled = true;
    updateSoundButton();
    try {
      await music.play();
      if (request !== musicRequest) return;
      musicStarted = true;
    } catch {
      if (request !== musicRequest) return;
      soundEnabled = false;
      updateSoundButton();
      liveStatus.textContent = "تعذّر تشغيل الأغنية. يمكنكم المحاولة من زر الصوت.";
    }
  }

  function toggleSound() {
    if (!music) return;
    if (soundEnabled) {
      musicRequest += 1;
      music.pause();
      soundEnabled = false;
      updateSoundButton();
    } else void startMusic();
  }

  if (music) {
    music.addEventListener("loadedmetadata", () => {
      if (!musicStarted && music.currentTime < musicStart) music.currentTime = musicStart;
    });
    music.addEventListener("play", () => { soundEnabled = true; updateSoundButton(); });
    music.addEventListener("pause", () => { soundEnabled = false; updateSoundButton(); });
    music.addEventListener("ended", () => { soundEnabled = false; updateSoundButton(); });
    music.addEventListener("error", () => { soundEnabled = false; updateSoundButton(); });
  }

  if (soundButton) {
    updateSoundButton();
    soundButton.addEventListener("click", () => { void toggleSound(); });
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) resetPointer();
    updatePetalMotion();
  });

  // A small read-only diagnostic surface for browser QA and integration.
  Object.defineProperty(window, "weddingExperience", {
    configurable: false,
    writable: false,
    value: Object.freeze({
      getState: () => state,
      get isTransitioning() { return transitioning; },
      get reducedMotion() { return reducedMotion; },
      states: STATES,
      replay: replayIntro,
      skip: skipIntro
    })
  });

  updateInvitationDetails();
  initializeGallery();
  initializePetals();
  configureAssets();
  void runOpening();
})();
