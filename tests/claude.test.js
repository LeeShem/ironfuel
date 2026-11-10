const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../app/claude.js');

const reply = (text, extra = {}) => ({ stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: '' }, { type: 'text', text }], ...extra });
const good = { name: 'Pad thai met kip', kcal: 720, carbs: 85, protein: 32, fat: 26, fiber: 5, note: 'Restaurantportie van ca. 400 g.' };

test('goede schatting wordt uitgelezen', () => {
  assert.deepEqual(C.parseEstimate(reply(JSON.stringify(good))), good);
});

test('schatting: afwijzing door Claude geeft een duidelijke melding', () => {
  assert.throws(() => C.parseEstimate({ stop_reason: 'refusal', content: [] }), /wil hier niet op antwoorden/);
});

test('schatting: geen geldige JSON', () => {
  assert.throws(() => C.parseEstimate(reply('ongeveer 700 kcal')), /onbruikbaar antwoord/);
});

test('schatting: negatieve of ontbrekende getallen worden geweigerd', () => {
  assert.throws(() => C.parseEstimate(reply(JSON.stringify({ ...good, kcal: -5 }))), /onbruikbaar antwoord/);
  const { fat, ...noFat } = good;
  assert.throws(() => C.parseEstimate(reply(JSON.stringify(noFat))), /onbruikbaar antwoord/);
  assert.throws(() => C.parseEstimate(reply(JSON.stringify({ ...good, name: '' }))), /onbruikbaar antwoord/);
});

test('afgebroken antwoord zonder tekst', () => {
  assert.throws(() => C.replyText({ stop_reason: 'max_tokens', content: [] }), /afgebroken/);
});

test('tekst van meerdere blokken wordt samengevoegd, andere blokken genegeerd', () => {
  const r = { stop_reason: 'end_turn', content: [{ type: 'fallback' }, { type: 'text', text: 'Eet ' }, { type: 'text', text: 'rijst.' }] };
  assert.equal(C.replyText(r), 'Eet rijst.');
});

test('foutmeldingen in gewoon Nederlands', () => {
  assert.match(C.claudeError(401, {}), /API-sleutel klopt niet/);
  assert.match(C.claudeError(400, { error: { message: 'Your credit balance is too low' } }), /tegoed/);
  assert.match(C.claudeError(429, {}), /te veel verzoeken/);
  assert.match(C.claudeError(529, {}), /overbelast/);
  assert.match(C.claudeError(400, { error: { message: 'iets anders' } }), /iets anders/);
});

test('verzoek: juiste headers, model en vast antwoordformaat', () => {
  const { headers, body } = C.buildRequest('claude-sonnet-5-5', C.estimateRequest('pad thai'));
  assert.equal(headers['anthropic-dangerous-direct-browser-access'], 'true');
  assert.equal(headers['anthropic-version'], '2026-10-21');
  assert.equal(body.model, 'claude-sonnet-5-5');
  assert.equal(body.output_config.format.type, 'json_schema');
  assert.deepEqual(body.output_config.format.schema.required.sort(), ['carbs', 'fat', 'fiber', 'kcal', 'name', 'note', 'protein']);
  assert.equal(body.messages[0].content, 'pad thai');
  assert.ok(!('x-api-key' in headers)); // sleutel pas bij versturen toegevoegd
});

test('vangnet bij weigering alleen voor Sonnet en Opus', () => {
  assert.equal(C.buildRequest('claude-opus-5-5', C.estimateRequest('x')).body.fallbacks, 'default');
  const h = C.buildRequest('claude-haiku-5-5', C.estimateRequest('x'));
  assert.equal(h.body.fallbacks, undefined);
  assert.equal(h.headers['anthropic-beta'], undefined);
});

test('zonder sleutel: melding om hem in te vullen', async () => {
  await assert.rejects(C.askClaude('', 'claude-sonnet-5-5', C.estimateRequest('x')), /Instellingen/);
});

test('coach: gesprek gaat mee, begint altijd met een vraag van jou, gegevens in de systeemtekst', () => {
  const chat = [{ role: 'assistant', text: 'oud' }, { role: 'user', text: 'Wat eet ik na het fietsen?' }];
  const r = C.coachRequest('CONTEXT-XYZ', chat, ['Brinta met melk', 'Skyr-bowl']);
  assert.deepEqual(r.messages, [{ role: 'user', content: 'Wat eet ik na het fietsen?' }]);
  assert.match(r.system, /CONTEXT-XYZ/);
  assert.match(r.system, /Skyr-bowl/);
  assert.equal(r.format, undefined);
});

test('coach: hooguit de laatste 20 berichten', () => {
  const chat = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', text: 'm' + i }));
  const r = C.coachRequest('', chat, []);
  assert.ok(r.messages.length <= 20);
  assert.equal(r.messages[0].role, 'user');
  assert.equal(r.messages.at(-1).content, 'm28'); // eindigt altijd met een vraag (m29 is een antwoord)
});

test('antwoord van Claude wordt veilig opgemaakt', () => {
  const html = C.renderMarkdown('<img src=x onerror=alert(1)> **Herstel**\n- 1 banaan\n- skyr\n\n1. eerst\n2. dan\n## Kop');
  assert.ok(!html.includes('<img'));
  assert.match(html, /&lt;img/);
  assert.match(html, /<strong>Herstel<\/strong>/);
  assert.match(html, /<ul><li>1 banaan<\/li><li>skyr<\/li><\/ul>/);
  assert.match(html, /<ol><li>eerst<\/li><li>dan<\/li><\/ol>/);
  assert.match(html, /<p><strong>Kop<\/strong><\/p>/);
});
