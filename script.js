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

const ENGINE_VERSION = 'RATFUSCATOR_V5';
const SIGNAL_TOKEN = "`329`;;\n''";
const SHARD_SIZE = 9;
const HEADER_SPLIT = '::';

const PRESET_KEYS = [
  '766$%',
  '99!rt',
  'r7#11',
  '0xRAT',
  '5!gnl',
  '??!x9',
  'rat404',
  'mix777',
  'mask930',
  'amber11',
  'frost22',
  'zeta77',
];

const X4_SEED = [
  '4a',
  '5f',
  '72',
  '39',
  '6d',
  '2b',
  '50',
  '7e',
  '41',
  '3c',
  '68',
  '24',
  '55',
  '6a',
  '7b',
  '30',
  '47',
  '5d',
  '2f',
  '79',
];

const RAT_TOKENS = [
  'Rat',
  'RAT',
  'rat',
  'rAt',
  'RaT',
  'RAt',
  'raT',
  'RatTT',
  'RATify',
  'rattify',
];

const NOISE_CHARS = '&@#$*!?;:+-|~^';

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomDigits(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

function randomNoise(length) {
  return Array.from({ length }, () => NOISE_CHARS[Math.floor(Math.random() * NOISE_CHARS.length)]).join('');
}

function randomRatToken() {
  return randomFrom(RAT_TOKENS);
}

function decodeHexSeed(hexSeed) {
  return String.fromCharCode(parseInt(hexSeed, 16));
}

function randomJammerToken() {
  const a = decodeHexSeed(randomFrom(X4_SEED));
  const b = decodeHexSeed(randomFrom(X4_SEED));
  const c = randomFrom('!@#$%^&*?+-=_~');
  const d = randomFrom('0123456789abcdefghijklmnopqrstuvwxyz');
  return `${a}${b}${c}${d}`;
}

function randomDistractionTag() {
  return `%${randomJammerToken()}%`;
}

function toUtf8Base64(value) {
  return btoa(unescape(encodeURIComponent(value)));
}

function fromUtf8Base64(value) {
  return decodeURIComponent(escape(atob(value)));
}

function nowNonce() {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

function toHex(number) {
  return (number >>> 0).toString(16);
}

function fnv1a32(text) {
  let hash = 0x811c9dc5;

  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return hash >>> 0;
}

function crcText(text) {
  return toHex(fnv1a32(text));
}

function assertString(value, message) {
  if (typeof value !== 'string') {
    throw new Error(message);
  }
}

function assertTruthy(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

function basePresetKey(preset) {
  let sum = 71;

  for (let i = 0; i < preset.length; i += 1) {
    const ch = preset.charCodeAt(i);
    sum = (sum + ch * (i + 17)) % 256;
  }

  return sum;
}

function deriveStreamSeed(preset, nonce, modeTag) {
  const mixed = `${preset}|${nonce}|${modeTag}|${ENGINE_VERSION}`;
  return fnv1a32(mixed) % 256;
}

function streamCrypt(text, preset, nonce, modeTag) {
  const presetSeed = basePresetKey(preset);
  const seed = deriveStreamSeed(preset, nonce, modeTag);

  let state = (seed + presetSeed) % 256;

  const out = [];

  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    const delta = (state + ((i * 13) % 256) + ((presetSeed * (i % 5 + 1)) % 256)) % 256;
    const next = code ^ delta;
    out.push(String.fromCharCode(next));
    state = (state + delta + (i % 19) + 7) % 256;
  }

  return out.join('');
}

function makeSealPayload(preset) {
  const inner = `${preset}|${ENGINE_VERSION}`;
  const encrypted = streamCrypt(inner, '99!rt', 'seal-nonce', 'seal');
  return `<${toUtf8Base64(encrypted).replace(/=+$/g, '')}>`;
}

function readSealPayload(value) {
  const match = value.match(/<([A-Za-z0-9+/]+)>/);

  if (!match) {
    return null;
  }

  try {
    const encoded = match[1];
    const padded = encoded + '='.repeat((4 - (encoded.length % 4)) % 4);
    const decoded = fromUtf8Base64(padded);
    const plain = streamCrypt(decoded, '99!rt', 'seal-nonce', 'seal');
    const [preset, version] = plain.split('|');

    if (!preset || version !== ENGINE_VERSION) {
      return null;
    }

    return preset;
  } catch (error) {
    return null;
  }
}

function obfuscateTxt(value) {
  if (!value) {
    return '';
  }

  const salt = Math.floor(Math.random() * 25) + 11;

  const body = [...value]
    .map((char, index) => {
      const code = char.charCodeAt(0);
      const shifted = ((code + salt + index) ^ 9) >>> 0;
      return shifted.toString(36);
    })
    .join('.');

  return `txt:${salt}:${body}`;
}

function randomLuaIdentifier(prefix = 'v') {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const body = Array.from({ length: 9 }, () => randomFrom(alphabet)).join('');
  return `${prefix}_${body}`;
}

function encodeLuaSourceToTriples(value, seedA, seedB) {
  return [...value].map((char, index) => {
    const code = char.charCodeAt(0);
    const a = ((code + seedA + index * 7) % 251) + 1;
    const b = ((code ^ seedB ^ ((index * 11) % 255)) % 251) + 1;
    const c = (((a + b + code + seedA + seedB + index) % 251) + 1);
    return [a, b, c];
  });
}

function makeLuaNoiseLines(total, bagName) {
  const lines = [];
  for (let i = 0; i < total; i += 1) {
    const n1 = Math.floor(Math.random() * 900) + 100;
    const n2 = Math.floor(Math.random() * 900) + 100;
    const n3 = Math.floor(Math.random() * 900) + 100;
    lines.push(`local __n_${i} = (${n1} + ${n2}) - ${n3}`);
    lines.push(`if __n_${i} % 2 == 0 then ${bagName}[${i + 1}] = __n_${i} else ${bagName}[${i + 1}] = __n_${i} * -1 end`);
  }
  return lines.join('\n');
}

function obfuscateLua(value) {
  if (!value) {
    return '';
  }

  const seedA = Math.floor(Math.random() * 190) + 33;
  const seedB = Math.floor(Math.random() * 190) + 41;

  const tableName = randomLuaIdentifier('tbl');
  const outName = randomLuaIdentifier('out');
  const idxName = randomLuaIdentifier('idx');
  const scratchName = randomLuaIdentifier('bag');
  const decodeName = randomLuaIdentifier('dec');

  const triples = encodeLuaSourceToTriples(value, seedA, seedB);
  const tripleRows = triples
    .map((triple, index) => `  [${index + 1}] = {${triple[0]},${triple[1]},${triple[2]}}`)
    .join(',\n');

  const luaNoise = makeLuaNoiseLines(250, scratchName);

  return [
    '-- RATFUSCATOR LUA OBF V2',
    '-- Roblox/Luau compatible wrapper (requires loadstring enabled where applicable).',
    `local ${tableName} = {`,
    tripleRows,
    '}',
    `local ${scratchName} = {}`,
    luaNoise,
    `local function ${decodeName}(triple, i, sa, sb)`,
    '  local a = triple[1] - 1',
    '  local b = triple[2] - 1',
    '  local c = triple[3] - 1',
    '  local x = (a - sa - ((i - 1) * 7)) % 251',
    '  local y = (b ~ sb ~ (((i - 1) * 11) % 255)) % 251',
    '  local z = (c - a - b - sa - sb - (i - 1)) % 251',
    '  local m = (x + y + z) % 251',
    '  return string.char(m)',
    'end',
    `local ${outName} = table.create(#${tableName})`,
    `for ${idxName} = 1, #${tableName} do`,
    `  ${outName}[${idxName}] = ${decodeName}(${tableName}[${idxName}], ${idxName}, ${seedA}, ${seedB})`,
    'end',
    `local __src = table.concat(${outName})`,
    'local __runner = loadstring or load',
    'if not __runner then',
    "  error('Ratfuscator Lua payload requires loadstring/load support in this runtime.')",
    'end',
    'local __fn, __err = __runner(__src)',
    'if not __fn then',
    "  error('Ratfuscator payload decode error: ' .. tostring(__err))",
    'end',
    'return __fn()',
  ].join('\n');
}

function obfuscateRattify(value) {
  if (!value) {
    return '';
  }

  const seed = Math.floor(Math.random() * 80) + 20;

  const body = [...value]
    .map((char, index) => {
      const code = char.charCodeAt(0);
      const shifted = ((code + seed + index * 2) ^ (seed % 11)) >>> 0;
      return shifted.toString(36);
    })
    .join('rat');

  return `rat:${seed}:${body}`;
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

function buildPacket(source, base, preset, modeTag) {
  const nonce = nowNonce();

  const packet = {
    version: 5,
    engine: ENGINE_VERSION,
    nonce,
    mode: modeTag,
    source,
    base,
    sourceChecksum: crcText(source),
    baseChecksum: crcText(base),
    timestamp: Date.now(),
  };

  const json = JSON.stringify(packet);
  const encrypted = streamCrypt(json, preset, nonce, modeTag);
  const packed = toUtf8Base64(encrypted).replace(/=+$/g, '');

  return {
    packet,
    packed,
  };
}

function buildShardEntries(payload) {
  const chunks = payload.match(new RegExp(`.{1,${SHARD_SIZE}}`, 'g')) || [];

  return chunks.map((chunk, index) => {
    const id = index.toString(36);
    const checksum = crcText(`${id}:${chunk}`).slice(0, 6);

    return {
      id,
      chunk,
      checksum,
    };
  });
}

function serializeShards(entries) {
  const separator = `${randomDistractionTag()}${randomFrom(['#', ';', ':'])}${randomDistractionTag()}`;

  return entries
    .map((entry) => {
      const prefix = `${randomDistractionTag()}${randomDistractionTag()}${randomRatToken()}${randomNoise(1)}${randomDistractionTag()}`;
      const body = `[${entry.id}|${entry.chunk}|${entry.checksum}]`;
      const suffix = `${randomDistractionTag()}${SIGNAL_TOKEN}${randomNoise(1)}${randomDigits(1)}${randomDistractionTag()}${randomDistractionTag()}`;
      return `${prefix}${body}${suffix}`;
    })
    .join(separator);
}

function layerOfObfuscation(source, baseValue, modeTag) {
  if (!source) {
    return '';
  }

  const preset = randomFrom(PRESET_KEYS);
  const { packet, packed } = buildPacket(source, baseValue, preset, modeTag);
  const entries = buildShardEntries(packed);
  const serialized = serializeShards(entries);

  const meta = {
    c: entries.length,
    n: packet.nonce,
    d: crcText(packed).slice(0, 8),
    m: modeTag,
  };

  const metaToken = toUtf8Base64(JSON.stringify(meta)).replace(/=+$/g, '');

  return `rat:${randomDistractionTag()}${randomNoise(1)}${randomDigits(4)}${randomNoise(2)}${makeSealPayload(preset)}${HEADER_SPLIT}${metaToken}${HEADER_SPLIT}${randomDistractionTag()}${randomDistractionTag()}${serialized}${randomDistractionTag()}${randomDistractionTag()}${randomNoise(2)}`;
}

function stripDistractions(value) {
  return value.replace(/%[^%]{4}%/g, '');
}

function parseMeta(value) {
  const match = value.match(/<[^>]+>::([A-Za-z0-9+/]+)::/);

  if (!match) {
    throw new Error('Invalid format: missing metadata sections.');
  }

  const metaToken = match[1];
  const padded = metaToken + '='.repeat((4 - (metaToken.length % 4)) % 4);
  const plain = fromUtf8Base64(padded);
  const meta = JSON.parse(plain);

  if (!meta || typeof meta !== 'object') {
    throw new Error('Invalid format: metadata parse failed.');
  }

  if (typeof meta.c !== 'number' || meta.c < 1) {
    throw new Error('Invalid format: bad chunk count metadata.');
  }

  if (typeof meta.n !== 'string') {
    throw new Error('Invalid format: missing nonce metadata.');
  }

  if (typeof meta.d !== 'string') {
    throw new Error('Invalid format: missing digest metadata.');
  }

  if (typeof meta.m !== 'string') {
    throw new Error('Invalid format: missing mode metadata.');
  }

  return meta;
}

function parseShards(value) {
  const cleaned = stripDistractions(value);
  const matches = [...cleaned.matchAll(/\[([0-9a-z]+)\|([A-Za-z0-9+/]+)\|([0-9a-f]+)\]/g)];

  if (!matches.length) {
    throw new Error('Invalid format: no payload shards found.');
  }

  const entries = matches.map((match) => {
    const id = match[1];
    const chunk = match[2];
    const checksum = match[3];

    const expected = crcText(`${id}:${chunk}`).slice(0, 6);
    if (checksum !== expected) {
      throw new Error('Invalid format: shard checksum mismatch.');
    }

    return {
      id,
      index: parseInt(id, 36),
      chunk,
    };
  });

  return entries.sort((a, b) => a.index - b.index);
}

function joinShards(entries, meta) {
  if (entries.length !== meta.c) {
    throw new Error('Invalid format: shard count mismatch.');
  }

  for (let i = 0; i < entries.length; i += 1) {
    if (entries[i].index !== i) {
      throw new Error('Invalid format: missing shard sequence.');
    }
  }

  const payload = entries.map((entry) => entry.chunk).join('');
  const digest = crcText(payload).slice(0, 8);

  if (digest !== meta.d) {
    throw new Error('Invalid format: payload digest mismatch.');
  }

  return payload;
}

function decodePayload(payload, preset, meta) {
  const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
  const encrypted = fromUtf8Base64(padded);
  const plain = streamCrypt(encrypted, preset, meta.n, meta.m);
  const packet = JSON.parse(plain);

  if (!packet || typeof packet !== 'object') {
    throw new Error('Deobfuscation failed: packet parse failed.');
  }

  assertString(packet.source, 'Deobfuscation failed: source is invalid.');
  assertString(packet.base, 'Deobfuscation failed: base payload is invalid.');
  assertString(packet.sourceChecksum, 'Deobfuscation failed: source checksum missing.');
  assertString(packet.baseChecksum, 'Deobfuscation failed: base checksum missing.');

  if (packet.engine !== ENGINE_VERSION) {
    throw new Error('Deobfuscation failed: engine version mismatch.');
  }

  if (packet.sourceChecksum !== crcText(packet.source)) {
    throw new Error('Deobfuscation failed: source checksum mismatch.');
  }

  if (packet.baseChecksum !== crcText(packet.base)) {
    throw new Error('Deobfuscation failed: base checksum mismatch.');
  }

  return packet;
}

function deobfuscateRatOutput(value) {
  try {
    assertString(value, 'Invalid format: expected rat: output.');

    if (!value.startsWith('rat:')) {
      throw new Error('Invalid format: expected rat: output.');
    }

    const preset = readSealPayload(value);
    assertTruthy(preset, 'Invalid format: missing hidden preset signature.');

    const meta = parseMeta(value);
    const shards = parseShards(value);
    const payload = joinShards(shards, meta);
    const packet = decodePayload(payload, preset, meta);

    return `Deobfuscation Access OK\nRecovered source: ${packet.source}\nBase payload: ${packet.base}`;
  } catch (error) {
    return error instanceof Error ? error.message : 'Deobfuscation failed: unknown error.';
  }
}

async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyPassword(candidate) {
  if (!candidate) {
    return false;
  }

  return (await sha256Hex(candidate)) === PASSWORD_HASH;
}

function selectedModeTag(selectedLanguage) {
  if (selectedLanguage === 'lua') {
    return 'lua';
  }

  if (selectedLanguage === 'rat') {
    return 'rat';
  }

  return 'txt';
}

obfuscateBtn.addEventListener('click', () => {
  const source = inputText.value;
  const selectedLanguage = languageSelect.value;
  const base = runSelectedObfuscation(source, selectedLanguage);
  const modeTag = selectedModeTag(selectedLanguage);

  outputText.value = layerOfObfuscation(source, base, modeTag);
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
