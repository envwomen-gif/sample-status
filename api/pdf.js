// Prints the blank sampling card (original PDF, unchanged) with a QR that opens /<JC> on this site.
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const QR = require('qrcode');
const fs = require('fs'); const path = require('path');
module.exports = async (req, res) => {
  const u = new URL(req.url, 'http://x'); const jc = (u.searchParams.get('jc') || '').trim().toUpperCase();
  if (!/^[A-Z0-9-]{1,20}$/.test(jc)) { res.statusCode = 400; return res.end('Bad JC number'); }
  const proto = req.headers['x-forwarded-proto'] || 'https'; const host = req.headers['x-forwarded-host'] || req.headers.host;
  const base = process.env.PUBLIC_BASE_URL || `${proto}://${host}`;
  const doc = await PDFDocument.load(fs.readFileSync(path.join(process.cwd(), 'assets', 'cost-breakup-v6.pdf')));
  const p1 = doc.getPage(0); const H = p1.getHeight();
  const png = await QR.toBuffer(`${base}/${jc}`, { errorCorrectionLevel: 'M', margin: 1, scale: 12, type: 'png' });
  const img = await doc.embedPng(png); const f = await doc.embedFont(StandardFonts.Helvetica), fb = await doc.embedFont(StandardFonts.HelveticaBold);
  const x = 392, top = 84, size = 66;
  p1.drawImage(img, { x, y: H - top - size, width: size, height: size });
  p1.drawText('Scan: live sample', { x: x + size + 5, y: H - top - 10, size: 6.5, font: f, color: rgb(0, 0, 0) });
  p1.drawText('status', { x: x + size + 5, y: H - top - 18, size: 6.5, font: f });
  p1.drawText(jc, { x: x + size + 5, y: H - top - 40, size: 13, font: fb });
  const bytes = await doc.save();
  res.setHeader('content-type', 'application/pdf'); res.setHeader('content-disposition', `inline; filename="sampling-card-${jc}.pdf"`);
  res.end(Buffer.from(bytes));
};
