// Sprachenlern-App: Startseite, Lektionen, Übungen und Fortschritt.
// Alles läuft im Browser, der Fortschritt wird im Gerät gespeichert (localStorage).

(function () {
  "use strict";

  const COURSES = window.COURSES;
  const STORAGE_KEY = "sprachenlernapp-v1";
  const XP_PER_LESSON = 10;
  const app = document.getElementById("app");

  // ---------- Fortschritt speichern ----------

  function defaultState() {
    return { lang: null, xp: 0, streak: 0, lastDay: null, done: {} };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? Object.assign(defaultState(), JSON.parse(raw)) : defaultState();
    } catch (e) {
      return defaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* Speichern nicht möglich, App läuft trotzdem */ }
  }

  let state = loadState();

  function dayString(d) {
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function today() {
    return dayString(new Date());
  }

  function yesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return dayString(d);
  }

  function currentStreak() {
    if (state.lastDay === today() || state.lastDay === yesterday()) return state.streak;
    return 0;
  }

  function finishLesson(lesson, mistakes) {
    // Später im Kurs gibt es mehr Punkte
    const xp = XP_PER_LESSON + 2 * (lesson.unit || 0) + (mistakes === 0 ? 5 : 0);
    state.xp += xp;
    if (!lesson.isReview) state.done[lesson.id] = (state.done[lesson.id] || 0) + 1;
    if (state.lastDay !== today()) {
      state.streak = state.lastDay === yesterday() ? state.streak + 1 : 1;
      state.lastDay = today();
    }
    saveState();
    return xp;
  }

  // ---------- Hilfsfunktionen ----------

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pick(list, n) {
    return shuffle(list).slice(0, n);
  }

  function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function esc(text) {
    return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // Für den Vergleich: klein, ohne Satzzeichen, ohne doppelte Leerzeichen
  function normalize(text) {
    return String(text).toLowerCase().replace(/[.,!?¿¡;:"«»]/g, " ").replace(/[’`´]/g, "'").replace(/\s+/g, " ").trim();
  }

  function stripAccents(text) {
    return text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/œ/g, "oe");
  }

  // Noch großzügiger: ohne Akzente, Bindestrich = Leerzeichen
  function loose(text) {
    return stripAccents(normalize(text)).replace(/-/g, " ").replace(/\s+/g, " ").trim();
  }

  function tokens(sentence) {
    return normalize(sentence).split(" ").filter(Boolean);
  }

  // Liefert immer das nächste Element, ohne Wiederholung, bis alle einmal dran waren
  function cycler(list) {
    let pool = [];
    return () => {
      if (!pool.length) pool = shuffle(list);
      return pool.pop();
    };
  }

  // Bis zu n verschiedene falsche Antworten, die nicht wie die richtige aussehen
  function distractors(answer, candidates, n) {
    const seen = new Set([normalize(answer)]);
    const out = [];
    for (const c of shuffle(candidates)) {
      const k = normalize(c);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(c);
      if (out.length === n) break;
    }
    return out;
  }

  function speak(text, lang) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.9;
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang && v.lang.replace("_", "-").startsWith(lang.slice(0, 2)));
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  }

  // ---------- Übungen aus einer Lektion erzeugen ----------
  //
  // Pro Teil des Kurses gibt es einen "Plan": welche Übungen in welcher Menge.
  // Je weiter hinten, desto mehr Aufgaben, mehr Schreiben, Diktate und Wiederholungen.

  const PLANS = [
    // Teil 1: 10 Aufgaben, viel Auswählen
    ["chooseT", "chooseT", "chooseD", "chooseD", "listen", "match", "buildT", "buildT", "buildD", "type"],
    // Teil 2: 12 Aufgaben, Lückentexte und erste Wiederholung
    ["chooseT", "chooseD", "listen", "match", "gap", "gap", "buildT", "buildT", "buildD", "type", "type", "review"],
    // Teil 3: 14 Aufgaben, Diktat
    ["chooseD", "listen", "match", "gap", "gap", "buildT", "buildT", "buildD", "type", "type", "dictWord", "dictSentence", "review", "number"],
    // Teil 4: 16 Aufgaben
    ["chooseD", "listen", "match", "gap", "gap", "buildT", "buildT", "buildD", "type", "type", "type", "dictWord", "dictSentence", "review", "review", "number"],
    // Teil 5: 18 Aufgaben, kaum noch Auswählen
    ["listen", "match", "gap", "gap", "buildT", "buildT", "buildD", "buildD", "type", "type", "type", "dictWord", "dictSentence", "dictSentence", "review", "review", "review", "number"],
  ];

  // Leicht zuerst, schwer am Ende einer Lektion
  const LEVEL = { chooseT: 0, chooseD: 0, listen: 0, match: 0, numRead: 0, numPick: 0, gap: 1, buildT: 1, buildD: 1, review: 1, number: 1, numHear: 2, type: 2, numWrite: 2, dictWord: 2, dictSentence: 2 };

  function buildExercises(lesson, course, lang) {
    const tier = Math.min(lesson.unit || 0, PLANS.length - 1);
    const index = course.lessons.indexOf(lesson);
    const earlier = lesson.isReview ? lesson.pool : course.lessons.slice(0, Math.max(index, 0));
    const earlierWords = [].concat(...earlier.map((l) => l.words));

    // Zahlenbereich: was diese oder frühere Lektionen geübt haben
    const ranges = (lesson.numbers ? [lesson.numbers] : []).concat(earlier.filter((l) => l.numbers).map((l) => l.numbers));
    const numRange = ranges.length ? [Math.min(...ranges.map((r) => r[0])), Math.max(...ranges.map((r) => r[1]))] : null;

    let plan = PLANS[tier].slice();
    if (lesson.isReview) plan = plan.map((p) => (p === "review" ? (Math.random() < 0.5 ? "type" : "gap") : p));
    if (!earlierWords.length) plan = plan.map((p) => (p === "review" ? "chooseT" : p));
    if (lesson.numbers && !lesson.isReview) {
      // Zahlen-Lektionen: vier Zahlen-Aufgaben statt einiger anderer
      plan = plan.filter((p) => p !== "number" && p !== "review");
      plan.splice(plan.indexOf("chooseT") >= 0 ? plan.indexOf("chooseT") : 0, 1);
      plan = plan.concat(["numRead", "numPick", "numHear", "numWrite"]);
    } else if (!numRange) {
      plan = plan.map((p) => (p === "number" ? "gap" : p));
    }

    // Reihenfolge: leicht → schwer, innerhalb der Stufe gemischt
    plan = shuffle(plan).sort((a, b) => LEVEL[a] - LEVEL[b]);

    const nextWord = cycler(lesson.words);
    const nextSentence = cycler(lesson.sentences);
    const nextOld = earlierWords.length ? cycler(earlierWords) : nextWord;
    // Ab Teil 2 kommen falsche Antworten auch aus früheren Lektionen (schwerer)
    const optionWords = tier === 0 ? lesson.words : lesson.words.concat(earlierWords);
    const targetPool = optionWords.map((w) => w[0]);
    const germanPool = optionWords.map((w) => w[1]);
    const allTargetTokens = [].concat(...lesson.sentences.map((s) => tokens(s[0])), ...optionWords.map((w) => tokens(w[0])));
    const allGermanTokens = [].concat(...lesson.sentences.map((s) => tokens(s[1])), ...optionWords.map((w) => tokens(w[1])));
    const extraChips = 2 + tier; // mehr falsche Wörter beim Satzbau

    const make = {
      chooseT(w = nextWord()) {
        return { type: "choice", prompt: "Was bedeutet das?", show: w[0], speakText: w[0], answer: w[1],
          options: shuffle([w[1]].concat(distractors(w[1], germanPool, 3))) };
      },
      chooseD(w = nextWord()) {
        return { type: "choice", prompt: "Wie sagt man das?", show: w[1], answer: w[0], speakAnswer: true,
          options: shuffle([w[0]].concat(distractors(w[0], targetPool, 3))) };
      },
      listen(w = nextWord()) {
        return { type: "listen", prompt: "Was hörst du?", speakText: w[0], answer: w[0],
          options: shuffle([w[0]].concat(distractors(w[0], targetPool, 3))) };
      },
      match() {
        return { type: "match", prompt: "Finde die Paare", pairs: uniquePairs(lesson.words, tier === 0 ? 4 : 5) };
      },
      type(w = nextWord()) {
        return { type: "type", prompt: "Schreib es auf " + course.name, show: w[1], answer: w[0], accents: true };
      },
      buildT() {
        const s = nextSentence();
        return sentenceExercise("Übersetze diesen Satz", s[1], s[0], allTargetTokens, extraChips, true);
      },
      buildD() {
        const s = nextSentence();
        const e = sentenceExercise("Übersetze ins Deutsche", s[0], s[1], allGermanTokens, extraChips, false);
        e.speakText = s[0];
        return e;
      },
      gap() {
        return gapExercise(nextSentence(), allTargetTokens, lesson.words) || make.chooseT();
      },
      dictWord(w = nextWord()) {
        return { type: "type", prompt: "Schreib, was du hörst", speakText: w[0], bigSpeaker: true, answer: w[0], accents: true };
      },
      dictSentence() {
        const s = nextSentence();
        return { type: "type", prompt: "Schreib den Satz, den du hörst", speakText: s[0], bigSpeaker: true, answer: s[0], hint: s[1], accents: true };
      },
      review() {
        const w = nextOld();
        const kind = pick(["chooseT", "chooseD", "listen", "type"], 1)[0];
        const e = make[kind](w);
        e.review = true;
        return e;
      },
      number() {
        return make[pick(["numRead", "numPick", "numHear", "numWrite"], 1)[0]]();
      },
      numRead() {
        const n = randomNumber(numRange);
        const words = window.numberToWords(n, lang);
        return { type: "choice", prompt: "Wie heißt diese Zahl?", show: formatNumber(n), answer: words, speakAnswer: true,
          options: shuffle([words].concat(nearNumbers(n, numRange).map((m) => window.numberToWords(m, lang)))) };
      },
      numPick() {
        const n = randomNumber(numRange);
        const words = window.numberToWords(n, lang);
        return { type: "choice", prompt: "Welche Zahl ist das?", show: words, speakText: words, answer: formatNumber(n),
          options: shuffle([n].concat(nearNumbers(n, numRange)).map(formatNumber)) };
      },
      numHear() {
        const n = randomNumber(numRange);
        return { type: "type", prompt: "Welche Zahl hörst du? (in Ziffern)", speakText: String(n), bigSpeaker: true,
          answer: String(n), numeric: true, solution: formatNumber(n) + " (" + window.numberToWords(n, lang) + ")" };
      },
      numWrite() {
        const n = randomNumber(numRange);
        return { type: "type", prompt: "Schreib die Zahl als Wort", show: formatNumber(n), answer: window.numberToWords(n, lang), accents: true };
      },
    };

    return plan.map((p) => make[p]());
  }

  function uniquePairs(words, n) {
    const seenT = new Set(), seenD = new Set(), out = [];
    for (const w of shuffle(words)) {
      if (seenT.has(w[0]) || seenD.has(w[1])) continue;
      seenT.add(w[0]); seenD.add(w[1]);
      out.push(w);
      if (out.length === n) break;
    }
    return out;
  }

  function randomNumber(range) {
    const [min, max] = range;
    // Große Bereiche: mal klein, mal groß, damit alle Größen geübt werden
    if (max > 100 && Math.random() < 0.3) return randInt(Math.max(min, 11), 100);
    return randInt(min, max);
  }

  function nearNumbers(n, range) {
    const [min, max] = range;
    const set = new Set([n]);
    const out = [];
    const spread = Math.max(3, Math.round(n * 0.3));
    let tries = 0;
    while (out.length < 3 && tries++ < 200) {
      let m = tries % 3 === 0 && n >= 10 ? Number(String(n).split("").reverse().join("")) : n + randInt(-spread, spread);
      if (tries > 100) m = randInt(min, max);
      if (m < min || m > max || set.has(m)) continue;
      set.add(m);
      out.push(m);
    }
    return out;
  }

  function formatNumber(n) {
    return String(n);
  }

  function sentenceExercise(prompt, show, answer, pool, extraCount, speakAnswer) {
    const correct = tokens(answer);
    const extras = pick(Array.from(new Set(pool)).filter((w) => !correct.includes(w)), extraCount);
    return { type: "build", prompt, show, answer, speakAnswer, correct, bank: shuffle(correct.concat(extras)) };
  }

  // Lückentext: ein Wort im Satz fehlt, man wählt das richtige aus
  function gapExercise(sentence, pool, words) {
    const [target, german] = sentence;
    const pieces = target.split(" ");
    const lessonWords = new Set(words.map((w) => normalize(w[0])));
    const candidates = pieces
      .map((p, i) => ({ i, core: normalize(p) }))
      .filter((c) => c.core.length > 1 && !c.core.includes("'") && !c.core.includes(" "));
    if (!candidates.length) return null;
    // Lieber ein Wort aus der Lektion, sonst das längste
    const inLesson = candidates.filter((c) => lessonWords.has(c.core));
    const chosen = inLesson.length ? pick(inLesson, 1)[0] : candidates.sort((a, b) => b.core.length - a.core.length)[0];
    const display = pieces.map((p, i) => (i === chosen.i ? p.replace(/[^.,!?¿¡;:]+/, "____") : p)).join(" ");
    const sentenceTokens = new Set(tokens(target));
    const ok = (t) => !sentenceTokens.has(t) && !t.includes("'") && t.length > 1;
    // Erst Wörter aus derselben Lektion (schwerer zu unterscheiden), dann andere
    let wrong = distractors(chosen.core, [...lessonWords].filter((t) => ok(t) && !t.includes(" ")), 3);
    if (wrong.length < 3) wrong = wrong.concat(distractors(chosen.core, pool.filter((t) => ok(t) && !wrong.includes(t)), 3 - wrong.length));
    const options = shuffle([chosen.core].concat(wrong));
    return { type: "choice", prompt: "Welches Wort fehlt?", show: display, hint: german, answer: chosen.core, options, solution: target, speakSolution: target };
  }

  // ---------- Bildschirme ----------

  function headerHtml() {
    const course = state.lang ? COURSES[state.lang] : null;
    return `
      <header class="topbar">
        <button class="lang-switch" data-action="choose-lang" aria-label="Sprache wechseln">${course ? course.flag : "🌍"}</button>
        <div class="stats">
          <span class="stat" title="Tage in Folge">🔥 ${currentStreak()}</span>
          <span class="stat" title="Erfahrungspunkte">⭐ ${state.xp} XP</span>
        </div>
      </header>`;
  }

  function showLanguageChoice() {
    app.innerHTML = `
      <main class="screen center">
        <div class="logo">🦜</div>
        <h1>Welche Sprache möchtest du lernen?</h1>
        <div class="lang-list">
          ${Object.entries(COURSES).map(([code, c]) => `
            <button class="lang-card" data-lang="${code}">
              <span class="flag">${c.flag}</span>
              <span>${c.name}</span>
            </button>`).join("")}
        </div>
      </main>`;
    app.querySelectorAll("[data-lang]").forEach((b) =>
      b.addEventListener("click", () => {
        state.lang = b.dataset.lang;
        saveState();
        showHome();
      })
    );
  }

  function stars(n, total) {
    return "★".repeat(n) + "☆".repeat(total - n);
  }

  function showHome() {
    if (!state.lang) return showLanguageChoice();
    const course = COURSES[state.lang];
    const lessons = course.lessons;
    const doneLessons = lessons.filter((l) => state.done[l.id]);
    const doneCount = doneLessons.length;
    let i = 0;

    app.innerHTML = `
      ${headerHtml()}
      <main class="screen">
        <section class="course-head">
          <h1>${course.flag} ${course.name}</h1>
          <div class="course-progress">
            <div class="bar"><div class="fill" style="width:${(doneCount / lessons.length) * 100}%"></div></div>
            <span>${doneCount} von ${lessons.length} Lektionen</span>
          </div>
          ${doneCount >= 2 ? `
          <button class="review-card" data-action="review">
            <span class="icon">🔁</span>
            <span><b>Wiederholen</b><small>Gemischte Übungen aus allem, was du schon kannst</small></span>
          </button>` : ""}
        </section>
        ${course.units.map((unit, u) => `
          <section class="unit unit-c${u % 5}">
            <div class="unit-head">
              <span class="unit-no">Teil ${u + 1}</span>
              <span class="unit-title">${esc(unit.title)}</span>
              <span class="unit-stars" title="Schwierigkeit">${stars(u + 1, course.units.length)}</span>
            </div>
            <ol class="path">
              ${unit.lessons.map((l) => {
                const idx = i++;
                const done = !!state.done[l.id];
                const unlocked = idx === 0 || !!state.done[lessons[idx - 1].id];
                const cls = done ? "done" : unlocked ? "open" : "locked";
                return `
                  <li class="node ${cls}" style="--offset:${[0, 1, 2, 1, 0, -1, -2, -1][idx % 8]}">
                    <button data-lesson="${idx}" ${unlocked ? "" : "disabled"} aria-label="${esc(l.title)}">
                      <span class="icon">${unlocked ? l.icon : "🔒"}</span>
                    </button>
                    <span class="label">${esc(l.title)}${done ? " ✓" : ""}</span>
                  </li>`;
              }).join("")}
            </ol>
          </section>`).join("")}
      </main>`;

    app.querySelector("[data-action=choose-lang]").addEventListener("click", showLanguageChoice);
    app.querySelectorAll("[data-lesson]").forEach((b) =>
      b.addEventListener("click", () => startLesson(lessons[Number(b.dataset.lesson)]))
    );
    const rv = app.querySelector("[data-action=review]");
    if (rv) rv.addEventListener("click", () => startLesson(reviewLesson(course, doneLessons)));

    // Zur aktuellen Lektion scrollen
    const current = app.querySelector(".node.open");
    if (current && doneCount > 2) current.scrollIntoView({ block: "center" });
  }

  // Eine "Lektion" aus allem, was schon gelernt wurde
  function reviewLesson(course, doneLessons) {
    const recent = doneLessons.slice(-8);
    const ranges = doneLessons.filter((l) => l.numbers).map((l) => l.numbers);
    return {
      id: "review-" + state.lang,
      title: "Wiederholung",
      icon: "🔁",
      isReview: true,
      unit: Math.max(...doneLessons.map((l) => l.unit || 0)),
      words: [].concat(...recent.map((l) => l.words), ...pick(doneLessons, 4).map((l) => l.words)),
      sentences: [].concat(...doneLessons.map((l) => l.sentences)),
      numbers: ranges.length ? [0, Math.max(...ranges.map((r) => r[1]))] : null,
      pool: doneLessons,
    };
  }

  // ---------- Lektion ----------

  function startLesson(lesson) {
    const course = COURSES[state.lang];
    const session = {
      lesson,
      voice: course.voice,
      queue: buildExercises(lesson, course, state.lang),
      total: 0,
      solved: 0,
      mistakes: 0,
    };
    session.total = session.queue.length;
    showExercise(session);
  }

  function showExercise(session) {
    const ex = session.queue[0];
    if (!ex) return showResult(session);
    window.__exercise = ex; // für automatische Tests

    const pct = (session.solved / session.total) * 100;
    app.innerHTML = `
      <main class="screen lesson">
        <div class="lesson-top">
          <button class="close" data-action="quit" aria-label="Lektion beenden">✕</button>
          <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
        </div>
        ${ex.review ? `<span class="badge">🔁 Wiederholung</span>` : ""}
        <h2 class="prompt">${esc(ex.prompt)}</h2>
        <div class="exercise"></div>
        <footer class="check-area">
          <div class="feedback" hidden></div>
          <button class="btn primary" data-action="check" disabled>Prüfen</button>
        </footer>
      </main>`;

    app.querySelector("[data-action=quit]").addEventListener("click", () => {
      if (confirmQuit()) showHome();
    });

    const area = app.querySelector(".exercise");
    const checkBtn = app.querySelector("[data-action=check]");
    const renderers = { choice: renderChoice, listen: renderChoice, match: renderMatch, build: renderBuild, type: renderType };
    const getAnswer = renderers[ex.type](ex, area, checkBtn, session);

    if (ex.type === "match") return; // Paare prüfen sich selbst

    checkBtn.addEventListener("click", function onCheck() {
      checkBtn.removeEventListener("click", onCheck);
      const result = evaluate(ex, getAnswer());
      area.querySelectorAll("button:not(.speaker), input").forEach((el) => (el.disabled = true));
      if (result.ok) {
        if (ex.speakSolution) speak(ex.speakSolution, session.voice);
        else if (ex.speakAnswer) speak(ex.answer, session.voice);
      }
      showFeedback(session, result, ex);
    });
  }

  function confirmQuit() {
    // Ohne Browser-Dialog: zweimal tippen zum Beenden
    const btn = app.querySelector("[data-action=quit]");
    if (btn.dataset.armed) return true;
    btn.dataset.armed = "1";
    btn.textContent = "Beenden?";
    btn.classList.add("armed");
    setTimeout(() => {
      if (btn.isConnected) {
        delete btn.dataset.armed;
        btn.textContent = "✕";
        btn.classList.remove("armed");
      }
    }, 2500);
    return false;
  }

  function evaluate(ex, given) {
    if (ex.type === "choice" || ex.type === "listen") return { ok: given === ex.answer };
    if (ex.type === "build") return { ok: given.join(" ") === ex.correct.join(" ") };
    if (ex.type === "type") {
      if (ex.numeric) return { ok: given.replace(/[\s.,]/g, "") === ex.answer };
      const a = normalize(given), b = normalize(ex.answer);
      if (a === b) return { ok: true };
      if (loose(a) === loose(b)) return { ok: true, note: "Fast perfekt! Genau geschrieben: " + ex.answer };
      return { ok: false };
    }
    return { ok: false };
  }

  function showFeedback(session, result, ex) {
    const fb = app.querySelector(".feedback");
    const btn = app.querySelector("[data-action=check]");
    const footer = app.querySelector(".check-area");
    fb.hidden = false;

    if (result.ok) {
      footer.classList.add("good");
      fb.innerHTML = `<strong>${pick(["Richtig! 🎉", "Super! 💪", "Genau! ✨", "Klasse! 🌟"], 1)[0]}</strong>${result.note ? `<p>${esc(result.note)}</p>` : ""}`;
      session.queue.shift();
      session.solved++;
    } else {
      footer.classList.add("bad");
      fb.innerHTML = `<strong>Nicht ganz.</strong><p>Richtige Lösung: <b>${esc(ex.solution || ex.answer)}</b></p>`;
      session.mistakes++;
      // Falsch beantwortete Aufgaben kommen später noch einmal
      session.queue.push(session.queue.shift());
    }
    btn.textContent = "Weiter";
    btn.disabled = false;
    btn.addEventListener("click", () => showExercise(session), { once: true });
    btn.focus();
  }

  function speakerButton(ex, big) {
    return ex.speakText ? `<button class="speaker${big ? " big" : ""}" data-action="speak" aria-label="Anhören">🔊</button>` : "";
  }

  function wireSpeaker(ex, area, session) {
    const sp = area.querySelector("[data-action=speak]");
    if (!sp) return;
    sp.addEventListener("click", () => speak(ex.speakText, session.voice));
    speak(ex.speakText, session.voice);
  }

  function cardHtml(ex) {
    return `<div class="card-word">${speakerButton(ex, false)}<span>${esc(ex.show)}</span></div>${ex.hint ? `<p class="hint">${esc(ex.hint)}</p>` : ""}`;
  }

  // Auswahl (auch fürs Hören)
  function renderChoice(ex, area, checkBtn, session) {
    let selected = null;
    const top = ex.type === "listen" ? speakerButton(ex, true) : cardHtml(ex);
    area.innerHTML = `${top}
      <div class="options">
        ${ex.options.map((o, i) => `<button class="option" data-i="${i}"><span class="key">${i + 1}</span>${esc(o)}</button>`).join("")}
      </div>`;

    wireSpeaker(ex, area, session);
    area.querySelectorAll(".option").forEach((b) =>
      b.addEventListener("click", () => {
        area.querySelectorAll(".option").forEach((x) => x.classList.remove("selected"));
        b.classList.add("selected");
        selected = ex.options[Number(b.dataset.i)];
        checkBtn.disabled = false;
        if (ex.speakAnswer) speak(selected, session.voice);
      })
    );
    return () => selected;
  }

  // Satz aus Wörtern bauen
  function renderBuild(ex, area, checkBtn, session) {
    const chosen = [];
    area.innerHTML = `${cardHtml(ex)}
      <div class="answer-line" aria-label="Deine Antwort"></div>
      <div class="bank">${ex.bank.map((w, i) => `<button class="chip" data-i="${i}">${esc(w)}</button>`).join("")}</div>`;

    const line = area.querySelector(".answer-line");
    wireSpeaker(ex, area, session);

    function redraw() {
      line.innerHTML = chosen.map((i, pos) => `<button class="chip" data-pos="${pos}">${esc(ex.bank[i])}</button>`).join("");
      area.querySelectorAll(".bank .chip").forEach((b) => b.classList.toggle("used", chosen.includes(Number(b.dataset.i))));
      line.querySelectorAll(".chip").forEach((b) =>
        b.addEventListener("click", () => {
          chosen.splice(Number(b.dataset.pos), 1);
          redraw();
        })
      );
      checkBtn.disabled = chosen.length === 0;
    }

    area.querySelectorAll(".bank .chip").forEach((b) =>
      b.addEventListener("click", () => {
        const i = Number(b.dataset.i);
        if (chosen.includes(i)) return;
        chosen.push(i);
        redraw();
      })
    );
    return () => chosen.map((i) => ex.bank[i]);
  }

  // Antwort eintippen (auch Diktat und Zahlen)
  function renderType(ex, area, checkBtn, session) {
    const top = ex.bigSpeaker ? speakerButton(ex, true) + (ex.hint ? `<p class="hint">${esc(ex.hint)}</p>` : "") : cardHtml(ex);
    area.innerHTML = `${top}
      <input class="text-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false"
        ${ex.numeric ? 'inputmode="numeric" placeholder="z. B. 42"' : 'placeholder="Deine Antwort …"'}>
      ${ex.accents && !ex.numeric ? `<div class="accent-keys">${accentKeys().map((k) => `<button class="chip small" data-k="${k}">${k}</button>`).join("")}</div>` : ""}`;
    wireSpeaker(ex, area, session);
    const input = area.querySelector("input");
    input.addEventListener("input", () => (checkBtn.disabled = input.value.trim() === ""));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !checkBtn.disabled) checkBtn.click();
    });
    area.querySelectorAll("[data-k]").forEach((b) =>
      b.addEventListener("click", () => {
        input.value += b.dataset.k;
        input.dispatchEvent(new Event("input"));
        input.focus();
      })
    );
    setTimeout(() => input.focus(), 50);
    return () => input.value;
  }

  function accentKeys() {
    return state.lang === "fr" ? ["é", "è", "ê", "à", "ç", "ô", "û", "œ"] : ["á", "é", "í", "ó", "ú", "ñ", "ü", "¿"];
  }

  // Paare finden
  function renderMatch(ex, area, checkBtn, session) {
    const left = shuffle(ex.pairs.map((p) => p[0]));
    const right = shuffle(ex.pairs.map((p) => p[1]));
    let selLeft = null, selRight = null, found = 0, hadMistake = false;

    area.innerHTML = `
      <div class="match">
        <div class="col">${left.map((w) => `<button class="option" data-side="l" data-w="${esc(w)}">${esc(w)}</button>`).join("")}</div>
        <div class="col">${right.map((w) => `<button class="option" data-side="r" data-w="${esc(w)}">${esc(w)}</button>`).join("")}</div>
      </div>`;
    checkBtn.textContent = "Weiter";
    checkBtn.disabled = true;

    function tryPair() {
      if (!selLeft || !selRight) return;
      const ok = ex.pairs.some((p) => p[0] === selLeft.dataset.w && p[1] === selRight.dataset.w);
      const a = selLeft, b = selRight;
      selLeft = selRight = null;
      if (ok) {
        [a, b].forEach((x) => { x.classList.remove("selected"); x.classList.add("matched"); x.disabled = true; });
        found++;
        if (found === ex.pairs.length) {
          session.queue.shift();
          session.solved++;
          if (hadMistake) session.mistakes++;
          const footer = app.querySelector(".check-area");
          const fb = app.querySelector(".feedback");
          footer.classList.add("good");
          fb.hidden = false;
          fb.innerHTML = "<strong>Alle Paare gefunden! 🎉</strong>";
          checkBtn.disabled = false;
          checkBtn.addEventListener("click", () => showExercise(session), { once: true });
          checkBtn.focus();
        }
      } else {
        hadMistake = true;
        [a, b].forEach((x) => { x.classList.remove("selected"); x.classList.add("wrong"); });
        setTimeout(() => [a, b].forEach((x) => x.classList.remove("wrong")), 500);
      }
    }

    area.querySelectorAll(".option").forEach((b) =>
      b.addEventListener("click", () => {
        if (b.dataset.side === "l") {
          if (selLeft) selLeft.classList.remove("selected");
          selLeft = b;
          speak(b.dataset.w, session.voice);
        } else {
          if (selRight) selRight.classList.remove("selected");
          selRight = b;
        }
        b.classList.add("selected");
        tryPair();
      })
    );
    return () => null;
  }

  // ---------- Ergebnis ----------

  function showResult(session) {
    const xp = finishLesson(session.lesson, session.mistakes);
    const perfect = session.mistakes === 0;
    const accuracy = Math.round((session.total / (session.total + session.mistakes)) * 100);
    app.innerHTML = `
      <main class="screen center result">
        <div class="logo">${perfect ? "🏆" : "🎉"}</div>
        <h1>${session.lesson.isReview ? "Wiederholung geschafft!" : "Lektion geschafft!"}</h1>
        <p class="sub">${esc(session.lesson.title)}</p>
        <div class="result-stats">
          <div class="pill"><span>⭐</span><b>+${xp} XP</b>${perfect ? "<small>Ohne Fehler: +5 Bonus</small>" : ""}</div>
          <div class="pill"><span>🎯</span><b>${accuracy} %</b><small>richtig</small></div>
          <div class="pill"><span>🔥</span><b>${currentStreak()} ${currentStreak() === 1 ? "Tag" : "Tage"}</b><small>in Folge</small></div>
        </div>
        <button class="btn primary" data-action="home">Weiter</button>
      </main>`;
    app.querySelector("[data-action=home]").addEventListener("click", showHome);
  }

  // Tastatur: Zahlen 1–4 wählen Antworten, Enter prüft
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;
    const n = Number(e.key);
    if (n >= 1 && n <= 4) {
      const opt = app.querySelectorAll(".options .option")[n - 1];
      if (opt && !opt.disabled) opt.click();
    }
    if (e.key === "Enter") {
      const btn = app.querySelector("[data-action=check]");
      if (btn && !btn.disabled && document.activeElement !== btn) { e.preventDefault(); btn.click(); }
    }
  });

  // Offline-Unterstützung (App kann aufs Handy installiert werden)
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  if ("speechSynthesis" in window) window.speechSynthesis.getVoices();

  showHome();
})();
