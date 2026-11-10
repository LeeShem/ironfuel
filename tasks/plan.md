# Bouwplan: IronFuel

## Overzicht
De app uit `SPEC.md` bouw ik in 8 kleine stappen. Na elke stap werkt er iets meer, en je kunt het meteen bekijken. Het moeilijkste deel, de verbinding met Claude, bouw ik vroeg. Als daar iets niet werkt, weten we dat snel.

## Belangrijke keuzes
- **Geen bibliotheken van derden.** Alleen standaard HTML, CSS en JavaScript. Dan draait er geen vreemde code naast je API-sleutel, en hoeft er niets "gebouwd" te worden voordat de app werkt.
- **Rekenwerk apart van de schermen.** De maaltijden, voedingswaarden en optelsommen staan in een eigen bestand. Zo kan een test ze controleren zonder telefoon.
- **Claude rechtstreeks vanaf de telefoon.** De app praat direct met de Claude API van Anthropic, zonder tussenserver. Bij een eigen maaltijd vraagt de app om een vast antwoordformaat (JSON), zodat de getallen betrouwbaar uit te lezen zijn.
- **Foto's in de app zelf.** De foto's worden meegeleverd. Dat is sneller en werkt ook offline.

## Volgorde

| # | Taak | Hangt af van | Omvang |
|---|---|---|---|
| 1 | Rekenkern: maaltijden en voedingswaarden | – | klein |
| 2 | Eerste werkende app: maaltijd loggen en dagtotaal zien | 1 | middel |
| — | **Controlemoment A:** je kunt lokaal loggen en het dagtotaal zien | | |
| 3 | Instellingen: API-sleutel versleuteld bewaren en model kiezen | 2 | klein |
| 4 | Eigen maaltijd laten schatten door Claude | 3 | middel |
| 5 | Trainingen toevoegen | 2 | klein |
| 6 | Coach: advies vragen aan Claude | 4, 5 | middel |
| — | **Controlemoment B:** alle functies werken | | |
| 7 | Foto's bij elke maaltijd | 2 | klein |
| 8 | Beginscherm-app, offline werken en online zetten via GitHub Pages | alles | middel |
| — | **Controlemoment C:** de app staat op je iPhone | | |

Taken 5 en 7 kunnen eventueel eerder. Ze hangen alleen af van taak 2.

## Risico's

| Risico | Gevolg | Wat ik eraan doe |
|---|---|---|
| De Claude API weigert verzoeken die rechtstreeks vanaf een telefoon komen | Hoog: dan werken de coach en de schatting niet | Ik gebruik de officiële instelling waarmee Anthropic dit toestaat, en ik test het al in taak 4 |
| Claude geeft bij een eigen maaltijd een onbruikbaar antwoord | Middel | Een vast antwoordformaat; de test controleert ook een fout antwoord; je ziet de schatting altijd vóór het toevoegen |
| De iPhone wist gegevens van web-apps | Middel | Apps op het beginscherm worden niet automatisch gewist; in de uitleg zet ik dat je de app niet van je beginscherm moet verwijderen |
| Er zijn geen goede vrije foto's voor Nederlandse gerechten, zoals snijbonen met aardappelen | Laag | Dan maak ik zelf een afbeelding, zoals afgesproken |
| Voedingswaarden wijken af van jouw merken | Laag | Het blijven gemiddelden; per ingrediënt makkelijk aan te passen in één bestand |

## Open vragen
Geen. De standaardwaarden uit `SPEC.md` zijn goedgekeurd.
