const languageSelect = document.getElementById('language');
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const obfuscateBtn = document.getElementById('obfuscateBtn');
const docsToggle = document.getElementById('docsToggle');
const docsPanel = document.getElementById('docsPanel');

const leetMap = {
  a: '4',
  e: '3',
  i: '1',
  o: '0',
  s: '5',
  t: '7',
  l: '1',
};

const specialGlyphMap = {
  a: '@',
  c: '(',
  h: '#',
  k: '|<',
  m: '/\\/',
  n: '^',
  r: '®',
  y: '`',
};

const SIGNAL_TOKEN = "`329`;;\n''";
const PRESET_MAP = {
  '766$%': 'a',
  '99!rt': 'e',
  'r7#11': 'i',
  '0xRAT': 'o',
  '5!gnl': 'u',
};

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function obfuscateTxt(value) {
  if (!value) {
    return '';
  }

  const salt = Math.floor(Math.random() * 30) + 11;
  const parts = [...value].map((char, idx) => ((char.charCodeAt(0) + salt + idx) ^ (salt % 7)).toString(36));
  return `txt:${salt}:${parts.join('.')}`;
}

function obfuscateLua(value) {
  if (!value) {
    return '';
  }

  const escaped = [...value]
    .map((char, idx) => `\\${(char.charCodeAt(0) + idx % 10).toString().padStart(3, '0')}`)
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

function randomChars(length) {
  const chars = '&@#$%*!?;:+-|~^';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function randomDigits(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

function randomRatToken() {
  return randomFrom(['Rat', 'RAT', 'rat', 'rAt', 'RaT', 'RAt', 'raT', 'RatTT']);
}

function mutateWord(word) {
  const lettersOnly = word.replace(/[^a-zA-Z]/g, '');
  if (!lettersOnly) {
    return randomRatToken();
  }

  return [...lettersOnly]
    .map((char, idx) => {
      const lower = char.toLowerCase();

      if (Math.random() < 0.17) {
        return SIGNAL_TOKEN;
      }

      if (leetMap[lower] && Math.random() < 0.33) {
        return leetMap[lower];
      }

      if (specialGlyphMap[lower] && Math.random() < 0.25) {
        return specialGlyphMap[lower];
      }

      if (idx % 2 === 0 && Math.random() < 0.6) {
        return lower.toUpperCase();
      }

      return lower;
    })
    .join('');
}

function applyPresetSignal(text, preset) {
  const replacement = PRESET_MAP[preset] || randomFrom(['x', 'q', 'z', 'v']);
  return text.split(SIGNAL_TOKEN).join(replacement);
}

function layerOfObfuscation(source, baseValue) {
  if (!source) {
    return '';
  }

  const words = source.trim().split(/\s+/).filter(Boolean);
  const preset = randomFrom(Object.keys(PRESET_MAP).concat(['??!x9', 'rat404', 'mix777']));

  const ratWords = words
    .map((word, idx) => {
      const chunk = `${randomRatToken()}${mutateWord(word)}${randomDigits(2)}${randomChars(2)}`;
      return idx % 2 === 0 ? chunk.toUpperCase() : chunk;
    })
    .join('');

  const baseEncoded = btoa(unescape(encodeURIComponent(baseValue))).replace(/=+$/g, '');
  const maskedBase = [...baseEncoded]
    .map((char, idx) => (idx % 3 === 0 ? char.toUpperCase() : char))
    .join('');

  const withSignal = `${ratWords}${SIGNAL_TOKEN}${maskedBase.slice(0, 18)}${randomRatToken()}`;
  const signalResolved = applyPresetSignal(withSignal, preset);
  const noisyPrefix = `rat:${randomChars(1)}${randomDigits(4)}${randomChars(2)}rat${randomRatToken()}`;

  return `${noisyPrefix}${signalResolved}${randomChars(3)}${randomDigits(3)}::preset:${preset}`;
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

obfuscateBtn.addEventListener('click', () => {
  const source = inputText.value;
  const selectedLanguage = languageSelect.value;
  const base = runSelectedObfuscation(source, selectedLanguage);

  outputText.value = layerOfObfuscation(source, base);
});

docsToggle.addEventListener('click', () => {
  const shouldOpen = docsPanel.hasAttribute('hidden');
  docsPanel.toggleAttribute('hidden', !shouldOpen);
  docsToggle.setAttribute('aria-expanded', String(shouldOpen));
});
