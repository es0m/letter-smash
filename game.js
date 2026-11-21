const latin = "abcdefghijklmnopqrstuvwxyz";
const digits = "0123456789";
const keys = {
  en: latin + digits,
  de: latin + "äöüß" + digits,
};

const letterNames = {
  en: [
    "ay", "bee|be", "see|sea", "dee", "ee", "eff|ef", "gee", "aitch|haitch",
    "eye|aye", "jay", "kay", "el|ell", "em", "en", "oh|owe", "pee|pea",
    "cue|queue", "ar|are", "ess|es", "tee|tea", "you|ewe", "vee", "double you|double u",
    "ex|ecks", "why", "zee|zed",
  ],
  de: [
    "A", "Beh|Be", "Ze|Ce", "De", "E", "Eff|Ef", "Ge", "Ha",
    "I", "Jot", "Ka", "Ell|El", "Emm|Em", "Enn|En", "O", "P|Pe",
    "Ku", "Err|Er", "Ess|Es", "Te", "U", "Fau|Vau", "We",
    // Some German voices interpret "Ix" as the Roman numeral IX.
    "Iks|Ix", "Ypsilon", "Zett|Zet",
  ],
};
const digitNames = {
  en: ["zero|oh", "one|won", "two|to|too", "three", "four|for", "five", "six", "seven", "eight|ate", "nine"],
  de: ["null", "eins", "zwei|zwo", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"],
};
const germanNames = { ä: "Ä|A Umlaut", ö: "Ö|O Umlaut", ü: "Ü|U Umlaut", ß: "Eszett|Es Zett|scharfes S" };

export const speechTags = { en: "en-US", de: "de-DE" };
export const themes = ["space", "spring", "winter", "party"];
export const defaults = { language: "en", letterCase: "upper", theme: "space", words: "", exampleReadouts: false };

export function preferences(value) {
  return {
    language: value?.language === "de" ? "de" : defaults.language,
    letterCase: value?.letterCase === "lower" ? "lower" : defaults.letterCase,
    theme: themes.includes(value?.theme) ? value.theme : defaults.theme,
    words: typeof value?.words === "string" ? value.words.slice(0, 600) : defaults.words,
    exampleReadouts: typeof value?.exampleReadouts === "boolean" ? value.exampleReadouts : defaults.exampleReadouts,
  };
}

export function playableKey(value, language) {
  const key = value.toLowerCase();
  return key.length === 1 && keys[language].includes(key) ? key : null;
}

export function keyboardKeys(language) {
  return { letters: keys[language].slice(0, -digits.length), digits };
}

export function displayKey(key, letterCase) {
  if (letterCase === "lower") return key;
  return key === "ß" ? "ẞ" : key.toUpperCase();
}

export function practicePool(words, language) {
  return Array.from(words.normalize("NFC"), key => playableKey(key, language)).filter(Boolean);
}

export function surpriseKey(language, pool, random = Math.random) {
  const source = pool.length > 0 && random() < .75 ? pool : keys[language];
  return source[Math.floor(random() * source.length)];
}

function namesFor(key, language) {
  if (digits.includes(key)) return digitNames[language][Number(key)];
  const index = latin.indexOf(key);
  return index === -1 ? germanNames[key] : letterNames[language][index];
}

export function spokenName(key, language) {
  return namesFor(key, language).split("|")[0];
}

function normalizeAnswer(text) {
  return text.normalize("NFC").toLowerCase()
    .replace(/^[\s\p{P}]+|[\s\p{P}]+$/gu, "")
    .replace(/[\s-]+/gu, " ");
}

export function matchesAnswer(key, language, answers) {
  const accepted = [key, ...namesFor(key, language).split("|")].map(normalizeAnswer);
  return answers.some(answer => accepted.includes(normalizeAnswer(answer)));
}

export const copy = {
  en: {
    tagline: "The little letter arcade",
    stars: "Stars",
    settings: "Grown-ups",
    playMode: "Play mode",
    stage: "Play stage",
    hear: "Hear it",
    say: "Say it",
    hearNote: "Press a key and hear its name.",
    sayNote: "Uses your mic. Your browser may process audio online.",
    noRecognition: "Speech recognition isn't available in this browser. You can still play Hear it.",
    welcome: "Ready, set, smash!",
    hearWelcome: "Press a letter or number to play.",
    sayWelcome: "Press a key, then say what you see to earn a star.",
    surprise: "Surprise me",
    spaceKey: "Space",
    keypad: "On-screen keys",
    showKeys: "Show keys",
    hideKeys: "Hide keys",
    fullscreen: "Fullscreen",
    fullscreenExitFailed: "The browser couldn't leave fullscreen. Use its fullscreen control.",
    ctrl: "Ctrl",
    toExit: "to leave play fullscreen",
    settingsTitle: "Make it yours",
    close: "Close settings",
    language: "Language",
    letterCase: "Letter case",
    upper: "Uppercase (ABC)",
    lower: "Lowercase (abc)",
    exampleReadouts: "Letter examples",
    exampleReadoutsHint: "Hear it sometimes says “J as in jaguar” and shows a picture.",
    exampleConnector: "as in",
    themes: "Stage theme",
    space: "Cosmic Club",
    spring: "Spring Garden",
    winter: "Snow Day",
    party: "Party Time",
    words: "Practice words",
    wordsHint: "Separate words with commas or new lines. Surprise picks their letters and numbers more often.",
    wordsPlaceholder: "moon, rocket, 123",
    cancel: "Cancel",
    save: "Save settings",
    settingsLoadFailed: "Saved settings couldn't be loaded. Using the defaults.",
    settingsSaveFailed: "Settings changed for this page, but couldn't be saved for next time.",
    speaking: "Listen closely!",
    next: "Press another key to keep playing.",
    voiceUnavailable: "Couldn't play the sound. Check your browser or system voices.",
    starting: "Getting the microphone ready…",
    listening: "Listening… Say what you see!",
    correct: "You got it! +1 star",
    incorrect: "Not quite. Give it another try!",
    quiet: "I didn't hear you. Give it another try!",
    micDenied: "Microphone access was blocked. Check this site's permissions.",
    micMissing: "No microphone is available. Check your audio settings.",
    recognitionOffline: "Speech recognition couldn't connect. Check your internet connection.",
    recognitionLanguage: "This browser doesn't support speech recognition in this language.",
    recognitionFailed: "Couldn't listen this time. Try again.",
    paused: "Listening paused. Try again when you're ready.",
    hearAgain: "Hear again",
    tryAgain: "Try again",
  },
  de: {
    tagline: "Das kleine Buchstabenspiel",
    stars: "Sterne",
    settings: "Für Große",
    playMode: "Spielmodus",
    stage: "Spielbühne",
    hear: "Hör zu",
    say: "Sag es",
    hearNote: "Drücke eine Taste und hör, wie sie heißt.",
    sayNote: "Nutzt dein Mikrofon. Dein Browser kann den Ton online verarbeiten.",
    noRecognition: "Dieser Browser hat keine Spracherkennung. Du kannst trotzdem „Hör zu“ spielen.",
    welcome: "Auf die Tasten, los!",
    hearWelcome: "Drücke eine Buchstaben- oder Zahlentaste.",
    sayWelcome: "Drücke eine Taste und sag, was du siehst. Dafür gibt es einen Stern!",
    surprise: "Überrasch mich",
    spaceKey: "Leertaste",
    keypad: "Bildschirmtastatur",
    showKeys: "Tasten zeigen",
    hideKeys: "Tasten ausblenden",
    fullscreen: "Vollbild",
    fullscreenExitFailed: "Der Browser konnte das Vollbild nicht beenden. Nutze seine Vollbildsteuerung.",
    ctrl: "Strg",
    toExit: "beendet das Spiel-Vollbild",
    settingsTitle: "Mach es zu deinem Spiel",
    close: "Einstellungen schließen",
    language: "Sprache",
    letterCase: "Buchstaben",
    upper: "Großbuchstaben (ABC)",
    lower: "Kleinbuchstaben (abc)",
    exampleReadouts: "Buchstabenbeispiele",
    exampleReadoutsHint: "„Hör zu“ sagt manchmal „J wie Jaguar“ und zeigt ein Bild.",
    exampleConnector: "wie",
    themes: "Bühnenmotiv",
    space: "Weltraum-Club",
    spring: "Frühlingsgarten",
    winter: "Schneetag",
    party: "Partyzeit",
    words: "Übungswörter",
    wordsHint: "Trenne Wörter mit Kommas oder neuen Zeilen. Ihre Buchstaben und Zahlen erscheinen öfter bei „Überrasch mich“.",
    wordsPlaceholder: "Mond, Rakete, 123",
    cancel: "Abbrechen",
    save: "Speichern",
    settingsLoadFailed: "Die Einstellungen konnten nicht geladen werden. Die Standardwerte werden verwendet.",
    settingsSaveFailed: "Die Einstellungen gelten für diese Seite, konnten aber nicht gespeichert werden.",
    speaking: "Hör gut zu!",
    next: "Drücke eine weitere Taste und spiel weiter.",
    voiceUnavailable: "Der Ton konnte nicht abgespielt werden. Prüfe die Stimmen im Browser oder auf deinem Gerät.",
    starting: "Das Mikrofon wird vorbereitet …",
    listening: "Ich höre zu … Sag, was du siehst!",
    correct: "Richtig! +1 Stern",
    incorrect: "Fast! Versuch es noch mal.",
    quiet: "Ich habe dich nicht gehört. Versuch es noch mal.",
    micDenied: "Der Mikrofonzugriff ist gesperrt. Prüfe die Berechtigungen für diese Seite.",
    micMissing: "Kein Mikrofon verfügbar. Prüfe deine Audioeinstellungen.",
    recognitionOffline: "Die Spracherkennung konnte sich nicht verbinden. Prüfe die Internetverbindung.",
    recognitionLanguage: "Der Browser unterstützt keine Spracherkennung in dieser Sprache.",
    recognitionFailed: "Das Zuhören hat nicht geklappt. Versuch es noch mal.",
    paused: "Das Zuhören wurde pausiert. Versuch es noch mal, wenn du bereit bist.",
    hearAgain: "Noch mal hören",
    tryAgain: "Noch mal versuchen",
  },
};
