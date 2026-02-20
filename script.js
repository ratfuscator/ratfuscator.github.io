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

const DEOBFUSCATOR_PASSWORD = 'rattify';
const SIGNAL_TOKEN = "`329`;;\n''";

const PRESET_MAP = {
  '766$%': 'a',
  '99!rt': 'e',
  'r7#11': 'i',
  '0xRAT': 'o',
  '5!gnl': 'u',
};

const REVERSE_PRESET_MAP = Object.fromEntries(Object.entries(PRESET_MAP).map(([k, v]) => [v, k]));

const LEET_ENCODE_MAP = {
  a: '4',
  b: '8',
  e: '3',
  g: '9',
  i: '1',
  l: '|',
  o: '0',
  s: '5',
  t: '7',
  z: '2',
};

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

function toBase64(value) {
  return btoa(unescape(encodeURIComponent(value)));
}

function fromBase64(value) {
  return decodeURIComponent(escape(atob(value)));
}

function rotateByPreset(text, preset, invert = false) {
  const shiftSource = preset.charCodeAt(0) + preset.charCodeAt(preset.length - 1);
  const shift = (shiftSource % 9) + 3;

  return [...text]
    .map((char, idx) => {
      const code = char.charCodeAt(0);
      const delta = shift + (idx % 5);
      const next = invert ? code - delta : code + delta;
      return String.fromCharCode(next);
    })
    .join('');
}

function byteSwap(text, preset, invert = false) {
  const key = [...preset].reduce((acc, ch, idx) => acc + ch.charCodeAt(0) * (idx + 3), 0) % 251;

  return [...text]
    .map((char, idx) => {
      const raw = char.charCodeAt(0);
      const salted = invert ? raw - ((key + idx * 7) % 256) : raw + ((key + idx * 7) % 256);
      const safe = ((salted % 65535) + 65535) % 65535;
      return String.fromCharCode(safe);
    })
    .join('');
}

function encodeLetterAsCluster(char, idx, preset) {
  const lower = char.toLowerCase();
  const marker = REVERSE_PRESET_MAP[lower] || randomFrom(Object.keys(PRESET_MAP));
  const leet = LEET_ENCODE_MAP[lower] || lower;
  const noiseA = randomChars(1);
  const noiseB = randomDigits(2);
  const rat = randomRatToken();

  return `${rat}{${idx.toString(36)}:${leet}${SIGNAL_TOKEN}${marker}${noiseA}${noiseB}}`;
}

function transformForLayer(source, preset) {
  const words = source.split(/\s+/).filter(Boolean);

  return words
    .map((word, wordIndex) => {
      const encoded = [...word]
        .map((char, idx) => {
          if (/^[a-zA-Z]$/.test(char)) {
            return encodeLetterAsCluster(char, idx + wordIndex, preset);
          }
          return `${randomRatToken()}[${char.charCodeAt(0).toString(16)}${randomChars(1)}]`;
        })
        .join('');

      return `${encoded}${randomRatToken()}${randomDigits(3)}`;
    })
    .join(randomFrom(['||', '::', '~~']));
}

function deTokenizeLayered(value) {
  return value
    .replace(/(RatTT|Rat|RAT|rat|rAt|RaT|RAt|raT)/g, '')
    .replace(/\|\||::|~~/g, '')
    .replace(/\{[0-9a-z]+:([^{}]+?)`329`;;\n''([A-Za-z0-9!#$%]+)[^{}]*\}/g, (_, encodedLetter, marker) => {
      if (PRESET_MAP[marker]) {
        return encodedLetter;
      }
      return randomFrom(['x', 'q', 'z', 'v']);
    })
    .replace(/\[[0-9a-f]+[^\]]?\]/g, '')
    .replace(/[0-9]{3}/g, ' ')
    .trim();
}

function obfuscateTxt(value) {
  if (!value) {
    return '';
  }

  const salt = Math.floor(Math.random() * 30) + 11;
  const parts = [...value].map((char, idx) => ((char.charCodeAt(0) + salt + idx * 2) ^ (salt % 7)).toString(36));
  return `txt:${salt}:${parts.join('.')}`;
}

function obfuscateLua(value) {
  if (!value) {
    return '';
  }

  const escaped = [...value]
    .map((char, idx) => `\\${(char.charCodeAt(0) + (idx % 10) + 3).toString().padStart(3, '0')}`)
    .join('');

  return `loadstring("${escaped}")()`;
}

function obfuscateRattify(value) {
  if (!value) {
    return '';
  }

  const seed = Math.floor(Math.random() * 90) + 10;
  const payload = [...value]
    .map((char, idx) => {
      const shifted = (char.charCodeAt(0) + seed + idx * 3) ^ (seed % 13);
      return `${shifted.toString(36)}${randomRatToken().toLowerCase()}`;
    })
    .join('');

  return `rat:${seed}:${payload}`;
}

function layerOfObfuscation(source, baseValue) {
  if (!source) {
    return '';
  }

  const preset = randomFrom(Object.keys(PRESET_MAP).concat(['??!x9', 'rat404', 'mix777']));
  const transformedSource = transformForLayer(source, preset);
  const merged = `${baseValue}||${transformedSource}`;
  const rotated = rotateByPreset(merged, preset);
  const swapped = byteSwap(rotated, preset);
  const packed = toBase64(swapped).replace(/=+$/g, '');
  const shards = packed.match(/.{1,8}/g) || [];

  const noisy = shards
    .map((chunk, idx) => `${randomRatToken()}[${idx.toString(36)}|${chunk}]${randomChars(1)}${randomDigits(1)}`)
    .join(randomFrom(['#', ';', ':']));

  return `rat:${randomChars(1)}${randomDigits(4)}${randomChars(2)}${noisy}${randomChars(2)}::preset:${preset}`;
}

function runSelectedObfuscation(value, selectedLanguage) {
  if (selectedLanguage === 'lua') {
    return obfuscateLua(value);
  }

  if (selectedLanguage === 'rat') {
    return obfuscateRattify(value);
  }

  return obfuscateTxt(value);
}

function normalizeLeet(text) {
  const reverseLeet = Object.fromEntries(Object.entries(LEET_ENCODE_MAP).map(([k, v]) => [v, k]));
  return [...text]
    .map((char) => reverseLeet[char] || char)
    .join('');
}

function deobfuscateRatOutput(value) {
  if (!value || !value.startsWith('rat:')) {
    return 'Invalid format: expected rat: output.';
  }

  const presetMatch = value.match(/::preset:([^\s]+)$/);
  if (!presetMatch) {
    return 'Invalid format: missing preset.';
  }

  const preset = presetMatch[1];
  const payload = value.replace(/^rat:[^\n]*?((?:RatTT|Rat|RAT|rat|rAt|RaT|RAt|raT)\[)/, '$1').replace(/::preset:[^\s]+$/, '');
  const chunks = [...payload.matchAll(/\[(?:[0-9a-z]+)\|([A-Za-z0-9+/]+)\]/g)].map((m) => m[1]);
  const baseOnly = chunks.join('');

  if (!baseOnly) {
    return 'Invalid format: missing encoded payload.';
  }

  try {
    const padded = baseOnly + '='.repeat((4 - (baseOnly.length % 4)) % 4);
    const swapped = fromBase64(padded);
    const unSwapped = byteSwap(swapped, preset, true);
    const unRotated = rotateByPreset(unSwapped, preset, true);
    const parts = unRotated.split('||');

    if (parts.length < 2) {
      return `Deobfuscation Access OK\nPreset: ${preset}\nRecovered: ${unRotated}`;
    }

    const rawSourceLayer = parts.slice(1).join('||');
    const tokenizedLetters = deTokenizeLayered(rawSourceLayer);
    const normalized = normalizeLeet(tokenizedLetters);

    return `Deobfuscation Access OK\nPreset: ${preset}\nRecovered source: ${normalized}\nBase payload: ${parts[0]}`;
  } catch (error) {
    return 'Deobfuscation failed: payload is too corrupted or not generated by this Ratfuscator version.';
  }
}

obfuscateBtn.addEventListener('click', () => {
  const source = inputText.value;
  const selectedLanguage = languageSelect.value;
  const base = runSelectedObfuscation(source, selectedLanguage);

  outputText.value = layerOfObfuscation(source, base);
});

openDeobfuscatorBtn.addEventListener('click', () => {
  const enteredPassword = window.prompt('Enter deobfuscator password:');

  if (enteredPassword !== DEOBFUSCATOR_PASSWORD) {
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
