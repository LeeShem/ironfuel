'use strict';
// Schermen en knoppen. Rekenwerk staat in meals.js, opslag in store.js.

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const nl = (n, d = 0) => n.toLocaleString('nl-NL', { maximumFractionDigits: d });

const state = loadState(localStorage);
let current = dateKey();

function persist() {
  try { saveState(localStorage, state); }
  catch { alert('Opslaan is mislukt. Is de opslag van je telefoon vol?'); }
}

// Foto ontbreekt → toon de letter eronder
document.addEventListener('error', e => { if (e.target.tagName === 'IMG') e.target.remove(); }, true);
const thumb = (img, name) => `<span class="thumb" aria-hidden="true">${esc(name[0])}${img ? `<img src="${esc(img)}" alt="">` : ''}</span>`;

/* ---------- Menubalk ---------- */
document.querySelector('.tabbar').addEventListener('click', e => {
  const b = e.target.closest('button[data-view]');
  if (b) showView(b.dataset.view);
});
function showView(v) {
  document.body.dataset.view = v;
  if (v === 'coach') renderCoach();
  document.querySelectorAll('.view').forEach(s => { s.hidden = s.id !== 'view-' + v; });
  document.querySelectorAll('.tabbar button').forEach(b =>
    b.dataset.view === v ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  window.scrollTo(0, 0);
}

/* ---------- Vandaag ---------- */
const TRASH = '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';
const SPORT_ICON = { zwemmen: '🏊', fietsen: '🚴', lopen: '🏃' };
function dateText(k) {
  const diff = daysBetween(dateKey(), k);
  if (diff === 0) return 'Vandaag';
  if (diff === -1) return 'Gisteren';
  if (diff === 1) return 'Morgen';
  const d = new Date(k + 'T12:00');
  return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
}

function renderToday() {
  $('#dateLabel').textContent = dateText(current);
  const day = getDay(state, current);
  const t = totals(day.items);
  const e = t.carbs * 4 + t.protein * 4 + t.fat * 9 || 1;
  const pct = x => Math.round(x / e * 100);
  const perKg = x => `${nl(x / BODY_KG, 1)} g/kg`;
  $('#summary').innerHTML = `
    <div class="card hero">
      <div class="kcal"><b class="num">${nl(t.kcal)}</b><span>kcal</span></div>
      <div class="split" aria-hidden="true">
        <i class="c" style="width:${pct(t.carbs * 4)}%"></i><i class="p" style="width:${pct(t.protein * 4)}%"></i><i class="f" style="width:${pct(t.fat * 9)}%"></i>
      </div>
      <div class="macros">
        <div class="macro c"><b class="num">${nl(t.carbs)} g</b><span>Koolh.</span><small>${perKg(t.carbs)}</small></div>
        <div class="macro p"><b class="num">${nl(t.protein)} g</b><span>Eiwit</span><small>${perKg(t.protein)}</small></div>
        <div class="macro f"><b class="num">${nl(t.fat)} g</b><span>Vet</span><small>${pct(t.fat * 9)}% energie</small></div>
        <div class="macro v"><b class="num">${nl(t.fiber)} g</b><span>Vezels</span></div>
      </div>
    </div>`;
  $('#trainings').innerHTML = day.trainings.map(t => `
    <li>
      <span class="thumb sport" aria-hidden="true">${SPORT_ICON[t.sport]}</span>
      <div class="txt"><b>${SPORTS[t.sport]} · ${t.minutes} min</b><small>${INTENSITIES[t.intensity]} · ${esc(t.time)}</small></div>
      <button class="icon-btn" data-del-training="${esc(t.id)}" aria-label="Training ${SPORTS[t.sport].toLowerCase()} verwijderen">${TRASH}</button>
    </li>`).join('');
  $('#items').innerHTML = day.items.map(i => `
    <li>
      ${thumb(i.img, i.name)}
      <div class="txt"><b>${esc(i.name)}</b><small>${esc(i.desc || '')}</small></div>
      <span class="kc num">${nl(i.kcal)}</span>
      <button class="icon-btn" data-del="${esc(i.id)}" aria-label="${esc(i.name)} verwijderen">${TRASH}</button>
    </li>`).join('');
  $('#emptyToday')?.remove();
  if (!day.items.length) $('#items').insertAdjacentHTML('afterend', `
    <div id="emptyToday" class="card empty-card"><p>Nog niets gelogd${current === dateKey() ? ' vandaag' : ''}.</p>
    <button class="secondary" data-goto="food">Eten toevoegen</button></div>`);
}

$('#prevDay').onclick = () => { current = shiftDate(current, -1); renderToday(); };
$('#nextDay').onclick = () => { current = shiftDate(current, 1); renderToday(); };
$('#dateLabel').onclick = () => { current = dateKey(); renderToday(); };

$('#view-today').addEventListener('click', e => {
  const del = e.target.closest('[data-del]');
  if (del) {
    const it = getDay(state, current).items.find(i => i.id === del.dataset.del);
    const undo = removeItem(state, current, del.dataset.del);
    persist(); renderToday();
    toast(`${it.name} verwijderd`, () => { undo(); persist(); renderToday(); });
  }
  const delT = e.target.closest('[data-del-training]');
  if (delT) {
    const undo = removeItem(state, current, delT.dataset.delTraining, 'trainings');
    persist(); renderToday();
    toast('Training verwijderd', () => { undo(); persist(); renderToday(); });
  }
  if (e.target.closest('[data-goto]')) showView('food');
});

/* ---------- Eten ---------- */
function renderFood() {
  $('#mealGrid').innerHTML = MEALS.map(m => `
    <button class="tile" data-meal="${m.id}">
      <span class="ph" aria-hidden="true">${esc(m.name[0])}<img src="${m.img}" alt="" loading="lazy"></span>
      <span class="meta"><b>${esc(m.name)}</b><small class="num">± ${nl(calc(m, defaults(m)).kcal)} kcal</small></span>
    </button>`).join('');
}
$('#mealGrid').addEventListener('click', e => {
  const b = e.target.closest('[data-meal]');
  if (b) openMeal(MEALS.find(m => m.id === b.dataset.meal));
});

/* ---------- Eigen maaltijd via Claude ---------- */
let pendingEstimate = null;
$('#estimateBtn').onclick = async () => {
  const text = $('#customText').value.trim();
  if (!text) return toast('Beschrijf eerst wat je hebt gegeten');
  const btn = $('#estimateBtn');
  btn.disabled = true; btn.textContent = 'Claude schat…';
  $('#estimate').innerHTML = '';
  try {
    const e = await estimateMeal(await loadApiKey(localStorage), getModel(localStorage), text);
    pendingEstimate = { ...e, text };
    $('#estimate').innerHTML = `
      <div class="estimate">
        <b>${esc(e.name)}</b>
        <div class="live">${liveLine(e)}</div>
        <p class="hint">${esc(e.note)}</p>
        <div class="btns">
          <button type="button" class="primary" data-est="add">Toevoegen aan ${esc(dateText(current).toLowerCase())}</button>
          <button type="button" class="link" data-est="cancel">Annuleer</button>
        </div>
      </div>`;
  } catch (err) {
    $('#estimate').innerHTML = `<p class="error" role="alert">${esc(err.message)}</p>`;
  } finally {
    btn.disabled = false; btn.textContent = 'Laat Claude schatten';
  }
};
$('#estimate').addEventListener('click', e => {
  const act = e.target.closest('[data-est]')?.dataset.est;
  if (!act) return;
  if (act === 'add' && pendingEstimate) {
    const { text, note, ...r } = pendingEstimate;
    const it = addItem(state, current, { mealId: null, img: null, desc: text, ...r });
    persist(); renderToday();
    toast(`${r.name} toegevoegd · ${nl(r.kcal)} kcal`, () => { removeItem(state, current, it.id); persist(); renderToday(); });
    $('#customText').value = '';
  }
  pendingEstimate = null;
  $('#estimate').innerHTML = '';
});

/* ---------- Invulscherm ---------- */
const sheet = $('#sheet');
sheet.addEventListener('click', e => { if (e.target === sheet) sheet.close(); }); // tik naast het scherm
const sheetHead = (title, img) => `
    <div class="sheet-head">
      ${img !== undefined ? thumb(img, title) : ''}
      <div class="t"><h2 id="sheetTitle" tabindex="-1" autofocus>${esc(title)}</h2></div>
      <button type="button" class="icon-btn" data-act="close" aria-label="Sluiten"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>`;
const fmtAmount = n => nl(n, 2);

function liveLine(r) {
  return `<b class="num">${nl(r.kcal)} kcal</b>
    <span class="num">K ${nl(r.carbs)} · E ${nl(r.protein)} · V ${nl(r.fat)} · Vz ${nl(r.fiber)} g</span>`;
}

function openMeal(meal) {
  const sel = defaults(meal);
  const rows = meal.vars.map(v => `
    <div class="row" data-var="${v.id}">
      <div class="row-main">
        <span class="row-label" id="lbl-${v.id}">${esc(v.label)}</span>
        <div class="stepper">
          <button type="button" data-step="-1" aria-label="Minder ${esc(v.label)}">−</button>
          <label><input type="text" inputmode="decimal" value="${fmtAmount(v.def)}" aria-labelledby="lbl-${v.id}"><span class="u">${esc(v.unit === 'portie' ? '×' : v.unit)}</span></label>
          <button type="button" data-step="1" aria-label="Meer ${esc(v.label)}">+</button>
        </div>
      </div>
      ${v.options ? `<div class="chips" role="group" aria-label="Soort ${esc(v.label.toLowerCase())}">${v.options.map(o =>
        `<button type="button" class="chip" data-opt="${o.id}" aria-pressed="${o.id === v.optDef}">${esc(o.label)}</button>`).join('')}</div>` : ''}
    </div>`).join('');

  sheet.innerHTML = `${sheetHead(meal.name, meal.img)}
    <div class="sheet-body">${rows}</div>
    <div class="sheet-foot">
      <div class="live">${liveLine(calc(meal, sel))}</div>
      <button type="button" class="primary" data-act="add">Toevoegen aan ${esc(dateText(current).toLowerCase())}</button>
    </div>`;

  const update = () => { sheet.querySelector('.live').innerHTML = liveLine(calc(meal, sel)); };
  sheet.onchange = null;

  sheet.oninput = e => {
    const row = e.target.closest('[data-var]');
    if (!row) return;
    const n = parseFloat(e.target.value.replace(',', '.'));
    sel.amounts[row.dataset.var] = Number.isFinite(n) ? Math.max(0, n) : 0;
    update();
  };
  sheet.onfocusin = e => { if (e.target.tagName === 'INPUT') e.target.select(); };
  sheet.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    const row = b.closest('[data-var]');
    if (b.dataset.step) {
      const v = meal.vars.find(x => x.id === row.dataset.var);
      const n = Math.max(0, +(sel.amounts[v.id] + v.step * b.dataset.step).toFixed(2));
      sel.amounts[v.id] = n;
      row.querySelector('input').value = fmtAmount(n);
      update();
    } else if (b.dataset.opt) {
      sel.choices[row.dataset.var] = b.dataset.opt;
      row.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === b));
      update();
    } else if (b.dataset.act === 'add') {
      const r = calc(meal, sel);
      if (r.kcal <= 0) return toast('Vul eerst een hoeveelheid in');
      const it = addItem(state, current, { mealId: meal.id, name: meal.name, img: meal.img, desc: describe(meal, sel), ...r });
      persist(); sheet.close(); renderToday();
      toast(`${meal.name} toegevoegd · ${nl(r.kcal)} kcal`, () => {
        removeItem(state, current, it.id); persist(); renderToday();
      });
    } else if (b.dataset.act === 'close') sheet.close();
  };
  sheet.showModal();
}

/* ---------- Training toevoegen ---------- */
function openTraining() {
  const now = new Date();
  const t = { sport: 'fietsen', minutes: 60, intensity: 'gemiddeld',
    time: `${String(now.getHours()).padStart(2, '0')}:${now.getMinutes() < 30 ? '00' : '30'}` };
  const chips = (key, opts) => `<div class="chips" role="group" aria-label="${key === 'sport' ? 'Sport' : 'Intensiteit'}">${Object.entries(opts).map(([id, label]) =>
    `<button type="button" class="chip" data-key="${key}" data-val="${id}" aria-pressed="${t[key] === id}">${key === 'sport' ? SPORT_ICON[id] + ' ' : ''}${label}</button>`).join('')}</div>`;
  sheet.innerHTML = `${sheetHead('Training')}
    <div class="sheet-body">
      <div class="row"><span class="row-label">Sport</span>${chips('sport', SPORTS)}</div>
      <div class="row"><div class="row-main">
        <span class="row-label" id="lbl-min">Duur</span>
        <div class="stepper">
          <button type="button" data-min="-15" aria-label="15 minuten korter">−</button>
          <label><input id="tMin" type="text" inputmode="numeric" value="${t.minutes}" aria-labelledby="lbl-min"><span class="u">min</span></label>
          <button type="button" data-min="15" aria-label="15 minuten langer">+</button>
        </div>
      </div></div>
      <div class="row"><span class="row-label">Intensiteit</span>${chips('intensity', INTENSITIES)}</div>
      <div class="row"><div class="row-main">
        <label class="row-label" for="tTime">Tijdstip</label>
        <input id="tTime" class="field time" type="time" value="${t.time}">
      </div></div>
    </div>
    <div class="sheet-foot"><button type="button" class="primary" data-act="addtraining">Training toevoegen aan ${esc(dateText(current).toLowerCase())}</button></div>`;
  sheet.onchange = null;
  sheet.onfocusin = e => { if (e.target.id === 'tMin') e.target.select(); };
  sheet.oninput = e => {
    if (e.target.id === 'tMin') t.minutes = parseInt(e.target.value, 10) || 0;
    if (e.target.id === 'tTime') t.time = e.target.value;
  };
  sheet.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.key) {
      t[b.dataset.key] = b.dataset.val;
      b.parentElement.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === b));
    } else if (b.dataset.min) {
      t.minutes = Math.max(15, t.minutes + Number(b.dataset.min));
      $('#tMin').value = t.minutes;
    } else if (b.dataset.act === 'addtraining') {
      try { addTraining(state, current, t); }
      catch { return toast('Vul een duur en een tijdstip in'); }
      persist(); sheet.close(); renderToday();
      toast(`${SPORTS[t.sport]} ${t.minutes} min toegevoegd`);
    } else if (b.dataset.act === 'close') sheet.close();
  };
  sheet.showModal();
}
$('#addTraining').onclick = openTraining;

/* ---------- Coach ---------- */
let coachBusy = false;
const scrollChat = () => window.scrollTo(0, document.body.scrollHeight);

function renderCoach(error) {
  const chat = getDay(state, current).chat;
  $('#coachDate').textContent = dateText(current);
  $('#newChat').hidden = !chat.length || coachBusy;
  $('#chat').innerHTML = (chat.length ? chat.map(m =>
    `<div class="msg ${m.role}">${m.role === 'user' ? esc(m.text) : renderMarkdown(m.text)}</div>`).join('')
    : `<p class="coach-intro">Vraag je coach om advies over eten en herstel. Claude ziet wat je ${current === dateKey() ? 'vandaag' : 'op deze dag'} hebt gegeten en getraind, en een samenvatting van de week ervoor.</p>`)
    + (coachBusy ? '<div class="msg assistant typing" role="status" aria-label="Coach denkt na"><i></i><i></i><i></i></div>' : '')
    + (error ? `<div class="msg error" role="alert">${esc(error)}</div>` : '');
  document.querySelectorAll('.quick .chip, .send').forEach(b => { b.disabled = coachBusy; });
}

async function ask(text) {
  text = text.trim();
  if (!text || coachBusy) return;
  const k = current, day = ensureDay(state, k);
  day.chat.push({ role: 'user', text });
  persist();
  coachBusy = true;
  $('#askText').value = ''; growAsk();
  renderCoach(); scrollChat();
  let error;
  try {
    const req = coachRequest(coachContext(state, k), day.chat, MEALS.map(m => m.name));
    const data = await askClaude(await loadApiKey(localStorage), getModel(localStorage), req);
    day.chat.push({ role: 'assistant', text: replyText(data) });
  } catch (err) {
    error = err.message;
    day.chat.pop(); // vraag niet bewaren, maar terugzetten zodat je hem opnieuw kunt sturen
    if (!$('#askText').value) { $('#askText').value = text; growAsk(); }
  } finally {
    coachBusy = false;
    persist();
    if (k === current) { renderCoach(error); scrollChat(); }
  }
}

const growAsk = () => { const t = $('#askText'); t.style.height = 'auto'; t.style.height = t.scrollHeight + 2 + 'px'; /* +2 = rand */ };
$('#askText').addEventListener('input', growAsk);
$('#askForm').addEventListener('submit', e => { e.preventDefault(); ask($('#askText').value); });
document.querySelector('.quick').addEventListener('click', e => {
  const b = e.target.closest('.chip');
  if (b) ask(b.textContent);
});
$('#newChat').onclick = () => {
  if (!confirm('Gesprek van deze dag wissen en opnieuw beginnen?')) return;
  getDay(state, current).chat.length = 0;
  persist(); renderCoach();
};

/* ---------- Instellingen ---------- */
const mask = k => k.slice(0, 10) + '…' + k.slice(-4);
let CREDITS = [];
fetch('credits.json').then(r => r.json()).then(c => { CREDITS = c; }).catch(() => {});

async function openSettings() {
  const key = await loadApiKey(localStorage);
  const model = getModel(localStorage);
  sheet.innerHTML = `${sheetHead('Instellingen')}
    <div class="sheet-body">
      <div class="row">
        <label class="row-label" for="apiKey">Claude API-sleutel</label>
        <p class="hint ${key ? 'ok' : ''}" id="keyStatus">${key ? `✓ Opgeslagen: ${esc(mask(key))}` : 'Nog geen sleutel ingevuld.'}</p>
        <input id="apiKey" class="field" type="password" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"
               placeholder="${key ? 'Nieuwe sleutel plakken' : 'sk-ant-…'}" aria-describedby="keyStatus keyHelp">
        <div class="btns">
          <button type="button" class="secondary" data-act="savekey">Opslaan</button>
          ${key ? '<button type="button" class="link" data-act="delkey">Verwijderen</button>' : ''}
        </div>
        <p class="hint" id="keyHelp">Een sleutel maak je op console.anthropic.com bij <i>API Keys</i>. Hij wordt versleuteld op deze telefoon bewaard en gaat alleen naar Anthropic.</p>
      </div>
      <div class="row">
        <span class="row-label" id="modelLbl">Claude-model</span>
        <div class="options" role="radiogroup" aria-labelledby="modelLbl">
          ${MODELS.map(m => `<label class="opt"><input type="radio" name="model" value="${m.id}" ${m.id === model ? 'checked' : ''}>
            <span><b>${esc(m.name)}</b><small>${esc(m.note)}</small></span></label>`).join('')}
        </div>
      </div>
      <div class="row">
        <details class="credits"><summary class="row-label">Bronvermelding foto's</summary>
          <p class="hint">Alle foto's komen van Wikimedia Commons en zijn bijgesneden en verkleind.</p>
          <ul>${CREDITS.map(c => `<li><b>${esc(c.meal)}</b>: <a href="${esc(c.page)}" target="_blank" rel="noopener">${esc(c.title)}</a>, ${esc(c.artist)}, ${esc(c.license)}</li>`).join('')}</ul>
        </details>
      </div>
    </div>`;
  sheet.oninput = null;
  sheet.onfocusin = null;
  sheet.onchange = e => {
    if (e.target.name !== 'model') return;
    setModel(localStorage, e.target.value);
    toast(`Model: ${MODELS.find(m => m.id === e.target.value).name}`);
  };
  sheet.onclick = async e => {
    const act = e.target.closest('button')?.dataset.act;
    if (act === 'close') sheet.close();
    if (act === 'savekey') {
      const v = $('#apiKey').value.trim();
      if (!v) return toast('Plak eerst je sleutel in het veld');
      if (!/^sk-ant-\S{20,}$/.test(v)) return toast('Dit lijkt geen Claude-sleutel (begint met sk-ant-)');
      try { await saveApiKey(localStorage, v); }
      catch { return toast('Opslaan van de sleutel is mislukt'); }
      toast('Sleutel veilig opgeslagen');
      openSettings();
    }
    if (act === 'delkey' && confirm('Sleutel van deze telefoon verwijderen?')) {
      clearApiKey(localStorage);
      toast('Sleutel verwijderd');
      openSettings();
    }
  };
  if (!sheet.open) sheet.showModal();
}
$('#openSettings').onclick = openSettings;

/* ---------- Melding met 'ongedaan maken' ---------- */
let toastTimer;
function toast(msg, undo) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button type="button">Ongedaan</button>' : ''}`;
  t.hidden = false;
  if (undo) t.querySelector('button').onclick = () => { undo(); t.hidden = true; };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 4000);
}

/* ---------- Start ---------- */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
const weeks = Math.floor(daysBetween(dateKey(), RACE_DATE) / 7);
$('#countdown').textContent = weeks >= 0 ? `nog ${weeks} weken tot Barcelona` : 'Ironman Barcelona ✓';
renderFood();
renderToday();
// Na middernacht automatisch naar de nieuwe dag als je op 'vandaag' stond
let lastToday = dateKey();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const today = dateKey();
  if (current === lastToday && today !== lastToday) { current = today; renderToday(); }
  lastToday = today;
});
