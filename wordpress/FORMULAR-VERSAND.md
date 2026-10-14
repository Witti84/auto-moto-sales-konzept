# Auto Moto Sales – WordPress Formularversand (Vorbereitung)

## Stand
Das Plugin unter `wordpress/plugins/auto-moto-sales-inquiries/` ist ein **Entwurf**, nicht installiert und standardmässig gesperrt (`AMS_FORMS_LIVE` fehlt). Die Vercel-Formulare senden weiterhin an `/api/inquiry` und sind nicht automatisch mit WordPress verbunden. Die bestehende Domain bleibt unverändert.

## Geplanter Ablauf
1. Fahrzeug- oder Kontaktanfrage mit Einwilligung und optional bis zu 15 Fotos (insgesamt max. 12 MB).
2. Server prüft Pflichtfelder, E-Mail-Adresse, Herkunft, Dateitypen und Upload-Grösse.
3. Anfrage wird als privater WordPress-Datensatz gespeichert.
4. Benachrichtigung an **info@auto-moto-sales.ch** mit Formularangaben und Anfrage-ID.
5. Automatische Eingangsbestätigung in der gewählten Sprache an den Kunden.

## Vor Aktivierung zwingend
- Plugin in einer **WordPress-Staging-Umgebung** installieren und PHP-Fehler sowie E-Mail-Transport (SMTP/API) testen.
- Frontend-Formulare auf `/wp-json/ams/v1/inquiry` umstellen; dabei Feldnamen und Validierung zwischen Frontend und Plugin vollständig abgleichen.
- **Wichtig: Medien in der normalen WordPress-Mediathek sind standardmässig öffentlich über ihre URL erreichbar.** Vor echten Kundenuploads einen privaten Speicherort mit berechtigungsgeprüftem Download implementieren. Das jetzige Plugin ist daher **nicht für Live-Betrieb freigegeben**.
- Datenschutztext, Löschfristen, Berechtigungskonzept, Spam-Schutz und Versandbestätigung fachlich abnehmen.
- Zustellbarkeit an info@auto-moto-sales.ch sowie Kundenbestätigung prüfen (SPF/DKIM/DMARC).
- Rückmeldungen bei Mailfehlern, Doppelversand, Rate-Limits und Upload-Abbrüchen testen.
- Erst nach erfolgreichen Tests `define('AMS_FORMS_LIVE', true);` in wp-config.php setzen.

## Hinweis
Es wurde **kein** echter Mailversand ausgelöst und keine Live-Domain geändert.
