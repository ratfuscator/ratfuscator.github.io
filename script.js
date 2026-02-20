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

function obfuscateTxt(value) {
  if (!value) {
    return '';
  }

  const salt = Math.floor(Math.random() * 30) + 11;
  const parts = [...value].map((char) => (char.charCodeAt(0) + salt).toString(36));
  return `txt:${salt}:${parts.join('.')}`;
}

function obfuscateLua(value) {
  if (!value) {
    return '';
  }

  const escaped = [...value]
    .map((char) => `\\${char.charCodeAt(0).toString().padStart(3, '0')}`)
    .join('');

  return `loadstring("${escaped}")()`;
}

function obfuscateRattify(value) {
  if (!value) {
    return '';
  }

  const seed = Math.floor(Math.random() * 90) + 10;
  const payload = [...value]
    .map((char, idx) => `${(char.charCodeAt(0) + seed + idx).toString(36)}rat`)
    .join('');

  return `rat:${seed}:${payload}`;
}

function randomChars(length) {
  const chars = '&@#$%*!?';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function randomDigits(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

function randomRatToken() {
  const forms = ['Rat', 'RAT', 'rat', 'rAt', 'RaT', 'RAt', 'raT'];
  return forms[Math.floor(Math.random() * forms.length)];
}

function mutateWord(word) {
  const lettersOnly = word.replace(/[^a-zA-Z]/g, '');
  if (!lettersOnly) {
    return randomRatToken();
  }

  return [...lettersOnly]
    .map((char) => {
      const lower = char.toLowerCase();
      if (leetMap[lower] && Math.random() < 0.25) {
        return leetMap[lower];
      }
      return Math.random() < 0.5 ? lower : lower.toUpperCase();
    })
    .join('');
}

function layerOfObfuscation(source, baseValue) {
  if (!source) {
    return '';
  }

  const words = source.trim().split(/\s+/).filter(Boolean);
  const ratWords = words.map((word) => `${randomRatToken()}${mutateWord(word)}`).join('');
  const noise = `${randomChars(1)}${randomDigits(4)}${randomChars(3)}`;
  const signature = btoa(unescape(encodeURIComponent(baseValue))).replace(/=+$/g, '').slice(0, 12);

  return `rat:${noise}rat${ratWords}${randomRatToken()}${signature}`;
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
