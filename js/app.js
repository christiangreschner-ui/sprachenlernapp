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
    // placed: Einstieg gewählt (pro Sprache), weak: Wörter, die oft falsch waren
    // goal: Tagesziel in XP, dayXp/dayKey: heute gesammelte XP
    return { lang: null, xp: 0, streak: 0, lastDay: null, done: {}, placed: {}, weak: {}, goal: 30, dayXp: 0, dayKey: null };
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

  function course() {
    return COURSES[state.lang];
  }

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

  function todayXp() {
    return state.dayKey === today() ? state.dayXp : 0;
  }

  // Wie oft eine Lektion geschafft wurde: 1 = ★, 2 = ★★, 3+ = ★★★ (gemeistert)
  function mastery(lesson) {
    return Math.min(state.done[lesson.id] || 0, 3);
  }

  function finishLesson(lesson, mistakes, boost) {
    // Später im Kurs und auf höherer Stufe gibt es mehr Punkte
    const xp = XP_PER_LESSON + 2 * (lesson.unit || 0) + 3 * (boost || 0) + (mistakes === 0 ? 5 : 0);
    state.xp += xp;
    state.dayXp = todayXp() + xp;
    state.dayKey = today();
    if (!lesson.isReview) state.done[lesson.id] = (state.done[lesson.id] || 0) + 1;
    if (state.lastDay !== today()) {
      state.streak = state.lastDay === yesterday() ? state.streak + 1 : 1;
      state.lastDay = today();
    }
    saveState();
    return xp;
  }

  // Merkt sich, welche Wörter schwerfallen (für die Wiederholung)
  function trackWord(word, ok) {
    if (!word) return;
    const k = state.lang + "|" + word[0];
    if (ok) {
      if (state.weak[k]) state.weak[k]--;
      if (!state.weak[k]) delete state.weak[k];
    } else {
      state.weak[k] = Math.min((state.weak[k] || 0) + 2, 6);
    }
    saveState();
  }

  function weakWords(c) {
    const byTarget = {};
    c.lessons.forEach((l) => l.words.forEach((w) => { byTarget[w[0]] = w; }));
    return Object.entries(state.weak)
      .filter(([k]) => k.startsWith(c.code + "|"))
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => byTarget[k.slice(c.code.length + 1)])
      .filter(Boolean)
      .slice(0, 10);
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
    return String(text).toLowerCase().replace(/[.,!?¿¡;:"«»？！，。、]/g, " ").replace(/[’`´]/g, "'").replace(/\s+/g, " ").trim();
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
      if (!k || seen.has(k)) continue;
      seen.add(k);
      out.push(c);
      if (out.length === n) break;
    }
    return out;
  }

  function speak(text, lang) {
    if (!("speechSynthesis" in window)) return;
    if (lang.startsWith("zh")) text = String(text).replace(/ /g, "");
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = lang.startsWith("zh") ? 0.75 : 0.9;
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang && v.lang.replace("_", "-").startsWith(lang.slice(0, 2)));
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  }

  // ---------- Fremdsprachige Texte anzeigen (mit Pinyin und Antippen) ----------

  function isZh() {
    return !!(course() && course().pinyin);
  }

  function pyOf(text) {
    const c = course();
    if (!c || !c.pinyin) return "";
    const t = String(text);
    return c.py[t] || c.py[t.replace(/ /g, "")] || window.numberPinyin(t.replace(/ /g, "")) || "";
  }

  // Text ohne Leerzeichen (Chinesisch), mit Pinyin in Klammern
  function solutionText(text) {
    if (!isZh()) return text;
    const p = pyOf(text);
    return text.replace(/ /g, "") + (p ? " (" + p + ")" : "");
  }

  function glossOf(word) {
    const c = course();
    return c.dict[normalize(word)] || "";
  }

  // Zeigt Fremdsprache an. Bei Chinesisch steht unter jedem Wort das Pinyin.
  // gloss: Wörter lassen sich antippen und zeigen die Übersetzung.
  function renderTarget(text, gloss) {
    const parts = String(text).split(" ");
    if (isZh()) {
      return `<span class="zh-line">${parts.map((t) => {
        if (/^_+/.test(t)) return `<span class="tw"><span class="hz blank">＿＿</span><span class="py">&nbsp;</span></span>`;
        const py = course().py[t] || window.numberPinyin(t) || (parts.length === 1 ? pyOf(text) : "");
        const g = gloss ? glossOf(t) : "";
        return `<span class="tw${g ? " g" : ""}"${g ? ` data-g="${esc(g)}"` : ""}><span class="hz">${esc(t)}</span><span class="py">${esc(py) || "&nbsp;"}</span></span>`;
      }).join("")}</span>`;
    }
    const blank = (p) => p.replace(/_{3,}/, '<span class="blank-gap">___</span>');
    if (!gloss) return parts.map((p) => (/_{3,}/.test(p) ? blank(esc(p)) : esc(p))).join(" ");
    return parts.map((p) => {
      if (/_{3,}/.test(p)) return blank(esc(p));
      const g = glossOf(p);
      return g ? `<span class="tw g" data-g="${esc(g)}">${esc(p)}</span>` : esc(p);
    }).join(" ");
  }

  // Antippen eines Wortes zeigt die Übersetzung
  document.addEventListener("click", (e) => {
    const w = e.target.closest(".tw.g");
    app.querySelectorAll(".tw.g.open").forEach((x) => { if (x !== w) x.classList.remove("open"); });
    if (w) {
      w.classList.toggle("open");
      e.stopPropagation();
    }
  });

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
  const LEVEL = { chooseT: 0, chooseD: 0, listen: 0, match: 0, numRead: 0, numPick: 0, gap: 1, buildT: 1, buildD: 1, buildListen: 1, review: 1, number: 1, numHear: 2, type: 2, typePinyin: 2, numWrite: 2, dictWord: 2, dictSentence: 2 };

  function buildExercises(lesson, c, lang, boost) {
    if (lesson.grammar) return grammarExercises(lesson, c, boost || 0);
    // boost: Wiederholung einer geschafften Lektion = höhere Stufe, schwerere Aufgaben
    const tier = Math.min((lesson.unit || 0) + (boost || 0), PLANS.length - 1);
    const zh = !!c.pinyin;
    const index = c.lessons.indexOf(lesson);
    const earlier = lesson.isReview ? lesson.pool : c.lessons.slice(0, Math.max(index, 0));
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
    if (zh) {
      // Chinesisch: keine Schriftzeichen tippen. Stattdessen auswählen, bauen oder Pinyin schreiben.
      const map = { type: tier >= 2 ? "typePinyin" : "chooseD", dictWord: "listen", dictSentence: "buildListen", numWrite: "numRead" };
      plan = plan.map((p) => map[p] || p);
    }

    // Reihenfolge: leicht → schwer, innerhalb der Stufe gemischt
    plan = shuffle(plan).sort((a, b) => LEVEL[a] - LEVEL[b]);

    const nextWord = cycler(lesson.words);
    const nextSentence = cycler(lesson.sentences);
    const nextOld = earlierWords.length ? cycler(earlierWords) : nextWord;
    // Ab Teil 2 kommen falsche Antworten auch aus früheren Lektionen (schwerer)
    const optionWords = tier === 0 ? lesson.words.concat(earlierWords.slice(-8)) : lesson.words.concat(earlierWords);
    const targetPool = optionWords.map((w) => w[0]);
    const germanPool = optionWords.map((w) => w[1]);
    const allTargetTokens = [].concat(...lesson.sentences.map((s) => tokens(s[0])), ...optionWords.map((w) => tokens(w[0])));
    const allGermanTokens = [].concat(...lesson.sentences.map((s) => tokens(s[1])), ...optionWords.map((w) => tokens(w[1])));
    const extraChips = 2 + tier; // mehr falsche Wörter beim Satzbau

    const make = {
      chooseT(w = nextWord()) {
        return { type: "choice", prompt: "Was bedeutet das?", show: w[0], showT: true, speakText: w[0], answer: w[1], word: w,
          options: shuffle([w[1]].concat(distractors(w[1], germanPool, 3))) };
      },
      chooseD(w = nextWord()) {
        return { type: "choice", prompt: "Wie sagt man das?", show: w[1], answer: w[0], optT: true, solT: true, speakAnswer: true, word: w,
          options: shuffle([w[0]].concat(distractors(w[0], targetPool, 3))) };
      },
      listen(w = nextWord()) {
        return { type: "listen", prompt: "Was hörst du?", speakText: w[0], answer: w[0], optT: true, solT: true, word: w,
          options: shuffle([w[0]].concat(distractors(w[0], targetPool, 3))) };
      },
      match() {
        return { type: "match", prompt: "Finde die Paare", pairs: uniquePairs(lesson.words, tier === 0 ? 4 : 5) };
      },
      type(w = nextWord()) {
        return { type: "type", prompt: "Schreib es auf " + c.name, show: w[1], answer: w[0], solT: true, accents: true, word: w };
      },
      typePinyin(w = nextWord()) {
        return { type: "type", prompt: "Schreib es in Pinyin", show: w[1], answer: w[2] || w[0], pinyin: true, word: w,
          solution: w[0] + " (" + (w[2] || "") + ")", inputHint: "Töne (ā á ǎ à) darfst du weglassen." };
      },
      buildT() {
        const s = nextSentence();
        return sentenceExercise("Übersetze diesen Satz", s[1], s[0], allTargetTokens, extraChips, { chipsT: true, solT: true, speakAnswer: true });
      },
      buildD() {
        const s = nextSentence();
        return sentenceExercise("Übersetze ins Deutsche", s[0], s[1], allGermanTokens, extraChips, { showT: true, gloss: true, speakText: s[0] });
      },
      buildListen() {
        const s = nextSentence();
        return sentenceExercise("Hör zu und bau den Satz", null, s[0], allTargetTokens, Math.max(2, extraChips - 1),
          { chipsT: true, solT: true, speakText: s[0], bigSpeaker: true, hint: s[1] });
      },
      gap() {
        return gapExercise(nextSentence(), allTargetTokens, lesson.words, zh) || make.chooseT();
      },
      dictWord(w = nextWord()) {
        return { type: "type", prompt: "Schreib, was du hörst", speakText: w[0], bigSpeaker: true, answer: w[0], solT: true, accents: true, word: w };
      },
      dictSentence() {
        const s = nextSentence();
        return { type: "type", prompt: "Schreib den Satz, den du hörst", speakText: s[0], bigSpeaker: true, answer: s[0], solT: true, hint: s[1], accents: true };
      },
      review() {
        const w = nextOld();
        const kinds = zh ? ["chooseT", "chooseD", "listen"].concat(tier >= 2 ? ["typePinyin"] : []) : ["chooseT", "chooseD", "listen", "type"];
        const e = make[pick(kinds, 1)[0]](w);
        e.review = true;
        return e;
      },
      number() {
        return make[pick(zh ? ["numRead", "numPick", "numHear"] : ["numRead", "numPick", "numHear", "numWrite"], 1)[0]]();
      },
      numRead() {
        const n = randomNumber(numRange);
        const words = window.numberToWords(n, lang);
        return { type: "choice", prompt: "Wie heißt diese Zahl?", show: String(n), answer: words, optT: true, solT: true, speakAnswer: true,
          options: shuffle([words].concat(nearNumbers(n, numRange).map((m) => window.numberToWords(m, lang)))) };
      },
      numPick() {
        const n = randomNumber(numRange);
        const words = window.numberToWords(n, lang);
        return { type: "choice", prompt: "Welche Zahl ist das?", show: words, showT: true, speakText: words, answer: String(n),
          options: shuffle([n].concat(nearNumbers(n, numRange)).map(String)) };
      },
      numHear() {
        const n = randomNumber(numRange);
        return { type: "type", prompt: "Welche Zahl hörst du? (in Ziffern)", speakText: String(n), bigSpeaker: true,
          answer: String(n), numeric: true, solution: n + " (" + solutionText(window.numberToWords(n, lang)) + ")" };
      },
      numWrite() {
        const n = randomNumber(numRange);
        return { type: "type", prompt: "Schreib die Zahl als Wort", show: String(n), answer: window.numberToWords(n, lang), solT: true, accents: true };
      },
    };

    const list = plan.map((p) => make[p]());
    // In der Wiederholung kommen auch Grammatik-Übungen dran
    if (lesson.isReview && lesson.drills && lesson.drills.length) {
      pick(lesson.drills, 2).forEach((d) => list.splice(randInt(Math.floor(list.length / 2), list.length), 0, drillExercise(d)));
    }
    return list;
  }

  // ---------- Grammatik ----------

  // Lücke im Satz mit dem richtigen Wort füllen
  function drillExercise(d) {
    const full = d.s.replace("___", d.a);
    return { type: "choice", prompt: "Setze das richtige Wort ein", show: d.s, showT: true, gloss: true, hint: d.de,
      answer: d.a, optT: true, options: shuffle([d.a].concat(d.wrong.slice(0, 3))), solution: full, solT: true, speakSolution: full, grammar: true };
  }

  function grammarExercises(lesson, c, boost) {
    const zh = !!c.pinyin;
    const ex = lesson.sentences;
    const germanTokens = [].concat(...ex.map((s) => tokens(s[1])));
    const targetTokens = [].concat(...ex.map((s) => tokens(s[0])));
    const nextEx = cycler(ex);
    const build = (kind) => {
      const s = nextEx();
      if (kind === "T") return sentenceExercise("Übersetze diesen Satz", s[1], s[0], targetTokens, 2 + boost, { chipsT: true, solT: true, speakAnswer: true });
      if (kind === "D") return sentenceExercise("Übersetze ins Deutsche", s[0], s[1], germanTokens, 2 + boost, { showT: true, gloss: true, speakText: s[0] });
      return sentenceExercise("Hör zu und bau den Satz", null, s[0], targetTokens, 2 + boost, { chipsT: true, solT: true, speakText: s[0], bigSpeaker: true, hint: s[1] });
    };
    // Erst ein paar Beispiele bauen, dann alle Lückensätze, auf höherer Stufe auch Hören und Schreiben
    const list = [build("D"), build("T")];
    const drills = shuffle(lesson.drills).map(drillExercise);
    list.push(...drills.slice(0, 4), build("T"), ...drills.slice(4));
    if (boost >= 1) list.push(build("L"));
    if (boost >= 2) {
      const s = nextEx();
      list.push(zh
        ? build("L")
        : { type: "type", prompt: "Schreib den Satz, den du hörst", speakText: s[0], bigSpeaker: true, answer: s[0], solT: true, hint: s[1], accents: true });
    }
    return list;
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

  function sentenceExercise(prompt, show, answer, pool, extraCount, extra) {
    const correct = tokens(answer);
    const extras = pick(Array.from(new Set(pool)).filter((w) => !correct.includes(w)), extraCount);
    return Object.assign({ type: "build", prompt, show, answer, correct, bank: shuffle(correct.concat(extras)) }, extra);
  }

  // Lückentext: ein Wort im Satz fehlt, man wählt das richtige aus
  function gapExercise(sentence, pool, words, zh) {
    const [target, german] = sentence;
    const pieces = target.split(" ");
    const lessonWords = new Set(words.map((w) => normalize(w[0])));
    const minLen = zh ? 1 : 2;
    const candidates = pieces
      .map((p, i) => ({ i, core: normalize(p) }))
      .filter((c) => c.core.length >= minLen && !c.core.includes("'") && !c.core.includes(" "));
    if (!candidates.length) return null;
    // Lieber ein Wort aus der Lektion, sonst das längste
    const inLesson = candidates.filter((c) => lessonWords.has(c.core));
    const chosen = inLesson.length ? pick(inLesson, 1)[0] : candidates.sort((a, b) => b.core.length - a.core.length)[0];
    const display = pieces.map((p, i) => (i === chosen.i ? p.replace(/[^.,!?¿¡;:？！，。]+/, "____") : p)).join(" ");
    const sentenceTokens = new Set(tokens(target));
    const ok = (t) => !sentenceTokens.has(t) && !t.includes("'") && t.length >= minLen;
    // Erst Wörter aus derselben Lektion (schwerer zu unterscheiden), dann andere
    let wrong = distractors(chosen.core, [...lessonWords].filter((t) => ok(t) && !t.includes(" ")), 3);
    if (wrong.length < 3) wrong = wrong.concat(distractors(chosen.core, pool.filter((t) => ok(t) && !wrong.includes(t)), 3 - wrong.length));
    const options = shuffle([chosen.core].concat(wrong));
    return { type: "choice", prompt: "Welches Wort fehlt?", show: display, showT: true, gloss: true, hint: german, answer: chosen.core,
      optT: true, options, solution: target, solT: true, speakSolution: target };
  }

  // ---------- Bildschirme ----------

  function headerHtml() {
    const c = state.lang ? course() : null;
    return `
      <header class="topbar">
        <button class="lang-switch" data-action="choose-lang" aria-label="Sprache wechseln">${c ? c.flag : "🌍"}</button>
        <div class="stats">
          <span class="stat${todayXp() >= state.goal ? " goal-done" : ""}" title="Tagesziel">🎯 ${Math.min(todayXp(), state.goal)}/${state.goal}</span>
          <span class="stat" title="Tage in Folge">🔥 ${currentStreak()}</span>
          <span class="stat" title="Erfahrungspunkte">⭐ ${state.xp}</span>
        </div>
        <button class="gear" data-action="settings" aria-label="Einstellungen">⚙️</button>
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

  // Einstieg wählen: ganz neu oder Einstufungstest
  function showLevelChoice() {
    const c = course();
    app.innerHTML = `
      <main class="screen center">
        <div class="logo">${c.flag}</div>
        <h1>Wie gut kannst du schon ${esc(c.name)}?</h1>
        <div class="lang-list">
          <button class="lang-card level" data-level="new">
            <span class="flag">🌱</span>
            <span><b>Ich bin ganz neu</b><small>Ich fange bei null an.</small></span>
          </button>
          <button class="lang-card level" data-level="test">
            <span class="flag">🎓</span>
            <span><b>Ich kann schon etwas</b><small>Kurzer Test, dann geht es an der passenden Stelle los.</small></span>
          </button>
        </div>
        <button class="link" data-action="back">Andere Sprache wählen</button>
      </main>`;
    app.querySelector("[data-level=new]").addEventListener("click", () => {
      state.placed[state.lang] = true;
      saveState();
      showHome();
    });
    app.querySelector("[data-level=test]").addEventListener("click", startPlacement);
    app.querySelector("[data-action=back]").addEventListener("click", showLanguageChoice);
  }

  function stars(n, total) {
    return "★".repeat(n) + "☆".repeat(total - n);
  }

  // Erste Lektion, die frei, aber noch nicht geschafft ist
  function nextLessonIndex(lessons) {
    return lessons.findIndex((l, idx) => !state.done[l.id] && (idx === 0 || state.done[lessons[idx - 1].id]));
  }

  function showHome() {
    if (!state.lang) return showLanguageChoice();
    const c = course();
    const lessons = c.lessons;
    const doneLessons = lessons.filter((l) => state.done[l.id]);
    const doneCount = doneLessons.length;
    if (!state.placed[state.lang] && doneCount === 0) return showLevelChoice();
    const weak = weakWords(c);
    const nextIdx = nextLessonIndex(lessons);
    const next = lessons[nextIdx];
    const mastered = lessons.filter((l) => mastery(l) >= 3).length;
    let i = 0;

    app.innerHTML = `
      ${headerHtml()}
      <main class="screen">
        <section class="course-head">
          <h1>${c.flag} ${c.name}</h1>
          <div class="course-progress">
            <div class="bar"><div class="fill" style="width:${(doneCount / lessons.length) * 100}%"></div></div>
            <span>${doneCount} von ${lessons.length} Lektionen</span>
          </div>
          ${next ? `
          <button class="continue-card" data-action="continue">
            <span class="icon">▶</span>
            <span><b>${doneCount ? "Weiterlernen" : "Loslegen"}</b><small>Teil ${next.unit + 1} · ${esc(next.title)}</small></span>
          </button>` : `
          <div class="continue-card all-done">
            <span class="icon">🏆</span>
            <span><b>Alle Lektionen geschafft!</b><small>${mastered} von ${lessons.length} gemeistert (★★★). Spiel Lektionen noch einmal für mehr Sterne.</small></span>
          </div>`}
          <div class="home-actions">
            ${doneCount >= 2 ? `
            <button class="review-card" data-action="review">
              <span class="icon">🔁</span>
              <span><b>Wiederholen</b><small>${weak.length
                ? `Übt vor allem ${weak.length} ${weak.length === 1 ? "Wort, das" : "Wörter, die"} dir noch schwerfallen`
                : "Gemischte Übungen aus allem, was du schon kannst"}</small></span>
            </button>` : ""}
            <button class="review-card" data-action="grammar">
              <span class="icon">📘</span>
              <span><b>Grammatik</b><small>Alle Regeln zum Nachlesen</small></span>
            </button>
          </div>
        </section>
        ${c.units.map((unit, u) => {
          const firstIdx = lessons.indexOf(unit.lessons[0]);
          const unitLocked = firstIdx > 0 && !state.done[lessons[firstIdx - 1].id] && !state.done[unit.lessons[0].id];
          return `
          <section class="unit unit-c${u % 5}">
            <div class="unit-head">
              <span class="unit-no">Teil ${u + 1}</span>
              <span class="unit-title">${esc(unit.title)}</span>
              <span class="unit-stars" title="Schwierigkeit">${stars(u + 1, c.units.length)}</span>
              ${unitLocked ? `<button class="jump" data-jump="${firstIdx}">Hierhin springen</button>` : ""}
            </div>
            <ol class="path">
              ${unit.lessons.map((l) => {
                const idx = i++;
                const done = !!state.done[l.id];
                const unlocked = idx === 0 || done || !!state.done[lessons[idx - 1].id];
                const cls = (done ? "done" : unlocked ? "open" : "locked") + (l.grammar ? " grammar" : "") + (mastery(l) >= 3 ? " mastered" : "");
                return `
                  <li class="node ${cls}" style="--offset:${[0, 1, 2, 1, 0, -1, -2, -1][idx % 8]}">
                    <button data-lesson="${idx}" aria-label="${esc(l.title)}${unlocked ? "" : " (gesperrt)"}">
                      <span class="icon">${unlocked ? l.icon : "🔒"}</span>
                    </button>
                    <span class="label">${esc(l.title)}</span>
                    ${done ? `<span class="mstars" title="Stufe">${stars(mastery(l), 3)}</span>` : ""}
                  </li>`;
              }).join("")}
            </ol>
          </section>`;
        }).join("")}
      </main>`;

    wireHeader();
    app.querySelectorAll("[data-lesson]").forEach((b) =>
      b.addEventListener("click", () => {
        const idx = Number(b.dataset.lesson);
        const l = lessons[idx];
        const unlocked = idx === 0 || state.done[l.id] || state.done[lessons[idx - 1].id];
        if (unlocked) startLesson(l);
        else showJumpSheet(idx);
      })
    );
    app.querySelectorAll("[data-jump]").forEach((b) => b.addEventListener("click", () => showJumpSheet(Number(b.dataset.jump))));
    const cont = app.querySelector("[data-action=continue]");
    if (cont) cont.addEventListener("click", () => startLesson(next));
    const rv = app.querySelector("[data-action=review]");
    if (rv) rv.addEventListener("click", () => startLesson(reviewLesson(c, doneLessons, weak)));
    app.querySelector("[data-action=grammar]").addEventListener("click", showGrammarOverview);

    // Zur aktuellen Lektion scrollen
    const current = app.querySelector(".node.open");
    if (current && doneCount > 2) current.scrollIntoView({ block: "center" });
  }

  function wireHeader() {
    app.querySelector("[data-action=choose-lang]").addEventListener("click", showLanguageChoice);
    app.querySelector("[data-action=settings]").addEventListener("click", showSettings);
  }

  // ---------- Später einsteigen: gesperrte Lektion antippen ----------

  function showJumpSheet(idx) {
    const c = course();
    const target = c.lessons[idx];
    const sheet = document.createElement("div");
    sheet.className = "sheet-bg";
    sheet.innerHTML = `
      <div class="sheet" role="dialog" aria-label="Lektion gesperrt">
        <div class="logo">🔒</div>
        <h2>${esc(target.title)}</h2>
        <p class="sub">Teil ${target.unit + 1}: ${esc(c.units[target.unit].title)}</p>
        <p>Du kannst schon etwas? Mach einen kurzen Test mit 10 Fragen zu allem davor. Mit 8 richtigen Antworten springst du direkt hierher.</p>
        <button class="btn primary" data-action="jump-test">🎓 Test machen</button>
        <button class="btn secondary" data-action="jump-open">Trotzdem öffnen</button>
        <button class="link" data-action="jump-cancel">Abbrechen</button>
      </div>`;
    app.appendChild(sheet);
    const close = () => sheet.remove();
    sheet.addEventListener("click", (e) => { if (e.target === sheet) close(); });
    sheet.querySelector("[data-action=jump-cancel]").addEventListener("click", close);
    sheet.querySelector("[data-action=jump-open]").addEventListener("click", () => { close(); startLesson(target); });
    sheet.querySelector("[data-action=jump-test]").addEventListener("click", () => { close(); startJumpTest(idx); });
    sheet.querySelector("[data-action=jump-test]").focus();
  }

  // 10 Fragen aus allem vor der Ziel-Lektion, mehr aus den letzten Lektionen davor
  function startJumpTest(idx) {
    const c = course();
    const before = c.lessons.slice(0, idx);
    const recent = before.slice(-12);
    const allWords = [].concat(...before.map((l) => l.words));
    const recentWords = [].concat(...recent.map((l) => l.words));
    const drills = [].concat(...before.map((l) => l.drills || []));
    const words = [];
    const seen = new Set();
    const take = (list, n) => { for (const w of shuffle(list)) { if (n <= 0) break; if (!seen.has(w[0])) { seen.add(w[0]); words.push(w); n--; } } };
    const nDrills = Math.min(drills.length ? 2 : 0, drills.length);
    take(recentWords, 6 - nDrills);
    take(allWords, 10 - nDrills - words.length);
    const queue = words.map((w, k) => (k % 2 === 0
      ? { type: "choice", prompt: "Was bedeutet das?", show: w[0], showT: true, speakText: w[0], answer: w[1],
          options: shuffle([w[1]].concat(distractors(w[1], allWords.map((x) => x[1]), 3))) }
      : { type: "choice", prompt: "Wie sagt man das?", show: w[1], answer: w[0], optT: true, solT: true,
          options: shuffle([w[0]].concat(distractors(w[0], allWords.map((x) => x[0]), 3))) }));
    pick(drills, nDrills).forEach((d) => queue.splice(randInt(0, queue.length), 0, drillExercise(d)));
    const session = { test: true, jump: true, target: idx, lesson: { id: "jump", title: "Einstiegstest" }, voice: c.voice,
      queue: shuffle(queue), total: queue.length, solved: 0, mistakes: 0, correct: 0 };
    showExercise(session);
  }

  function showJumpResult(session) {
    const c = course();
    const target = c.lessons[session.target];
    const need = Math.ceil(session.total * 0.8);
    const passed = session.correct >= need;
    if (passed) {
      c.lessons.slice(0, session.target).forEach((l) => { if (!state.done[l.id]) state.done[l.id] = 1; });
      state.placed[state.lang] = true;
      saveState();
    }
    app.innerHTML = `
      <main class="screen center result">
        <div class="logo">${passed ? "🎓" : "💪"}</div>
        <h1>${passed ? "Bestanden!" : "Noch nicht ganz"}</h1>
        <p class="sub">${session.correct} von ${session.total} richtig.</p>
        <p class="sub">${passed
          ? `Alles bis „${esc(target.title)}“ ist jetzt freigeschaltet. Du kannst die Lektionen davor jederzeit wiederholen.`
          : `Für den Sprung brauchst du ${need} richtige Antworten. Du kannst die Lektion trotzdem öffnen oder es später noch einmal versuchen.`}</p>
        ${passed
          ? `<button class="btn primary" data-action="go">Lektion starten</button>`
          : `<button class="btn primary" data-action="go">Trotzdem öffnen</button>`}
        <button class="link" data-action="home">Zur Übersicht</button>
      </main>`;
    app.querySelector("[data-action=go]").addEventListener("click", () => startLesson(target));
    app.querySelector("[data-action=home]").addEventListener("click", showHome);
  }

  // ---------- Grammatik-Übersicht ----------

  function showGrammarOverview() {
    const c = course();
    const list = c.lessons.filter((l) => l.grammar);
    app.innerHTML = `
      ${headerHtml()}
      <main class="screen">
        <button class="link back" data-action="home">← Zurück</button>
        <h1>📘 Grammatik ${c.flag}</h1>
        <p class="sub">Alle Regeln auf einen Blick. Jede Regel hat eine eigene Lektion am Ende ihres Teils.</p>
        ${list.map((l, k) => `
          <details class="grammar-card"${k === 0 ? " open" : ""}>
            <summary><span>${state.done[l.id] ? "✅" : "📘"}</span> <b>${esc(l.title.replace(/^Grammatik: /, ""))}</b> <small>Teil ${l.unit + 1}</small></summary>
            ${l.explain.map((p) => `<p>${esc(p)}</p>`).join("")}
            <ul class="examples">
              ${l.sentences.map((s, j) => `
                <li>
                  <button class="speaker" data-say="${k}-${j}" aria-label="Anhören">🔊</button>
                  <div><div class="ex-target">${renderTarget(s[0], true)}</div><div class="ex-german">${esc(s[1])}</div></div>
                </li>`).join("")}
            </ul>
          </details>`).join("")}
      </main>`;
    wireHeader();
    app.querySelector("[data-action=home]").addEventListener("click", showHome);
    app.querySelectorAll("[data-say]").forEach((b) =>
      b.addEventListener("click", () => {
        const [k, j] = b.dataset.say.split("-").map(Number);
        speak(list[k].sentences[j][0], c.voice);
      })
    );
    window.scrollTo(0, 0);
  }

  // ---------- Einstellungen ----------

  function exportCode() {
    return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
  }

  function importCode(code) {
    try {
      const data = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
      if (typeof data !== "object" || !data || typeof data.done !== "object") return false;
      state = Object.assign(defaultState(), data);
      saveState();
      return true;
    } catch (e) {
      return false;
    }
  }

  function showSettings(msg) {
    const c = state.lang ? course() : null;
    app.innerHTML = `
      ${headerHtml()}
      <main class="screen settings">
        <button class="link back" data-action="home">← Zurück</button>
        <h1>⚙️ Einstellungen</h1>
        ${typeof msg === "string" ? `<p class="notice">${esc(msg)}</p>` : ""}

        <section class="set-block">
          <h2>🎯 Tagesziel</h2>
          <p class="sub">Wie viele Punkte (XP) möchtest du pro Tag sammeln? Eine Lektion bringt etwa 10 bis 30 XP.</p>
          <div class="goal-list">
            ${[[20, "Locker"], [30, "Normal"], [50, "Ehrgeizig"], [80, "Intensiv"]].map(([g, name]) => `
              <button class="chip goal${state.goal === g ? " selected" : ""}" data-goal="${g}">${name}<small>${g} XP</small></button>`).join("")}
          </div>
        </section>

        ${c ? `
        <section class="set-block">
          <h2>🎓 Einstieg ${c.flag}</h2>
          <p class="sub">Du kannst schon mehr? Mach den Einstufungstest noch einmal. Geschaffte Lektionen bleiben geschafft.</p>
          <button class="btn secondary" data-action="placement">Einstufungstest machen</button>
        </section>` : ""}

        <section class="set-block">
          <h2>💾 Fortschritt mitnehmen</h2>
          <p class="sub">Dein Fortschritt ist nur auf diesem Gerät gespeichert. Mit diesem Code kannst du ihn auf ein anderes Gerät (z. B. vom Handy auf den Computer) übertragen.</p>
          <textarea class="code" readonly rows="3" aria-label="Dein Fortschritts-Code">${exportCode()}</textarea>
          <button class="btn secondary" data-action="copy">Code kopieren</button>
          <p class="sub" style="margin-top:14px">Auf dem neuen Gerät hier den Code einfügen:</p>
          <textarea class="code" data-role="import" rows="3" placeholder="Code hier einfügen …" aria-label="Code einfügen"></textarea>
          <button class="btn secondary" data-action="import">Fortschritt übernehmen</button>
        </section>
      </main>`;
    wireHeader();
    app.querySelector("[data-action=home]").addEventListener("click", showHome);
    app.querySelectorAll("[data-goal]").forEach((b) =>
      b.addEventListener("click", () => { state.goal = Number(b.dataset.goal); saveState(); showSettings("Tagesziel gespeichert."); })
    );
    const pl = app.querySelector("[data-action=placement]");
    if (pl) pl.addEventListener("click", startPlacement);
    app.querySelector("[data-action=copy]").addEventListener("click", (e) => {
      const ta = app.querySelector("textarea.code");
      ta.select();
      const done = () => { e.target.textContent = "Kopiert ✓"; };
      if (navigator.clipboard) navigator.clipboard.writeText(ta.value).then(done, () => { document.execCommand("copy"); done(); });
      else { document.execCommand("copy"); done(); }
    });
    app.querySelector("[data-action=import]").addEventListener("click", () => {
      const val = app.querySelector("[data-role=import]").value;
      if (!val.trim()) return;
      if (importCode(val)) showSettings("Fortschritt übernommen! 🎉");
      else showSettings("Der Code hat nicht funktioniert. Bitte genau so einfügen, wie er kopiert wurde.");
    });
    window.scrollTo(0, 0);
  }

  // Eine "Lektion" aus allem, was schon gelernt wurde. Schwierige Wörter kommen öfter dran.
  function reviewLesson(c, doneLessons, weak) {
    const recent = doneLessons.slice(-8);
    const ranges = doneLessons.filter((l) => l.numbers).map((l) => l.numbers);
    return {
      id: "review-" + state.lang,
      title: weak.length ? "Wiederholung (mit deinen Fehlerwörtern)" : "Wiederholung",
      icon: "🔁",
      isReview: true,
      unit: Math.max(...doneLessons.map((l) => l.unit || 0)),
      words: [].concat(weak, weak, ...recent.map((l) => l.words), ...pick(doneLessons, 4).map((l) => l.words)),
      sentences: [].concat(...doneLessons.map((l) => l.sentences)),
      numbers: ranges.length ? [0, Math.max(...ranges.map((r) => r[1]))] : null,
      pool: doneLessons,
      drills: [].concat(...doneLessons.map((l) => l.drills || [])),
    };
  }

  // ---------- Einstufungstest ----------

  function startPlacement() {
    const c = course();
    const units = c.units.slice(0, Math.min(4, c.units.length));
    const queue = [];
    units.forEach((unit, u) => {
      const words = [].concat(...unit.lessons.map((l) => l.words));
      pick(words, 4).forEach((w, k) => {
        const toGerman = k % 2 === 0;
        queue.push(toGerman
          ? { type: "choice", prompt: "Was bedeutet das?", show: w[0], showT: true, speakText: w[0], answer: w[1], unitIdx: u,
              options: shuffle([w[1]].concat(distractors(w[1], words.map((x) => x[1]), 3))) }
          : { type: "choice", prompt: "Wie sagt man das?", show: w[1], answer: w[0], optT: true, solT: true, unitIdx: u,
              options: shuffle([w[0]].concat(distractors(w[0], words.map((x) => x[0]), 3))) });
      });
    });
    const session = { test: true, placement: true, correct: 0, lesson: { id: "placement", title: "Einstufungstest" }, voice: c.voice, queue, total: queue.length,
      solved: 0, mistakes: 0, results: units.map(() => 0), units };
    showExercise(session);
  }

  function showPlacementResult(session) {
    const c = course();
    let passed = 0;
    while (passed < session.units.length && session.results[passed] >= 3) passed++;
    // Bestandene Teile als erledigt markieren
    c.units.slice(0, passed).forEach((unit) => unit.lessons.forEach((l) => { if (!state.done[l.id]) state.done[l.id] = 1; }));
    state.placed[state.lang] = true;
    saveState();
    const start = c.units[Math.min(passed, c.units.length - 1)];
    app.innerHTML = `
      <main class="screen center result">
        <div class="logo">${passed ? "🎓" : "🌱"}</div>
        <h1>${passed ? "Gut gemacht!" : "Kein Problem!"}</h1>
        <p class="sub">${passed
          ? `Du startest mit Teil ${Math.min(passed + 1, c.units.length)}: ${esc(start.title)}. Die Teile davor sind freigeschaltet und du kannst sie jederzeit wiederholen.`
          : "Am besten fängst du ganz vorne an. Neue Wörter werden dir vor jeder Lektion gezeigt."}</p>
        <button class="btn primary" data-action="home">Los geht's</button>
      </main>`;
    app.querySelector("[data-action=home]").addEventListener("click", showHome);
  }

  // ---------- Lektion ----------

  function startLesson(lesson) {
    const c = course();
    // Schon geschafft? Dann eine Stufe schwerer (bis Stufe 3)
    const boost = lesson.isReview ? 0 : Math.min(state.done[lesson.id] || 0, 2);
    const session = {
      lesson,
      boost,
      voice: c.voice,
      queue: buildExercises(lesson, c, state.lang, boost),
      total: 0,
      solved: 0,
      mistakes: 0,
      firstTime: !lesson.isReview && !state.done[lesson.id],
      seen: new Set(),
    };
    session.total = session.queue.length;
    if (session.firstTime) showIntro(session);
    else showExercise(session);
  }

  // Vor einer neuen Lektion: Tipp, dann jedes neue Wort als Lernkarte, dann Beispielsätze
  function showIntro(session) {
    const lesson = session.lesson;
    const steps = [];
    if (lesson.grammar) steps.push({ kind: "grammar" });
    else if (lesson.tip) steps.push({ kind: "tip" });
    lesson.words.forEach((w) => steps.push({ kind: "word", w }));
    if (lesson.sentences.length) steps.push({ kind: "sentences" });
    let i = 0;

    function render() {
      const step = steps[i];
      const wordNo = steps.slice(0, i + 1).filter((s) => s.kind === "word").length;
      let badge = "", body = "";
      if (step.kind === "grammar") {
        badge = `<span class="badge grammar">📘 Grammatik</span>`;
        body = `<h2 class="prompt">${esc(lesson.title.replace(/^Grammatik: /, ""))}</h2>
          <div class="grammar-text">${lesson.explain.map((p) => `<p>${esc(p)}</p>`).join("")}</div>`;
      } else if (step.kind === "tip") {
        badge = `<span class="badge tip">💡 Tipp</span>`;
        body = `<h2 class="prompt">${esc(lesson.title)}</h2><p class="tip-text">${esc(lesson.tip)}</p>`;
      } else if (step.kind === "word") {
        badge = `<span class="badge new">✨ Neues Wort ${wordNo} von ${lesson.words.length}</span>`;
        body = `
          <div class="flashcard">
            <button class="speaker big" data-action="speak" aria-label="Anhören">🔊</button>
            <div class="fc-target">${renderTarget(step.w[0])}</div>
            <div class="fc-german">${esc(step.w[1])}</div>
          </div>`;
      } else {
        badge = `<span class="badge new">📝 ${lesson.grammar ? "So sieht es aus" : "Beispielsätze"}</span>`;
        body = `
          <p class="hint">Tipp: Tippe auf ein Wort, um die Übersetzung zu sehen.</p>
          <ul class="examples">
            ${lesson.sentences.map((s, k) => `
              <li>
                <button class="speaker" data-say="${k}" aria-label="Anhören">🔊</button>
                <div><div class="ex-target">${renderTarget(s[0], true)}</div><div class="ex-german">${esc(s[1])}</div></div>
              </li>`).join("")}
          </ul>`;
      }
      const last = i === steps.length - 1;
      app.innerHTML = `
        <main class="screen lesson">
          <div class="lesson-top">
            <button class="close" data-action="quit" aria-label="Lektion beenden">✕</button>
            <div class="bar intro"><div class="fill" style="width:${((i + 1) / steps.length) * 100}%"></div></div>
            <button class="skip" data-action="skip">Überspringen</button>
          </div>
          ${badge}
          <div class="exercise intro-body">${body}</div>
          <footer class="check-area">
            <button class="btn primary" data-action="next">${last ? "Los geht's!" : "Weiter"}</button>
          </footer>
        </main>`;
      app.querySelector("[data-action=quit]").addEventListener("click", () => { if (confirmQuit()) showHome(); });
      app.querySelector("[data-action=skip]").addEventListener("click", () => showExercise(session));
      app.querySelector("[data-action=next]").addEventListener("click", () => {
        if (last) return showExercise(session);
        i++;
        render();
      });
      const sp = app.querySelector("[data-action=speak]");
      if (sp && step.w) {
        sp.addEventListener("click", () => speak(step.w[0], session.voice));
        speak(step.w[0], session.voice);
      }
      app.querySelectorAll("[data-say]").forEach((b) =>
        b.addEventListener("click", () => speak(lesson.sentences[Number(b.dataset.say)][0], session.voice))
      );
      app.querySelector("[data-action=next]").focus();
    }
    render();
  }

  function showExercise(session) {
    const ex = session.queue[0];
    if (!ex) return session.placement ? showPlacementResult(session) : session.jump ? showJumpResult(session) : showResult(session);
    window.__exercise = ex; // für automatische Tests

    let badge = "";
    if (session.test) badge = `<span class="badge tip">🎓 ${session.jump ? "Einstiegstest" : "Einstufungstest"} · Frage ${session.solved + 1} von ${session.total}</span>`;
    else if (ex.grammar) badge = `<span class="badge grammar">📘 Grammatik</span>`;
    else if (ex.review) badge = `<span class="badge">🔁 Wiederholung</span>`;
    else if (session.firstTime && ex.word && !session.seen.has(ex.word[0])) {
      session.seen.add(ex.word[0]);
      badge = `<span class="badge new">✨ NEU</span>`;
    }
    const tip = session.lesson.tip;
    const tipHtml = session.lesson.grammar ? session.lesson.explain.map((p) => `<p>${esc(p)}</p>`).join("") : esc(tip);
    const level = session.boost ? `<span class="level-tag" title="Stufe">Stufe ${session.boost + 1}</span>` : "";

    const pct = (session.solved / session.total) * 100;
    app.innerHTML = `
      <main class="screen lesson">
        <div class="lesson-top">
          <button class="close" data-action="quit" aria-label="Lektion beenden">✕</button>
          <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
          ${level}
          ${tip ? `<button class="tip-btn" data-action="tip" aria-label="Tipp anzeigen">💡</button>` : ""}
        </div>
        ${tip ? `<div class="tip-box" hidden>${tipHtml}</div>` : ""}
        ${badge}
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
    const tb = app.querySelector("[data-action=tip]");
    if (tb) tb.addEventListener("click", () => { const box = app.querySelector(".tip-box"); box.hidden = !box.hidden; });

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
      if (ex.pinyin) {
        const flat = (t) => loose(t).replace(/[\s']/g, "").replace(/v/g, "u");
        if (a.replace(/\s/g, "") === b.replace(/\s/g, "")) return { ok: true };
        if (flat(a) === flat(b)) return { ok: true, note: "Richtig! Mit Tönen: " + ex.answer };
        return { ok: false };
      }
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
    if (!session.test) trackWord(ex.word, result.ok);
    const solution = ex.solution || ex.answer;
    const solHtml = esc(ex.solT ? solutionText(solution) : solution);

    if (session.test) {
      // Im Test wird nichts wiederholt, jede Frage zählt einmal
      if (result.ok) {
        session.correct++;
        if (session.placement) session.results[ex.unitIdx]++;
      }
      footer.classList.add(result.ok ? "good" : "bad");
      fb.innerHTML = result.ok ? "<strong>Richtig!</strong>" : `<strong>Nicht ganz.</strong><p>Richtig wäre: <b>${solHtml}</b></p>`;
      session.queue.shift();
      session.solved++;
    } else if (result.ok) {
      footer.classList.add("good");
      fb.innerHTML = `<strong>${pick(["Richtig! 🎉", "Super! 💪", "Genau! ✨", "Klasse! 🌟"], 1)[0]}</strong>${result.note ? `<p>${esc(result.note)}</p>` : ""}`;
      session.queue.shift();
      session.solved++;
    } else {
      footer.classList.add("bad");
      fb.innerHTML = `<strong>Nicht ganz.</strong><p>Richtige Lösung: <b>${solHtml}</b></p><p class="small">Keine Sorge, die Aufgabe kommt gleich noch einmal.</p>`;
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
    const shown = ex.showT ? renderTarget(ex.show, ex.gloss) : esc(ex.show);
    return `<div class="card-word">${speakerButton(ex, false)}<span class="card-text">${shown}</span></div>${ex.hint ? `<p class="hint">${esc(ex.hint)}</p>` : ""}`;
  }

  function topHtml(ex) {
    if (ex.bigSpeaker || ex.type === "listen") return speakerButton(ex, true) + (ex.hint ? `<p class="hint center">${esc(ex.hint)}</p>` : "");
    return cardHtml(ex);
  }

  // Auswahl (auch fürs Hören)
  function renderChoice(ex, area, checkBtn, session) {
    let selected = null;
    area.innerHTML = `${topHtml(ex)}
      <div class="options">
        ${ex.options.map((o, i) => `<button class="option" data-i="${i}"><span class="key">${i + 1}</span><span>${ex.optT ? renderTarget(o) : esc(o)}</span></button>`).join("")}
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
    const chip = (w) => (ex.chipsT ? renderTarget(w) : esc(w));
    area.innerHTML = `${topHtml(ex)}
      <div class="answer-line" aria-label="Deine Antwort"></div>
      <div class="bank">${ex.bank.map((w, i) => `<button class="chip" data-i="${i}">${chip(w)}</button>`).join("")}</div>`;

    const line = area.querySelector(".answer-line");
    wireSpeaker(ex, area, session);

    function redraw() {
      line.innerHTML = chosen.map((i, pos) => `<button class="chip" data-pos="${pos}">${chip(ex.bank[i])}</button>`).join("");
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
        if (ex.chipsT && isZh()) speak(ex.bank[i], session.voice);
        redraw();
      })
    );
    return () => chosen.map((i) => ex.bank[i]);
  }

  // Antwort eintippen (auch Diktat, Zahlen und Pinyin)
  function renderType(ex, area, checkBtn, session) {
    const placeholder = ex.numeric ? "z. B. 42" : ex.pinyin ? "z. B. ni hao" : "Deine Antwort …";
    area.innerHTML = `${topHtml(ex)}
      <input class="text-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false"
        ${ex.numeric ? 'inputmode="numeric"' : ""} placeholder="${placeholder}">
      ${ex.inputHint ? `<p class="hint">${esc(ex.inputHint)}</p>` : ""}
      ${ex.accents && !ex.numeric && !isZh() ? `<div class="accent-keys">${accentKeys().map((k) => `<button class="chip small" data-k="${k}">${k}</button>`).join("")}</div>` : ""}`;
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
        <div class="col">${left.map((w) => `<button class="option" data-side="l" data-w="${esc(w)}">${renderTarget(w)}</button>`).join("")}</div>
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
    const goalBefore = todayXp() >= state.goal;
    const xp = finishLesson(session.lesson, session.mistakes, session.boost);
    const goalNow = !goalBefore && todayXp() >= state.goal;
    const perfect = session.mistakes === 0;
    const accuracy = Math.round((session.total / (session.total + session.mistakes)) * 100);
    const lesson = session.lesson;
    const m = lesson.isReview ? 0 : mastery(lesson);
    const levelText = ["", "Stufe 1 geschafft! Spiel sie noch einmal für Stufe 2 (schwerer).",
      "Stufe 2 geschafft! Noch einmal, dann ist die Lektion gemeistert.", "Lektion gemeistert! 👑"][m];
    app.innerHTML = `
      <main class="screen center result">
        <div class="logo">${goalNow ? "🎯" : perfect ? "🏆" : "🎉"}</div>
        <h1>${lesson.isReview ? "Wiederholung geschafft!" : "Lektion geschafft!"}</h1>
        <p class="sub">${esc(lesson.title)}</p>
        ${m ? `<div class="big-stars" aria-label="${m} von 3 Sternen">${stars(m, 3)}</div><p class="sub">${levelText}</p>` : ""}
        <div class="result-stats">
          <div class="pill"><span>⭐</span><b>+${xp} XP</b>${perfect ? "<small>Ohne Fehler: +5 Bonus</small>" : ""}</div>
          <div class="pill"><span>🎯</span><b>${accuracy} %</b><small>richtig</small></div>
          <div class="pill"><span>🔥</span><b>${currentStreak()} ${currentStreak() === 1 ? "Tag" : "Tage"}</b><small>in Folge</small></div>
        </div>
        <div class="goal-line">
          <div class="bar"><div class="fill" style="width:${Math.min(100, (todayXp() / state.goal) * 100)}%"></div></div>
          <span>${goalNow ? "Tagesziel erreicht! 🎉" : todayXp() >= state.goal ? "Tagesziel schon erreicht ✓" : `Tagesziel: ${todayXp()} von ${state.goal} XP`}</span>
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
      const btn = app.querySelector("[data-action=check], [data-action=next]");
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
