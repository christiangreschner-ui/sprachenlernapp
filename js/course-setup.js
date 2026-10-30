// Bereitet die Kurse vor: alle Lektionen als Liste, Tipps anhängen,
// Wörterbuch fürs Antippen und Pinyin-Tabelle für Chinesisch.

(function () {
  function key(text) {
    return String(text).toLowerCase().replace(/[.,!?¿¡;:"«»？！，。、]/g, " ").replace(/[’`´]/g, "'").replace(/\s+/g, " ").trim();
  }

  Object.entries(window.COURSES).forEach(([code, course]) => {
    course.code = code;
    course.lessons = [];
    // Grammatik-Lektionen ans Ende ihres Teils hängen
    ((window.GRAMMAR || {})[code] || []).forEach((g) => {
      const unit = course.units[Math.min(g.unit, course.units.length - 1)];
      if (!unit.lessons.includes(g)) unit.lessons.push(g);
    });
    course.units.forEach((unit, u) =>
      unit.lessons.forEach((l) => {
        l.unit = u;
        l.tip = l.grammar ? l.explain.join(" ") : (window.TIPS || {})[l.id] || "";
        course.lessons.push(l);
      })
    );

    // Pinyin: ganzes Wort/Satz und jedes einzelne Wort im Satz
    course.py = {};
    if (course.pinyin) {
      course.lessons.forEach((l) => {
        l.words.forEach((w) => { if (w[2]) course.py[w[0]] = w[2]; });
        l.sentences.forEach((s) => {
          if (!s[2]) return;
          course.py[s[0]] = s[2];
          const ts = s[0].split(" "), ps = s[2].split(" ");
          if (ts.length === ps.length) ts.forEach((t, i) => { if (!course.py[t]) course.py[t] = ps[i]; });
        });
        (l.drills || []).forEach((d) => {
          if (!d.py) return;
          const full = d.s.replace("___", d.a);
          course.py[full] = d.py;
          const ts = full.split(" "), ps = d.py.split(" ");
          if (ts.length === ps.length) ts.forEach((t, i) => { if (!course.py[t]) course.py[t] = ps[i]; });
        });
        String(l.extraPy || "").split(";").forEach((e) => {
          const i = e.indexOf("=");
          if (i > 0) course.py[e.slice(0, i).trim()] = e.slice(i + 1).trim();
        });
      });
    }

    // Wörterbuch fürs Antippen: Vokabeln + kleines Extra-Wörterbuch
    course.dict = {};
    course.lessons.forEach((l) => l.words.forEach((w) => { course.dict[key(w[0])] = w[1]; }));
    String((window.GLOSSARY || {})[code] || "").split(";").forEach((entry) => {
      const i = entry.indexOf("=");
      if (i > 0) course.dict[key(entry.slice(0, i))] = entry.slice(i + 1).trim();
    });
  });
})();
