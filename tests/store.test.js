const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../app/store.js');

const fakeStorage = (init = {}) => ({
  data: { ...init },
  getItem(k) { return this.data[k] ?? null; },
  setItem(k, v) { this.data[k] = String(v); },
});
const item = (kcal, protein = 0) => ({ name: 'x', kcal, carbs: 0, protein, fat: 0, fiber: 0 });

test('datum als JJJJ-MM-DD in lokale tijd', () => {
  assert.equal(S.dateKey(new Date(2026, 10, 10, 23, 59)), '2026-11-10');
});

test('dagen bladeren over maand- en jaargrens', () => {
  assert.equal(S.shiftDate('2026-11-30', 1), '2026-12-01');
  assert.equal(S.shiftDate('2027-01-01', -1), '2026-12-31');
});

test('dagen tot de wedstrijd', () => {
  assert.equal(S.daysBetween('2026-11-10', S.RACE_DATE), 327);
});

test('dagtotaal is de som van de items, ook na verwijderen', () => {
  const st = S.emptyState();
  const a = S.addItem(st, '2026-11-10', item(240, 13));
  S.addItem(st, '2026-11-10', item(105, 1));
  assert.deepEqual(S.totals(S.getDay(st, '2026-11-10').items),
    { kcal: 345, carbs: 0, protein: 14, fat: 0, fiber: 0 });
  S.removeItem(st, '2026-11-10', a.id);
  assert.equal(S.totals(S.getDay(st, '2026-11-10').items).kcal, 105);
});

test('items komen op de juiste dag terecht', () => {
  const st = S.emptyState();
  S.addItem(st, '2026-11-09', item(100));
  assert.equal(S.getDay(st, '2026-11-10').items.length, 0);
  assert.equal(S.getDay(st, '2026-11-09').items.length, 1);
});

test('een lege dag bekijken maakt geen opslag-regel aan', () => {
  const st = S.emptyState();
  S.getDay(st, '2026-01-01');
  assert.deepEqual(st.days, {});
});

test('opslaan en weer inlezen geeft dezelfde gegevens', () => {
  const store = fakeStorage();
  const st = S.emptyState();
  S.addItem(st, '2026-11-10', item(240));
  S.saveState(store, st);
  assert.deepEqual(S.loadState(store), st);
});

test('beschadigde opslag: lege start, maar oude gegevens worden apart bewaard', () => {
  const store = fakeStorage({ [S.KEY]: '{kapot' });
  assert.deepEqual(S.loadState(store), S.emptyState());
  assert.equal(store.getItem(S.KEY + ':kapot'), '{kapot');
});

test('ongedaan maken zet een item terug op dezelfde plek', () => {
  const st = S.emptyState();
  S.addItem(st, 'd', item(1)); const b = S.addItem(st, 'd', item(2)); S.addItem(st, 'd', item(3));
  const undo = S.removeItem(st, 'd', b.id);
  undo();
  assert.deepEqual(S.getDay(st, 'd').items.map(i => i.kcal), [1, 2, 3]);
});

test('trainingen: toevoegen, gesorteerd op tijd, verwijderen en ongedaan maken', () => {
  const st = S.emptyState();
  S.addTraining(st, 'd', { sport: 'fietsen', minutes: 90, intensity: 'gemiddeld', time: '17:00' });
  const run = S.addTraining(st, 'd', { sport: 'lopen', minutes: 45, intensity: 'rustig', time: '07:00' });
  assert.deepEqual(S.getDay(st, 'd').trainings.map(t => t.sport), ['lopen', 'fietsen']);
  const undo = S.removeItem(st, 'd', run.id, 'trainings');
  assert.equal(S.getDay(st, 'd').trainings.length, 1);
  undo();
  assert.equal(S.getDay(st, 'd').trainings.length, 2);
  assert.equal(S.getDay(st, 'd').items.length, 0); // eten blijft los
});

test('training met ongeldige waarden wordt geweigerd', () => {
  const st = S.emptyState();
  assert.throws(() => S.addTraining(st, 'd', { sport: 'tennis', minutes: 60, intensity: 'rustig', time: '07:00' }));
  assert.throws(() => S.addTraining(st, 'd', { sport: 'lopen', minutes: 0, intensity: 'rustig', time: '07:00' }));
  assert.throws(() => S.addTraining(st, 'd', { sport: 'lopen', minutes: 30, intensity: 'rustig', time: '25:00' }));
});

test('coach-context: profiel, eten, trainingen en de afgelopen 7 dagen', () => {
  const st = S.emptyState();
  S.addItem(st, '2026-11-10', { name: 'Brinta met melk', desc: '35 g brinta', kcal: 240, carbs: 34, protein: 13, fat: 5, fiber: 4, at: new Date(2026, 10, 10, 7, 30).getTime() });
  S.addTraining(st, '2026-11-10', { sport: 'fietsen', minutes: 120, intensity: 'gemiddeld', time: '17:00' });
  S.addItem(st, '2026-11-08', { name: 'Banaan', kcal: 105, carbs: 27, protein: 1, fat: 0, fiber: 3 });
  S.addItem(st, '2026-11-01', { name: 'Te oud', kcal: 999, carbs: 0, protein: 0, fat: 0, fiber: 0 });
  const c = S.coachContext(st, '2026-11-10', new Date(2026, 10, 10, 12, 15));
  assert.match(c, /80 kg/);
  assert.match(c, /Ironman Barcelona/);
  assert.match(c, /nog 327 dagen/);
  assert.match(c, /Het is nu 12:15/);
  assert.match(c, /07:30 Brinta met melk \(35 g brinta\): 240 kcal, 34 g koolh\., 13 g eiwit/);
  assert.match(c, /Fietsen 120 min, gemiddeld, om 17:00/);
  assert.match(c, /0,4 g\/kg koolh/);
  assert.match(c, /2026-11-08.*105 kcal/);
  assert.doesNotMatch(c, /Te oud/);
});

test('coach-context: lege dag', () => {
  const c = S.coachContext(S.emptyState(), '2026-11-10', new Date(2026, 10, 10, 9, 0));
  assert.match(c, /nog niets ingevoerd/);
  assert.match(c, /Trainingen[^\n]*:\n- geen ingevoerd/);
});

test('eigen macro\'s: geldige invoer wordt een item', () => {
  assert.deepEqual(S.manualItem({ name: '  Proteïnereep ', kcal: '210', carbs: '22,5', protein: '20', fat: '7', fiber: '' }),
    { name: 'Proteïnereep', kcal: 210, carbs: 22.5, protein: 20, fat: 7, fiber: 0 });
});

test('eigen macro\'s: calorieën leeg → berekend uit koolhydraten, eiwit en vet', () => {
  assert.equal(S.manualItem({ name: 'Shake', kcal: '', carbs: '30', protein: '25', fat: '5', fiber: '' }).kcal, 265); // 4·30 + 4·25 + 9·5
});

test('eigen macro\'s: ongeldige invoer wordt geweigerd', () => {
  assert.throws(() => S.manualItem({ name: '', kcal: '100', carbs: '', protein: '', fat: '', fiber: '' }), /naam/);
  assert.throws(() => S.manualItem({ name: 'x', kcal: '-5', carbs: '', protein: '', fat: '', fiber: '' }), /getal/);
  assert.throws(() => S.manualItem({ name: 'x', kcal: 'abc', carbs: '', protein: '', fat: '', fiber: '' }), /getal/);
  assert.throws(() => S.manualItem({ name: 'x', kcal: '', carbs: '', protein: '', fat: '', fiber: '' }), /calorieën/);
});
