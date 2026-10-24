// Zahlen als Wörter (0 bis 9999) auf Spanisch, Französisch und Chinesisch.
// Wird für das Zahlen-Training benutzt, damit es unendlich viele Zahlen-Aufgaben gibt.

(function () {
  const ES_UNITS = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez",
    "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte",
    "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
  const ES_TENS = { 3: "treinta", 4: "cuarenta", 5: "cincuenta", 6: "sesenta", 7: "setenta", 8: "ochenta", 9: "noventa" };
  const ES_HUNDREDS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

  function es(n) {
    if (n < 30) return ES_UNITS[n];
    if (n < 100) {
      const t = Math.floor(n / 10), u = n % 10;
      return ES_TENS[t] + (u ? " y " + ES_UNITS[u] : "");
    }
    if (n < 1000) {
      if (n === 100) return "cien";
      const h = Math.floor(n / 100), r = n % 100;
      return ES_HUNDREDS[h] + (r ? " " + es(r) : "");
    }
    const th = Math.floor(n / 1000), r = n % 1000;
    return (th === 1 ? "mil" : es(th) + " mil") + (r ? " " + es(r) : "");
  }

  const FR_UNITS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
    "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const FR_TENS = { 2: "vingt", 3: "trente", 4: "quarante", 5: "cinquante", 6: "soixante" };

  function fr(n) {
    if (n < 20) return FR_UNITS[n];
    if (n < 70) {
      const t = Math.floor(n / 10), u = n % 10;
      if (u === 0) return FR_TENS[t];
      if (u === 1) return FR_TENS[t] + " et un";
      return FR_TENS[t] + "-" + FR_UNITS[u];
    }
    if (n < 80) return n === 71 ? "soixante et onze" : "soixante-" + FR_UNITS[n - 60];
    if (n < 100) {
      if (n === 80) return "quatre-vingts";
      return "quatre-vingt-" + FR_UNITS[n - 80];
    }
    if (n < 1000) {
      const h = Math.floor(n / 100), r = n % 100;
      const head = h === 1 ? "cent" : FR_UNITS[h] + (r ? " cent" : " cents");
      return head + (r ? " " + fr(r) : "");
    }
    const th = Math.floor(n / 1000), r = n % 1000;
    let head = th === 1 ? "mille" : fr(th) + " mille";
    head = head.replace(/cents mille$/, "cent mille").replace(/quatre-vingts mille$/, "quatre-vingt mille");
    return head + (r ? " " + fr(r) : "");
  }

  const ZH = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const ZH_PY = { 零: "líng", 一: "yī", 二: "èr", 两: "liǎng", 三: "sān", 四: "sì", 五: "wǔ", 六: "liù", 七: "qī", 八: "bā", 九: "jiǔ", 十: "shí", 百: "bǎi", 千: "qiān" };

  // 10–19 am Satzanfang: 十一; mitten in der Zahl: 一十一 (z. B. 一百一十一)
  function zhTens(n, inside) {
    if (n < 10) return ZH[n];
    const t = Math.floor(n / 10), u = n % 10;
    const head = t === 1 && !inside ? "十" : ZH[t] + "十";
    return head + (u ? ZH[u] : "");
  }

  function zh(n) {
    if (n < 100) return zhTens(n, false);
    if (n < 1000) {
      const h = Math.floor(n / 100), r = n % 100;
      const head = (h === 2 ? "两" : ZH[h]) + "百";
      if (!r) return head;
      return head + (r < 10 ? "零" + ZH[r] : zhTens(r, true));
    }
    const th = Math.floor(n / 1000), r = n % 1000;
    const head = (th === 2 ? "两" : ZH[th]) + "千";
    if (!r) return head;
    if (r < 100) return head + "零" + (r < 10 ? ZH[r] : zhTens(r, true));
    const h = Math.floor(r / 100), rr = r % 100;
    return head + ZH[h] + "百" + (!rr ? "" : rr < 10 ? "零" + ZH[rr] : zhTens(rr, true));
  }

  window.numberToWords = function (n, lang) {
    if (lang === "zh") return zh(n);
    return lang === "fr" ? fr(n) : es(n);
  };

  // Pinyin für chinesische Zahlwörter (z. B. 三十五 → sānshíwǔ)
  window.numberPinyin = function (text) {
    if (!/^[零一二两三四五六七八九十百千]+$/.test(text)) return "";
    return text.split("").map((c) => ZH_PY[c]).join("");
  };
})();
