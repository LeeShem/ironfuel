// Standaardmaaltijden en voedingswaarden (gemiddelden, o.a. NEVO en etiketten).
// Elke waarde is een rij: [kcal, koolhydraten, eiwit, vet, vezels].

const add = (...rows) => rows.reduce((s, r) => s.map((v, i) => v + r[i]), [0, 0, 0, 0, 0]);
const g100 = row => row.map(v => v / 100); // waarden per 100 g/ml → per gram/ml

// Ingrediënten
const F = {
  brinta:     g100([356, 64, 12, 2.5, 10]),
  melk:       g100([46, 4.7, 3.5, 1.5, 0]),     // halfvol
  skyr:       g100([63, 3.9, 11, 0.2, 0]),
  whey:       [120, 3, 24, 1.5, 0],             // per schep (30 g)
  muesli:     g100([370, 62, 10, 7, 8]),
  honing:     g100([304, 82, 0.3, 0, 0]),
  fruit:      g100([45, 8, 1, 0.3, 4]),         // bevroren rood fruit
  banaan:     [105, 27, 1.3, 0.4, 3.1],         // per stuk
  kiwi:       [45, 10, 0.8, 0.4, 2.3],
  mandarijn:  [40, 9, 0.6, 0.2, 1.3],
  wit:        [90, 17, 3, 0.8, 1],              // per sneetje (35 g)
  bruin:      [85, 14, 3.6, 1, 2.5],
  grillworst: [35, 0.3, 2.1, 2.9, 0],           // per plakje
  kipbeleg:   [11, 0.1, 2.2, 0.2, 0],
  mortadella: [46, 0.2, 2.3, 4, 0],
  kaas:       [72, 0, 5, 5.8, 0],
  choco:      [81, 8.6, 0.9, 4.7, 0.5],         // per laagje (15 g)
  stokbrood:  [169, 34, 5.9, 1, 1.6],           // per kwart
  rookkip:    g100([110, 1, 23, 1.5, 0]),
  ei:         [75, 0.4, 6.5, 5.3, 0],           // per gekookt ei
  rucola:     [4, 0.5, 0.4, 0.1, 0.2],          // handje (15 g)
  augurk:     [4, 0.6, 0.1, 0, 0.3],            // beetje (20 g)
  aardappel:  [188, 40, 4.5, 0.3, 4.3],         // normale portie (250 g gekookt)
  bolletjes:  [280, 44, 5, 9, 5],               // 200 g aardappelbolletjes
  boter:      [75, 0, 0.1, 8.3, 0],             // 10 g om in te bakken
  broccoli:   [68, 5, 6, 0.8, 6],               // 200 g
  bloemkool:  [46, 4, 4, 0.6, 4.6],
  snijbonen:  [56, 7, 3.6, 0.4, 6],
  wortel:     [64, 12, 1.4, 0.4, 6],
  spinazie:   g100([70, 3.5, 2.8, 4.8, 2.2]),   // à la crème
  spaghetti:  [355, 70, 12.5, 1.5, 3],          // 100 g droog
  saus:       [135, 14, 3, 7, 4],               // 200 g tomatensaus met groente + 5 g olie
};

const MEATS = [
  { id: 'kip',    label: 'Kipfilet',     per: g100([110, 0, 23, 1.5, 0]) },
  { id: 'gehakt', label: 'Gehakt',       per: g100([240, 0, 18, 18, 0]) },
  { id: 'varken', label: 'Varkensvlees', per: g100([150, 0, 21, 7, 0]) },
  { id: 'rund',   label: 'Rundvlees',    per: g100([125, 0, 22, 4, 0]) },
  { id: 'vis',    label: 'Vis (zalm)',   per: g100([200, 0, 20, 13, 0]) },
];

const vlees = (def, optDef = 'kip') =>
  ({ id: 'vlees', label: 'Vlees', unit: 'g', step: 25, def, options: MEATS, optDef });
const portie = per => ({ id: 'portie', label: 'Porties', unit: 'portie', step: 0.5, def: 1, per });
const stuks = per => [{ id: 'stuks', label: 'Aantal', unit: '', step: 1, def: 1, per }];
const plakjes = (id, label, per, unit = 'plakjes') => ({ id, label, unit, step: 1, def: 0, per });

const MEALS = [
  { id: 'brinta', name: 'Brinta met melk', img: 'img/brinta.jpg', vars: [
    { id: 'brinta', label: 'Brinta', unit: 'g', step: 5, def: 35, per: F.brinta },
    { id: 'melk', label: 'Halfvolle melk', unit: 'ml', step: 25, def: 250, per: F.melk },
  ] },
  { id: 'skyr', name: 'Skyr-bowl', img: 'img/skyr.jpg', vars: [
    { id: 'skyr', label: 'Skyr', unit: 'g', step: 25, def: 200, per: F.skyr },
    { id: 'whey', label: 'Whey', unit: 'schep', step: 0.5, def: 0.5, per: F.whey },
    { id: 'muesli', label: 'Muesli', unit: 'g', step: 10, def: 50, per: F.muesli },
    { id: 'honing', label: 'Honing', unit: 'g', step: 5, def: 10, per: F.honing },
    { id: 'fruit', label: 'Bevroren fruit', unit: 'g', step: 10, def: 60, per: F.fruit },
  ] },
  { id: 'banaan', name: 'Banaan', img: 'img/banaan.jpg', vars: stuks(F.banaan) },
  { id: 'kiwi', name: 'Kiwi', img: 'img/kiwi.jpg', vars: stuks(F.kiwi) },
  { id: 'mandarijn', name: 'Mandarijn', img: 'img/mandarijn.jpg', vars: stuks(F.mandarijn) },
  { id: 'broodje', name: 'Broodje met beleg', img: 'img/broodje.jpg', vars: [
    { id: 'brood', label: 'Brood', unit: 'sneetjes', step: 1, def: 2, optDef: 'bruin', options: [
      { id: 'bruin', label: 'Bruin', per: F.bruin },
      { id: 'wit', label: 'Wit', per: F.wit },
    ] },
    plakjes('kaas', 'Kaas', F.kaas),
    plakjes('kipfilet', 'Kipfilet', F.kipbeleg),
    plakjes('grillworst', 'Grillworst', F.grillworst),
    plakjes('mortadella', 'Mortadella', F.mortadella),
    plakjes('choco', 'Chocoladepasta', F.choco, 'laagjes'),
  ] },
  { id: 'stokbrood', name: 'Stokbrood met gerookte kip', img: 'img/stokbrood.jpg',
    fixed: add(F.rucola, F.augurk), vars: [
    { id: 'stokbrood', label: 'Stokbrood', unit: 'kwart', step: 1, def: 1, per: F.stokbrood },
    { id: 'kip', label: 'Gerookte kipfilet', unit: 'g', step: 25, def: 75, per: F.rookkip },
    { id: 'eieren', label: 'Gekookte eieren', unit: '', step: 1, def: 2, per: F.ei },
  ] },
  { id: 'bolognese', name: 'Spaghetti bolognese', img: 'img/bolognese.jpg', vars: [
    portie(add(F.spaghetti, F.saus)), vlees(125, 'gehakt'),
  ] },
  { id: 'broccoli', name: 'Broccoli, aardappelen & vlees', img: 'img/broccoli.jpg', vars: [
    portie(add(F.broccoli, F.aardappel, F.boter)), vlees(100),
  ] },
  { id: 'spinazie', name: 'Spinazie à la crème met eieren', img: 'img/spinazie.jpg', vars: [
    { id: 'spinazie', label: 'Spinazie à la crème', unit: 'g', step: 50, def: 450, per: F.spinazie },
    { id: 'eieren', label: 'Gekookte eieren', unit: '', step: 1, def: 2, per: F.ei },
    vlees(100),
  ] },
  { id: 'wortelen', name: 'Wortelen, aardappelbolletjes & vlees', img: 'img/wortelen.jpg', vars: [
    portie(add(F.wortel, F.bolletjes, F.boter)), vlees(100),
  ] },
  { id: 'bloemkool', name: 'Bloemkool, aardappelen & vlees', img: 'img/bloemkool.jpg', vars: [
    portie(add(F.bloemkool, F.aardappel, F.boter)), vlees(100),
  ] },
  { id: 'snijbonen', name: 'Snijbonen, aardappelen & vlees', img: 'img/snijbonen.jpg', vars: [
    portie(add(F.snijbonen, F.aardappel, F.boter)), vlees(100),
  ] },
];

// Standaardinvulling van een maaltijd: { amounts: {varId: getal}, choices: {varId: optieId} }
function defaults(meal) {
  const amounts = {}, choices = {};
  for (const v of meal.vars) {
    amounts[v.id] = v.def;
    if (v.options) choices[v.id] = v.optDef;
  }
  return { amounts, choices };
}

// Hoeveelheden → { kcal, carbs, protein, fat, fiber }
function calc(meal, { amounts, choices }) {
  const rows = meal.vars.map(v => {
    const per = v.options ? v.options.find(o => o.id === choices[v.id]).per : v.per;
    const n = Math.max(0, amounts[v.id] ?? 0);
    return per.map(x => x * n);
  });
  const anything = meal.vars.some(v => (amounts[v.id] ?? 0) > 0);
  const [kcal, carbs, protein, fat, fiber] = add(...rows, anything && meal.fixed ? meal.fixed : [0, 0, 0, 0, 0]);
  return { kcal, carbs, protein, fat, fiber };
}

// Hoeveelheid in een invulveld: zonder duizendtalpunt, zodat '1000' ook weer als 1000 wordt gelezen
const fmtAmount = n => n.toLocaleString('nl-NL', { maximumFractionDigits: 2, useGrouping: false });
const parseAmount = s => { const n = parseFloat(String(s).replace(',', '.')); return Number.isFinite(n) ? Math.max(0, n) : 0; };

// Korte omschrijving, bijv. "2 sneetjes bruin · 2 plakjes kaas"
function describe(meal, { amounts, choices }) {
  return meal.vars.filter(v => amounts[v.id] > 0).map(v => {
    const n = amounts[v.id].toLocaleString('nl-NL');
    if (v.id === 'stuks') return `${n}×`;
    if (v.id === 'portie') return `${n} portie`;
    const what = (v.options ? v.options.find(o => o.id === choices[v.id]).label : v.label).toLowerCase();
    return [n, v.unit, what].filter(Boolean).join(' ');
  }).join(' · ');
}

if (typeof module !== 'undefined') module.exports = { MEALS, MEATS, defaults, calc, describe, fmtAmount, parseAmount };
