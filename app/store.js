// Gegevens per dag, opgeslagen op de telefoon (localStorage).
// Vorm: { days: { 'JJJJ-MM-DD': { items: [...], trainings: [...], chat: [...] } } }

const KEY = 'ironfuel:v1';
const RACE_DATE = '2027-10-03';
const BODY_KG = 80;

const pad = n => String(n).padStart(2, '0');
const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const shiftDate = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dateKey(d); };
const daysBetween = (a, b) => {
  const utc = k => { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((utc(b) - utc(a)) / 864e5);
};

const emptyState = () => ({ days: {} });
const emptyDay = () => ({ items: [], trainings: [], chat: [] });

// Alleen lezen: een lege dag wordt niet opgeslagen.
const getDay = (st, k) => st.days[k] ?? emptyDay();
const ensureDay = (st, k) => (st.days[k] ??= emptyDay());

function addItem(st, k, item) {
  const it = { id: crypto.randomUUID(), at: Date.now(), ...item };
  ensureDay(st, k).items.push(it);
  return it;
}

// Maaltijd met zelf ingevulde macro's. Velden zijn tekst uit het formulier ('' = leeg).
function manualItem({ name, kcal, carbs, protein, fat, fiber }) {
  name = String(name || '').trim().slice(0, 60);
  if (!name) throw new Error('Vul een naam in');
  const num = v => {
    if (String(v ?? '').trim() === '') return null;
    const n = Number(String(v).replace(',', '.'));
    if (!Number.isFinite(n) || n < 0 || n >= 10000) throw new Error('Vul een geldig getal in (0 of meer)');
    return n;
  };
  const m = { carbs: num(carbs) ?? 0, protein: num(protein) ?? 0, fat: num(fat) ?? 0, fiber: num(fiber) ?? 0 };
  const k = num(kcal) ?? Math.round(m.carbs * 4 + m.protein * 4 + m.fat * 9);
  if (k <= 0) throw new Error("Vul calorieën of macro's in");
  return { name, kcal: k, ...m };
}

const SPORTS = { zwemmen: 'Zwemmen', fietsen: 'Fietsen', lopen: 'Lopen' };
const INTENSITIES = { rustig: 'Rustig', gemiddeld: 'Gemiddeld', zwaar: 'Zwaar' };

function addTraining(st, k, { sport, minutes, intensity, time }) {
  if (!SPORTS[sport] || !INTENSITIES[intensity] || !(minutes > 0 && minutes <= 1000)
      || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Ongeldige training');
  const t = { id: crypto.randomUUID(), sport, minutes, intensity, time };
  const list = ensureDay(st, k).trainings;
  list.push(t);
  list.sort((a, b) => a.time.localeCompare(b.time));
  return t;
}

// Geeft een functie terug die het verwijderen ongedaan maakt. list: 'items' of 'trainings'
function removeItem(st, k, id, list = 'items') {
  const items = getDay(st, k)[list];
  const i = items.findIndex(x => x.id === id);
  if (i < 0) return () => {};
  const [gone] = items.splice(i, 1);
  return () => items.splice(i, 0, gone);
}

const totals = items => items.reduce((t, x) => ({
  kcal: t.kcal + x.kcal, carbs: t.carbs + x.carbs, protein: t.protein + x.protein,
  fat: t.fat + x.fat, fiber: t.fiber + x.fiber,
}), { kcal: 0, carbs: 0, protein: 0, fat: 0, fiber: 0 });

function loadState(storage) {
  const raw = storage.getItem(KEY);
  if (!raw) return emptyState();
  try {
    const st = JSON.parse(raw);
    if (!st || typeof st.days !== 'object' || Array.isArray(st.days)) throw new Error('onverwachte vorm');
    return st;
  } catch {
    storage.setItem(KEY + ':kapot', raw); // niet overschrijven zonder kopie
    return emptyState();
  }
}

const saveState = (storage, st) => storage.setItem(KEY, JSON.stringify(st));

/* ---------- Gegevens voor de coach ---------- */

const hhmm = ts => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const r0 = n => Math.round(n);
const macroText = t => `${r0(t.kcal)} kcal, ${r0(t.carbs)} g koolh., ${r0(t.protein)} g eiwit, ${r0(t.fat)} g vet, ${r0(t.fiber)} g vezels`;
const trainingText = t => `${SPORTS[t.sport]} ${t.minutes} min, ${INTENSITIES[t.intensity].toLowerCase()}, om ${t.time}`;
const perKg = g => (g / BODY_KG).toFixed(1).replace('.', ',');
const weekday = k => parseKey(k).toLocaleDateString('nl-NL', { weekday: 'long' });

function coachContext(st, k, now = new Date()) {
  const day = getDay(st, k);
  const today = dateKey(now);
  const left = daysBetween(k, RACE_DATE);
  const t = totals(day.items);
  const lines = [
    `Atleet: ${BODY_KG} kg, traint voor Ironman Barcelona op zondag 3 oktober 2027 (nog ${left} dagen, ca. ${Math.floor(left / 7)} weken).`,
    k === today ? `Het is nu ${hhmm(now)} op ${weekday(k)} ${k}.` : `Dit gesprek gaat over ${weekday(k)} ${k} (vandaag is ${today}).`,
    '',
    `Trainingen op ${k}:`,
    ...(day.trainings.length ? day.trainings.map(x => '- ' + trainingText(x)) : ['- geen ingevoerd']),
    '',
    `Gegeten op ${k} (tijd = moment van invoeren):`,
    ...(day.items.length ? day.items.map(i => `- ${hhmm(i.at)} ${i.name}${i.desc ? ` (${i.desc})` : ''}: ${macroText(i)}`) : ['- nog niets ingevoerd']),
    `Totaal: ${macroText(t)} (${perKg(t.carbs)} g/kg koolh., ${perKg(t.protein)} g/kg eiwit).`,
    '',
    'Afgelopen 7 dagen:',
  ];
  const before = lines.length;
  for (let n = 7; n >= 1; n--) {
    const dk = shiftDate(k, -n);
    const d = st.days[dk];
    if (!d || (!d.items.length && !d.trainings.length)) continue;
    lines.push(`- ${weekday(dk)} ${dk}: ${d.items.length ? macroText(totals(d.items)) : 'geen eten ingevoerd'}; training: ${d.trainings.map(trainingText).join('; ') || 'geen'}`);
  }
  if (lines.length === before) lines.push('- geen gegevens');
  return lines.join('\n');
}

/* ---------- Instellingen ---------- */

const MODELS = [
  { id: 'claude-sonnet-5-5', name: 'Sonnet 5.5', note: 'Standaard · slim en betaalbaar' },
  { id: 'claude-opus-5-5', name: 'Opus 5.5', note: 'Slimste advies · ongeveer 2× duurder' },
  { id: 'claude-haiku-5-5', name: 'Haiku 5.5', note: 'Snelst · veel goedkoper, minder diepgaand' },
];
const getModel = storage => {
  const m = storage.getItem(KEY + ':model');
  return MODELS.some(x => x.id === m) ? m : MODELS[0].id;
};
const setModel = (storage, id) => storage.setItem(KEY + ':model', id);

/* ---------- API-sleutel, versleuteld ----------
   De sleutel wordt versleuteld met een AES-sleutel die alleen op dit toestel bestaat
   (in IndexedDB, 'non-extractable': de app kan hem gebruiken maar nooit uitlezen). */

const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function encryptText(key, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text));
  return { iv: b64(iv), data: b64(data) };
}

async function decryptText(key, { iv, data }) {
  const buf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(data));
  return new TextDecoder().decode(buf);
}

function deviceKey() {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('ironfuel', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('keys');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const get = db.transaction('keys').objectStore('keys').get('main');
      get.onerror = () => reject(get.error);
      get.onsuccess = async () => {
        if (get.result) return resolve(get.result);
        const k = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
        const put = db.transaction('keys', 'readwrite').objectStore('keys').put(k, 'main');
        put.onsuccess = () => resolve(k);
        put.onerror = () => reject(put.error);
      };
    };
  });
}

async function saveApiKey(storage, text) {
  storage.setItem(KEY + ':apikey', JSON.stringify(await encryptText(await deviceKey(), text)));
}

async function loadApiKey(storage) {
  const raw = storage.getItem(KEY + ':apikey');
  if (!raw) return '';
  try { return await decryptText(await deviceKey(), JSON.parse(raw)); }
  catch { return ''; } // apparaatsleutel kwijt → opnieuw invullen
}

const clearApiKey = storage => storage.removeItem(KEY + ':apikey');

if (typeof module !== 'undefined') module.exports = {
  KEY, RACE_DATE, BODY_KG, dateKey, shiftDate, daysBetween, emptyState, getDay, ensureDay,
  addItem, removeItem, totals, loadState, saveState, SPORTS, INTENSITIES, addTraining, manualItem, coachContext,
  MODELS, getModel, setModel, encryptText, decryptText,
};
