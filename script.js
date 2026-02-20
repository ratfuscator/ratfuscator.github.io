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
const DISTRACTION_WORDS = [
  'mango',
  'ratgear',
  'fuzz',
  'mask',
  'noise',
  'ember',
  'shadow',
  'drift',
  'cipher',
  'jam',
];

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomDigits(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

function randomChars(length) {
  const chars = '&@#$%*!?;:+-|~^';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function randomRatToken() {
  return randomFrom(['Rat', 'RAT', 'rat', 'rAt', 'RaT', 'RAt', 'raT', 'RatTT']);
}

function randomDistractionTag() {
  const word = randomFrom(DISTRACTION_WORDS);
  return `%${word}${randomDigits(2)}%`;
}

function toBase64(value) {
  return btoa(unescape(encodeURIComponent(value)));
}

function fromBase64(value) {
  return decodeURIComponent(escape(atob(value)));
}

function keyFromPreset(preset) {
  return [...preset].reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 11), 97) % 256;
}

function cryptWithPreset(text, preset, invert = false) {
  const key = keyFromPreset(preset);
  return [...text]
    .map((char, idx) => {
      const code = char.charCodeAt(0);
      const delta = (key + idx * 17 + (idx % 7) * 3) % 256;
      const next = invert ? code - delta : code + delta;
      const wrapped = ((next % 65535) + 65535) % 65535;
      return String.fromCharCode(wrapped);
    })
    .join('');
}

function makePresetSeal(preset) {
  const hidden = toBase64(cryptWithPreset(preset, '99!rt')).replace(/=+$/g, '');
  return `<${hidden}>`;
}

function readPresetSeal(value) {
  const match = value.match(/<([A-Za-z0-9+/]+)>/);
  if (!match) {
    return null;
  }

  try {
    const raw = match[1];
    const padded = raw + '='.repeat((4 - (raw.length % 4)) % 4);
    return cryptWithPreset(fromBase64(padded), '99!rt', true);
  } catch (error) {
    return null;
  }
}

function obfuscateTxt(value) {
  if (!value) return '';
  const salt = Math.floor(Math.random() * 25) + 11;
  return `txt:${salt}:${[...value].map((char, idx) => ((char.charCodeAt(0) + salt + idx) ^ 9).toString(36)).join('.')}`;
}

function obfuscateLua(value) {
  if (!value) return '';
  return `loadstring("${[...value].map((char, idx) => `\\${(char.charCodeAt(0) + idx).toString().padStart(3, '0')}`).join('')}")()`;
}

function obfuscateRattify(value) {
  if (!value) return '';
  const seed = Math.floor(Math.random() * 80) + 20;
  return `rat:${seed}:${[...value].map((char, idx) => ((char.charCodeAt(0) + seed + idx * 2) ^ (seed % 11)).toString(36)).join('rat')}`;
}

function runSelectedObfuscation(value, selectedLanguage) {
  if (selectedLanguage === 'lua') return obfuscateLua(value);
  if (selectedLanguage === 'rat') return obfuscateRattify(value);
  return obfuscateTxt(value);
}

function layerOfObfuscation(source, baseValue) {
  if (!source) return '';

  const preset = randomFrom(PRESET_KEYS);
  const payload = JSON.stringify({ source, base: baseValue, v: 2 });
  const encrypted = cryptWithPreset(payload, preset);
  const packed = toBase64(encrypted).replace(/=+$/g, '');
  const shards = packed.match(/.{1,7}/g) || [];

  const noisy = shards
    .map((chunk, idx) => `${randomDistractionTag()}${randomRatToken()}[${idx.toString(36)}|${chunk}]${SIGNAL_TOKEN}${randomChars(1)}${randomDigits(1)}${randomDistractionTag()}`)
    .join(`${randomFrom(['#', ';', ':'])}${randomDistractionTag()}`);

  return `rat:${randomChars(1)}${randomDigits(4)}${randomChars(2)}${makePresetSeal(preset)}${randomDistractionTag()}${noisy}${randomDistractionTag()}${randomChars(2)}`;
}

function deobfuscateRatOutput(value) {
  if (!value || !value.startsWith('rat:')) {
    return 'Invalid format: expected rat: output.';
  }

  const preset = readPresetSeal(value);
  if (!preset) {
    return 'Invalid format: missing hidden preset signature.';
  }

  const cleanedValue = value.replace(/%[a-zA-Z0-9_-]+%/g, '');
  const chunks = [...cleanedValue.matchAll(/\[(?:[0-9a-z]+)\|([A-Za-z0-9+/]+)\]/g)].map((m) => m[1]);
  if (!chunks.length) {
    return 'Invalid format: no payload chunks found.';
  }

  try {
    const joined = chunks.join('');
    const padded = joined + '='.repeat((4 - (joined.length % 4)) % 4);
    const decoded = fromBase64(padded);
    const plain = cryptWithPreset(decoded, preset, true);
    const parsed = JSON.parse(plain);

    if (!parsed || typeof parsed.source !== 'string') {
      return 'Deobfuscation failed: payload structure invalid.';
    }

    return `Deobfuscation Access OK\nRecovered source: ${parsed.source}\nBase payload: ${parsed.base || 'n/a'}`;
  } catch (error) {
    return 'Deobfuscation failed: corrupted payload or wrong format.';
  }
}

async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(candidate) {
  if (!candidate) return false;
  return (await sha256Hex(candidate)) === PASSWORD_HASH;
}

obfuscateBtn.addEventListener('click', () => {
  const source = inputText.value;
  const selectedLanguage = languageSelect.value;
  outputText.value = layerOfObfuscation(source, runSelectedObfuscation(source, selectedLanguage));
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
