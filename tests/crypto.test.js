const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../app/store.js');

const newKey = () => crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
const fakeStorage = () => ({ data: {}, getItem(k) { return this.data[k] ?? null; }, setItem(k, v) { this.data[k] = String(v); } });
const SECRET = 'sk-ant-api03-voorbeeldsleutel-1234';

test('versleutelen en weer ontsleutelen geeft de sleutel terug', async () => {
  const k = await newKey();
  assert.equal(await S.decryptText(k, await S.encryptText(k, SECRET)), SECRET);
});

test('de versleutelde tekst bevat de sleutel niet', async () => {
  const blob = JSON.stringify(await S.encryptText(await newKey(), SECRET));
  assert.ok(!blob.includes('sk-ant'));
  assert.ok(!blob.includes('voorbeeldsleutel'));
});

test('twee keer versleutelen geeft verschillende uitkomst', async () => {
  const k = await newKey();
  assert.notDeepEqual(await S.encryptText(k, SECRET), await S.encryptText(k, SECRET));
});

test('met een andere apparaatsleutel lukt ontsleutelen niet', async () => {
  const blob = await S.encryptText(await newKey(), SECRET);
  await assert.rejects(S.decryptText(await newKey(), blob));
});

test('apparaatsleutel kan niet worden uitgelezen', async () => {
  const k = await newKey();
  await assert.rejects(crypto.subtle.exportKey('raw', k));
});

test('model: standaard Sonnet 5.5, onbekende waarde valt terug op standaard', () => {
  const st = fakeStorage();
  assert.equal(S.getModel(st), 'claude-sonnet-5-5');
  S.setModel(st, 'claude-haiku-5-5');
  assert.equal(S.getModel(st), 'claude-haiku-5-5');
  st.setItem(S.KEY + ':model', 'iets-raars');
  assert.equal(S.getModel(st), 'claude-sonnet-5-5');
});

test('drie modellen kiesbaar', () => {
  assert.deepEqual(S.MODELS.map(m => m.id), ['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-haiku-5-5']);
});
