// Prints the blank sampling card (original PDF, unchanged) with a QR that opens /<JC> on this site.
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const QR = require('qrcode');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs'); const path = require('path');
module.exports = async (req, res) => {
  const u = new URL(req.url, 'http://x'); const jc = (u.searchParams.get('jc') || '').trim().toUpperCase();
  if (!/^[A-Z0-9-]{1,20}$/.test(jc)) { res.statusCode = 400; return res.end('Bad JC number'); }
  const proto = req.headers['x-forwarded-proto'] || 'https'; const host = req.headers['x-forwarded-host'] || req.headers.host;
  const base = process.env.PUBLIC_BASE_URL || `${proto}://${host}`;
  const doc = await PDFDocument.load(fs.readFileSync(path.join(process.cwd(), 'assets', 'cost-breakup-v6.pdf')));
  const p1 = doc.getPage(0); const H = p1.getHeight();
  const png = await QR.toBuffer(`${base}/${jc}`, { errorCorrectionLevel: 'M', margin: 1, scale: 12, type: 'png' });
  doc.registerFontkit(fontkit);
  const cal = await doc.embedFont(fs.readFileSync(path.join(process.cwd(), 'assets', 'Caladea-Regular.ttf')), { subset: true });
  const img = await doc.embedPng(png); const f = await doc.embedFont(StandardFonts.Helvetica), fb = await doc.embedFont(StandardFonts.HelveticaBold);
  const x = 392, top = 84, size = 66;
  p1.drawImage(img, { x, y: H - top - size, width: size, height: size });
  p1.drawText('Scan: live sample', { x: x + size + 5, y: H - top - 10, size: 6.5, font: f, color: rgb(0, 0, 0) });
  p1.drawText('status', { x: x + size + 5, y: H - top - 18, size: 6.5, font: f });
  p1.drawText(jc, { x: x + size + 5, y: H - top - 40, size: 13, font: fb });
  // Printed label "JC No" becomes "Sample Card No" (white patch over the old text, same line style).
  const relabel = (page, x0, x1, y0, y1, fs, lineEnd) => {
    const Hh = page.getHeight(); const base = Hh - (y0 + 0.8 * (y1 - y0));
    page.drawRectangle({ x: x0 - 1.5, y: Hh - y1 - 1.5, width: x1 - x0 + 3, height: y1 - y0 + 3, color: rgb(1, 1, 1) });
    page.drawText('Sample Card No', { x: x0, y: base, size: fs, font: cal, color: rgb(0, 0, 0) });
    const w = cal.widthOfTextAtSize('Sample Card No', fs);
    page.drawLine({ start: { x: x0 + w + 1, y: base - 1.2 }, end: { x: lineEnd, y: base - 1.2 }, thickness: 0.45, color: rgb(0, 0, 0) });
  };
  relabel(p1, 438.34, 545.3, 34.5, 47.5, 10.3, 549);
  relabel(doc.getPage(1), 443.86, 508.0, 64.05, 74.6, 9.0, 534.3);
  const bytes = await doc.save();
  res.setHeader('content-type', 'application/pdf'); res.setHeader('content-disposition', `inline; filename="sampling-card-${jc}.pdf"`);
  res.end(Buffer.from(bytes));
};
