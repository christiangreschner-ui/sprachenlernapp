// Zahlen als Wörter (0 bis 9999) auf Spanisch und Französisch.
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

  window.numberToWords = function (n, lang) {
    return lang === "fr" ? fr(n) : es(n);
  };
})();
