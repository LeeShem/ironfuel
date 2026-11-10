# IronFuel

Voedingstracker voor de training richting Ironman Barcelona (3 oktober 2027), met een Claude-coach erin.
Werkt als app op je iPhone-beginscherm. Al je gegevens blijven op je telefoon.

## 1. Online zetten (eenmalig)

1. Ga op **github.com** naar **New repository**. Noem hem `ironfuel`, kies **Public** en klik op **Create repository**.
   (Gratis GitHub Pages werkt alleen met een openbare repository. Er staan geen geheimen in de code: je API-sleutel en je eetgegevens staan alleen op je telefoon.)
2. Zet deze map in die repository (dat doet Claude Code voor je, of zie *Voor ontwikkelaars* hieronder).
3. Ga in de repository naar **Settings → Pages**. Kies bij **Source** de optie **GitHub Actions**.
4. Wacht ongeveer een minuut. Bij **Actions** zie je een groen vinkje zodra het klaar is.
   Je app staat dan op **https://leeshem.github.io/ironfuel/**

## 2. Op je iPhone zetten

1. Open de link hierboven in **Safari**. Gebruik echt Safari: andere browsers kunnen op een iPhone geen app op het beginscherm zetten.
2. Tik op de **deelknop** (het vierkantje met het pijltje omhoog).
3. Kies **Zet op beginscherm** en tik op **Voeg toe**.
4. Open IronFuel voortaan via het icoon op je beginscherm.

## 3. Je API-sleutel invullen

1. Maak een sleutel op **console.anthropic.com** bij **API Keys → Create Key**. Zorg ook dat er tegoed staat, onder **Billing**.
2. Open IronFuel en tik rechtsboven op het **tandwieltje**.
3. Plak de sleutel in het veld **Claude API-sleutel** en tik op **Opslaan**.
4. Kies eventueel een ander model. Sonnet 5.5 is de standaard.

De sleutel wordt versleuteld op je telefoon bewaard en gaat alleen naar Anthropic.

## Goed om te weten

- **Verwijder de app niet van je beginscherm.** Je gegevens staan alleen op je telefoon en er is geen back-up. Verwijder je de app, dan ben je alles kwijt.
- Gegevens in Safari en in de app op je beginscherm staan los van elkaar. Vul je sleutel daarom in de app op je beginscherm in.
- **Updates:** na een nieuwe versie zie je de wijzigingen de tweede keer dat je de app opent.
- Loggen en het dagoverzicht werken ook zonder internet. Voor de coach en het schatten van eigen maaltijden heb je internet nodig.
- Elke vraag aan Claude kost een klein bedrag van je tegoed: met Sonnet 1 à 2 cent.

## Voor ontwikkelaars

```
Testen:            node --test "tests/*.test.js"
Lokaal bekijken:   cd app && python -m http.server 8000   → http://localhost:8000
```

- `app/` is de app zelf: gewone HTML, CSS en JavaScript, zonder build-stap en zonder bibliotheken van derden.
- `tests/` bevat de automatische tests (Node.js, de testfunctie die standaard in Node zit).
- `.github/workflows/pages.yml` draait de tests en publiceert `app/` bij elke push naar `main`.
- Voedingswaarden staan in `app/meals.js`, fotobronnen in `app/CREDITS.md`.
- `SPEC.md` is de beschrijving; `tasks/` bevat het plan en de takenlijst.
