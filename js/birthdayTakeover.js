/* ============================================================
   DAVIS BIRTHDAY TAKEOVER
   ============================================================

   Save as:
     js/birthdayTakeover.js

   Public API:
     window.startBirthdayTakeoverSystem()

   This file intentionally does NOT auto-start when loaded.
   logistics.html should call startBirthdayTakeoverSystem()
   when the FAQ partial is opened.

   Expected partial:
     logistics/birthdayTakeover.html
   ============================================================ */

/* ============================================================
   EASY MASTER SWITCH
   ------------------------------------------------------------
   Keep this FALSE while reviewing the website normally.
   Change it to TRUE only when you want the FAQ takeover armed.
   ============================================================ */

const ENABLE_BIRTHDAY_TAKEOVER = true;


(() => {
  "use strict";

  const CONFIG = {
    enabled: ENABLE_BIRTHDAY_TAKEOVER,
    // Keep TRUE while developing/testing.
    // Change to FALSE for the actual party.
    testMode: true,

    takeoverHtml: "logistics/birthdayTakeover.html",
    sessionKey: "davisBirthdayTakeoverCompleted",

    introDelay: 900,

    popupMessages: [
      "sorry.",
      "I appreciate everyone’s patience.",
      "but...",
      "I’m going to hijack this presentation for a minute..."
    ],

    popupReadDelay: 1250,
    closeDangerRadius: 125,
    closeMoveCooldown: 210,

    terminalTypingSpeed: 35,
    terminalHold: 360,
    storyTypingSpeed: 48,

    story: [
      {
        text: "Life with you is the greatest adventure.",
        collection: "life",
        hold: 5200,
        swapSpeed: 1100,
        visibleCount: 6
      },
      {
        text: "Four trips around the sun.",
        collection: "birthday",
        hold: 4300,
        swapSpeed: 1200,
        visibleCount: 4
      },
      {
        text: "Six countries conquered.",
        collection: "travel",
        hold: 4500,
        swapSpeed: 1050,
        visibleCount: 5
      },
      {
        text: "And my favorite place is still by your side.",
        collection: "couple",
        hold: 5200,
        swapSpeed: 1200,
        visibleCount: 5
      }
    ],

    engagementText: "Guess I’m lucky I get to stay here forever.",
    engagementHold: 6500,

    finalText: "Happy 33rd Birthday,\nHere's to many more together",

    countdownLeadIn: 1300,
    countdownNumberHold: 900,

    audio: {
      love: "Assets/takeover/cantHelpFallingInLove.mp3",
      birthday: "Assets/takeover/happyBirthday.mp3",
      glitch: "",
      crt: "",
      slam: ""
    },

    /*
     * PHOTO COLLECTIONS
     * ----------------------------------------------------------
     * Expected files:
     *   lifeImage1.jpg ... lifeImage12.jpg
     *   birthdayImage1.jpg ... birthdayImage6.jpg
     *   travelImage1.jpg ... travelImage8.jpg
     *   coupleImage1.jpg ... coupleImage6.jpg
     *   engagementImage1.jpg ... engagementImage5.jpg
     *
     * engagementImage1.jpg is the focal proposal image.
     */
    images: {
      life: {
        count: 10,
        prefix: "Assets/takeover/lifeImage",
        extension: ".jpg"
      },
      birthday: {
        count: 6,
        prefix: "Assets/takeover/birthdayImage",
        extension: ".jpg"
      },
      travel: {
        count: 8,
        prefix: "Assets/takeover/travelImage",
        extension: ".jpg"
      },
      couple: {
        count: 8,
        prefix: "Assets/takeover/coupleImage",
        extension: ".jpg"
      },
      engagement: {
        count: 3,
        prefix: "Assets/takeover/engagementImage",
        extension: ".jpg",
        focalImage: 1
      }
    },

    birthdayAudioFallback: 20000
  };

  const STATE = {
    loaded: false,
    initialized: false,
    running: false,
    completed: false,
    cleanupStarted: false,

    root: null,
    faqRoot: null,
    faqTitle: null,
    elements: {},

    timers: new Set(),
    intervals: new Set(),

    extractionSpans: [],
    photoSlots: [],
    engagementPhotos: [],
    photoRotationInterval: null,

    closeEvasionEnabled: false,
    lastCloseMove: 0,
    popupPointerHandler: null,

    audioUnlocked: false
  };

  function wait(ms) {
    return new Promise(resolve => {
      const id = setTimeout(() => {
        STATE.timers.delete(id);
        resolve();
      }, ms);
      STATE.timers.add(id);
    });
  }

  function setManagedTimeout(fn, ms) {
    const id = setTimeout(() => {
      STATE.timers.delete(id);
      fn();
    }, ms);
    STATE.timers.add(id);
    return id;
  }

  function setManagedInterval(fn, ms) {
    const id = setInterval(fn, ms);
    STATE.intervals.add(id);
    return id;
  }

  function clearManagedTimers() {
    STATE.timers.forEach(clearTimeout);
    STATE.intervals.forEach(clearInterval);
    STATE.timers.clear();
    STATE.intervals.clear();
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function show(element) {
    if (element) element.classList.remove("birthday-hidden");
  }

  function hide(element) {
    if (element) element.classList.add("birthday-hidden");
  }

  function forceReflow(element) {
    if (element) void element.offsetWidth;
  }

  function getCollectionPaths(name) {
    const collection = CONFIG.images[name];
    if (!collection) return [];

    return Array.from(
      { length: collection.count },
      (_, index) => `${collection.prefix}${index + 1}${collection.extension}`
    );
  }

  function preloadImages() {
    Object.keys(CONFIG.images).forEach(name => {
      getCollectionPaths(name).forEach(src => {
        const image = new Image();
        image.src = src;
      });
    });
  }

  function findFaqTitle() {
    const headings = [...document.querySelectorAll("h1, h2, h3, h4")];
    return headings.find(element =>
      element.textContent.trim().toLowerCase().includes("frequently asked questions")
    ) || null;
  }

  function findFaqRoot(title) {
    if (!title) return null;

    return (
      title.closest(".faq-page") ||
      title.closest(".logistics-subpage") ||
      title.closest(".logistics-content") ||
      title.closest("[data-logistics-page]") ||
      title.closest("main") ||
      title.parentElement
    );
  }

  async function loadTakeoverHtml() {
    const existing = document.getElementById("birthdayTakeoverRoot");
    if (existing) {
      STATE.root = existing;
      STATE.loaded = true;
      return;
    }

    const response = await fetch(CONFIG.takeoverHtml, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`[Birthday Takeover] Failed to load ${CONFIG.takeoverHtml} (${response.status}).`);
    }

    const html = await response.text();
    document.body.insertAdjacentHTML("beforeend", html);

    STATE.root = document.getElementById("birthdayTakeoverRoot");

    if (!STATE.root) {
      throw new Error("[Birthday Takeover] birthdayTakeoverRoot was not found in the loaded partial.");
    }

    STATE.loaded = true;
  }

  function cacheElements() {
    const byId = id => document.getElementById(id);

    STATE.elements = {
      modal: byId("birthdayTakeoverModal"),
      modalTitle: byId("birthdayTakeoverModalTitle"),
      close: byId("birthdayTakeoverClose"),
      skip: byId("birthdayTakeoverSkip"),
      ok: byId("birthdayTakeoverOk"),

      terminal: byId("birthdayTakeoverTerminal"),
      terminalText: byId("birthdayTakeoverTerminalText"),
      terminalCursor: byId("birthdayTakeoverTerminalCursor"),
      progressWrap: byId("birthdayTakeoverProgressWrap"),
      progress: byId("birthdayTakeoverProgress"),
      progressPercent: byId("birthdayTakeoverProgressPercent"),

      noise: byId("birthdayTakeoverNoise"),
      tear: byId("birthdayTakeoverTear"),
      corruption: byId("birthdayTakeoverCorruption"),
      crt: byId("birthdayTakeoverCRT"),
      launch: byId("birthdayTakeoverLaunch"),
      black: byId("birthdayTakeoverBlack"),

      slam: byId("birthdayTakeoverSlam"),
      slamText: byId("birthdayTakeoverSlamText"),
      slamFlash: byId("birthdayTakeoverSlamFlash"),

      story: byId("birthdayTakeoverStory"),
      photoLayer: byId("birthdayTakeoverPhotoLayer"),
      engagementLayer: byId("birthdayTakeoverEngagementLayer"),
      storyText: byId("birthdayTakeoverStoryText"),
      storyTextValue: byId("birthdayTakeoverStoryTextValue"),
      storyCursor: byId("birthdayTakeoverStoryCursor"),

      final: byId("birthdayTakeoverFinal"),
      finalMessage: byId("birthdayTakeoverFinalMessage"),
      countdown: byId("birthdayTakeoverCountdown"),

      loveAudio: byId("birthdayTakeoverLoveAudio"),
      birthdayAudio: byId("birthdayTakeoverBirthdayAudio"),
      glitchAudio: byId("birthdayTakeoverGlitchAudio"),
      crtAudio: byId("birthdayTakeoverCrtAudio"),
      slamAudio: byId("birthdayTakeoverSlamAudio"),

      testControls: byId("birthdayTakeoverTestControls"),
      testRestart: byId("birthdayTakeoverTestRestart"),
      testTerminal: byId("birthdayTakeoverTestTerminal"),
      testGlitch: byId("birthdayTakeoverTestGlitch"),
      testSlam: byId("birthdayTakeoverTestSlam"),
      testStory: byId("birthdayTakeoverTestStory"),
      testEngagement: byId("birthdayTakeoverTestEngagement"),
      testFinal: byId("birthdayTakeoverTestFinal")
    };
  }

  function configureAudio() {
    const e = STATE.elements;

    const assignments = [
      [e.loveAudio, CONFIG.audio.love],
      [e.birthdayAudio, CONFIG.audio.birthday],
      [e.glitchAudio, CONFIG.audio.glitch],
      [e.crtAudio, CONFIG.audio.crt],
      [e.slamAudio, CONFIG.audio.slam]
    ];

    assignments.forEach(([audio, src]) => {
      if (!audio || !src) return;
      audio.src = src;
      audio.preload = "auto";
    });
  }

  function unlockAudioFromGesture() {
    const audios = [
      STATE.elements.loveAudio,
      STATE.elements.birthdayAudio,
      STATE.elements.glitchAudio,
      STATE.elements.crtAudio,
      STATE.elements.slamAudio
    ].filter(Boolean);

    audios.forEach(audio => {
      if (!audio.src) return;

      const originalVolume = audio.volume;
      audio.volume = 0;

      const promise = audio.play();
      if (promise && typeof promise.then === "function") {
        promise
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = originalVolume;
          })
          .catch(() => {
            audio.volume = originalVolume;
          });
      }
    });

    STATE.audioUnlocked = true;
  }

  function playSfx(audio, { volume = 1, playbackRate = 1, restart = true } = {}) {
    if (!audio || !audio.src) return;

    try {
      if (restart) {
        audio.pause();
        audio.currentTime = 0;
      }

      audio.volume = clamp(volume, 0, 1);
      audio.playbackRate = playbackRate;
      const promise = audio.play();
      if (promise && typeof promise.catch === "function") promise.catch(() => {});
    } catch (_) {}
  }

  async function playLoveTrack() {
    const audio = STATE.elements.loveAudio;
    if (!audio || !audio.src) return;

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0;
      await audio.play();

      for (let i = 1; i <= 14; i++) {
        audio.volume = i / 14;
        await wait(65);
      }
    } catch (error) {
      console.warn("[Birthday Takeover] Love music could not play.", error);
    }
  }

  async function fadeOutLoveTrack(duration = 2600) {
    const audio = STATE.elements.loveAudio;
    if (!audio || audio.paused) return;

    const startVolume = audio.volume;
    const steps = 26;
    const stepTime = duration / steps;

    for (let i = 1; i <= steps; i++) {
      audio.volume = Math.max(0, startVolume * (1 - i / steps));
      await wait(stepTime);
    }

    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1;
  }

  function setClosePosition(x, y) {
    const button = STATE.elements.close;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const width = rect.width || 90;
    const height = rect.height || 44;

    button.style.left = `${clamp(x, 16, window.innerWidth - width - 16)}px`;
    button.style.top = `${clamp(y, 16, window.innerHeight - height - 16)}px`;
  }

  function moveCloseFarAway(pointerX, pointerY) {
    const margin = 32;

    const candidates = [
      [margin, margin],
      [window.innerWidth - 130, margin],
      [margin, window.innerHeight - 75],
      [window.innerWidth - 130, window.innerHeight - 75],
      [window.innerWidth * 0.2, window.innerHeight * 0.72],
      [window.innerWidth * 0.75, window.innerHeight * 0.22],
      [window.innerWidth * 0.72, window.innerHeight * 0.7],
      [window.innerWidth * 0.18, window.innerHeight * 0.25]
    ];

    const ranked = candidates
      .map(([x, y]) => ({
        x,
        y,
        distance: Math.hypot(x - pointerX, y - pointerY)
      }))
      .sort((a, b) => b.distance - a.distance);

    const topChoices = ranked.slice(0, 3);
    const choice = topChoices[Math.floor(Math.random() * topChoices.length)];
    setClosePosition(choice.x, choice.y);
  }

  function handlePointerMove(event) {
    if (!STATE.closeEvasionEnabled) return;

    const button = STATE.elements.close;
    if (!button || button.classList.contains("birthday-hidden")) return;

    const now = performance.now();
    if (now - STATE.lastCloseMove < CONFIG.closeMoveCooldown) return;

    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);

    if (distance <= CONFIG.closeDangerRadius) {
      STATE.lastCloseMove = now;
      moveCloseFarAway(event.clientX, event.clientY);
    }
  }

  async function showPopupMessage(text, index) {
    const { modal, modalTitle, close, skip, ok } = STATE.elements;

    show(modal);
    modalTitle.textContent = text;
    hide(skip);
    hide(ok);

    const isFinal = index === CONFIG.popupMessages.length - 1;

    if (isFinal) {
      STATE.closeEvasionEnabled = false;
      hide(close);
      show(skip);
      show(ok);
      return;
    }

    STATE.closeEvasionEnabled = false;
    close.classList.add("birthday-reading");
    show(close);

    setClosePosition(
      window.innerWidth / 2 + 150,
      window.innerHeight / 2 + 80
    );

    await wait(CONFIG.popupReadDelay);

    close.classList.remove("birthday-reading");
    STATE.closeEvasionEnabled = true;
  }

  function runPopupSequence() {
    return new Promise(resolve => {
      const { close, skip, ok } = STATE.elements;

      let index = 0;
      let advancing = false;

      const render = async () => {
        await showPopupMessage(
          CONFIG.popupMessages[index],
          index
        );
      };

      const advancePopup = async () => {
        if (advancing) return;

        if (index >= CONFIG.popupMessages.length - 1) {
          return;
        }

        advancing = true;
        STATE.closeEvasionEnabled = false;
        index += 1;

        // Let the X visibly escape before changing the message.
        await wait(450);
        await render();

        advancing = false;
      };

      const closeHandler = async event => {
        event.preventDefault();
        await advancePopup();
      };

      const popupPointerHandler = event => {
        if (
          !STATE.closeEvasionEnabled ||
          advancing ||
          index >= CONFIG.popupMessages.length - 1
        ) {
          return;
        }

        const rect = close.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const distance = Math.hypot(
          event.clientX - centerX,
          event.clientY - centerY
        );

        if (distance <= CONFIG.closeDangerRadius) {
          handlePointerMove(event);
          void advancePopup();
          return;
        }

        handlePointerMove(event);
      };

      const skipHandler = event => {
        event.preventDefault();

        skip.classList.add("birthday-button-disabled");
        skip.setAttribute("aria-disabled", "true");
      };

      const okHandler = () => {
        unlockAudioFromGesture();
        STATE.closeEvasionEnabled = false;

        document.removeEventListener(
          "pointermove",
          popupPointerHandler
        );

        STATE.popupPointerHandler = null;

        close.removeEventListener(
          "click",
          closeHandler
        );

        skip.removeEventListener(
          "click",
          skipHandler
        );

        ok.removeEventListener(
          "click",
          okHandler
        );

        hide(STATE.elements.modal);
        hide(close);

        document.body.classList.add(
          "birthday-cursor-hidden"
        );

        resolve();
      };

      close.addEventListener(
        "click",
        closeHandler
      );

      skip.addEventListener(
        "click",
        skipHandler
      );

      ok.addEventListener(
        "click",
        okHandler
      );

      STATE.popupPointerHandler =
        popupPointerHandler;

      document.addEventListener(
        "pointermove",
        popupPointerHandler
      );

      void render();
    });
  }

  function createTerminalLine() {
    const line = document.createElement("div");
    line.className = "birthday-terminal-line";
    STATE.elements.terminalText.appendChild(line);
    return line;
  }

  async function typeInto(element, text, speed = CONFIG.terminalTypingSpeed) {
    element.textContent = "";

    for (const character of text) {
      element.textContent += character;
      const variance = character === " " ? 0.35 : random(0.82, 1.18);
      await wait(speed * variance);
    }
  }

  async function terminalLine(text, hold = CONFIG.terminalHold) {
    const line = createTerminalLine();
    await typeInto(line, `> ${text}`);
    await wait(hold);
    return line;
  }

  async function replaceTerminalLine(line, text, hold = CONFIG.terminalHold) {
    const current = line.textContent;

    for (let i = current.length; i >= Math.max(0, current.length - 8); i--) {
      line.textContent = current.slice(0, i);
      await wait(18);
    }

    line.textContent = "";
    await typeInto(line, `> ${text}`);
    await wait(hold);
  }

  async function animateEllipsis(line, baseText, cycles = 4) {
    for (let i = 0; i < cycles; i++) {
      for (let dots = 1; dots <= 3; dots++) {
        line.textContent = `> ${baseText}${".".repeat(dots)}`;
        await wait(250);
      }
    }
  }

  async function setExtractionProgress(value) {
    const normalized = clamp(value, 0, 100);
    STATE.elements.progress.style.width = `${normalized}%`;
    STATE.elements.progressPercent.textContent = `${Math.round(normalized)}%`;

    await wait(
      normalized < 20 ? 420 :
      normalized < 55 ? 260 :
      120
    );
  }

  function textNodesWithin(root) {
    if (!root) return [];

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;

          const parent = node.parentElement;

          if (!parent) {
            return NodeFilter.FILTER_REJECT;
          }

          if (parent.closest("#birthdayTakeoverRoot")) {
            return NodeFilter.FILTER_REJECT;
          }

          if (parent.closest(".birthday-extract-character")) {
            return NodeFilter.FILTER_REJECT;
          }

          if (
            ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)
          ) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodes = [];
    let current;

    while ((current = walker.nextNode())) {
      nodes.push(current);
    }

    return nodes;
  }

  function findTextNodeContaining(root, searchText) {
    const needle = searchText.toLowerCase();
    return textNodesWithin(root).find(node =>
      node.nodeValue.toLowerCase().includes(needle)
    ) || null;
  }

  function wrapCharacterInTextNode(textNode, index) {
    if (!textNode || index < 0 || index >= textNode.nodeValue.length) return null;

    const text = textNode.nodeValue;
    const before = text.slice(0, index);
    const character = text[index];
    const after = text.slice(index + 1);

    const fragment = document.createDocumentFragment();

    if (before) fragment.appendChild(document.createTextNode(before));

    const span = document.createElement("span");
    span.className = "birthday-extract-character";
    span.textContent = character;
    fragment.appendChild(span);

    if (after) fragment.appendChild(document.createTextNode(after));

    textNode.parentNode.replaceChild(fragment, textNode);
    STATE.extractionSpans.push(span);

    return span;
  }

  function wrapSpecificCharacter(root, phrase, desiredCharacter) {
    const node = findTextNodeContaining(root, phrase);
    if (!node) return null;

    const phraseIndex = node.nodeValue.toLowerCase().indexOf(phrase.toLowerCase());
    if (phraseIndex < 0) return null;

    const relativeIndex = phrase.toLowerCase().indexOf(desiredCharacter.toLowerCase());
    if (relativeIndex < 0) return null;

    return wrapCharacterInTextNode(node, phraseIndex + relativeIndex);
  }

  function wrapNextCharacter(root, desiredCharacter) {
    const nodes = textNodesWithin(root);
    const target = desiredCharacter.toLowerCase();

    for (const node of nodes) {
      const index = node.nodeValue.toLowerCase().indexOf(target);
      if (index >= 0) return wrapCharacterInTextNode(node, index);
    }

    return null;
  }

  async function removeCharacter(span, duration = 580) {
    if (!span) return;

    span.classList.add("birthday-character-removing");
    await wait(duration);
    span.classList.remove("birthday-character-removing");
    span.classList.add("birthday-character-gone");
  }

  async function runExtraction() {
    const root = STATE.faqRoot || document.body;

    show(STATE.elements.progressWrap);
    STATE.elements.progress.style.width = "0%";
    STATE.elements.progressPercent.textContent = "0%";

    let firstA = wrapSpecificCharacter(
      root,
      "Frequently Asked Questions",
      "A"
    );

    if (!firstA) firstA = wrapNextCharacter(root, "A");

    let firstD = wrapSpecificCharacter(
      root,
      "Documents, phones, insurance + money",
      "D"
    );

    if (!firstD) firstD = wrapNextCharacter(root, "D");

    await setExtractionProgress(7);
    await removeCharacter(firstA, 720);

    await setExtractionProgress(14);
    await removeCharacter(firstD, 660);

    const remainingCharacters = "HAPPYBIRTHDAYDAVIS".split("");
    const targets = remainingCharacters
      .map(character => wrapNextCharacter(root, character))
      .filter(Boolean);

    const progressStages = [29, 48, 72, 100];
    const chunks = [
      targets.slice(0, 4),
      targets.slice(4, 8),
      targets.slice(8, 13),
      targets.slice(13)
    ];

    for (let i = 0; i < chunks.length; i++) {
      await Promise.all(
        chunks[i].map(async (span, index) => {
          await wait(index * 55);
          await removeCharacter(span, 330);
        })
      );

      await setExtractionProgress(progressStages[i]);
    }

    await wait(320);
  }

  async function runTerminalSequence() {
    const { terminal, terminalText, progressWrap } = STATE.elements;

    terminalText.innerHTML = "";
    hide(progressWrap);
    show(terminal);

    await terminalLine("system override detected", 300);

    const initialize = await terminalLine(
      "initializing presentationTakeover.exe",
      260
    );

    await wait(250);

    await replaceTerminalLine(
      initialize,
      "presentationTakeover.exe initialized successfully",
      320
    );

    const downloadLine = createTerminalLine();
    await typeInto(downloadLine, "> downloading images");
    await animateEllipsis(downloadLine, "downloading images", 3);
    await replaceTerminalLine(downloadLine, "images downloaded successfully", 300);

    const locating = createTerminalLine();
    await typeInto(locating, "> locating usable characters");
    await animateEllipsis(locating, "locating usable characters", 2);
    await replaceTerminalLine(locating, "usable characters located", 320);

    await terminalLine("extraction initialized", 260);
    await runExtraction();
    hide(STATE.elements.progressWrap);

    await terminalLine("extraction complete", 320);
    await terminalLine("presentationTakeover.exe successfully loaded", 300);
    await terminalLine("takeover.exe launching", 520);
  }

  function createCorruptionBlocks(count = 52) {
    const layer = STATE.elements.corruption;
    layer.innerHTML = "";

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const block = document.createElement("div");
      block.className = "birthday-corruption-block";

      block.style.width = `${random(5, 25)}vw`;
      block.style.height = `${random(3, 18)}vh`;
      block.style.left = `${random(-2, 97)}vw`;
      block.style.top = `${random(-2, 97)}vh`;
      block.style.animationDelay = `${random(0, 3300)}ms`;

      fragment.appendChild(block);
    }

    layer.appendChild(fragment);
  }

  async function runGlitchAndCorruption() {
    const { terminal, noise, tear, corruption, glitchAudio } = STATE.elements;

    hide(terminal);

    if (STATE.faqRoot) {
      STATE.faqRoot.classList.add("birthday-glitch-target", "birthday-glitching");
    }

    noise.classList.add("birthday-glitch-visible");
    tear.classList.add("birthday-glitch-visible");
    show(corruption);
    createCorruptionBlocks();

    playSfx(glitchAudio, { volume: 0.72, playbackRate: 1 });

    await wait(4700);

    noise.classList.remove("birthday-glitch-visible");
    tear.classList.remove("birthday-glitch-visible");

    if (STATE.faqRoot) {
      STATE.faqRoot.classList.remove("birthday-glitching");
    }
  }

  async function runCrtShutdown() {
    const { crt, launch, crtAudio } = STATE.elements;

    show(launch);
    await wait(700);

    show(crt);
    forceReflow(crt);
    crt.classList.add("birthday-crt-active");

    playSfx(crtAudio, { volume: 0.8 });

    await wait(950);

    if (STATE.faqRoot) {
      STATE.faqRoot.style.visibility = "hidden";
    }

    hide(crt);
    await wait(1450);

    hide(launch);
    show(STATE.elements.black);
    await wait(2200);
  }

  async function slamWord(word, { volume = 0.75, playbackRate = 1, hold = 750 } = {}) {
    const { slam, slamText, slamFlash, slamAudio } = STATE.elements;

    show(slam);
    slamText.textContent = word;

    slam.classList.remove("birthday-slam-hit", "birthday-slam-impact");
    slamFlash.classList.remove("birthday-flash-active");

    forceReflow(slam);

    slam.classList.add("birthday-slam-hit", "birthday-slam-impact");
    slamFlash.classList.add("birthday-flash-active");

    playSfx(slamAudio, { volume, playbackRate });
    await wait(hold);
  }

  async function runSlamSequence() {
    hide(STATE.elements.black);

    await slamWord("HAPPY", {
      volume: 0.62,
      playbackRate: 1.08,
      hold: 760
    });

    await slamWord("BIRTHDAY", {
      volume: 0.78,
      playbackRate: 1,
      hold: 840
    });

    await slamWord("DAVIS", {
      volume: 1,
      playbackRate: 0.92,
      hold: 1150
    });
  }

  const PHOTO_LAYOUTS = [
    { left: 4, top: 8, width: 22, height: 29, rotate: -3 },
    { left: 31, top: 4, width: 23, height: 27, rotate: 2 },
    { right: 4, top: 10, width: 22, height: 29, rotate: 3 },
    { left: 7, bottom: 7, width: 23, height: 27, rotate: 2 },
    { left: 38, bottom: 4, width: 22, height: 26, rotate: -2 },
    { right: 7, bottom: 8, width: 23, height: 27, rotate: -3 }
  ];

  function buildPhotoSlots() {
    const layer = STATE.elements.photoLayer;
    layer.innerHTML = "";
    STATE.photoSlots = [];

    PHOTO_LAYOUTS.forEach(layout => {
      const wrapper = document.createElement("div");
      wrapper.className = "birthday-photo";

      wrapper.style.width = `${layout.width}vw`;
      wrapper.style.height = `${layout.height}vh`;

      if (layout.left !== undefined) wrapper.style.left = `${layout.left}vw`;
      if (layout.right !== undefined) wrapper.style.right = `${layout.right}vw`;
      if (layout.top !== undefined) wrapper.style.top = `${layout.top}vh`;
      if (layout.bottom !== undefined) wrapper.style.bottom = `${layout.bottom}vh`;

      wrapper.style.transform = `rotate(${layout.rotate}deg)`;
      wrapper.style.setProperty(
        "--birthday-float-duration",
        `${random(9, 14).toFixed(2)}s`
      );

      wrapper.style.setProperty(
        "--birthday-float-delay",
        `${random(-6, 0).toFixed(2)}s`
      );

      wrapper.style.setProperty(
        "--birthday-x1",
        `${random(-22, -10).toFixed(1)}px`
      );

      wrapper.style.setProperty(
        "--birthday-y1",
        `${random(10, 22).toFixed(1)}px`
      );

      wrapper.style.setProperty(
        "--birthday-x2",
        `${random(12, 25).toFixed(1)}px`
      );

      wrapper.style.setProperty(
        "--birthday-y2",
        `${random(-25, -10).toFixed(1)}px`
      );

      wrapper.style.setProperty(
        "--birthday-x3",
        `${random(-20, 18).toFixed(1)}px`
      );

      wrapper.style.setProperty(
        "--birthday-y3",
        `${random(-20, 20).toFixed(1)}px`
      );

      const image = document.createElement("img");
      image.alt = "";

      wrapper.appendChild(image);
      layer.appendChild(wrapper);

      STATE.photoSlots.push({ wrapper, image, currentSrc: "" });
    });
  }

  function stopPhotoRotation() {
    if (!STATE.photoRotationInterval) return;

    clearInterval(STATE.photoRotationInterval);
    STATE.intervals.delete(STATE.photoRotationInterval);
    STATE.photoRotationInterval = null;
  }

  function hideAllPhotoSlots() {
    STATE.photoSlots.forEach(slot => {
      slot.wrapper.classList.remove("birthday-photo-visible");
    });
  }

function assignPhotoToSlot(slot, src) {
  if (!slot || !src) return;

  /*
   * Load the replacement image BEFORE removing the
   * current one. This prevents an empty photo slot if
   * a requested image is missing or fails to load.
   */
  const preload = new Image();

  preload.onload = () => {
    slot.wrapper.classList.remove(
      "birthday-photo-visible"
    );

    setManagedTimeout(() => {
      slot.image.src = src;
      slot.currentSrc = src;

      slot.wrapper.classList.add(
        "birthday-photo-visible"
      );
    }, 220);
  };

  preload.onerror = () => {
    console.warn(
      `[Birthday Takeover] Could not load image: ${src}`
    );

    /*
     * Leave whatever image is already in this slot
     * visible instead of turning the slot blank.
     */
  };

  preload.src = src;
}

  function startPhotoGroup(collectionName, visibleCount, swapSpeed) {
    stopPhotoRotation();
    hideAllPhotoSlots();

    const paths = shuffle(getCollectionPaths(collectionName));
    if (!paths.length) return;

    const activeCount = Math.min(visibleCount, STATE.photoSlots.length, paths.length);

    paths.slice(0, activeCount).forEach((src, index) => {
      assignPhotoToSlot(STATE.photoSlots[index], src);
    });

    let photoIndex = activeCount;
    let slotIndex = 0;

    STATE.photoRotationInterval = setManagedInterval(() => {
      const slot = STATE.photoSlots[slotIndex % activeCount];
      const src = paths[photoIndex % paths.length];

      assignPhotoToSlot(slot, src);

      photoIndex += 1;
      slotIndex += 1;
    }, swapSpeed);
  }

  async function typeStoryText(text) {
    const { storyText, storyTextValue, storyCursor } = STATE.elements;

    storyText.classList.remove("birthday-text-fading");
    storyTextValue.textContent = "";
    show(storyCursor);

    for (const char of text) {
      storyTextValue.textContent += char;
      await wait(CONFIG.storyTypingSpeed * random(0.82, 1.16));
    }

    await wait(450);
    hide(storyCursor);
  }

  async function fadeStoryText() {
    const text = STATE.elements.storyText;

    text.classList.add("birthday-text-fading");
    await wait(900);

    STATE.elements.storyTextValue.textContent = "";
    text.classList.remove("birthday-text-fading");
  }

  async function runStoryMontage() {
    const { slam, story, engagementLayer } = STATE.elements;

    hide(slam);
    show(story);
    engagementLayer.innerHTML = "";

    buildPhotoSlots();
    playLoveTrack();

    for (const chapter of CONFIG.story) {
      startPhotoGroup(
        chapter.collection,
        chapter.visibleCount,
        chapter.swapSpeed
      );

      await typeStoryText(chapter.text);
      await wait(chapter.hold);
      await fadeStoryText();
    }

    stopPhotoRotation();
    hideAllPhotoSlots();
    await wait(900);
  }

  function buildEngagementComposition() {
    const layer = STATE.elements.engagementLayer;
    layer.innerHTML = "";
    STATE.engagementPhotos = [];

    const paths = getCollectionPaths("engagement");
    if (!paths.length) return;

    const focalIndex = clamp(
      CONFIG.images.engagement.focalImage - 1,
      0,
      paths.length - 1
    );

    const focalPath = paths[focalIndex];
    const orbitPaths = paths.filter((_, index) => index !== focalIndex);

    const focal = document.createElement("div");
    focal.className = "birthday-engagement-photo birthday-engagement-focal";

    const focalImage = document.createElement("img");
    focalImage.src = focalPath;
    focalImage.alt = "";
    focal.appendChild(focalImage);

    layer.appendChild(focal);
    STATE.engagementPhotos.push(focal);

    orbitPaths.slice(0, 4).forEach((src, index) => {
      const wrapper = document.createElement("div");
      wrapper.className = `birthday-engagement-photo birthday-engagement-orbit birthday-engagement-pos-${index + 1}`;
      wrapper.style.setProperty("--engagement-speed", `${random(9, 13).toFixed(2)}s`);
      wrapper.style.setProperty("--engagement-delay", `${random(-4, 0).toFixed(2)}s`);

      const image = document.createElement("img");
      image.src = src;
      image.alt = "";

      wrapper.appendChild(image);
      layer.appendChild(wrapper);
      STATE.engagementPhotos.push(wrapper);
    });
  }

  async function runEngagementScene() {
    hideAllPhotoSlots();
    buildEngagementComposition();

    const [focal, ...orbitPhotos] = STATE.engagementPhotos;

    if (focal) {
      await wait(250);
      focal.classList.add("birthday-engagement-visible");
    }

    await wait(800);
    await typeStoryText(CONFIG.engagementText);

    for (let i = 0; i < orbitPhotos.length; i++) {
      await wait(380);
      orbitPhotos[i].classList.add("birthday-engagement-visible");
    }

    await wait(CONFIG.engagementHold);

    STATE.elements.storyText.classList.add("birthday-text-fading");
    STATE.engagementPhotos.forEach(photo => {
      photo.classList.remove("birthday-engagement-visible");
    });

    const musicFade = fadeOutLoveTrack(2600);

    await wait(1700);
    await musicFade;

    STATE.elements.storyTextValue.textContent = "";
    hide(STATE.elements.story);
  }

  async function runCountdown() {
    const countdown = STATE.elements.countdown;

    await wait(CONFIG.countdownLeadIn);

    for (const number of ["3", "2", "1"]) {
      countdown.textContent = number;
      await wait(CONFIG.countdownNumberHold);
      countdown.textContent = "";
      await wait(150);
    }
  }

  function waitForAudioEnd(audio, fallbackMs) {
    return new Promise(resolve => {
      let finished = false;

      const finish = () => {
        if (finished) return;
        finished = true;
        audio?.removeEventListener("ended", finish);
        resolve();
      };

      if (audio) {
        audio.addEventListener("ended", finish, { once: true });
      }

      setManagedTimeout(finish, fallbackMs);
    });
  }

  async function playBirthdayTrack() {
    const audio = STATE.elements.birthdayAudio;

    if (!audio || !audio.src) {
      await wait(15000);
      return;
    }

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1;

      const endPromise = waitForAudioEnd(audio, CONFIG.birthdayAudioFallback);
      await audio.play();
      await endPromise;
    } catch (error) {
      console.warn("[Birthday Takeover] Happy Birthday track could not play.", error);
      await wait(15000);
    }
  }

  async function runFinalScreen() {
    const { final, finalMessage, countdown } = STATE.elements;

    show(final);
    finalMessage.textContent = CONFIG.finalText;
    countdown.textContent = "";

    await wait(250);
    finalMessage.classList.add("birthday-final-visible");

    await runCountdown();
    await playBirthdayTrack();

    final.classList.add("birthday-final-fading");
    await wait(1600);
  }

  function restoreExtractedCharacters() {
    STATE.extractionSpans.forEach(span => {
      if (!span?.parentNode) return;

      const text = document.createTextNode(span.textContent);
      span.parentNode.replaceChild(text, span);
      text.parentNode?.normalize();
    });

    STATE.extractionSpans = [];
  }

  function resetTakeoverVisuals() {
    const e = STATE.elements;

    [
      e.modal,
      e.close,
      e.terminal,
      e.progressWrap,
      e.crt,
      e.launch,
      e.black,
      e.slam,
      e.story,
      e.final
    ].forEach(hide);

    e.skip?.classList.remove("birthday-button-disabled");
    e.skip?.removeAttribute("aria-disabled");
    e.close?.classList.remove("birthday-reading");

    if (e.close) {
      e.close.style.left = "";
      e.close.style.top = "";
    }

    e.finalMessage?.classList.remove("birthday-final-visible");
    e.final?.classList.remove("birthday-final-fading");
    e.story?.classList.remove("birthday-story-fading");
    e.storyText?.classList.remove("birthday-text-fading");
    e.slam?.classList.remove("birthday-slam-hit", "birthday-slam-impact");
    e.slamFlash?.classList.remove("birthday-flash-active");
    e.noise?.classList.remove("birthday-glitch-visible");
    e.tear?.classList.remove("birthday-glitch-visible");
    e.crt?.classList.remove("birthday-crt-active");

    if (e.corruption) e.corruption.innerHTML = "";
    if (e.photoLayer) e.photoLayer.innerHTML = "";
    if (e.engagementLayer) e.engagementLayer.innerHTML = "";
    if (e.terminalText) e.terminalText.innerHTML = "";

    if (e.progress) e.progress.style.width = "0%";
    if (e.progressPercent) e.progressPercent.textContent = "0%";
    if (e.storyTextValue) e.storyTextValue.textContent = "";
    if (e.countdown) e.countdown.textContent = "";

    if (STATE.faqRoot) {
      STATE.faqRoot.classList.remove("birthday-glitch-target", "birthday-glitching");
      STATE.faqRoot.style.visibility = "";
    }

    document.body.classList.remove(
      "birthday-takeover-active",
      "birthday-cursor-hidden"
    );
  }

  async function cleanupBirthdayTakeover({
    removePartial = true,
    markComplete = true
  } = {}) {
    if (STATE.cleanupStarted) return;

    STATE.cleanupStarted = true;
    STATE.closeEvasionEnabled = false;

    if (STATE.popupPointerHandler) {
      document.removeEventListener(
        "pointermove",
        STATE.popupPointerHandler
      );

      STATE.popupPointerHandler = null;
    }

    document.removeEventListener(
      "pointermove",
      handlePointerMove
    );

    stopPhotoRotation();
    clearManagedTimers();

    [
      STATE.elements.loveAudio,
      STATE.elements.birthdayAudio,
      STATE.elements.glitchAudio,
      STATE.elements.crtAudio,
      STATE.elements.slamAudio
    ].forEach(audio => {
      if (!audio) return;
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (_) {}
    });

    restoreExtractedCharacters();

    if (STATE.faqRoot) {
      STATE.faqRoot.classList.remove("birthday-glitch-target", "birthday-glitching");
      STATE.faqRoot.style.visibility = "";
    }

    document.body.classList.remove(
      "birthday-takeover-active",
      "birthday-cursor-hidden"
    );

    if (markComplete && !CONFIG.testMode) {
      try {
        sessionStorage.setItem(CONFIG.sessionKey, "true");
      } catch (_) {}
      STATE.completed = true;
    }

    if (removePartial) {
      if (STATE.root) {
        STATE.root.remove();
      }

      const takeoverStyles =
        document.getElementById(
          "birthdayTakeoverStyles"
        );

      if (takeoverStyles) {
        takeoverStyles.remove();
      }

      STATE.root = null;
      STATE.loaded = false;
      STATE.initialized = false;
      STATE.elements = {};
    }

    STATE.running = false;
    STATE.cleanupStarted = false;
  }

  async function runFullTakeover() {
    if (STATE.running) return;

    STATE.running = true;
    STATE.cleanupStarted = false;

    document.body.classList.add("birthday-takeover-active");
    resetTakeoverVisuals();

    try {
      await wait(CONFIG.introDelay);
      await runPopupSequence();
      await runTerminalSequence();
      await runGlitchAndCorruption();
      await runCrtShutdown();
      await runSlamSequence();
      await runStoryMontage();
      await runEngagementScene();
      await runFinalScreen();

      await cleanupBirthdayTakeover({
        removePartial: true,
        markComplete: true
      });
    } catch (error) {
      console.error("[Birthday Takeover] Sequence failed.", error);

      await cleanupBirthdayTakeover({
        removePartial: true,
        markComplete: false
      });
    }
  }

  async function prepareForTestScene() {
    clearManagedTimers();
    stopPhotoRotation();
    restoreExtractedCharacters();
    resetTakeoverVisuals();
    document.body.classList.add("birthday-takeover-active");
  }

  function wireTestControls() {
    const e = STATE.elements;

    if (!CONFIG.testMode) {
      hide(e.testControls);
      return;
    }

    show(e.testControls);

    e.testRestart?.addEventListener("click", async () => {
      if (STATE.running) return;
      await prepareForTestScene();
      STATE.running = false;
      runFullTakeover();
    });

    e.testTerminal?.addEventListener("click", async () => {
      await prepareForTestScene();
      await runTerminalSequence();
    });

    e.testGlitch?.addEventListener("click", async () => {
      await prepareForTestScene();
      await runGlitchAndCorruption();
      await runCrtShutdown();
    });

    e.testSlam?.addEventListener("click", async () => {
      await prepareForTestScene();
      await runSlamSequence();
    });

    e.testStory?.addEventListener("click", async () => {
      await prepareForTestScene();
      await runStoryMontage();
    });

    e.testEngagement?.addEventListener("click", async () => {
      await prepareForTestScene();
      show(STATE.elements.story);
      playLoveTrack();
      await runEngagementScene();
    });

    e.testFinal?.addEventListener("click", async () => {
      await prepareForTestScene();
      await runFinalScreen();
    });
  }

  function wireKeyboardTestShortcut() {
    if (!CONFIG.testMode) return;
    if (window.__birthdayTakeoverKeyboardBound) return;

    window.__birthdayTakeoverKeyboardBound = true;

    document.addEventListener("keydown", async event => {
      if (!event.shiftKey || event.key.toLowerCase() !== "b") return;

      event.preventDefault();

      if (!document.getElementById("birthdayTakeoverRoot")) {
        await initializeBirthdayTakeover();
      }

      if (!STATE.running) {
        runFullTakeover();
      }
    });
  }

  async function initializeBirthdayTakeover() {
    await loadTakeoverHtml();
    cacheElements();

    STATE.faqTitle = findFaqTitle();
    STATE.faqRoot = findFaqRoot(STATE.faqTitle);

    configureAudio();
    preloadImages();

    STATE.root.setAttribute("aria-hidden", "false");
    STATE.initialized = true;

    wireTestControls();
    wireKeyboardTestShortcut();
  }

  async function startBirthdayTakeoverSystem() {
    if (!CONFIG.enabled) return;
    if (STATE.running) return;

    if (!CONFIG.testMode) {
      try {
        if (sessionStorage.getItem(CONFIG.sessionKey) === "true") {
          STATE.completed = true;
          return;
        }
      } catch (_) {}

      if (STATE.completed) return;
    }

    await initializeBirthdayTakeover();
    await runFullTakeover();
  }

  window.startBirthdayTakeoverSystem = startBirthdayTakeoverSystem;

  window.BirthdayTakeover = {
    start: startBirthdayTakeoverSystem,
    initialize: initializeBirthdayTakeover,
    cleanup: cleanupBirthdayTakeover,
    config: CONFIG
  };
})();
