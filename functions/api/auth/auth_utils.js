const PBKDF2_ITERATIONS = 100000;
const HASH_ALGORITHM = 'SHA-256';
const HASH_BYTES = 32;
const SALT_BYTES = 16;

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function legacySha256(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest(HASH_ALGORITHM, data);
  return bytesToHex(new Uint8Array(hash));
}

export async function hashPassword(password, salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: HASH_ALGORITHM,
      salt,
      iterations: PBKDF2_ITERATIONS,
    },
    keyMaterial,
    HASH_BYTES * 8
  );

  return `pbkdf2$${PBKDF2_ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(new Uint8Array(bits))}`;
}

export async function verifyPassword(password, storedHash) {
  if (!storedHash) return false;

  if (!storedHash.startsWith('pbkdf2$')) {
    const legacyHash = await legacySha256(password);
    return constantTimeEqual(legacyHash, storedHash);
  }

  const [, iterationsRaw, saltHex, expectedHash] = storedHash.split('$');
  const iterations = Number(iterationsRaw);
  if (!iterations || !saltHex || !expectedHash) return false;

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: HASH_ALGORITHM,
      salt: hexToBytes(saltHex),
      iterations,
    },
    keyMaterial,
    HASH_BYTES * 8
  );

  return constantTimeEqual(bytesToHex(new Uint8Array(bits)), expectedHash);
}

export function generateToken() {
  return crypto.randomUUID();
}

export function sessionCookie(token, maxAge, requestUrl) {
  const secure = new URL(requestUrl).protocol === 'https:' ? '; Secure' : '';
  return `session_token=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Strict${secure}`;
}
