// Verbinding met de Claude API (rechtstreeks vanaf de telefoon, met je eigen sleutel).

const API_URL = 'https://api.anthropic.com/v1/messages';
const FALLBACK_MODELS = ['claude-sonnet-5-5', 'claude-opus-5-5']; // server-side vangnet bij weigering

function buildRequest(model, { system, messages, effort = 'medium', maxTokens = 8000, format }) {
  const body = { model, max_tokens: maxTokens, system, messages, output_config: { effort } };
  if (format) body.output_config.format = { type: 'json_schema', schema: format };
  const headers = {
    'content-type': 'application/json',
    'anthropic-version': '2026-10-21',
    'anthropic-dangerous-direct-browser-access': 'true', // nodig voor verzoeken vanuit een browser
  };
  if (FALLBACK_MODELS.includes(model)) {
    body.fallbacks = 'default';
    headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
  }
  return { headers, body };
}

function claudeError(status, data) {
  const msg = data?.error?.message || '';
  if (status === 401) return 'Je API-sleutel klopt niet. Controleer hem bij Instellingen.';
  if (status === 403) return 'Deze API-sleutel heeft geen toegang. Controleer hem op console.anthropic.com.';
  if (/credit balance/i.test(msg)) return 'Je Anthropic-tegoed is op. Waardeer het op via console.anthropic.com.';
  if (status === 429) return 'Even te veel verzoeken. Wacht een minuutje en probeer het opnieuw.';
  if (status === 529 || status >= 500) return 'Claude is even overbelast. Probeer het zo opnieuw.';
  return `Claude gaf een fout (${status})${msg ? ': ' + msg : ''}.`;
}

async function askClaude(apiKey, model, opts) {
  if (!apiKey) throw new Error('Vul eerst je API-sleutel in bij Instellingen (tandwieltje rechtsboven).');
  const { headers, body } = buildRequest(model, opts);
  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: { ...headers, 'x-api-key': apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });
  } catch (e) {
    throw new Error(e.name === 'TimeoutError'
      ? 'Claude deed er te lang over. Probeer het opnieuw.'
      : 'Geen verbinding met Claude. Heb je internet?');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(claudeError(res.status, data));
  return data;
}

function replyText(data) {
  if (data.stop_reason === 'refusal') throw new Error('Claude wil hier niet op antwoorden. Probeer het anders te formuleren.');
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  if (!text) throw new Error(data.stop_reason === 'max_tokens'
    ? 'Het antwoord werd te lang en is afgebroken. Probeer het opnieuw.'
    : 'Claude gaf een leeg antwoord. Probeer het opnieuw.');
  return text;
}

/* ---------- Eigen maaltijd schatten ---------- */

const NUMS = ['kcal', 'carbs', 'protein', 'fat', 'fiber'];
const ESTIMATE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Korte Nederlandse naam van de maaltijd, max. 40 tekens' },
    kcal: { type: 'number' }, carbs: { type: 'number' }, protein: { type: 'number' },
    fat: { type: 'number' }, fiber: { type: 'number' },
    note: { type: 'string', description: 'Eén korte zin met de aannames (portiegrootte, bereiding)' },
  },
  required: ['name', ...NUMS, 'note'],
  additionalProperties: false,
};

const estimateRequest = description => ({
  system: 'Je bent een sportdiëtist. Schat de voedingswaarden van de maaltijd die de gebruiker beschrijft. '
    + 'Staat er geen hoeveelheid bij, ga dan uit van een normale Nederlandse portie. '
    + 'Geef kcal en grammen koolhydraten (carbs), eiwit (protein), vet (fat) en vezels (fiber) voor de hele beschreven hoeveelheid. '
    + 'Schrijf name en note in het Nederlands.',
  messages: [{ role: 'user', content: description }],
  effort: 'low',
  maxTokens: 4000,
  format: ESTIMATE_SCHEMA,
});

function parseEstimate(data) {
  const text = replyText(data);
  const bad = new Error('Claude gaf een onbruikbaar antwoord. Probeer het opnieuw of beschrijf de maaltijd anders.');
  let e;
  try { e = JSON.parse(text); } catch { throw bad; }
  const okNum = n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n < 10000;
  if (typeof e?.name !== 'string' || !e.name.trim() || !NUMS.every(k => okNum(e[k]))) throw bad;
  return { name: e.name.trim().slice(0, 60), ...Object.fromEntries(NUMS.map(k => [k, e[k]])), note: String(e.note || '').slice(0, 200) };
}

const estimateMeal = async (apiKey, model, description) =>
  parseEstimate(await askClaude(apiKey, model, estimateRequest(description)));

/* ---------- Coach ---------- */

const COACH_SYSTEM = (mealNames) => `Je bent de persoonlijke sportvoedingscoach van een triatleet die traint voor Ironman Barcelona (zwemmen, fietsen, lopen). Hieronder staan de actuele gegevens uit de voedingsapp van de atleet.

Zo help je:
- Antwoord in het Nederlands, kort en praktisch: de atleet leest het op een telefoon. Gebruik korte alinea's of opsommingen en geen tabellen. Houd het rond de 150 woorden, tenzij om meer wordt gevraagd.
- Geef concrete voorstellen met hoeveelheden en tijdstip. Gebruik waar het past de standaardmaaltijden uit de app: ${mealNames.join(', ')}.
- Baseer je op actuele richtlijnen voor duursport: koolhydraten en eiwit in g/kg lichaamsgewicht, timing voor, tijdens en na training, herstel en vocht. Stem af op de trainingen van die dag, het tijdstip en wat er al gegeten is.
- De app heeft geen vaste dagdoelen. Wil de atleet doelen afspreken, bespreek die dan in dit gesprek.
- Ontbreken er gegevens (bijvoorbeeld nog niets ingevoerd), zeg dat kort en geef toch bruikbaar advies.
- Je bent geen arts. Verwijs bij gezondheidsklachten naar een arts of sportdiëtist.`;

function coachRequest(context, chat, mealNames) {
  const recent = chat.slice(-20);
  while (recent.length && recent[0].role !== 'user') recent.shift();
  while (recent.length && recent.at(-1).role !== 'user') recent.pop(); // laatste bericht moet een vraag zijn
  return {
    system: `${COACH_SYSTEM(mealNames)}\n\n<gegevens>\n${context}\n</gegevens>`,
    messages: recent.map(m => ({ role: m.role, content: m.text })),
    effort: 'medium',
    maxTokens: 8000,
  };
}

// Eenvoudige opmaak (vet, opsommingen, kopjes). Alle tekst wordt eerst ge-escaped.
function renderMarkdown(src) {
  const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const out = [];
  let list = null;
  for (const line of src.split('\n')) {
    const ul = line.match(/^\s*[-*•]\s+(.*)/), ol = line.match(/^\s*\d+[.)]\s+(.*)/), h = line.match(/^#{1,6}\s+(.*)/);
    const type = ul ? 'ul' : ol ? 'ol' : null;
    if (list && list !== type) { out.push(`</${list}>`); list = null; }
    if (type) {
      if (!list) { out.push(`<${type}>`); list = type; }
      out.push(`<li>${inline((ul || ol)[1])}</li>`);
    } else if (h) out.push(`<p><strong>${inline(h[1])}</strong></p>`);
    else if (line.trim()) out.push(`<p>${inline(line)}</p>`);
  }
  if (list) out.push(`</${list}>`);
  return out.join('');
}

if (typeof module !== 'undefined') module.exports = {
  buildRequest, claudeError, askClaude, replyText, estimateRequest, parseEstimate,
  coachRequest, renderMarkdown,
};
