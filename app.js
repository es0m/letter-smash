import {
  copy, displayKey, keyboardKeys, matchesAnswer, playableKey, practicePool,
  preferences, speechTags, spokenName, surpriseKey,
} from "./game.js";
import { randomLetterExample } from "./examples.js";
import { createCoinSound, createListener, pronunciationVoices } from "./speech.js";

const byId = id => document.getElementById(id);
const root = document.documentElement;
const stage = byId("playfield");
const welcome = byId("welcome");
const tilePlane = byId("tile-plane");
const marker = byId("marker");
const letter = byId("letter");
const examplePicture = byId("example-picture");
const exampleGlyph = byId("example-glyph");
const exampleDrawing = byId("example-drawing");
const exampleReadouts = byId("example-readouts");
const feedbackRow = byId("feedback-row");
const feedback = byId("feedback");
const replay = byId("replay");
const replayIcon = byId("replay-icon");
const iconSource = replayIcon.getAttribute("href").split("#", 1)[0];
const keypad = byId("keypad");
const keypadButton = byId("keypad-button");
const touchCtrl = byId("touch-ctrl");
const settingsButton = byId("settings-button");
const settingsDialog = byId("settings-dialog");
const settingsForm = byId("settings-form");
const fullscreenButton = byId("fullscreen-button");
const modeButtons = document.querySelectorAll("[data-mode]");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const touchInput = matchMedia("(pointer: coarse)");

const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
const reader = Recognition ? createListener(Recognition) : null;
const synthesis = typeof window.SpeechSynthesisUtterance === "function" ? window.speechSynthesis : null;
const coin = createCoinSound();
const recognitionErrors = {
  "no-speech": "quiet",
  "not-allowed": "micDenied",
  "service-not-allowed": "micDenied",
  "audio-capture": "micMissing",
  network: "recognitionOffline",
  "language-not-supported": "recognitionLanguage",
};

const settingsKey = "letter-smash-settings";
let notice = null;
let settings = loadSettings();
let pool;
let mode = "hear";
let prompt = null;
let utterance = null;
let stars = 0;
let status = null;
let playFullscreen = false;
let requestingFullscreen = false;
let showKeypad = false;
let touchCtrlPressed = false;

const t = key => copy[settings.language][key];

function loadSettings() {
  try {
    return preferences(JSON.parse(localStorage.getItem(settingsKey)));
  } catch (error) {
    console.warn("Could not load Letter Smash settings.", error);
    notice = "settingsLoadFailed";
    return preferences();
  }
}

function setNotice(key) {
  notice = key;
  const message = byId("notice");
  message.hidden = !key;
  message.textContent = key ? t(key) : "";
}

function saveSettings() {
  try {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    setNotice(null);
  } catch (error) {
    console.warn("Could not save Letter Smash settings.", error);
    setNotice("settingsSaveFailed");
  }
}

function applySettings() {
  root.lang = settings.language;
  document.body.dataset.theme = settings.theme;
  pool = practicePool(settings.words, settings.language);
  for (const element of document.querySelectorAll("[data-text]")) element.textContent = t(element.dataset.text);
  for (const element of document.querySelectorAll("[data-label]")) element.setAttribute("aria-label", t(element.dataset.label));
  byId("theme-name").textContent = t(settings.theme);
  byId("words").placeholder = t("wordsPlaceholder");
  const display = key => displayKey(key, settings.letterCase);
  const extras = settings.language === "de" ? ` / ${Array.from("äöüß", display).join(" ")}` : "";
  byId("key-guide").textContent = `${display("a")}-${display("z")}${extras} / 0-9`;
  fullscreenButton.title = `${t("ctrl")}+0 ${t("toExit")}`;
  renderKeys();
  renderMode();
  renderFullscreen();
  setNotice(notice);
}

function renderMode() {
  const hearing = mode === "hear";
  for (const button of modeButtons) button.setAttribute("aria-pressed", button.dataset.mode === mode);
  byId("mode-note").textContent = t(hearing ? "hearNote" : reader ? "sayNote" : "noRecognition");
  byId("welcome-note").textContent = t(hearing ? "hearWelcome" : reader ? "sayWelcome" : "hearWelcome");
  byId("replay-label").textContent = t(hearing ? "hearAgain" : "tryAgain");
  replayIcon.setAttribute("href", `${iconSource}#${hearing ? "sound" : "mic"}`);
}

function setFeedback(key) {
  status = key;
  feedback.dataset.status = key;
  feedback.textContent = t(key);
  if (mode === "hear") {
    replay.hidden = !synthesis;
  } else {
    replay.hidden = !reader || prompt.awarded || key === "starting" || key === "listening";
  }
}

function stopTalking() {
  if (!utterance) return;
  utterance = null;
  synthesis.cancel();
}

function resetStage() {
  stopTalking();
  reader?.stop();
  prompt = null;
  status = null;
  welcome.hidden = false;
  tilePlane.hidden = true;
  renderExample(null);
  feedbackRow.hidden = true;
  feedback.textContent = "";
}

function animate(element, frames, duration) {
  if (reducedMotion.matches || !element.animate) return;
  for (const animation of element.getAnimations()) animation.cancel();
  element.animate(frames, { duration, easing: "cubic-bezier(.2,.75,.3,1)" });
}

function renderExample(example) {
  tilePlane.classList.toggle("has-example", !!example);
  examplePicture.hidden = !example;
  if (!example) return;

  examplePicture.setAttribute("aria-label", example.word);
  const emoji = typeof example.image === "string";
  exampleGlyph.hidden = !emoji;
  exampleDrawing.toggleAttribute("hidden", emoji);
  if (emoji) {
    exampleGlyph.textContent = example.image;
  } else {
    exampleDrawing.firstElementChild.setAttribute("href", `${iconSource}#${example.image.symbol}`);
  }
}

function showKey(key) {
  setTouchCtrl(false);
  const example = mode === "hear" && settings.exampleReadouts ? randomLetterExample(key, settings.language) : null;
  prompt = { key, example, awarded: false };
  const tilt = `${Math.round(Math.random() * 18 - 9)}deg`;
  marker.style.setProperty("--x", `${Math.random() * 100}%`);
  marker.style.setProperty("--y", `${Math.random() * 100}%`);
  letter.style.setProperty("--tilt", tilt);
  letter.dataset.color = Math.floor(Math.random() * 5);
  letter.textContent = displayKey(key, settings.letterCase);
  renderExample(example);
  welcome.hidden = true;
  tilePlane.hidden = false;
  feedbackRow.hidden = false;
  animate(letter, [
    { transform: "scale(.55) rotate(-15deg)", opacity: .3 },
    { transform: `scale(1.08) rotate(${tilt})`, offset: .7 },
    { transform: `scale(1) rotate(${tilt})`, opacity: 1 },
  ], 320);
  playCurrent();
}

function speak(current) {
  stopTalking();
  if (!synthesis) {
    setFeedback("voiceUnavailable");
    return;
  }

  const language = settings.language;
  const tag = speechTags[language];
  const name = spokenName(current.key, language);
  const readout = current.example ? `${name} ${t("exampleConnector")} ${current.example.word}` : name;
  const { voice, fallback } = pronunciationVoices(synthesis.getVoices(), tag);

  function play(voice, fallback) {
    const phrase = new SpeechSynthesisUtterance(readout);
    phrase.lang = tag;
    phrase.pitch = 1.18;
    phrase.rate = .88;
    if (voice) phrase.voice = voice;

    utterance = phrase;
    phrase.onend = () => {
      if (utterance !== phrase) return;
      utterance = null;
      setFeedback("next");
    };
    phrase.onerror = event => {
      if (utterance !== phrase) return;
      utterance = null;
      console.warn("Speech synthesis failed.", event.error);
      if (fallback && ["network", "voice-unavailable", "language-unavailable", "synthesis-unavailable", "synthesis-failed"].includes(event.error)) {
        play(fallback);
      } else {
        setFeedback("voiceUnavailable");
      }
    };
    synthesis.speak(phrase);
  }

  setFeedback("speaking");
  play(voice, fallback);
}

function listen(current) {
  if (!reader) {
    setFeedback("noRecognition");
    return;
  }
  const language = settings.language;
  coin.prepare();
  setFeedback("starting");
  reader.listen({
    lang: speechTags[language],
    onStart: () => {
      if (prompt === current) setFeedback("listening");
    },
    onError: error => {
      if (prompt === current) setFeedback(recognitionErrors[error] ?? "recognitionFailed");
    },
    onResult: answers => {
      if (prompt !== current || current.awarded) return;
      if (!matchesAnswer(current.key, language, answers)) {
        setFeedback("incorrect");
        return;
      }
      current.awarded = true;
      byId("score").textContent = ++stars;
      setFeedback("correct");
      coin.play();
      animate(byId("score-badge"), [
        { transform: "scale(1)" },
        { transform: "scale(1.18) rotate(-4deg)", offset: .43 },
        { transform: "scale(1)" },
      ], 440);
    },
  });
}

function playCurrent() {
  if (!prompt || prompt.awarded) return;
  if (mode === "hear") speak(prompt);
  else listen(prompt);
}

function surprise() {
  showKey(surpriseKey(settings.language, pool));
}

function renderKeys() {
  const keys = keyboardKeys(settings.language);
  for (const [container, characters] of [["letter-keys", keys.letters], ["number-keys", keys.digits]]) {
    const buttons = Array.from(characters, key => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "key";
      button.textContent = displayKey(key, settings.letterCase);
      button.addEventListener("click", () => {
        if (playFullscreen && touchCtrlPressed && key === "0") leavePlayFullscreen();
        else showKey(key);
      });
      return button;
    });
    if (container === "number-keys") buttons.push(touchCtrl);
    byId(container).replaceChildren(...buttons);
  }
}

function renderKeypad() {
  keypad.hidden = !(showKeypad || (playFullscreen && touchInput.matches));
  keypadButton.setAttribute("aria-expanded", showKeypad);
  byId("keypad-label").textContent = t(showKeypad ? "hideKeys" : "showKeys");
  touchCtrl.hidden = !playFullscreen;
}

function setTouchCtrl(pressed) {
  touchCtrlPressed = pressed;
  touchCtrl.setAttribute("aria-pressed", pressed);
}

function browserCanFullscreen() {
  return document.fullscreenEnabled && typeof root.requestFullscreen === "function";
}

function renderFullscreen() {
  document.body.classList.toggle("is-play-full", playFullscreen);
  fullscreenButton.disabled = requestingFullscreen;
  renderKeypad();
}

function updateEscapeLock() {
  const keyboard = navigator.keyboard;
  if (typeof keyboard?.lock !== "function" || typeof keyboard.unlock !== "function") return;
  if (!playFullscreen || document.fullscreenElement !== root) {
    keyboard.unlock();
    return;
  }

  keyboard.lock(["Escape"]).catch(error => {
    if (playFullscreen && document.fullscreenElement === root) {
      console.warn("Could not lock Escape. The browser may still exit fullscreen on a tap.", error);
    }
  });
}

async function enterPlayFullscreen() {
  if (playFullscreen || requestingFullscreen || settingsDialog.open) return;
  playFullscreen = true;
  requestingFullscreen = browserCanFullscreen();
  if (notice === "fullscreenExitFailed") setNotice(null);
  renderFullscreen();
  stage.focus({ preventScroll: true });
  window.scrollTo(0, 0);
  if (!requestingFullscreen) {
    console.warn("Browser fullscreen is unavailable; using the full-window play view.");
    return;
  }

  try {
    await root.requestFullscreen();
    if (!playFullscreen) await exitNativeFullscreen();
  } catch (error) {
    console.warn("Browser fullscreen request failed; using the full-window play view.", error);
  } finally {
    requestingFullscreen = false;
    renderFullscreen();
  }
}

async function exitNativeFullscreen() {
  if (!document.fullscreenElement) return;
  try {
    await document.exitFullscreen();
  } catch (error) {
    console.warn("Could not exit browser fullscreen.", error);
    if (document.fullscreenElement) setNotice("fullscreenExitFailed");
  }
}

async function leavePlayFullscreen() {
  playFullscreen = false;
  updateEscapeLock();
  setTouchCtrl(false);
  renderFullscreen();
  await exitNativeFullscreen();
  fullscreenButton.focus({ preventScroll: true });
}

for (const button of modeButtons) {
  button.addEventListener("click", () => {
    if (mode === button.dataset.mode) return;
    mode = button.dataset.mode;
    resetStage();
    renderMode();
  });
}
byId("surprise").addEventListener("click", surprise);
replay.addEventListener("click", playCurrent);
keypadButton.addEventListener("click", () => {
  showKeypad = !showKeypad;
  renderKeypad();
  setTouchCtrl(false);
});
touchCtrl.addEventListener("click", () => setTouchCtrl(!touchCtrlPressed));
fullscreenButton.addEventListener("click", enterPlayFullscreen);
document.addEventListener("fullscreenchange", updateEscapeLock);

settingsButton.addEventListener("click", () => {
  if (playFullscreen) return;
  resetStage();
  byId("language").value = settings.language;
  byId("letter-case").value = settings.letterCase;
  exampleReadouts.checked = settings.exampleReadouts;
  settingsForm.elements.namedItem("theme").value = settings.theme;
  byId("words").value = settings.words;
  settingsDialog.showModal();
});
for (const id of ["close-settings", "cancel-settings"]) {
  byId(id).addEventListener("click", () => settingsDialog.close());
}
settingsForm.addEventListener("submit", event => {
  event.preventDefault();
  settings = preferences({
    language: byId("language").value,
    letterCase: byId("letter-case").value,
    exampleReadouts: exampleReadouts.checked,
    theme: new FormData(settingsForm).get("theme"),
    words: byId("words").value,
  });
  // Start loading the voice list before the first key press.
  synthesis?.getVoices();
  applySettings();
  saveSettings();
  settingsDialog.close();
});

document.addEventListener("keydown", event => {
  if (playFullscreen && event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey && event.key === "0") {
    event.preventDefault();
    if (!event.repeat) void leavePlayFullscreen();
    return;
  }
  if (settingsDialog.open || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
  if (event.target.closest?.("input, select, textarea, [contenteditable]")) return;

  const control = event.target.closest?.("button, a");
  const isSpace = event.key === " " && !control;
  const isReplay = playFullscreen && event.key === "Enter" && !control && prompt && !replay.hidden;
  const key = playableKey(event.key, settings.language);
  if (!isSpace && !isReplay && !key) return;
  event.preventDefault();
  if (event.repeat) return;
  if (isSpace) surprise();
  else if (isReplay) playCurrent();
  else showKey(key);
}, { capture: true });

document.addEventListener("visibilitychange", () => {
  if (!document.hidden || !prompt) return;
  if (status === "starting" || status === "listening") {
    reader.stop();
    setFeedback("paused");
  } else if (utterance) {
    stopTalking();
    setFeedback("next");
  }
});

applySettings();
