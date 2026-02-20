const languageSelect = document.getElementById('language');
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const obfuscateBtn = document.getElementById('obfuscateBtn');

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

obfuscateBtn.addEventListener('click', () => {
  const source = inputText.value;
  const selectedLanguage = languageSelect.value;

  outputText.value =
    selectedLanguage === 'lua' ? obfuscateLua(source) : obfuscateTxt(source);
});
