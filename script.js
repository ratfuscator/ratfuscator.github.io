const languageSelect = document.getElementById('language');
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const obfuscateBtn = document.getElementById('obfuscateBtn');
const docsToggle = document.getElementById('docsToggle');
const docsPanel = document.getElementById('docsPanel');

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

function randomChunk(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function layerOfObfuscation(value) {
  if (!value) {
    return '';
  }

  const lead = `rtt${Math.floor(Math.random() * 900 + 100)}tgrat${Math.floor(Math.random() * 900000 + 100000)}`;
  const mid = randomChunk(10);
  const tail = randomChunk(9);
  return `${lead} ${mid} ${tail} RARTTTTTT RATify ${btoa(unescape(encodeURIComponent(value)))}`;
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

  outputText.value = layerOfObfuscation(base);
});

docsToggle.addEventListener('click', () => {
  const shouldOpen = docsPanel.hasAttribute('hidden');
  docsPanel.toggleAttribute('hidden', !shouldOpen);
  docsToggle.setAttribute('aria-expanded', String(shouldOpen));
});
