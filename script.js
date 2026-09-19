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
  date: null,
  time: null,
  timeZone: "Asia/Damascus",
  venue: "المكان… بداية الحكاية",
  city: "سيُعلن قريبًا",
  mapsUrl: null,
  openingPhrase: "ومن بين كل الحكايات... بدأت حكايتنا",
  closingPhrase: "بانتظاركم لتكتمل الحكاية",
  // Optional assets are requested only when their path is configured.
  // Transparent door/pedestal assets should be tightly cropped to their object.
  assets: Object.freeze({
    interior: "assets/interior.webp",
    floralArch: "assets/floral-arch.webp",
    embossedPaper: "assets/embossed-paper.webp",
    waxSeal: "assets/wax-seal.webp",
    doorLeft: null,
    doorRight: null,
    pedestal: null,
    paperTexture: "assets/paper-texture.webp",
    monogram: null,
    hand: null
  })
});

(() => {
  const body = document.body;
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
    "approached", "card-pressed", "card-presented", "card-opened",
    "foil-drawn", "entering-card", "invitation-active", "hint-visible",
    "skip-entry"
  ];
  const STATES = Object.freeze({
    LOADING: "LOADING",
    DOOR_SCENE: "DOOR_SCENE",
    DOOR_OPENING: "DOOR_OPENING",
    CAMERA_ENTERING: "CAMERA_ENTERING",
    PEDESTAL_APPROACH: "PEDESTAL_APPROACH",
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
  let audioContext = null;
  let soundEnabled = false;
  let activationGateUntil = 0;
  let optionalHand = null;
  const waits = new Map();

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
    const pedestal = document.querySelector(".pedestal");
    const pedestalImage = appendAsset(pedestal, assets.pedestal, "pedestal-asset", () => {
      pedestal.classList.add("has-pedestal-asset");
      pedestal.querySelectorAll(".pedestal-top, .pedestal-cap, .table-leg")
        .forEach((part) => { part.hidden = true; });
    });
    if (pedestalImage) Object.assign(pedestalImage.style, { top: "-8px", objectFit: "fill", zIndex: "2" });
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
    card.setAttribute("aria-label", `افتح دعوة زفاف ${invitationData.brideName} و${invitationData.groomName}`);
    setState(STATES.CARD_READY, "الدعوة أمامك. المس الختم لفتحها.");
    if (await wait(1300, token)) {
      if (state === STATES.CARD_READY && !transitioning) setHint("", true);
    }
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

    if (!(await wait(900, token))) return;
    setState(STATES.DOOR_OPENING);
    body.classList.add("doors-open");
    playSound("door");
    if (!(await wait(1450, token))) return;
    setState(STATES.CARD_PRESENTING);
    body.classList.add("card-presented");
    if (!(await wait(250, token))) return;
    setState(STATES.CAMERA_ENTERING);
    body.classList.add("camera-entered");
    if (!(await wait(1800, token))) return;
    setState(STATES.PEDESTAL_APPROACH);
    body.classList.add("approached");
    if (!(await wait(1400, token))) return;
    await makeCardReady(token);
  }

  async function openCard() {
    const token = epoch;
    transitioning = true;
    card.disabled = true;
    body.classList.add("card-pressed");
    setHint("", false);
    setState(STATES.CARD_OPENING, "تُفتح الدعوة.");
    playSound("touch");
    if (!(await wait(reducedMotion ? 30 : 80, token))) return;
    body.classList.remove("card-pressed");
    setHandVisible(false);
    body.classList.add("card-opened");
    playSound("open");
    if (!(await wait(reducedMotion ? 240 : 1500, token))) return;
    setState(STATES.CARD_OPEN);
    body.classList.add("foil-drawn");
    if (!(await wait(reducedMotion ? 120 : 900, token))) return;
    if (!(await wait(reducedMotion ? 80 : 450, token))) return;
    setState(STATES.ENTERING_CARD);
    // Paper must cover wide screens too; center and cover travel independently.
    const cardWidth = card.offsetWidth;
    body.style.setProperty("--entry-scale", String(Math.max(6.6, window.innerWidth / cardWidth * 1.2)));
    body.classList.add("entering-card");
    if (!(await wait(reducedMotion ? 220 : 2100, token))) return;
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
    if (await wait(reducedMotion ? 260 : 1100, token)) cinematic.hidden = true;
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
    if (![STATES.CARD_READY, STATES.INVITATION_ACTIVE].includes(state)) return;
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
    if (reducedMotion || !("IntersectionObserver" in window)) {
      sections.forEach((section) => section.classList.add("revealed"));
      return;
    }
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.13, rootMargin: "0px 0px -24px 0px" });
    sections.forEach((section) => revealObserver.observe(section));
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
    document.title = `${invitationData.brideName} و${invitationData.groomName} | لتكتمل الحكاية`;
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
    if (cityDisplay) cityDisplay.textContent = invitationData.city || "سيُعلن قريبًا";
    if (dateDisplay) dateDisplay.textContent = eventDate
      ? new Intl.DateTimeFormat("ar-SY", { timeZone: invitationData.timeZone, day: "numeric", month: "long", year: "numeric" }).format(eventDate)
      : "موعدٌ نترقّبه";
    if (timeDisplay) {
      timeDisplay.hidden = !eventDate;
      timeDisplay.textContent = eventDate
        ? new Intl.DateTimeFormat("ar-SY", { timeZone: invitationData.timeZone, hour: "numeric", minute: "2-digit" }).format(eventDate)
        : "";
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
    if (!countdown) return;
    countdown.hidden = !eventDate;
    if (!eventDate) return;
    const units = [
      ["days", "يوم"], ["hours", "ساعة"], ["minutes", "دقيقة"], ["seconds", "ثانية"]
    ];
    const values = {};
    const numbers = new Intl.NumberFormat("ar-SY", { minimumIntegerDigits: 2, useGrouping: false });
    countdown.replaceChildren();
    countdown.setAttribute("role", "timer");
    countdown.setAttribute("aria-live", "off");
    units.forEach(([unit, label]) => {
      const part = document.createElement("div");
      part.className = "countdown-part";
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
      units.forEach(([unit]) => { values[unit].textContent = numbers.format(remaining[unit]); });
      countdown.setAttribute("aria-label", seconds > 0
        ? `بقي ${numbers.format(remaining.days)} يوم و${numbers.format(remaining.hours)} ساعة على موعدنا`
        : "حلّ يوم حكايتنا");
      if (!seconds && countdownTimer) {
        window.clearInterval(countdownTimer);
        countdownTimer = null;
      }
    };
    update();
    if (eventDate.getTime() > Date.now()) countdownTimer = window.setInterval(update, 1000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) update(); });
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

  // Quiet material sounds only. Creating/resuming an audio context requires the
  // visitor's explicit sound-toggle gesture; nothing plays on page load.
  async function toggleSound() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      try {
        if (!audioContext) audioContext = new AudioContextClass();
        await audioContext.resume();
      } catch {
        soundEnabled = false;
      }
    }
    if (soundButton) {
      soundButton.setAttribute("aria-pressed", String(soundEnabled));
      soundButton.setAttribute("aria-label", soundEnabled ? "إيقاف الصوت" : "تشغيل الصوت الهادئ");
      soundButton.dataset.enabled = String(soundEnabled);
    }
    if (soundEnabled) playSound("touch");
  }

  function playSound(kind) {
    if (!soundEnabled || !audioContext || audioContext.state !== "running") return;
    const durations = { touch: 0.09, lift: 0.22, open: 0.55, door: 0.8 };
    const duration = durations[kind] || 0.15;
    const buffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * duration), audioContext.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) samples[index] = Math.random() * 2 - 1;
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const envelope = audioContext.createGain();
    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.value = kind === "door" ? 170 : 1350;
    const now = audioContext.currentTime;
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(kind === "door" ? 0.035 : 0.018, now + Math.min(0.025, duration / 4));
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter).connect(envelope).connect(audioContext.destination);
    source.start(now);
    source.stop(now + duration);
    source.onended = () => { source.disconnect(); filter.disconnect(); envelope.disconnect(); };
  }

  if (soundButton) {
    if (!window.AudioContext && !window.webkitAudioContext) soundButton.hidden = true;
    soundButton.setAttribute("aria-pressed", "false");
    soundButton.addEventListener("click", () => { void toggleSound(); });
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) resetPointer();
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
  configureAssets();
  void runOpening();
})();
