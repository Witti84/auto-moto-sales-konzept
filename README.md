# Auto Moto Sales – Designentwurf

Moderne, viersprachige Website für AS Auto Moto Sales GmbH. Türkisgrün, Creme und dunkles Petrol. BMW-M4-Intro mit LED-Lichtsequenz und Kontrollschild BE 149 inklusive Schweizer- und Berner Wappen.

## Sofort ansehen

`VORSCHAU.html` nach dem Entpacken per Doppelklick in Chrome/Edge öffnen. Die Datei enthält alle vier Sprachversionen, Navigation, Demoformulare und die BMW-Lichtsequenz, ohne Installation und ohne Internet. Der ZIP-Download muss zuerst entpackt werden.

## Start und Build

Node.js 22 oder neuer. Keine Laufzeit-Abhängigkeiten.

```sh
npm run build
npm run check
```

Das Verzeichnis `dist` enthält 40 vorgerenderte Sprachseiten und die deutsche Root-Seite. Lokale Ansicht über einen beliebigen statischen Webserver; die Dateien verwenden absolute URLs.

## GitHub → Vercel

1. Neues privates Repository, z. B. `auto-moto-sales-konzept`, anlegen.
2. Projektdateien inklusive `src/`, `api/`, `scripts/`, `build.mjs`, `package.json`, `package-lock.json` und `vercel.json` hochladen.
3. Repository in Vercel importieren. Framework: Other. Build: `npm run build`. Output: `dist`. Node.js 22/24.
4. `SITE_URL` auf die tatsächlich zugewiesene Vercel-URL setzen und erneut deployen. `INDEXABLE=false`, `FORMS_LIVE=false` für die Kundenvorschau beibehalten.
5. Weitere Commits auf `main` lösen durch die Git-Integration neue Deployments aus.

## Seiten und Sprachen

DE, FR, IT, EN. Pro Sprache: Startseite, Direktverkauf, Inserate, Auto-Ankauf, Motorrad-Ankauf, Auto-Inserat, Motorrad-Inserat, Kontakt, FAQ, Rechtliches. Sprachwechsel führt zur entsprechenden Unterseite.

## Formulare

Vier Fahrzeugformulare in drei Schritten und ein Kontaktformular. Pflichtfeldprüfung, E-Mail-Prüfung, bis zu 15 Bilddateien (JPG/PNG/WebP, insgesamt 3 MB), Bildvorschau und Entfernen, Ausstattung, Preisvorstellung, Unterschrift als Namenseingabe und Zusammenfassung. Die Vorschau sendet keine Daten, löst keine Bestellung aus und speichert keine personenbezogenen Daten im Web Storage. Eingaben werden beim Seitenwechsel verworfen.

`api/inquiry.mjs` ist ein optionaler Vercel-Adapter für einen explizit freigegebenen multipart/form-data Webhook. Er ist standardmässig deaktiviert und verweigert Versand mit HTTP 503. Aktivierung erst nach Prüfung des Empfängers, seiner Antwortsemantik, Datenschutztexten und Zustelltests. Benötigt `FORMS_LIVE=true`, `FORMS_WEBHOOK` und optional `FORMS_WEBHOOK_TOKEN`. Der Server prüft Origin, Felder, E-Mail, Grösse und Dateitypen. Produktionsseitigen Spam-/Rate-Limit-Schutz am Empfänger oder der Vercel Firewall ergänzen. Kein vorhandenes Kundensystem wurde mit Testanfragen belastet.

Der Empfänger muss Multipart-Uploads mit den Feldern `kind`, `locale`, Personendaten, Fahrzeugdaten und wiederholten `equipment`/`photos` verarbeiten. HTTP 2xx darf er erst nach erfolgreicher Annahme ausgeben. Die bisherige API wurde absichtlich nicht ohne Abstimmung angeschlossen.

## SEO und GEO

Vollständiger HTML-Inhalt vor JavaScript, eigene Sprach-URLs, wechselseitige hreflang-Verknüpfungen, Canonicals, individuelle Titles/Descriptions, XML-Sitemap, Unternehmensdaten als LocalBusiness und BreadcrumbList, klar strukturierte FAQ, interne Links, semantische Überschriften. Keine erfundenen Bewertungen, Verkaufserfolge oder Kennzahlen. Keine Rankinggarantie.

Kundenvorschau: `noindex,nofollow` und `robots.txt: Disallow /`. Für die spätere echte Domain: erst Inhalte und Rechtstexte freigeben, `SITE_URL` ändern, `INDEXABLE=true` setzen, alle bisherigen URL-Weiterleitungen ergänzen und die Sitemap in Search Console einreichen. Die alte Domain wird durch dieses Projekt nicht verändert.

## WordPress-Übertragung

Inhalte sind in `src/content.mjs` getrennt von Layout/Interaktion. Komponenten für Header, Hero, Leistungen, Preise, Ablauf, FAQ und Footer stehen in `build.mjs`. Diese können später als WordPress-Blocks/Templates abgebildet werden. Vier Sprachbäume und Formularlogik sind vorbereitet, es handelt sich noch nicht um ein WordPress-Theme. Convert-Anbindung erst auf der freigegebenen WordPress-Seite.

## Inhaltliche Freigabepunkte

- Bisherige Preisangaben: Auto CHF 149 inkl. MwSt., ab zwei CHF 129 pro Fahrzeug; Motorrad CHF 98, ab zwei CHF 85. Vor Livegang bestätigen.
- Bestehende Texte sind zur Inseratdauer widersprüchlich: AGB 70 Tage mit kostenloser Verlängerung, Marketingtexte ohne zeitliche Begrenzung. Im Entwurf transparent erklärt; definitive Regelung mit Kunde abstimmen.
- Unternehmensdaten übernommen: Haldenstrasse 72, 4900 Langenthal, 062 923 99 66, info@auto-moto-sales.ch.
- Rechtliches ist ein gekennzeichneter Entwurf mit Link auf bisherige AGB. Kein fertig freigegebener Rechtstext. Die Privacy-Copy ist derzeit ausdrücklich auf den Demo-Modus ausgelegt.
- Intro wird pro Sitzung einmal gezeigt (Session-Storage-Marker ohne Personendaten), ist überspringbar, erneut abspielbar und respektiert reduzierte Bewegung. Laufzeit etwa 3,2 Sekunden plus Übergang.

## Bildquellen

Logo: vom Auftraggeber bereitgestellte `auto-moto-sales-logo.webp`, unverändert eingebunden. BMW: bereitgestelltes Referenzbild, mit dem integrierten Imagegen-Werkzeug für dunklen Hintergrund, BE 149 sowie Schweizer- und Berner Wappen bearbeitet. Finale Assetdatei: `src/bmw-be149.webp`. Der Bildprompt ist in `ASSETS.md` dokumentiert. Keine behauptete Partnerschaft mit BMW.

## Prüfungen

`npm run check` prüft die Sprachseiten, interne Links, JSON-LD, Metadaten, Formularstruktur und den deaktivierten Versand. Animation und mobile Darstellung benötigen zusätzlich eine Sichtprüfung im Browser. In dieser Umgebung war kein freigegebener lokaler Browser-QA-Workflow verfügbar.
