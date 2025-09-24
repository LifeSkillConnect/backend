// Usage:
// 1) Create a .env with APPLE_TEAM_ID, APPLE_CLIENT_ID, APPLE_KEY_ID
// 2) Provide the private key via either:
//    - APPLE_PRIVATE_KEY (paste the .p8 contents; keep newlines) OR
//    - APPLE_PRIVATE_KEY (single-line) using \n for newlines OR
//    - APPLE_PRIVATE_KEY_PATH pointing to a local .p8 file (e.g., secrets/AuthKey.p8)
// 3) Run: node scripts/generate-apple-client-secret.js

import('dotenv').then(({ default: dotenv }) => {
  try { dotenv.config(); } catch (_) {}
}).finally(async () => {
  const { SignJWT, importPKCS8 } = await import('jose');
  const fs = await import('fs');
  const path = await import('path');

  const teamId = process.env.APPLE_TEAM_ID;
  const clientId = process.env.APPLE_CLIENT_ID; // Bundle ID for in-app flow
  const keyId = process.env.APPLE_KEY_ID;

  let privateKey = process.env.APPLE_PRIVATE_KEY || '';
  const privateKeyPath = process.env.APPLE_PRIVATE_KEY_PATH || path.resolve(process.cwd(), 'secrets', 'AuthKey.p8');

  if (!privateKey) {
    if (fs.existsSync(privateKeyPath)) {
      privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    }
  }

  if (privateKey && privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  const missing = [];
  if (!teamId) missing.push('APPLE_TEAM_ID');
  if (!clientId) missing.push('APPLE_CLIENT_ID');
  if (!keyId) missing.push('APPLE_KEY_ID');
  if (!privateKey) missing.push('APPLE_PRIVATE_KEY or APPLE_PRIVATE_KEY_PATH');

  if (missing.length) {
    console.error('Missing required configuration:', missing.join(', '));
    console.error('Tip: Put your .p8 at', privateKeyPath, 'or set APPLE_PRIVATE_KEY in .env');
    process.exit(1);
  }

  try {
    const alg = 'ES256';
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 180 * 24 * 60 * 60; // ~180 days

    const key = await importPKCS8(privateKey, alg);
    const jwt = await new SignJWT({})
      .setProtectedHeader({ alg, kid: keyId })
      .setIssuer(teamId) // iss
      .setSubject(clientId) // sub
      .setAudience('https://appleid.apple.com') // aud
      .setIssuedAt(now) // iat
      .setExpirationTime(exp) // exp
      .sign(key);

    console.log(JSON.stringify({
      teamId,
      clientId,
      keyId,
      issuedAt: now,
      expiresAt: exp,
      jwt
    }, null, 2));
  } catch (err) {
    console.error('Failed to generate Apple client secret:', err);
    process.exit(1);
  }
});


