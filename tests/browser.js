function installFakes(saved, touch) {
  const stored = new Map(Object.entries(saved));
  const fake = window.fake = { stored, voices: [], phrases: [], sessions: [], notes: [], fullscreen: false, lockedKeys: null };
  const matchMedia = window.matchMedia.bind(window);
  window.matchMedia = query => query === "(pointer: coarse)" ? { matches: touch } : matchMedia(query);
  Object.defineProperty(window, "localStorage", {
    value: { getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) },
  });
  Object.defineProperty(window, "SpeechSynthesisUtterance", {
    value: class { constructor(text) { this.text = text; } },
  });
  Object.defineProperty(window, "speechSynthesis", {
    value: { getVoices: () => fake.voices, speak: phrase => fake.phrases.push(phrase), cancel() {} },
  });
  Object.defineProperty(window, "SpeechRecognition", {
    value: class {
      start() {
        if (fake.active) throw new Error("Concurrent speech recognition");
        fake.active = this;
        fake.sessions.push(this);
        this.onstart();
      }
      abort() { this.aborted = true; }
      answer(...answers) {
        const result = Object.assign(answers.map(transcript => ({ transcript })), { isFinal: true });
        this.onresult({ results: [result], resultIndex: 0 });
      }
      end() {
        fake.active = null;
        this.onend();
      }
    },
  });
  Object.defineProperty(window, "AudioContext", {
    value: class {
      state = "running";
      currentTime = 0;
      createOscillator() {
        const frequency = {};
        return { frequency, connect: node => node, start: () => fake.notes.push(frequency.value), stop() {} };
      }
      createGain() {
        return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
      }
    },
  });

  const setFullscreen = async value => {
    fake.fullscreen = value;
    document.dispatchEvent(new Event("fullscreenchange"));
  };
  Object.defineProperty(document, "fullscreenEnabled", { value: true });
  Object.defineProperty(document, "fullscreenElement", { get: () => fake.fullscreen ? document.documentElement : null });
  document.documentElement.requestFullscreen = () => setFullscreen(true);
  document.exitFullscreen = () => setFullscreen(false);
  Object.defineProperty(navigator, "keyboard", {
    value: {
      async lock(keys) {
        if (!fake.fullscreen || fake.denyKeyboardLock) throw new DOMException("Keyboard lock denied", "NotAllowedError");
        fake.lockedKeys = keys;
      },
      unlock() { fake.lockedKeys = null; },
    },
  });
}

const output = document.getElementById("results");
const appFile = new URLSearchParams(location.search).has("standalone") ? "letter-smash.html" : "index.html";
const checks = [];
function equal(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
}

async function makeGame(saved = {}, touch = false) {
  const base = new URL("../", location.href);
  const response = await fetch(new URL(appFile, base));
  if (!response.ok) throw new Error(`Couldn't load the game (${response.status})`);
  const app = await response.text();
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  frame.style.cssText = `position:absolute; top:0; left:-2000px; width:${touch ? 390 : 1050}px; height:670px; border:0;`;
  const loaded = new Promise(resolve => frame.addEventListener("load", resolve, { once: true }));
  const config = JSON.stringify(saved).replaceAll("<", "\\u003c");
  frame.srcdoc = app.replace("<head>", `<head><base href="${base}"><script>(${installFakes})(${config},${touch})</script>`);
  document.body.append(frame);
  await loaded;
  const win = frame.contentWindow;
  const doc = win.document;
  const get = id => doc.getElementById(id);
  const key = (value, modifiers = {}) => get("playfield").dispatchEvent(new win.KeyboardEvent("keydown", {
    key: value, bubbles: true, cancelable: true, ...modifiers,
  }));
  return { frame, win, doc, get, key, fake: win.fake };
}

function visibleControls(doc) {
  return Array.from(doc.querySelectorAll("button, input, select, textarea, a[href]"))
    .filter(control => control.getClientRects().length > 0);
}

try {
  const { frame, win, doc, get, key, fake } = await makeGame();
  fake.voices = [
    { name: "Microsoft David", lang: "en-US", localService: true },
    { name: "Microsoft Zira", lang: "en-US", localService: true },
    { name: "Microsoft Stefan", lang: "de-DE", localService: true },
    { name: "Microsoft Katja Online (Natural)", lang: "de-DE", localService: false },
  ];
  key("b");
  equal(get("letter").textContent, "B", "Physical letter key");
  equal(fake.phrases.at(-1).text, "bee", "English letter name");
  equal(fake.phrases.at(-1).lang, "en-US", "English pronunciation locale");
  equal(fake.phrases.at(-1).voice.name, "Microsoft Zira", "Prefer an available English female voice");
  get("keypad-button").click();
  Array.from(get("number-keys").children).find(button => button.textContent === "9").click();
  equal(get("letter").textContent, "9", "On-screen number key");
  equal(fake.phrases.at(-1).text, "nine", "English digit name");
  checks.push("PASS: keyboard and touch play pronounce the selected character");

  get("settings-button").click();
  key("z");
  equal(get("tile-plane").hidden, true, "Keys in the settings dialog do not play");
  get("language").value = "de";
  get("letter-case").value = "lower";
  doc.querySelector('input[value="winter"]').checked = true;
  get("words").value = "Ü, Ö\n3-3";
  get("settings-form").requestSubmit();
  equal(doc.documentElement.lang, "de", "German UI language");
  equal(doc.body.dataset.theme, "winter", "Selected stage theme");
  equal(get("mode-note").textContent.includes("Drücke"), true, "German UI copy");
  key("Ä");
  equal(get("letter").textContent, "ä", "Lowercase umlaut");
  equal(fake.phrases.at(-1).lang, "de-DE", "German pronunciation locale");
  equal(fake.phrases.at(-1).voice.name, "Microsoft Katja Online (Natural)", "Prefer an available German female voice");
  fake.phrases.at(-1).onerror({ error: "network" });
  equal(fake.phrases.at(-1).voice.name, "Microsoft Stefan", "Use a local German voice if the online voice fails");
  for (const [input, tile, speech] of [["B", "b", "Beh"], ["X", "x", "Iks"], ["P", "p", "P"]]) {
    key(input);
    equal(get("letter").textContent, tile, `German ${input} shows one letter`);
    equal(fake.phrases.at(-1).text, speech, `German ${input} sends an unambiguous pronunciation`);
  }
  win.Math.random = () => 0;
  key(" ");
  equal(get("letter").textContent, "ü", "Space draws from custom practice words on a weighted draw");
  win.Math.random = () => .999;
  get("surprise").click();
  equal(get("letter").textContent, "9", "Surprise can still draw from the full alphabet and digits");
  equal(fake.phrases.at(-1).text, "neun", "German 9 still speaks the number nine");
  const restored = await makeGame(Object.fromEntries(fake.stored));
  equal(restored.doc.body.dataset.theme, "winter", "Saved theme restored on a fresh load");
  equal(restored.doc.documentElement.lang, "de", "Saved language restored on a fresh load");
  restored.frame.remove();
  checks.push("PASS: language, case, theme, and weighted practice settings");

  doc.querySelector('[data-mode="say"]').click();
  const phrasesBefore = fake.phrases.length;
  key("Ä");
  let attempt = fake.active;
  equal(attempt.lang, "de-DE", "Recognition uses the chosen language");
  attempt.answer("A");
  equal(get("score").textContent, "0", "Wrong answer does not score");
  equal(get("replay").hidden, false, "Wrong answer can be retried");
  attempt.end();
  get("replay").click();
  attempt = fake.active;
  attempt.answer("A", "Ä.");
  attempt.answer("Ä");
  equal(get("score").textContent, "1", "Correct answer awards exactly one star");
  equal(fake.notes.length, 2, "Coin sound plays once");
  attempt.end();
  equal(fake.phrases.length, phrasesBefore, "Say it does not pronounce the prompt");
  checks.push("PASS: reading checks the answer, allows retries, and awards one star and coin sound");

  key("b");
  const stale = fake.active;
  key("c");
  key("d");
  equal(stale.aborted, true, "Replacing a prompt aborts the old attempt");
  stale.answer("Be");
  equal(get("score").textContent, "1", "Cancelled results are ignored");
  stale.end();
  attempt = fake.active;
  attempt.onerror({ error: "not-allowed" });
  equal(get("feedback").dataset.status, "micDenied", "Microphone errors are surfaced");
  attempt.end();
  get("replay").click();
  attempt = fake.active;
  attempt.answer("De");
  equal(get("score").textContent, "2", "Only the latest prompt is scored");
  attempt.end();
  checks.push("PASS: rapid prompts discard stale speech and recover from mic errors");

  doc.querySelector('[data-mode="hear"]').click();
  get("keypad-button").click();
  get("fullscreen-button").click();
  equal(fake.fullscreen, true, "Requests native fullscreen");
  equal(fake.lockedKeys?.join(","), "Escape", "Locks only Escape in native fullscreen");
  equal(visibleControls(doc).length, 0, "Desktop fullscreen hides all controls");
  equal(get("playfield").getBoundingClientRect().height, win.innerHeight, "Stage fills the viewport");
  await doc.exitFullscreen();
  equal(fake.lockedKeys, null, "Releases keyboard lock when the browser exits fullscreen");
  equal(doc.body.classList.contains("is-play-full"), true, "Browser Escape does not exit the play view");
  equal(visibleControls(doc).length, 0, "Browser Escape doesn't reveal app controls");
  key("0");
  equal(get("letter").textContent, "0", "Physical game keys still show tiles in fullscreen");
  equal(doc.body.classList.contains("is-play-full"), true, "Plain zero doesn't exit fullscreen");
  const beforeReplay = fake.phrases.length;
  key("Enter");
  equal(fake.phrases.length, beforeReplay + 1, "Enter replaces the replay button");
  equal(fake.phrases.at(-1).text, "null", "Enter replays the same tile");
  key("0", { ctrlKey: true });
  equal(doc.body.classList.contains("is-play-full"), false, "Ctrl+0 exits the play view");
  equal(visibleControls(doc).includes(get("settings-button")), true, "Settings return after Ctrl+0");
  get("keypad-button").click();
  get("fullscreen-button").click();
  get("touch-ctrl").click();
  get("number-keys").firstElementChild.click();
  equal(doc.body.classList.contains("is-play-full"), false, "On-screen Ctrl and 0 also exit");
  equal(fake.fullscreen, false, "Exits native fullscreen too");
  equal(fake.lockedKeys, null, "Ctrl+0 releases the keyboard lock");
  frame.remove();

  const touch = await makeGame({}, true);
  touch.fake.denyKeyboardLock = true;
  touch.get("fullscreen-button").click();
  await Promise.resolve();
  equal(touch.fake.fullscreen, true, "Denied keyboard lock does not break fullscreen play");
  const touchKeys = visibleControls(touch.doc);
  equal(touchKeys.length > 0 && touchKeys.every(key => touch.get("keypad").contains(key)), true, "Only keys are visible in touch fullscreen");
  touch.get("touch-ctrl").click();
  touch.get("number-keys").firstElementChild.click();
  equal(touch.get("keypad").hidden, true, "Touch exit restores the previous keypad setting");
  touch.frame.remove();
  checks.push("PASS: fullscreen offers only keys, with Ctrl+0 restoring the controls");

  const examples = await makeGame({}, true);
  examples.win.Math.random = () => 0;
  examples.key("J");
  equal(examples.fake.phrases.at(-1).text, "jay", "Examples are off by default");
  equal(examples.get("example-picture").hidden, true, "Plain letter has no example picture");
  examples.get("settings-button").click();
  examples.get("example-readouts").checked = true;
  examples.get("settings-form").requestSubmit();
  examples.key("J");
  equal(examples.fake.phrases.at(-1).text, "jay as in jaguar", "English example readout");
  examples.get("settings-button").click();
  examples.get("language").value = "de";
  examples.get("settings-form").requestSubmit();
  const savedExamples = Object.fromEntries(examples.fake.stored);
  examples.frame.remove();

  const germanExamples = await makeGame(savedExamples, true);
  germanExamples.win.Math.random = () => 0;
  germanExamples.key("J");
  const examplePicture = germanExamples.get("example-picture");
  equal(germanExamples.fake.phrases.at(-1).text, "Jot wie Jaguar", "German example setting persists after reload");
  equal(examplePicture.hidden, false, "Example picture is visible with the readout");
  equal(examplePicture.getAttribute("aria-label"), "Jaguar", "Picture describes the selected word");
  const draws = [0, .999];
  germanExamples.win.Math.random = () => draws.shift() ?? .999;
  germanExamples.key("J");
  equal(germanExamples.fake.phrases.at(-1).text, "Jot wie Jo-Jo", "Random readouts can choose another example");
  equal(germanExamples.get("example-drawing").getClientRects().length, 0, "Emoji examples hide the previous SVG");
  equal(germanExamples.get("example-glyph").textContent, "🪀", "Emoji picture matches the chosen toy");
  const stageBounds = germanExamples.get("playfield").getBoundingClientRect();
  equal(examplePicture.getBoundingClientRect().right <= stageBounds.right, true, "Picture stays inside the mobile stage near its edge");
  germanExamples.get("replay").click();
  equal(germanExamples.fake.phrases.at(-1).text, "Jot wie Jo-Jo", "Replay keeps the same example");
  germanExamples.key("J");
  equal(germanExamples.fake.phrases.at(-1).text, "Jot", "The random draw can give a plain letter");
  equal(examplePicture.hidden, true, "A plain letter clears the example picture");
  germanExamples.win.Math.random = () => 0;
  germanExamples.key("9");
  equal(germanExamples.fake.phrases.at(-1).text, "neun", "Digits keep their plain readout");
  germanExamples.doc.querySelector('[data-mode="say"]').click();
  germanExamples.key("J");
  equal(examplePicture.hidden, true, "Say it never reveals a picture hint");
  germanExamples.frame.remove();
  checks.push("PASS: optional picture readouts are randomized, localized, and saved");

  output.dataset.result = "pass";
  output.textContent = checks.join("\n");
} catch (error) {
  output.dataset.result = "fail";
  output.textContent = [...checks, `FAIL: ${error.message}`].join("\n");
  throw error;
}
