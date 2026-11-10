# Takenlijst IronFuel

## Taak 1: Rekenkern – maaltijden en voedingswaarden
Alle 13 standaardmaaltijden met hun ingrediënten, standaardhoeveelheden en voedingswaarden, plus de rekenfunctie "hoeveelheden → kcal, koolhydraten, eiwit, vet, vezels".
- [x] Alle maaltijden en vleessoorten uit de spec staan erin, met de goedgekeurde standaardwaarden
- [x] De berekening klopt voor de standaardportie en voor aangepaste hoeveelheden
- **Controle:** `node --test tests/` slaagt (bijvoorbeeld: Brinta standaard ≈ 240 kcal; 2 sneetjes bruin + 2 plakjes kaas klopt)
- **Bestanden:** `app/meals.js`, `tests/meals.test.js`

## Taak 2: Eerste werkende app – loggen en dagtotaal
Het scherm met maaltijdtegels, het invulscherm met − en +, "Toevoegen", het dagoverzicht met totalen, verwijderen, bladeren tussen dagen en de menubalk onderin.
- [x] Een standaardmaaltijd loggen kost maximaal 3 tikken
- [x] Het dagtotaal is de som van de items, ook na verwijderen
- [x] Na het herladen van de pagina staat alles er nog
- **Controle:** test voor dagtotaal en verwijderen slaagt; met de hand in de iPhone-weergave van de browser
- **Bestanden:** `app/index.html`, `app/styles.css`, `app/app.js`, `app/store.js`, `tests/store.test.js`

### Controlemoment A
- [x] Alle tests slagen
- [x] Je bekijkt de app lokaal en geeft akkoord op het uiterlijk

## Taak 3: Instellingen – API-sleutel en model
- [x] De sleutel wordt versleuteld opgeslagen en staat na herstart nog in de app
- [x] Modelkeuze tussen Sonnet 5.5 (standaard), Opus 5.5 en Haiku 5.5
- [x] De sleutel is nergens leesbaar in de opslag te zien
- **Controle:** test voor versleutelen en ontsleutelen slaagt; met de hand de opslag in de browser bekijken
- **Bestanden:** `app/store.js`, `app/app.js`, `app/index.html`, `tests/crypto.test.js`

## Taak 4: Eigen maaltijd laten schatten door Claude
- [x] Vrije tekst → schatting van Claude → je ziet de schatting → "Toevoegen" telt hem op
- [x] Duidelijke Nederlandse foutmeldingen bij een verkeerde sleutel, geen internet of een onbruikbaar antwoord
- **Controle:** test voor het uitlezen van het antwoord (goed én fout) slaagt; één echte schatting met jouw sleutel
- **Bestanden:** `app/claude.js`, `app/app.js`, `tests/claude.test.js`

## Taak 5: Trainingen
- [x] Training toevoegen (sport, duur, intensiteit, tijdstip) en verwijderen; zichtbaar in het dagoverzicht
- **Controle:** test slaagt; met de hand toevoegen en verwijderen
- **Bestanden:** `app/app.js`, `app/store.js`, `tests/store.test.js`

## Taak 6: Coach – advies van Claude
- [x] Chat met drie snelknoppen en een eigen vraag; het gesprek wordt per dag bewaard
- [x] Claude krijgt mee: 80 kg, de wedstrijddatum en het aantal weken tot de wedstrijd, het eten en de trainingen van vandaag, en een samenvatting van 7 dagen
- **Controle:** test dat de meegestuurde informatie klopt; met de hand de drie snelknoppen proberen
- **Bestanden:** `app/claude.js`, `app/app.js`, `tests/claude.test.js`

### Controlemoment B
- [x] Alle tests slagen
- [x] Alle functies uit de spec werken lokaal

## Taak 7: Foto's
- [x] Elke maaltijd heeft een passende, vrij te gebruiken foto (of een zelfgemaakte afbeelding)
- [x] De makers staan vermeld in `CREDITS.md` en in de instellingen
- **Controle:** alle foto's laden; je herkent elke maaltijd
- **Bestanden:** `app/img/*`, `app/CREDITS.md`, `app/meals.js`

## Taak 8: Beginscherm-app en online zetten
- [ ] Icoon, schermvullend openen vanaf het beginscherm, en loggen werkt offline
- [ ] **Eerst jouw akkoord**, daarna online zetten via GitHub Pages
- [ ] Een korte installatie-uitleg in `README.md`, inclusief waar je je API-sleutel invult
- **Controle:** de app op je iPhone installeren en starten
- **Bestanden:** `app/manifest.webmanifest`, `app/sw.js`, `app/icon.png`, `README.md`

### Controlemoment C
- [ ] Alle punten onder "Wanneer is het af" in de spec zijn gehaald
- [ ] Daarna: testen en review (fase 4)
