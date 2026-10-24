# Sprachenlernapp 🦜

Eine kleine Sprachlern-App im Stil von Duolingo/Babbel – zum Start mit **Spanisch** und **Französisch**.
Sie läuft im Browser am Computer und lässt sich auf dem Handy wie eine App installieren.

## Was die App kann

- Sprache wählen (Spanisch 🇪🇸 oder Französisch 🇫🇷), jederzeit über die Flagge oben links wechseln
- 30 Lektionen pro Sprache in 5 Teilen: Grundlagen, Alltag, Stadt & Freizeit, Leben, Fortgeschritten
- Rund 240 Vokabeln und 120 Sätze pro Sprache, dazu Zahlen-Training bis 9999
- Die Schwierigkeit steigt von Teil zu Teil: mehr Aufgaben (10 bis 18), mehr Schreiben, schwerere Auswahl
- Übungsarten: Wort auswählen, Hören, Paare finden, Satz bauen (in beide Richtungen), Lückentext,
  Wort eintippen, Diktat (Wort oder ganzer Satz), Zahlen hören, lesen und schreiben, Wiederholung alter Vokabeln
- „Wiederholen“-Knopf: gemischte Übungen aus allem, was man schon gelernt hat
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

Alle Vokabeln und Sätze stehen in [`js/lessons.js`](js/lessons.js), in einer einfachen Schreibweise
(`hola = hallo; adiós = tschüss`). Eine neue Lektion ist nur ein weiterer Eintrag mit Wörtern und Sätzen –
die Übungen werden automatisch daraus erzeugt. Eine neue Sprache ist ein weiterer Block neben `es` und `fr`.

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `index.html` | Die Seite |
| `css/style.css` | Aussehen (hell und dunkel) |
| `js/lessons.js` | Lerninhalte |
| `js/numbers.js` | Zahlen als Wörter (für das Zahlen-Training) |
| `js/app.js` | Ablauf, Übungen, Fortschritt |
| `sw.js`, `manifest.webmanifest`, `icons/` | Installation aufs Handy und Offline-Nutzung |

Keine Installation, kein Build-Schritt nötig: reines HTML, CSS und JavaScript.
