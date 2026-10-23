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

  function today() {
    const d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function yesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function currentStreak() {
    if (state.lastDay === today() || state.lastDay === yesterday()) return state.streak;
    return 0;
  }

  function finishLesson(lessonId, mistakes) {
    const first = !state.done[lessonId];
    const xp = XP_PER_LESSON + (mistakes === 0 ? 5 : 0);
    state.xp += xp;
    state.done[lessonId] = (state.done[lessonId] || 0) + 1;
    if (state.lastDay !== today()) {
      state.streak = state.lastDay === yesterday() ? state.streak + 1 : 1;
      state.lastDay = today();
    }
    saveState();
    return { xp, first };
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

  function esc(text) {
    return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // Für den Vergleich: klein, ohne Satzzeichen, ohne doppelte Leerzeichen
  function normalize(text) {
    return text.toLowerCase().replace(/[.,!?¿¡;:"«»]/g, " ").replace(/[’]/g, "'").replace(/\s+/g, " ").trim();
  }

  function stripAccents(text) {
    return text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/œ/g, "oe");
  }

  function tokens(sentence) {
    return normalize(sentence).split(" ").filter(Boolean);
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

  function buildExercises(lesson) {
    const words = lesson.words;
    const ex = [];
    const wordPicks = pick(words, 6);

    // Wort übersetzen: Fremdsprache → Deutsch
    wordPicks.slice(0, 2).forEach(([t, d]) => {
      ex.push({ type: "choice", prompt: "Was bedeutet das?", show: t, speakText: t, answer: d,
        options: shuffle([d].concat(pick(words.filter((w) => w[1] !== d).map((w) => w[1]), 3))) });
    });

    // Wort übersetzen: Deutsch → Fremdsprache
    wordPicks.slice(2, 4).forEach(([t, d]) => {
      ex.push({ type: "choice", prompt: "Wie sagt man das?", show: d, answer: t, speakAnswer: true,
        options: shuffle([t].concat(pick(words.filter((w) => w[0] !== t).map((w) => w[0]), 3))) });
    });

    // Hören
    const [lt] = wordPicks[4];
    ex.push({ type: "listen", prompt: "Was hörst du?", speakText: lt, answer: lt,
      options: shuffle([lt].concat(pick(words.filter((w) => w[0] !== lt).map((w) => w[0]), 3))) });

    // Paare finden
    ex.push({ type: "match", prompt: "Finde die Paare", pairs: pick(words, 4) });

    // Sätze bauen
    const sentences = shuffle(lesson.sentences);
    const allTargetTokens = [].concat(...lesson.sentences.map((s) => tokens(s[0])), ...words.map((w) => tokens(w[0])));
    const allGermanTokens = [].concat(...lesson.sentences.map((s) => tokens(s[1])), ...words.map((w) => tokens(w[1])));

    sentences.slice(0, 2).forEach(([t, d]) => {
      ex.push(sentenceExercise("Übersetze diesen Satz", d, t, allTargetTokens, true));
    });
    if (sentences[2]) {
      const [t, d] = sentences[2];
      const e = sentenceExercise("Übersetze diesen Satz", t, d, allGermanTokens, false);
      e.speakText = t;
      ex.push(e);
    }

    // Schreiben
    const [wt, wd] = wordPicks[5];
    ex.push({ type: "type", prompt: "Schreib es in der Fremdsprache", show: wd, answer: wt });

    return ex;
  }

  function sentenceExercise(prompt, show, answer, pool, speakAnswer) {
    const correct = tokens(answer);
    const extras = pick(Array.from(new Set(pool)).filter((w) => !correct.includes(w)), 3);
    return { type: "build", prompt, show, answer, speakAnswer, correct, bank: shuffle(correct.concat(extras)) };
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

  function showHome() {
    if (!state.lang) return showLanguageChoice();
    const course = COURSES[state.lang];
    const lessons = course.lessons;
    const doneCount = lessons.filter((l) => state.done[l.id]).length;

    app.innerHTML = `
      ${headerHtml()}
      <main class="screen">
        <section class="course-head">
          <h1>${course.flag} ${course.name}</h1>
          <div class="course-progress">
            <div class="bar"><div class="fill" style="width:${(doneCount / lessons.length) * 100}%"></div></div>
            <span>${doneCount} von ${lessons.length} Lektionen</span>
          </div>
        </section>
        <ol class="path">
          ${lessons.map((l, i) => {
            const done = !!state.done[l.id];
            const unlocked = i === 0 || !!state.done[lessons[i - 1].id];
            const cls = done ? "done" : unlocked ? "open" : "locked";
            return `
              <li class="node ${cls}" style="--offset:${[0, 1, 2, 1, 0, -1, -2, -1][i % 8]}">
                <button data-lesson="${i}" ${unlocked ? "" : "disabled"} aria-label="${esc(l.title)}">
                  <span class="icon">${unlocked ? l.icon : "🔒"}</span>
                </button>
                <span class="label">${esc(l.title)}${done ? " ✓" : ""}</span>
              </li>`;
          }).join("")}
        </ol>
      </main>`;

    app.querySelector("[data-action=choose-lang]").addEventListener("click", showLanguageChoice);
    app.querySelectorAll("[data-lesson]").forEach((b) =>
      b.addEventListener("click", () => startLesson(lessons[Number(b.dataset.lesson)]))
    );
  }

  // ---------- Lektion ----------

  function startLesson(lesson) {
    const course = COURSES[state.lang];
    const session = {
      lesson,
      voice: course.voice,
      queue: buildExercises(lesson),
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

    const pct = (session.solved / session.total) * 100;
    app.innerHTML = `
      <main class="screen lesson">
        <div class="lesson-top">
          <button class="close" data-action="quit" aria-label="Lektion beenden">✕</button>
          <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
        </div>
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
      area.querySelectorAll("button, input").forEach((el) => (el.disabled = true));
      if (ex.speakAnswer && result.ok) speak(ex.answer, session.voice);
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
      const a = normalize(given), b = normalize(ex.answer);
      if (a === b) return { ok: true };
      if (stripAccents(a) === stripAccents(b)) return { ok: true, note: "Achte auf die Akzente: " + ex.answer };
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
      fb.innerHTML = `<strong>Richtig! 🎉</strong>${result.note ? `<p>${esc(result.note)}</p>` : ""}`;
      session.queue.shift();
      session.solved++;
    } else {
      footer.classList.add("bad");
      fb.innerHTML = `<strong>Nicht ganz.</strong><p>Richtige Lösung: <b>${esc(ex.answer)}</b></p>`;
      session.mistakes++;
      // Falsch beantwortete Aufgaben kommen später noch einmal
      session.queue.push(session.queue.shift());
    }
    btn.textContent = "Weiter";
    btn.disabled = false;
    btn.addEventListener("click", () => showExercise(session), { once: true });
    btn.focus();
  }

  // Auswahl (auch fürs Hören)
  function renderChoice(ex, area, checkBtn, session) {
    let selected = null;
    let top = "";
    if (ex.type === "listen") {
      top = `<button class="speaker big" data-action="speak" aria-label="Anhören">🔊</button>`;
    } else {
      top = `<div class="card-word">${ex.speakText ? `<button class="speaker" data-action="speak" aria-label="Anhören">🔊</button>` : ""}<span>${esc(ex.show)}</span></div>`;
    }
    area.innerHTML = `${top}
      <div class="options">
        ${ex.options.map((o, i) => `<button class="option" data-i="${i}"><span class="key">${i + 1}</span>${esc(o)}</button>`).join("")}
      </div>`;

    const sp = area.querySelector("[data-action=speak]");
    if (sp) {
      sp.addEventListener("click", () => speak(ex.speakText, session.voice));
      speak(ex.speakText, session.voice);
    }
    area.querySelectorAll(".option").forEach((b) =>
      b.addEventListener("click", () => {
        area.querySelectorAll(".option").forEach((x) => x.classList.remove("selected"));
        b.classList.add("selected");
        selected = ex.options[Number(b.dataset.i)];
        checkBtn.disabled = false;
        if (ex.type === "choice" && ex.speakAnswer) speak(selected, session.voice);
      })
    );
    return () => selected;
  }

  // Satz aus Wörtern bauen
  function renderBuild(ex, area, checkBtn, session) {
    const chosen = [];
    area.innerHTML = `
      <div class="card-word">${ex.speakText ? `<button class="speaker" data-action="speak" aria-label="Anhören">🔊</button>` : ""}<span>${esc(ex.show)}</span></div>
      <div class="answer-line" aria-label="Deine Antwort"></div>
      <div class="bank">${ex.bank.map((w, i) => `<button class="chip" data-i="${i}">${esc(w)}</button>`).join("")}</div>`;

    const line = area.querySelector(".answer-line");
    const sp = area.querySelector("[data-action=speak]");
    if (sp) {
      sp.addEventListener("click", () => speak(ex.speakText, session.voice));
      speak(ex.speakText, session.voice);
    }

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

  // Antwort eintippen
  function renderType(ex, area, checkBtn) {
    area.innerHTML = `
      <div class="card-word"><span>${esc(ex.show)}</span></div>
      <input class="text-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Deine Antwort …">
      <div class="accent-keys">${accentKeys().map((k) => `<button class="chip small" data-k="${k}">${k}</button>`).join("")}</div>`;
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
    return state.lang === "fr" ? ["é", "è", "ê", "à", "ç", "ô", "œ"] : ["á", "é", "í", "ó", "ú", "ñ", "¿"];
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
    const { xp } = finishLesson(session.lesson.id, session.mistakes);
    const perfect = session.mistakes === 0;
    app.innerHTML = `
      <main class="screen center result">
        <div class="logo">${perfect ? "🏆" : "🎉"}</div>
        <h1>Lektion geschafft!</h1>
        <p class="sub">${esc(session.lesson.title)}</p>
        <div class="result-stats">
          <div class="pill"><span>⭐</span><b>+${xp} XP</b>${perfect ? "<small>Ohne Fehler: +5 Bonus</small>" : ""}</div>
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
