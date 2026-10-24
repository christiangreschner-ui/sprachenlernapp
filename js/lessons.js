// Lerninhalte. Jede Lektion hat Vokabeln (words) und Sätze (sentences).
// Format: [Fremdsprache, Deutsch]. Die Übungen werden daraus automatisch erzeugt.
// Neue Lektionen kann man einfach unten anhängen.

window.COURSES = {
  es: {
    name: "Spanisch",
    flag: "🇪🇸",
    voice: "es-ES",
    lessons: [
      {
        id: "es-1", title: "Begrüßung", icon: "👋",
        words: [["hola", "hallo"], ["adiós", "tschüss"], ["gracias", "danke"], ["por favor", "bitte"], ["sí", "ja"], ["no", "nein"]],
        sentences: [["Hola, buenos días", "Hallo, guten Morgen"], ["Muchas gracias", "Vielen Dank"], ["Adiós, hasta mañana", "Tschüss, bis morgen"]],
      },
      {
        id: "es-2", title: "Sich vorstellen", icon: "🙋",
        words: [["yo", "ich"], ["tú", "du"], ["nombre", "Name"], ["soy", "ich bin"], ["eres", "du bist"], ["alemán", "Deutscher"]],
        sentences: [["Me llamo Ana", "Ich heiße Ana"], ["Yo soy de Alemania", "Ich bin aus Deutschland"], ["¿Cómo te llamas?", "Wie heißt du?"]],
      },
      {
        id: "es-3", title: "Zahlen", icon: "🔢",
        words: [["uno", "eins"], ["dos", "zwei"], ["tres", "drei"], ["cuatro", "vier"], ["cinco", "fünf"], ["diez", "zehn"]],
        sentences: [["Tengo dos hermanos", "Ich habe zwei Geschwister"], ["Son las tres", "Es ist drei Uhr"], ["Quiero cinco manzanas", "Ich möchte fünf Äpfel"]],
      },
      {
        id: "es-4", title: "Essen & Trinken", icon: "🥘",
        words: [["agua", "Wasser"], ["pan", "Brot"], ["café", "Kaffee"], ["vino", "Wein"], ["queso", "Käse"], ["manzana", "Apfel"]],
        sentences: [["Un café, por favor", "Einen Kaffee, bitte"], ["Quiero agua", "Ich möchte Wasser"], ["El pan es bueno", "Das Brot ist gut"]],
      },
      {
        id: "es-5", title: "Familie", icon: "👨‍👩‍👧",
        words: [["madre", "Mutter"], ["padre", "Vater"], ["hermano", "Bruder"], ["hermana", "Schwester"], ["hijo", "Sohn"], ["hija", "Tochter"]],
        sentences: [["Mi madre es simpática", "Meine Mutter ist nett"], ["Tengo una hermana", "Ich habe eine Schwester"], ["Mi padre trabaja mucho", "Mein Vater arbeitet viel"]],
      },
      {
        id: "es-6", title: "Unterwegs", icon: "🚆",
        words: [["calle", "Straße"], ["tren", "Zug"], ["hotel", "Hotel"], ["playa", "Strand"], ["izquierda", "links"], ["derecha", "rechts"]],
        sentences: [["¿Dónde está el hotel?", "Wo ist das Hotel?"], ["El tren llega hoy", "Der Zug kommt heute an"], ["La playa está cerca", "Der Strand ist in der Nähe"]],
      },
    ],
  },
  fr: {
    name: "Französisch",
    flag: "🇫🇷",
    voice: "fr-FR",
    lessons: [
      {
        id: "fr-1", title: "Begrüßung", icon: "👋",
        words: [["bonjour", "guten Tag"], ["salut", "hallo"], ["au revoir", "auf Wiedersehen"], ["merci", "danke"], ["oui", "ja"], ["non", "nein"]],
        sentences: [["Bonjour, ça va ?", "Guten Tag, wie geht's?"], ["Merci beaucoup", "Vielen Dank"], ["Au revoir et à demain", "Auf Wiedersehen und bis morgen"]],
      },
      {
        id: "fr-2", title: "Sich vorstellen", icon: "🙋",
        words: [["je", "ich"], ["tu", "du"], ["nom", "Name"], ["je suis", "ich bin"], ["tu es", "du bist"], ["allemand", "Deutscher"]],
        sentences: [["Je m'appelle Paul", "Ich heiße Paul"], ["Je suis allemand", "Ich bin Deutscher"], ["Comment tu t'appelles ?", "Wie heißt du?"]],
      },
      {
        id: "fr-3", title: "Zahlen", icon: "🔢",
        words: [["un", "eins"], ["deux", "zwei"], ["trois", "drei"], ["quatre", "vier"], ["cinq", "fünf"], ["dix", "zehn"]],
        sentences: [["J'ai deux frères", "Ich habe zwei Brüder"], ["Il est trois heures", "Es ist drei Uhr"], ["Je veux cinq pommes", "Ich möchte fünf Äpfel"]],
      },
      {
        id: "fr-4", title: "Essen & Trinken", icon: "🥐",
        words: [["eau", "Wasser"], ["pain", "Brot"], ["café", "Kaffee"], ["vin", "Wein"], ["fromage", "Käse"], ["pomme", "Apfel"]],
        sentences: [["Un café, s'il vous plaît", "Einen Kaffee, bitte"], ["Je veux de l'eau", "Ich möchte Wasser"], ["Le pain est bon", "Das Brot ist gut"]],
      },
      {
        id: "fr-5", title: "Familie", icon: "👨‍👩‍👧",
        words: [["mère", "Mutter"], ["père", "Vater"], ["frère", "Bruder"], ["sœur", "Schwester"], ["fils", "Sohn"], ["fille", "Tochter"]],
        sentences: [["Ma mère est gentille", "Meine Mutter ist nett"], ["J'ai une sœur", "Ich habe eine Schwester"], ["Mon père travaille beaucoup", "Mein Vater arbeitet viel"]],
      },
      {
        id: "fr-6", title: "Unterwegs", icon: "🚆",
        words: [["rue", "Straße"], ["train", "Zug"], ["hôtel", "Hotel"], ["plage", "Strand"], ["gauche", "links"], ["droite", "rechts"]],
        sentences: [["Où est l'hôtel ?", "Wo ist das Hotel?"], ["Le train arrive aujourd'hui", "Der Zug kommt heute an"], ["La plage est près d'ici", "Der Strand ist in der Nähe"]],
      },
    ],
  },
};
