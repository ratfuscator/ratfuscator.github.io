const languageSelect = document.getElementById('language');
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const obfuscateBtn = document.getElementById('obfuscateBtn');
const docsToggle = document.getElementById('docsToggle');
const docsPanel = document.getElementById('docsPanel');
const openDeobfuscatorBtn = document.getElementById('openDeobfuscatorBtn');
const deobfuscatorPanel = document.getElementById('deobfuscatorPanel');
const deobInput = document.getElementById('deobInput');
const deobOutput = document.getElementById('deobOutput');
const deobfuscateBtn = document.getElementById('deobfuscateBtn');

const PASSWORD_HASH = '4f984c7da6d8d3547204e3a4dbdc95c872919d74db9fa6c1b330e5b0437aa59a';
const SIGNAL_TOKEN = "`329`;;\n''";
const PRESET_KEYS = ['766$%', '99!rt', 'r7#11', '0xRAT', '5!gnl', '??!x9', 'rat404', 'mix777'];
const PRESET_MAP = { '766$%': 'a', '99!rt': 'e', 'r7#11': 'i', '0xRAT': 'o', '5!gnl': 'u' };
const REVERSE_PRESET_MAP = Object.fromEntries(Object.entries(PRESET_MAP).map(([k, v]) => [v, k]));
const LEET_ENCODE_MAP = { a: '4', b: '8', e: '3', g: '9', i: '1', l: '|', o: '0', s: '5', t: '7', z: '2' };
const DEOBF_ENGINE_B64 = 'ZnVuY3Rpb24gcnVuKGN0eCl7Y29uc3Qge3ZhbHVlLFNJR05BTF9UT0tFTixyZWFkUHJlc2V0U2VhbCxmcm9tQmFzZTY0LGJ5dGVTd2FwLHJvdGF0ZUJ5UHJlc2V0LGRlVG9rZW5pemVMYXllcmVkLG5vcm1hbGl6ZUxlZXR9PWN0eDtpZighdmFsdWV8fCF2YWx1ZS5zdGFydHNXaXRoKCdyYXQ6JykpcmV0dXJuICdJbnZhbGlkIGZvcm1hdDogZXhwZWN0ZWQgcmF0OiBvdXRwdXQuJztjb25zdCBwcmVzZXQ9cmVhZFByZXNldFNlYWwodmFsdWUpO2lmKCFwcmVzZXQpcmV0dXJuICdJbnZhbGlkIGZvcm1hdDogaGlkZGVuIHByZXNldCBzaWduYXR1cmUgbWlzc2luZy4nO2NvbnN0IGFmdGVyU2lnbmFsPXZhbHVlLnNwbGl0KFNJR05BTF9UT0tFTilbMV07aWYoIWFmdGVyU2lnbmFsKXJldHVybiAnSW52YWxpZCBmb3JtYXQ6IG1pc3NpbmcgaGFyZC1sYXllciBzaWduYWwgc2VjdGlvbi4nO2NvbnN0IGNodW5rcz1bLi4uYWZ0ZXJTaWduYWwubWF0Y2hBbGwoL1xbKD86WzAtOWEtel0rKVx8KFtBLVphLXowLTkrL10rKVxdL2cpXS5tYXAoKG0pPT5tWzFdKTtjb25zdCBiYXNlT25seT1jaHVua3Muam9pbignJyk7aWYoIWJhc2VPbmx5KXJldHVybiAnSW52YWxpZCBmb3JtYXQ6IG1pc3NpbmcgZW5jb2RlZCBwYXlsb2FkLic7dHJ5e2NvbnN0IHBhZGRlZD1iYXNlT25seSsnPScucmVwZWF0KCg0LShiYXNlT25seS5sZW5ndGglNCkpJTQpO2NvbnN0IHN3YXBwZWQ9ZnJvbUJhc2U2NChwYWRkZWQpO2NvbnN0IHVuU3dhcHBlZD1ieXRlU3dhcChzd2FwcGVkLHByZXNldCx0cnVlKTtjb25zdCB1blJvdGF0ZWQ9cm90YXRlQnlQcmVzZXQodW5Td2FwcGVkLHByZXNldCx0cnVlKTtjb25zdCBwYXJ0cz11blJvdGF0ZWQuc3BsaXQoJ3x8Jyk7aWYocGFydHMubGVuZ3RoPDIpcmV0dXJuIGBEZW9iZnVzY2F0aW9uIEFjY2VzcyBPS1xuUmVjb3ZlcmVkOiAke3VuUm90YXRlZH1gO2NvbnN0IHJhd1NvdXJjZUxheWVyPXBhcnRzLnNsaWNlKDEpLmpvaW4oJ3x8Jyk7Y29uc3QgdG9rZW5pemVkTGV0dGVycz1kZVRva2VuaXplTGF5ZXJlZChyYXdTb3VyY2VMYXllcik7Y29uc3Qgbm9ybWFsaXplZD1ub3JtYWxpemVMZWV0KHRva2VuaXplZExldHRlcnMpO3JldHVybiBgRGVvYmZ1c2NhdGlvbiBBY2Nlc3MgT0tcblJlY292ZXJlZCBzb3VyY2U6ICR7bm9ybWFsaXplZH1cbkJhc2UgcGF5bG9hZDogJHtwYXJ0c1swXX1gO31jYXRjaChlKXtyZXR1cm4gJ0Rlb2JmdXNjYXRpb24gZmFpbGVkOiBwYXlsb2FkIGlzIHRvbyBjb3JydXB0ZWQgb3Igbm90IGdlbmVyYXRlZCBieSB0aGlzIFJhdGZ1c2NhdG9yIHZlcnNpb24uJzt9fQ==';

function randomFrom(list) { return list[Math.floor(Math.random() * list.length)]; }
function randomDigits(length) { return Array.from({ length }, () => Math.floor(Math.random() * 10)).join(''); }
function randomChars(length) { const chars = '&@#$%*!?;:+-|~^'; return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join(''); }
function randomRatToken() { return randomFrom(['Rat', 'RAT', 'rat', 'rAt', 'RaT', 'RAt', 'raT', 'RatTT']); }
function toBase64(value) { return btoa(unescape(encodeURIComponent(value))); }
function fromBase64(value) { return decodeURIComponent(escape(atob(value))); }

function rotateByPreset(text, preset, invert = false) {
  const shift = ((preset.charCodeAt(0) + preset.charCodeAt(preset.length - 1)) % 9) + 3;
  return [...text].map((char, idx) => String.fromCharCode(char.charCodeAt(0) + (invert ? -1 : 1) * (shift + (idx % 5)))).join('');
}

function byteSwap(text, preset, invert = false) {
  const key = [...preset].reduce((acc, ch, idx) => acc + ch.charCodeAt(0) * (idx + 3), 0) % 251;
  return [...text].map((char, idx) => {
    const raw = char.charCodeAt(0);
    const signed = invert ? raw - ((key + idx * 7) % 256) : raw + ((key + idx * 7) % 256);
    return String.fromCharCode(((signed % 65535) + 65535) % 65535);
  }).join('');
}

function makePresetSeal(preset) {
  return `<${toBase64(rotateByPreset(preset, '99!rt')).replace(/=+$/g, '')}>`;
}

function readPresetSeal(value) {
  const match = value.match(/<([A-Za-z0-9+/]+)>/);
  if (!match) return null;
  try {
    const padded = match[1] + '='.repeat((4 - (match[1].length % 4)) % 4);
    return rotateByPreset(fromBase64(padded), '99!rt', true);
  } catch {
    return null;
  }
}

function encodeLetterAsCluster(char, idx) {
  const lower = char.toLowerCase();
  const marker = REVERSE_PRESET_MAP[lower] || randomFrom(PRESET_KEYS.slice(0, 5));
  const leet = LEET_ENCODE_MAP[lower] || lower;
  return `${randomRatToken()}{${idx.toString(36)}:${leet}${SIGNAL_TOKEN}${marker}${randomChars(1)}${randomDigits(2)}}`;
}

function transformForLayer(source) {
  return source.split(/\s+/).filter(Boolean).map((word, wordIndex) => {
    const encoded = [...word].map((char, idx) => (/^[a-zA-Z]$/.test(char)
      ? encodeLetterAsCluster(char, idx + wordIndex)
      : `${randomRatToken()}[${char.charCodeAt(0).toString(16)}${randomChars(1)}]`)).join('');
    return `${encoded}${randomRatToken()}${randomDigits(3)}`;
  }).join(randomFrom(['||', '::', '~~']));
}

function deTokenizeLayered(value) {
  return value
    .replace(/(RatTT|Rat|RAT|rat|rAt|RaT|RAt|raT)/g, '')
    .replace(/\|\||::|~~/g, ' ')
    .replace(/\{[0-9a-z]+:([^{}]+?)`329`;;\n''([A-Za-z0-9!#$%]+)[^{}]*\}/g, (_, encodedLetter, marker) => (PRESET_MAP[marker] ? encodedLetter : '?'))
    .replace(/\[[0-9a-f]+[^\]]?\]/g, '')
    .replace(/[0-9]{3}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function obfuscateTxt(value) {
  if (!value) return '';
  const salt = Math.floor(Math.random() * 30) + 11;
  const parts = [...value].map((char, idx) => ((char.charCodeAt(0) + salt + idx * 2) ^ (salt % 7)).toString(36));
  return `txt:${salt}:${parts.join('.')}`;
}

function obfuscateLua(value) {
  if (!value) return '';
  const escaped = [...value].map((char, idx) => `\\${(char.charCodeAt(0) + (idx % 10) + 3).toString().padStart(3, '0')}`).join('');
  return `loadstring("${escaped}")()`;
}

function obfuscateRattify(value) {
  if (!value) return '';
  const seed = Math.floor(Math.random() * 90) + 10;
  const payload = [...value].map((char, idx) => `${((char.charCodeAt(0) + seed + idx * 3) ^ (seed % 13)).toString(36)}${randomRatToken().toLowerCase()}`).join('');
  return `rat:${seed}:${payload}`;
}

function layerOfObfuscation(source, baseValue) {
  if (!source) return '';
  const preset = randomFrom(PRESET_KEYS);
  const merged = `${baseValue}||${transformForLayer(source)}`;
  const packed = toBase64(byteSwap(rotateByPreset(merged, preset), preset)).replace(/=+$/g, '');
  const noisy = (packed.match(/.{1,8}/g) || [])
    .map((chunk, idx) => `${randomRatToken()}[${idx.toString(36)}|${chunk}]${randomChars(1)}${randomDigits(1)}`)
    .join(randomFrom(['#', ';', ':']));

  return `rat:${randomChars(1)}${randomDigits(4)}${randomChars(2)}${makePresetSeal(preset)}${SIGNAL_TOKEN}${noisy}${randomChars(2)}`;
}

function runSelectedObfuscation(value, selectedLanguage) {
  if (selectedLanguage === 'lua') return obfuscateLua(value);
  if (selectedLanguage === 'rat') return obfuscateRattify(value);
  return obfuscateTxt(value);
}

function normalizeLeet(text) {
  const reverseLeet = Object.fromEntries(Object.entries(LEET_ENCODE_MAP).map(([k, v]) => [v, k]));
  return [...text].map((char) => reverseLeet[char] || char).join('');
}

function deobfuscateRatOutput(value) {
  const engine = new Function('ctx', `${atob(DEOBF_ENGINE_B64)}; return run(ctx);`);
  return engine({
    value,
    SIGNAL_TOKEN,
    readPresetSeal,
    fromBase64,
    byteSwap,
    rotateByPreset,
    deTokenizeLayered,
    normalizeLeet,
  });
}

async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(candidate) {
  if (!candidate) return false;
  return (await sha256Hex(candidate)) === PASSWORD_HASH;
}

obfuscateBtn.addEventListener('click', () => {
  const source = inputText.value;
  const selectedLanguage = languageSelect.value;
  const base = runSelectedObfuscation(source, selectedLanguage);
  outputText.value = layerOfObfuscation(source, base);
});

openDeobfuscatorBtn.addEventListener('click', async () => {
  const enteredPassword = window.prompt('Enter deobfuscator password:');
  const allowed = await verifyPassword(enteredPassword || '');
  if (!allowed) {
    window.alert('Access denied. Wrong password.');
    return;
  }

  const shouldOpen = deobfuscatorPanel.hasAttribute('hidden');
  deobfuscatorPanel.toggleAttribute('hidden', !shouldOpen);
  openDeobfuscatorBtn.setAttribute('aria-expanded', String(shouldOpen));
});

deobfuscateBtn.addEventListener('click', () => {
  deobOutput.value = deobfuscateRatOutput(deobInput.value.trim());
});

docsToggle.addEventListener('click', () => {
  const shouldOpen = docsPanel.hasAttribute('hidden');
  docsPanel.toggleAttribute('hidden', !shouldOpen);
  docsToggle.setAttribute('aria-expanded', String(shouldOpen));
});
