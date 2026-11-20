const { rowsForJc } = require('../lib/sheet');
const { page } = require('../lib/render');
module.exports = async (req, res) => {
  const u = new URL(req.url, 'http://x'); const jc = (u.searchParams.get('jc') || '').trim();
  res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'no-store');
  if (!/^[A-Za-z0-9-]{1,20}$/.test(jc)) { res.statusCode = 400; return res.end('<p style="font:16px system-ui;padding:24px">Enter a sample JC number, for example S171.</p>'); }
  try {
    const rows = await rowsForJc(jc);
    if (!rows.length) { res.statusCode = 404; return res.end(`<p style="font:16px system-ui;padding:24px">No sample found for JC ${jc.replace(/[<>&]/g, '')}.</p>`); }
    const c = (u.searchParams.get('c') || '').toUpperCase(); const i = Math.max(0, rows.findIndex(r => String(r['Colour Code']).toUpperCase() === c));
    res.end(page({ jc: rows[0]['Sample Jc No'], rows, active: i, base: '' }));
  } catch (e) { res.statusCode = 502; res.end('<p style="font:16px system-ui;padding:24px">Cannot read the sample sheet now. Try again.</p>'); }
};
