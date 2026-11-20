// Reads SAMPLE MASTER rows for one JC. Header row = sheet row 3. Repeated headers get "@2", "@3"...
// Env: SHEET_ID, GOOGLE_SERVICE_ACCOUNT (JSON; share the sheet with that account as Viewer).
const crypto = require('crypto');
let tok = null;
async function token() {
  if (tok && tok.exp > Date.now() + 60000) return tok.v;
  const sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  const b = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const u = b({ alg: 'RS256', typ: 'JWT' }) + '.' + b({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/spreadsheets.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const sig = crypto.createSign('RSA-SHA256').update(u).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: u + '.' + sig }) });
  const j = await r.json(); if (!j.access_token) throw new Error('auth failed');
  tok = { v: j.access_token, exp: Date.now() + 3500000 }; return tok.v;
}
async function rowsForJc(jc) {
  const range = encodeURIComponent("'SAMPLE MASTER'!A3:GZ600");
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${process.env.SHEET_ID}/values/${range}?valueRenderOption=FORMATTED_VALUE`, { headers: { authorization: 'Bearer ' + await token() }, cache: 'no-store' });
  if (!r.ok) throw new Error('sheet read failed ' + r.status);
  const [head, ...data] = (await r.json()).values || [];
  const seen = {}; const keys = head.map(h => { h = String(h).trim(); seen[h] = (seen[h] || 0) + 1; return seen[h] > 1 ? `${h}@${seen[h]}` : h; });
  const want = String(jc).trim().toUpperCase();
  return data.filter(row => String(row[keys.indexOf('Sample Jc No')] || '').trim().toUpperCase() === want)
    .map(row => Object.fromEntries(keys.map((k, i) => [k, row[i] ?? ''])));
}
module.exports = { rowsForJc };
