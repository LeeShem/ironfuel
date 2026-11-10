const test = require('node:test');
const assert = require('node:assert/strict');
const { MEALS, MEATS, defaults, calc, describe, fmtAmount, parseAmount } = require('../app/meals.js');

const meal = id => MEALS.find(m => m.id === id);
const near = (actual, expected, tol = 1) =>
  assert.ok(Math.abs(actual - expected) <= tol, `verwacht ~${expected}, kreeg ${actual}`);

test('alle 13 standaardmaaltijden staan erin', () => {
  assert.equal(MEALS.length, 13);
  assert.equal(new Set(MEALS.map(m => m.id)).size, 13);
});

test('elke maaltijd heeft bij de standaardportie positieve waarden', () => {
  for (const m of MEALS) {
    const r = calc(m, defaults(m));
    assert.ok(r.kcal > 0 && r.carbs >= 0 && r.protein >= 0 && r.fat >= 0 && r.fiber >= 0, m.id);
  }
});

test('Brinta standaard (35 g + 250 ml halfvolle melk) ≈ 240 kcal', () => {
  const m = meal('brinta');
  assert.deepEqual(defaults(m).amounts, { brinta: 35, melk: 250 });
  near(calc(m, defaults(m)).kcal, 240, 3);
});

test('skyr-bowl standaard volgt de spec', () => {
  const m = meal('skyr');
  assert.deepEqual(defaults(m).amounts, { skyr: 200, whey: 0.5, muesli: 50, honing: 10, fruit: 60 });
  const r = calc(m, defaults(m));
  near(r.kcal, 428, 5);   // 126 skyr + 60 whey + 185 muesli + 30 honing + 27 fruit
  near(r.protein, 39.6, 1);
});

test('broodje: 2 sneetjes bruin + 2 plakjes kaas', () => {
  const m = meal('broodje');
  const d = defaults(m);
  assert.equal(d.amounts.brood, 2);
  assert.equal(d.amounts.kaas, 0); // standaard nog geen beleg
  const r = calc(m, { amounts: { ...d.amounts, kaas: 2 }, choices: { brood: 'bruin' } });
  near(r.kcal, 314);
  near(r.protein, 17.2, 0.1);
});

test('wit brood geeft andere waarden dan bruin', () => {
  const m = meal('broodje');
  const a = { ...defaults(m).amounts };
  assert.notEqual(calc(m, { amounts: a, choices: { brood: 'wit' } }).fiber,
                  calc(m, { amounts: a, choices: { brood: 'bruin' } }).fiber);
});

test('vlees: soort en gram tellen mee', () => {
  const m = meal('broccoli');
  const d = defaults(m);
  assert.equal(d.amounts.vlees, 100);
  const zonder = calc(m, { amounts: { ...d.amounts, vlees: 0 }, choices: d.choices });
  const kip200 = calc(m, { amounts: { ...d.amounts, vlees: 200 }, choices: { vlees: 'kip' } });
  near(kip200.protein - zonder.protein, 46, 0.1); // 200 g kipfilet ≈ 46 g eiwit
  const gehakt = calc(m, { amounts: d.amounts, choices: { vlees: 'gehakt' } });
  assert.ok(gehakt.fat > calc(m, { amounts: d.amounts, choices: { vlees: 'kip' } }).fat);
});

test('spaghetti start met 125 g gehakt, groenteschotels met 100 g', () => {
  assert.equal(defaults(meal('bolognese')).amounts.vlees, 125);
  assert.equal(defaults(meal('bolognese')).choices.vlees, 'gehakt');
  for (const id of ['broccoli', 'bloemkool', 'snijbonen', 'wortelen', 'spinazie'])
    assert.equal(defaults(meal(id)).amounts.vlees, 100, id);
});

test('alle vijf vleessoorten zijn kiesbaar', () => {
  assert.deepEqual(MEATS.map(o => o.id), ['kip', 'gehakt', 'varken', 'rund', 'vis']);
});

test('negatieve hoeveelheden tellen als 0', () => {
  const m = meal('banaan');
  assert.equal(calc(m, { amounts: { stuks: -2 }, choices: {} }).kcal, 0);
});

test('2 porties is twee keer zoveel als 1 portie (zonder vlees)', () => {
  const m = meal('bloemkool');
  const c = defaults(m).choices;
  const een = calc(m, { amounts: { portie: 1, vlees: 0 }, choices: c });
  const twee = calc(m, { amounts: { portie: 2, vlees: 0 }, choices: c });
  near(twee.kcal, een.kcal * 2, 0.01);
});

test('korte omschrijving voor in het dagoverzicht', () => {
  const m = meal('broodje');
  const d = defaults(m);
  assert.equal(describe(m, { amounts: { ...d.amounts, kaas: 2 }, choices: d.choices }),
    '2 sneetjes bruin · 2 plakjes kaas');
  const b = meal('broccoli');
  assert.equal(describe(b, defaults(b)), '1 portie · 100 g kipfilet');
  assert.equal(describe(meal('kiwi'), { amounts: { stuks: 2 }, choices: {} }), '2×');
  const s = meal('skyr');
  assert.equal(describe(s, defaults(s)), '200 g skyr · 0,5 schep whey · 50 g muesli · 10 g honing · 60 g bevroren fruit');
});

test('stokbrood op 0: rucola en augurk tellen dan ook niet mee', () => {
  const m = meal('stokbrood');
  assert.equal(calc(m, { amounts: { stokbrood: 0, kip: 0, eieren: 0 }, choices: {} }).kcal, 0);
});

test('hoeveelheden tonen en teruglezen, ook vanaf 1000', () => {
  for (const n of [0, 0.5, 35, 1000, 1250.5]) assert.equal(parseAmount(fmtAmount(n)), n);
  assert.equal(fmtAmount(1000), '1000');
  assert.equal(fmtAmount(0.5), '0,5');
  assert.equal(parseAmount('2,5'), 2.5);
  assert.equal(parseAmount('abc'), 0);
  assert.equal(parseAmount('-3'), 0);
});
