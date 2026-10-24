# Sprachenlernapp 🦜

Eine kleine Sprachlern-App im Stil von Duolingo/Babbel – mit **Spanisch**, **Französisch** und **Chinesisch**.
Sie läuft im Browser am Computer und lässt sich auf dem Handy wie eine App installieren.

## Was die App kann

- Drei Sprachen: Spanisch 🇪🇸, Französisch 🇫🇷 und Chinesisch 🇨🇳 (Schriftzeichen mit Pinyin)
- Beim ersten Start pro Sprache: „Ich bin ganz neu“ oder ein kurzer Einstufungstest, der bekannte Teile überspringt
- Spanisch und Französisch: 30 Lektionen in 5 Teilen, rund 240 Vokabeln und 120 Sätze pro Sprache
- Chinesisch: 24 Lektionen in 4 Teilen für komplette Anfänger, mit Pinyin unter jedem Zeichen
- Vor jeder neuen Lektion: ein kurzer Tipp, Lernkarten für jedes neue Wort und Beispielsätze mit Aussprache
- In Sätzen kann man auf ein Wort tippen und sieht die Übersetzung
- Die Schwierigkeit steigt von Teil zu Teil: mehr Aufgaben (10 bis 18), mehr Schreiben, schwerere Auswahl
- Übungsarten: Wort auswählen, Hören, Paare finden, Satz bauen, Lückentext, Wort eintippen, Diktat,
  Zahlen hören, lesen und schreiben, Pinyin schreiben (Chinesisch), Wiederholung alter Vokabeln
- „Wiederholen“-Knopf: gemischte Übungen, Wörter mit vielen Fehlern kommen öfter dran
- Falsche Antworten kommen am Ende der Lektion noch einmal dran
- Punkte (XP), Tage in Folge (🔥), Trefferquote und Fortschritt werden auf dem Gerät gespeichert
- Funktioniert nach dem ersten Öffnen auch offline

## Ausprobieren

**Online (empfohlen):** Im GitHub-Repository unter *Settings → Pages* bei „Branch“ `main` und `/ (root)` auswählen und speichern.
Nach ein bis zwei Minuten ist die App unter `https://christiangreschner-ui.github.io/sprachenlernapp/` erreichbar.

**Aufs Handy holen:** Die Adresse oben im Handy-Browser öffnen, dann
- iPhone (Safari): Teilen-Symbol → „Zum Home-Bildschirm“
- Android (Chrome): Menü ⋮ → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“

**Am eigenen Computer:** Im Projektordner `python3 -m http.server 8000` starten und `http://localhost:8000` öffnen.

## Inhalte erweitern

Alle Vokabeln und Sätze stehen in [`js/lessons.js`](js/lessons.js) und [`js/lessons-zh.js`](js/lessons-zh.js), in einer einfachen Schreibweise
(`hola = hallo; adiós = tschüss`, bei Chinesisch `你好 = nǐ hǎo = hallo`). Tipps stehen in [`js/tips.js`](js/tips.js). Eine neue Lektion ist nur ein weiterer Eintrag mit Wörtern und Sätzen –
die Übungen werden automatisch daraus erzeugt. Eine neue Sprache ist ein weiterer Block neben `es` und `fr`.

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `index.html` | Die Seite |
| `css/style.css` | Aussehen (hell und dunkel) |
| `js/lessons.js` | Lerninhalte Spanisch und Französisch |
| `js/lessons-zh.js` | Lerninhalte Chinesisch |
| `js/tips.js` | Tipps pro Lektion und Wörterbuch fürs Antippen |
| `js/course-setup.js` | Bereitet die Kurse beim Start vor |
| `js/numbers.js` | Zahlen als Wörter (für das Zahlen-Training) |
| `js/app.js` | Ablauf, Übungen, Fortschritt |
| `sw.js`, `manifest.webmanifest`, `icons/` | Installation aufs Handy und Offline-Nutzung |

Keine Installation, kein Build-Schritt nötig: reines HTML, CSS und JavaScript.
