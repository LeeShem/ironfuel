# Spec: IronFuel – voedingstracker voor Ironman Barcelona

## Doel
Een app voor de iPhone waarmee ik (80 kg, in training voor Ironman Barcelona op 3 oktober 2027) snel kan loggen wat ik eet. Ik zie per dag mijn totale calorieën en macro's en kan in de app advies vragen aan Claude over eten en herstel rond mijn trainingen (zwemmen, fietsen, lopen).

**De app is geslaagd als** ik een standaardmaaltijd in een paar seconden log (tikken, eventueel aanpassen, toevoegen) en Claude advies geeft dat past bij wat ik vandaag heb gegeten en getraind.

## Wat de app doet

### 1. Loggen met standaardmaaltijden
- Een raster met foto's van de 13 standaardmaaltijden. Eén tik opent een invulscherm.
- Het invulscherm begint **altijd met de standaardportie**. Met de knoppen − en + pas je de hoeveelheden aan, en "Toevoegen" telt de maaltijd bij de gekozen dag op.
- Wat je per maaltijd kunt aanpassen:

| Maaltijd | Aan te passen (standaardwaarde) |
|---|---|
| Brinta met melk | Brinta (35 g), halfvolle melk (250 ml) |
| Skyr-bowl | skyr (200 g), whey (½ schep), muesli (50 g), honing (10 g), bevroren fruit (60 g) |
| Banaan / kiwi / mandarijn | aantal (1) |
| Broodje met beleg | wit of bruin, aantal sneetjes (2), aantal plakjes per beleg: grillworst, kipfilet, mortadella, kaas, chocoladepasta (alles 0) |
| ¼ stokbrood met gerookte kip | stokbrood (¼), gerookte kipfilet (75 g), eieren (2); rucola en augurk zitten er vast in |
| Spaghetti bolognese | porties (1), soort vlees, vlees in gram (125 g gehakt) |
| Broccoli / bloemkool / snijbonen met aardappelen en vlees | porties groente met aardappel (1), soort vlees, vlees in gram (100 g) |
| Wortelen met aardappelbolletjes en vlees | idem |
| Spinazie à la crème met eieren en vlees | spinazie (450 g), eieren (2), soort vlees, vlees in gram (100 g) |

- Soorten vlees als snelkeuze: kipfilet, gehakt, varkensvlees, rundvlees, vis (zalm).
- "Normale portie" groente met aardappel = 200 g groente + 250 g aardappelen (bij wortelen: 200 g aardappelbolletjes) + 10 g boter of olie om in te bakken.
- De voedingswaarden zijn vaste gemiddelden (zoals op etiketten en in de Nederlandse voedingstabel NEVO). Het zijn schattingen, geen laboratoriumwaarden.

### 2. Dagoverzicht
- Bovenaan het totaal van de dag: **calorieën** (groot), koolhydraten, eiwit, vet en vezels.
- Daaronder de lijst met wat je die dag hebt gegeten. Een item verwijder je met één tik op het prullenbakje.
- Met de pijltjes ‹ › blader je naar andere dagen. Er is geen vast dagdoel.

### 3. Eigen maaltijd (vrije tekst)
- Een tekstveld, bijvoorbeeld "bord pad thai met kip en een cola". Claude schat de calorieën en macro's.
- Je ziet de schatting eerst en tikt dan op "Toevoegen".

### 3b. Eigen maaltijd met bekende macro's (toegevoegd na taak 8)
- Knop "+ Maaltijd met eigen macro's": je vult zelf naam, calorieën, koolhydraten, eiwit, vet en vezels in. Hiervoor is Claude niet nodig, dus het kost niets.
- Laat je de calorieën leeg, dan rekent de app ze uit: 4 × koolhydraten + 4 × eiwit + 9 × vet.

### 4. Coach (advies van Claude)
- Een chatscherm met drie snelknoppen:
  - "Wat kan ik nu nog het beste eten?"
  - "Wat had ik vandaag beter anders kunnen eten?"
  - "Wat eet ik voor en na mijn training?"
- Daarnaast kun je zelf vragen typen, bijvoorbeeld om samen dagdoelen af te spreken.
- Claude krijgt automatisch mee: je gewicht, de wedstrijddatum en het aantal weken tot de wedstrijd, wat je vandaag hebt gegeten en getraind, en een korte samenvatting van de afgelopen 7 dagen.
- Het gesprek wordt per dag bewaard.

### 5. Trainingen (besluit: ja, eenvoudig)
- Ik voeg trainingen toe, omdat advies over voor en na de training alleen goed is als Claude weet wat je doet en wanneer.
- Per training: **sport** (zwemmen / fietsen / lopen), **duur** in minuten, **intensiteit** (rustig / gemiddeld / zwaar) en **tijdstip**.
- Trainingen staan in het dagoverzicht en gaan mee naar de coach.

### 6. Instellingen
- Een veld voor je **Claude API-sleutel**. De sleutel wordt versleuteld op de iPhone bewaard en gaat alleen naar Anthropic (de maker van Claude). Er gaat niets naar mij of naar andere partijen.
- Een keuze voor het Claude-model: **Sonnet 5.5 (standaard)**, Opus 5.5 (slimmer, duurder) of Haiku 5.5 (sneller, goedkoper).

### Foto's
- Elke maaltijd krijgt een foto. Ik gebruik vrij te gebruiken foto's van Wikimedia Commons, die ik in de app meelever. Daardoor laden ze direct, ook zonder internet.
- Past er geen foto goed, dan maak ik zelf een afbeelding.
- In de instellingen staat een lijst met de makers van de foto's. Die vermelding is verplicht.

### Uiterlijk
- Gemaakt voor de iPhone: grote tikvlakken, een menubalk onderin (Vandaag · Eten · Coach), en een licht en donker thema dat de iPhone-instelling volgt.
- Een rustig, professioneel ontwerp met één accentkleur.

## Techniek (in gewone taal)
- **Soort app:** een web-app (in vaktaal: PWA). Je opent één keer een link in Safari en kiest "Zet op beginscherm". Daarna start hij als een gewone app, schermvullend en met een eigen icoon.
- **Online zetten:** gratis via GitHub Pages op je eigen GitHub-account.
- **Gebouwd met:** gewone HTML, CSS en JavaScript, zonder extra bibliotheken van anderen. Er draait dus geen code van derden in de app die bij je API-sleutel zou kunnen.
- **Opslag:** alles blijft op je iPhone, er is geen server en er wordt geen back-up gemaakt (jouw keuze).
- **Werkt offline:** loggen en het dagoverzicht werken ook zonder internet. Claude heeft wel internet nodig.

## Commando's (voor de ontwikkeling)
```
Testen:            node --test "tests/*.test.js"
Lokaal bekijken:   python -m http.server 8000   (open daarna http://localhost:8000)
```

## Mappen en bestanden
```
app/
  index.html        → de app
  styles.css        → het uiterlijk
  app.js            → schermen en knoppen
  meals.js          → standaardmaaltijden en voedingswaarden + rekenen
  claude.js         → verbinding met Claude
  store.js          → opslaan op de telefoon (incl. versleutelde sleutel)
  sw.js, manifest.webmanifest, icon.png → nodig voor de beginscherm-app
  img/              → foto's van de maaltijden
  CREDITS.md        → makers van de foto's
tests/              → automatische tests
SPEC.md             → dit document
```

## Codestijl
Korte, duidelijke functies. Gegevens staan apart van de schermcode. Voorbeeld:
```js
// Elke ingrediënt-regel: hoeveelheid × voedingswaarde per eenheid
{ id: 'melk', label: 'Halfvolle melk', unit: 'ml', step: 25, def: 250, per: [0.46, 0.047, 0.035, 0.015, 0] } // kcal, kh, eiwit, vet, vezels
```

## Testen
- Automatische tests (de testfunctie die standaard in Node.js zit) voor:
  - de berekening per maaltijd, bijvoorbeeld "Brinta standaard ≈ 240 kcal" en "2 sneetjes bruin + 2 plakjes kaas" klopt;
  - het dagtotaal na toevoegen en verwijderen;
  - het uitlezen van Claudes schatting bij een eigen maaltijd, inclusief een fout antwoord.
- Met de hand controleren: op de iPhone (of in de iPhone-weergave van de browser) loggen, verwijderen, een andere dag bekijken, een training toevoegen, de coach een vraag stellen en een eigen maaltijd laten schatten.

## Grenzen
- **Altijd:** de API-sleutel alleen naar api.anthropic.com sturen, foutmeldingen in gewoon Nederlands tonen ("Sleutel klopt niet", "Geen internet"), en tests draaien voor elke oplevering.
- **Eerst vragen:** iets online zetten op je GitHub-account, extra functies toevoegen, of een bibliotheek van derden gebruiken.
- **Nooit:** de API-sleutel in de code of online zetten, of gegevens naar andere partijen sturen.

## Wanneer is het af
1. Een standaardmaaltijd loggen kost maximaal 3 tikken als je de standaardportie neemt.
2. Het dagtotaal klopt met de som van de items (dat controleert een test).
3. Een eigen maaltijd in vrije tekst krijgt een schatting van Claude en wordt opgeteld.
4. De drie snelknoppen van de coach geven advies dat verwijst naar wat je vandaag hebt gegeten en getraind.
5. Trainingen kun je toevoegen en verwijderen.
6. Na een herstart staan alle gegevens en de API-sleutel er nog.
7. De app staat op je beginscherm en opent schermvullend.
8. Alle automatische tests slagen.

## Eerlijke kanttekeningen
- **Opslag van de sleutel:** een web-app kan niet bij de iPhone-sleutelhanger (Keychain). Daarom versleutel ik de sleutel met een code die de app niet kan exporteren en die alleen op deze telefoon werkt. Dat is goed beschermd, maar niet zo sterk als de Keychain van een echte app.
- **Kosten:** elke vraag aan Claude kost een klein bedrag van je Anthropic-tegoed, met Sonnet ongeveer 1 à 2 cent per vraag.
- **Geen back-up:** als je de app van je beginscherm verwijdert, zijn je gegevens weg.

## Open vragen
1. Kloppen de standaardwaarden in de tabel? Het gaat vooral om het broodje (2 sneetjes, geen beleg ingevuld), het vlees (100 g, en 125 g bij spaghetti) en de normale portie aardappelen (250 g).
2. Is de appnaam **IronFuel** goed, of wil je een andere naam?
