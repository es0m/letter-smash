const preferredVoiceNames = {
  en: /\b(?:ana|aria|ava|emma|hazel|jenny|libby|michelle|samantha|sonia|zira)\b/i,
  de: /\b(?:amala|anna|gisela|hedda|helena|katja|petra|seraphina)\b/i,
};
const labeledVoice = /\b(?:child|female|kids?|kinderstimme|weiblich)\b/i;

function bestVoice(voices, locale) {
  const exact = voice => voice.lang.toLowerCase() === locale;
  return voices.find(voice => voice.localService && exact(voice))
    ?? voices.find(voice => voice.localService)
    ?? voices.find(exact)
    ?? voices[0];
}

export function pronunciationVoices(voices, tag) {
  const locale = tag.toLowerCase();
  const language = locale.split("-")[0];
  const matching = voices.filter(voice => voice.lang.toLowerCase().split("-")[0] === language);
  // Web Speech exposes voice names, but no gender or age metadata.
  const preferred = matching.filter(voice => labeledVoice.test(voice.name) || preferredVoiceNames[language]?.test(voice.name));
  const voice = bestVoice(preferred, locale) ?? bestVoice(matching, locale);
  const fallback = voice && !voice.localService ? bestVoice(matching.filter(voice => voice.localService), locale) : undefined;
  return { voice, fallback };
}

export function createListener(Recognition) {
  let active = null;
  let pending = null;

  function startNext() {
    if (active || !pending) return;

    const request = pending;
    pending = null;
    const recognition = new Recognition();
    const run = { recognition, cancelled: false, finished: false };
    active = run;
    recognition.lang = request.lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    const isLive = () => active === run && !run.cancelled && !run.finished;
    recognition.onstart = () => {
      if (isLive()) request.onStart();
    };
    recognition.onresult = event => {
      const result = event.results[event.resultIndex];
      if (!isLive() || !result.isFinal) return;
      run.finished = true;
      request.onResult(Array.from(result, item => item.transcript));
    };
    recognition.onerror = event => {
      if (!isLive()) return;
      run.finished = true;
      request.onError(event.error);
    };
    recognition.onend = () => {
      if (active !== run) return;
      const endedWithoutResult = isLive();
      active = null;
      if (endedWithoutResult) request.onError("no-speech");
      startNext();
    };

    try {
      recognition.start();
    } catch (error) {
      console.warn("Could not start speech recognition.", error);
      if (active !== run) return;
      active = null;
      if (!run.cancelled) request.onError(error.name === "NotAllowedError" ? "not-allowed" : "start-failed");
      startNext();
    }
  }

  function cancelActive() {
    if (!active || active.cancelled || active.finished) return;
    // Wait for the browser's end event before starting another mic session.
    active.cancelled = true;
    active.recognition.abort();
  }

  return {
    listen(request) {
      pending = request;
      cancelActive();
      startNext();
    },
    stop() {
      pending = null;
      cancelActive();
    },
  };
}

export function createCoinSound() {
  let context;
  return {
    prepare() {
      const Audio = window.AudioContext ?? window.webkitAudioContext;
      if (!Audio) return;
      try {
        context ??= new Audio();
        if (context.state !== "running") {
          context.resume().catch(error => console.warn("Could not enable the star sound.", error));
        }
      } catch (error) {
        console.warn("Could not initialize the star sound.", error);
      }
    },
    play() {
      if (context?.state !== "running") return;
      const now = context.currentTime;
      for (const [frequency, delay, length] of [[1046.5, 0, .13], [1568, .07, .22]]) {
        const start = now + delay;
        const tone = context.createOscillator();
        const envelope = context.createGain();
        tone.type = "triangle";
        tone.frequency.value = frequency;
        envelope.gain.setValueAtTime(.001, start);
        envelope.gain.exponentialRampToValueAtTime(.13, start + .012);
        envelope.gain.exponentialRampToValueAtTime(.001, start + length);
        tone.connect(envelope).connect(context.destination);
        tone.start(start);
        tone.stop(start + length);
      }
    },
  };
}
