// Sampling card for one Sample Card No: the original COST BREAKUP v6 PDF, unchanged, plus
//  - the QR in the header box (scan opens /<JC> on this site) with Sample Card No and No of Colors below it,
//  - the page 2 label "JC No" renamed "Sample Card No",
//  - FABRIC INFORMATION only, typed from the SAMPLE MASTER rows of this card (no spec, process or cost values).
// Colour name and colour no are not printed (they live in the sheet only).
// Everything else on the form stays blank for people to write by hand.
// /pdf/<JC>?blank=1 prints the form with the QR and number only.
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const QR = require('qrcode');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs'); const path = require('path');
const { rowsForJc } = require('../lib/sheet');

const bad = (res, code, msg) => { res.statusCode = code; res.setHeader('content-type', 'text/plain; charset=utf-8'); res.end(msg); };
const uniq = a => [...new Set(a.map(s => String(s ?? '').trim()).filter(Boolean))];

module.exports = async (req, res) => {
  const u = new URL(req.url, 'http://x'); const jc = (u.searchParams.get('jc') || '').trim().toUpperCase();
  const blank = u.searchParams.get('blank') === '1';
  if (!/^[A-Z0-9-]{1,20}$/.test(jc)) return bad(res, 400, 'Bad Sample Card No');
  let rows = [];
  if (!blank) {
    try { rows = await rowsForJc(jc); } catch (e) { return bad(res, 502, 'Cannot read the sample sheet now. Try again.'); }
    if (!rows.length) return bad(res, 404, `No sample found for ${jc}. Save it in the sample form first.`);
  }
  const proto = req.headers['x-forwarded-proto'] || 'https'; const host = req.headers['x-forwarded-host'] || req.headers.host;
  const base = process.env.PUBLIC_BASE_URL || `${proto}://${host}`;

  const doc = await PDFDocument.load(fs.readFileSync(path.join(process.cwd(), 'assets', 'cost-breakup-v6.pdf')));
  doc.registerFontkit(fontkit);
  const cal = await doc.embedFont(fs.readFileSync(path.join(process.cwd(), 'assets', 'Caladea-Regular.ttf')), { subset: true });
  const hel = await doc.embedFont(StandardFonts.Helvetica), helB = await doc.embedFont(StandardFonts.HelveticaBold);
  const p1 = doc.getPage(0), H = p1.getHeight();
  const ink = rgb(0, 0, 0);
  const Y = top => H - top;                                    // top-based y (as pdftotext) -> PDF y

  // ---- header box on both pages (printed "JC No / No of Colors" box is wiped and replaced) ----
  const png = await QR.toBuffer(`${base}/${jc}`, { errorCorrectionLevel: 'M', margin: 0, scale: 12, type: 'png' });
  const img = await doc.embedPng(png);
  // same header on both pages: QR in a square frame, "Sample Card No" beside it, "No of Colors" below
  const header = (page, btop, wipeTop, wipeH) => {
    const bx = 430.8, bw = 127.2, bs = 70;
    page.drawRectangle({ x: bx - 1, y: Y(wipeTop + wipeH), width: bw + 2, height: wipeH, color: rgb(1, 1, 1) });   // wipe the printed box and its lines
    page.drawRectangle({ x: bx, y: Y(btop + bs), width: bs, height: bs, borderColor: ink, borderWidth: 0.72, color: rgb(1, 1, 1) });
    page.drawImage(img, { x: bx + 5, y: Y(btop + bs - 5), width: bs - 10, height: bs - 10 });
    const sx = bx + bs + 7, sw = bx + bw - sx;
    page.drawText('Sample Card No', { x: sx, y: Y(btop + 24), size: 7.6, font: cal, color: ink });
    page.drawText(jc, { x: sx + 1, y: Y(btop + 40) + 1, size: 12, font: helB, color: ink });
    page.drawLine({ start: { x: sx, y: Y(btop + 40) }, end: { x: sx + sw, y: Y(btop + 40) }, thickness: 1, color: ink });
    const ny = Y(btop + bs + 18), nl = 'No of Colors', nlw = cal.widthOfTextAtSize(nl, 9.5);
    page.drawText(nl, { x: bx, y: ny, size: 9.5, font: cal, color: ink });
    if (!blank) page.drawText(String(rows.length), { x: bx + nlw + 8, y: ny + 0.5, size: 11, font: helB, color: ink });
    page.drawLine({ start: { x: bx + nlw + 4, y: ny - 1.8 }, end: { x: bx + bw, y: ny - 1.8 }, thickness: 1, color: ink });
  };
  header(p1, 30.6, 29.1, 52);          // page 1: printed box top 30.6-78.6
  header(doc.getPage(1), 56, 59, 46);  // page 2: printed box top 60.2-103.4 (x436.3-558.1)

  if (!blank) {
    const r0 = rows[0], g = k => String(r0[k] ?? '').trim();
    // text fitted to a width (font shrinks to 6pt), vertically centred on a row centre
    const put = (text, x, cy, maxW, { size = 8.5, align = 'left', font = helB } = {}) => {
      text = String(text ?? '').trim(); if (!text) return;
      while (size > 6 && font.widthOfTextAtSize(text, size) > maxW) size -= 0.25;
      const w = font.widthOfTextAtSize(text, size);
      const x1 = align === 'center' ? x - w / 2 : x;
      p1.drawText(text, { x: x1, y: Y(cy) - size * 0.35, size, font, color: ink });
    };
    const tick = (cx, cy) => {                                  // check mark inside a box
      p1.drawLine({ start: { x: cx - 3.4, y: Y(cy) - 0.2 }, end: { x: cx - 0.9, y: Y(cy) - 3.2 }, thickness: 1.5, color: ink });
      p1.drawLine({ start: { x: cx - 0.9, y: Y(cy) - 3.2 }, end: { x: cx + 3.8, y: Y(cy) + 3.6 }, thickness: 1.5, color: ink });
    };
    const ring = (x0, x1, cy) => p1.drawEllipse({ x: (x0 + x1) / 2, y: Y(cy), xScale: (x1 - x0) / 2 + 2, yScale: 6, borderColor: ink, borderWidth: 1 });
    const unit = (v) => String(v || '').trim().toUpperCase().replace(/^PCS$/, 'PC');

    // header
    const d = g('Recd Date'); put(d, 118, 42.4, 40, { size: 9 });

    // vendor block
    put(g('Fabric Vendor'), 112, 105.3, 300);
    put(g('Fabric Design No'), 112, 128.3, 92);
    put(g('Fabric Quality'), 260, 128.3, 116);

    // fabric table: [row centre, key prefix, unit key, unit word boxes]
    const COL = { type: 209.5, quality: 254, width: 299.5, mtr: 340.4, rate: 383.1 };
    const cells = (cy, k) => {
      put(g(k.type), COL.type, cy, 38, { align: 'center', size: 8 });
      put(g(k.quality), COL.quality, cy, 48, { align: 'center', size: 8 });
      put(g(k.width), COL.width, cy, 38, { align: 'center' });
      put(g(k.mtr), COL.mtr, cy, 38, { align: 'center' });
      put(g(k.rate), COL.rate, cy, 40, { align: 'center' });
    };
    const f1 = { type: 'Fabric 1 Type', quality: 'Fabric 1 Quality', width: 'Fabric 1 Width', mtr: 'Fabric 1 Mtr', rate: 'Fabric 1 Rate' };
    const f2 = { type: 'Fabric 2 Type', quality: 'Fabric 2 Quality', width: 'Fabric 2 Width', mtr: 'Fabric 2 Mtr', rate: 'Fabric 2 Rate' };
    cells(205.3, f1); cells(228.3, f2);
    const dp = { quality: 'DP Quality', width: 'Dp Width', mtr: 'Dp Fabric Mtr', rate: 'Dp Rate' };
    cells(251.5, dp);
    cells(274.6, { quality: 'Pant Quality', width: 'Pant Width', mtr: 'Pant Fabric Mtr', rate: 'Pant Rate' });
    // unit: circle PC or MTR
    const un = (v, cy, pc, mtr) => { const u2 = unit(v); if (u2 === 'PC') ring(pc[0], pc[1], cy); else if (u2 === 'MTR') ring(mtr[0], mtr[1], cy); };
    un(g('Fabric 1 Unit'), 205.3, [146.9, 157.1], [163.1, 181.3]);
    un(g('Fabric 2 Unit'), 228.3, [146.9, 157.1], [163.1, 181.3]);
    un(g('Dp Unit'), 251.5, [144.9, 155.1], [161.1, 179.2]);
    // Dupatta / Pant yes-no boxes
    const yn = (v, cy, bx) => { const t = String(v || '').trim().toLowerCase(); if (t === 'yes') tick(bx[0], cy); else if (t === 'no') tick(bx[1], cy); };
    yn(g('Dupatta'), 251.9, [109.2, 128.8]); yn(g('Pant'), 274.4, [109.5, 130]);

    // trims: left = DL SL RN PL (MTR, RATE); right = SS EX ACC 1-3 (Type, MTR, RATE)
    const L = [['DL', 342.7, 'DL'], ['SL', 364.2, 'SL'], ['RN', 385.8, 'RN'], ['PL', 407.4, 'PL']];
    L.forEach(([k, cy]) => { put(g(k + ' Mtr'), 139.8, cy, 34, { align: 'center' }); put(g(k + ' Rate'), 179, cy, 38, { align: 'center' });
      if (g(k + ' Received').toLowerCase() === 'yes') tick(126, cy); });
    const R = [['SS', 342.7], ['EX ACC 1', 364.2], ['EX ACC 2', 385.8], ['EX ACC 3', 407.4]];
    R.forEach(([k, cy]) => { put(g(k + ' Type'), 281.5, cy, 38, { align: 'center', size: 8 }); put(g(k + ' Mtr'), 321.5, cy, 38, { align: 'center' }); put(g(k + ' Rate'), 366.5, cy, 46, { align: 'center' });
      if (g(k + ' Received').toLowerCase() === 'yes') tick(256.5, cy); });

    // fabric remark -> the Remark box on the right
    const rem = g('Fabric Remark');
    if (rem) {
      const words = rem.split(/\s+/); let line = ''; let y = 474; const lines = [];
      words.forEach(w => { const t = line ? line + ' ' + w : w; if (hel.widthOfTextAtSize(t, 8) > 138) { lines.push(line); line = w; } else line = t; });
      if (line) lines.push(line);
      lines.slice(0, 9).forEach(l => { p1.drawText(l, { x: 417, y: Y(y), size: 8, font: hel, color: ink }); y += 11; });
    }
  }

  const bytes = await doc.save();
  res.setHeader('content-type', 'application/pdf'); res.setHeader('content-disposition', `inline; filename="sampling-card-${jc}.pdf"`);
  res.setHeader('cache-control', 'no-store');
  res.end(Buffer.from(bytes));
};
