// Renders the sampling card (same layout as the paper COST BREAKUP v6 form) filled from one sheet row.
// rows: array of row objects (one per colour of the same JC). Object keys = sheet header names; the 2nd
// occurrence of a repeated header gets "@2" (e.g. "Fabric 1 Type@2" is the cost-table copy).
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const NA = v => { const t = String(v ?? '').trim(); return t === '' ? '' : t; };

function sheet(r, nColours, colourTabs) {
  const g = (k) => NA(r[k]);
  const yes = (k) => g(k).toLowerCase() === 'yes';
  const no = (k) => g(k).toLowerCase() === 'no';
  const val = (x) => x ? `<span class="v">${esc(x)}</span>` : '';
  const box = (on) => `<span class="cb${on ? ' on' : ''}"></span>`;
  const yn = (k) => `<div class="yn">${box(yes(k))}${box(no(k))}</div>`;
  const opt = (cur, list) => list.map(o => {
    const m = String(cur || '').toLowerCase().replace(/\s+/g, '');
    const hit = m && (m === o.toLowerCase().replace(/\s+/g, '') || (o === 'Other' && !list.some(x => x.toLowerCase().replace(/\s+/g, '') === m)));
    return `<span class="${hit ? 'circ' : ''}">${esc(o)}</span>`;
  }).join(' / ');

  // absolute table helper: x, y, widths[], rows[[h, [cells]]]; cell = string | {t, c:class, s:colspan, r:rowspan}
  const T = (x, y, w, rows, cls = '') => {
    const W = w.reduce((a, b) => a + b, 0);
    let h = '';
    rows.forEach(([rh, cells]) => {
      h += `<tr style="height:${rh}px">` + cells.map(c => {
        if (typeof c === 'string') c = { t: c };
        return `<td class="${c.c || ''}"${c.s ? ` colspan="${c.s}"` : ''}${c.r ? ` rowspan="${c.r}"` : ''}>${c.t ?? ''}</td>`;
      }).join('') + '</tr>';
    });
    return `<table class="t ${cls}" style="left:${x}px;top:${y}px;width:${W}px"><colgroup>${w.map(a => `<col style="width:${a}px">`).join('')}</colgroup>${h}</table>`;
  };
  const B = (x, y, w, h, inner, cls = '') => `<div class="bx ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">${inner}</div>`;
  const dash = (x, y, w) => `<div class="dash" style="left:${x}px;top:${y}px;width:${w}px"></div>`;
  const pin = (x, y, t) => `<div class="hd" style="left:${x}px;top:${y}px"><i>&#9679;</i>${t}</div>`;
  const G = 'g';
  const ac = (lab, k) => `${lab}${yes(k + ' Received') ? ' <b class="ok">&#10003;</b>' : ''}`;

  // ---------- PAGE 1 ----------
  const fabRow = (lab, n, hasYN, ynKey) => [24, [
    { t: lab, c: 'l b' },
    hasYN ? { t: yn(ynKey), s: 2 } : { c: G, s: 2 },
    { t: `<span class="un">${opt(g(`Fabric ${n} Unit`) === 'PCS' ? 'PC' : g(`Fabric ${n} Unit`), ['PC', 'MTR'])}</span>` },
    { t: val(g(`Fabric ${n} Type`)) }, { t: val(g(`Fabric ${n} Quality`)) }, { t: val(g(`Fabric ${n} Width`)) },
    { t: val(g(`Fabric ${n} Mtr`)) }, { t: val(g(`Fabric ${n} Rate`)) }]];
  const dpUnit = g('Dp Unit') === 'PCS' ? 'PC' : g('Dp Unit');
  const p1 = [
    B(40, 34, 150, 26, `<span class="lb">Received Date</span> ${val(g('Recd Date'))}`),
    `<div class="title">GARMENT COST BREAKUP SHEET</div>`,
    B(484, 35, 137, 53, `<div class="jcl"><span class="lb">JC No</span> ${val(g('Sample Jc No') + (g('Colour Code') ? ' · ' + g('Colour Code') : ''))}</div><div class="jcl"><span class="lb">No of Colors</span> ${val(String(nColours))}</div>`),
    pin(40, 79, 'FABRIC INFORMATION'),
    T(40, 104, [80, 110, 55, 134], [
      [26, [{ t: 'Fabric Vendor', c: 'l b' }, { t: val(g('Fabric Vendor')), s: 3 }]],
      [26, [{ t: 'Design No', c: 'l b' }, { t: val(g('Fabric Design No')) }, { t: 'Quality', c: 'l sm' }, { t: val(g('Fabric Quality')) }]],
      [25, [{ t: 'Colour Name', c: 'l b' }, { t: val(g('Fabric Colour Name')) }, { t: 'Colour No', c: 'l sm' }, { t: val(g('Fabric Colour No')) }]]]),
    T(40, 181, [70, 43, 43, 58, 44, 55, 46, 45, 50], [
      [34, [{ t: 'Particular', c: G + ' h' }, { t: 'Yes No', c: G + ' h b', s: 2 }, { t: 'Unit', c: G + ' h b' }, { t: 'Type', c: G + ' h b' }, { t: 'Quality', c: G + ' h b' }, { t: 'Width', c: G + ' h b' }, { t: 'MTR', c: G + ' h b' }, { t: 'Rate', c: G + ' h b' }]],
      fabRow('FABRIC 1', 1, false), fabRow('FABRIC 2', 2, false),
      [26, [{ t: 'Dupatta', c: 'l b' }, { t: yn('Dupatta'), s: 2 }, { t: `<span class="un">${opt(dpUnit, ['PC', 'MTR'])}</span>` }, { t: val(g('DP Type') === 'NA' ? '' : g('DP Type')), c: G }, { t: val(g('DP Quality')), c: 'sm' }, { t: val(g('Dp Width')) }, { t: val(g('Dp Fabric Mtr')) }, { t: val(g('Dp Rate')) }]],
      [26, [{ t: 'Pant', c: 'l b' }, { t: yn('Pant'), s: 2 }, { c: G }, { c: G }, { t: val(g('Pant Quality')) }, { t: val(g('Pant Width')) }, { t: val(g('Pant Fabric Mtr')) }, { t: val(g('Pant Rate')) }]]], 'hdr'),
    `<div class="sub" style="left:40px;top:320px">TRIMS &amp; ACCESSORIES – Received (tick for yes/no)</div>`,
    T(40, 340, [95, 41, 46, 69, 44, 45, 55], [
      [28, [{ t: 'Accessories', c: G + ' h' }, { t: 'MTR', c: G + ' h' }, { t: 'RATE', c: G + ' h' }, { t: 'Accessories', c: G + ' h' }, { t: 'Type', c: G + ' h' }, { t: 'MTR', c: G + ' h' }, { t: 'RATE', c: G + ' h' }]],
      [24, [{ t: ac('Daman Lace- DL', 'DL'), c: 'l' }, val(g('DL Mtr')), val(g('DL Rate')), { t: ac('Side Slit - SS', 'SS'), c: 'c' }, val(g('SS Type')), val(g('SS Mtr')), val(g('SS Rate'))]],
      [24, [{ t: ac('Sleeves Lace - SL', 'SL'), c: 'l' }, val(g('SL Mtr')), val(g('SL Rate')), { t: ac('EX ACC 1', 'EX ACC 1'), c: 'c' }, val(g('EX ACC 1 Type')), val(g('EX ACC 1 Mtr')), val(g('EX ACC 1 Rate'))]],
      [24, [{ t: ac('Ready Neck - RN', 'RN'), c: 'l' }, val(g('RN Mtr')), val(g('RN Rate')), { t: ac('EX ACC 2', 'EX ACC 2'), c: 'c' }, val(g('EX ACC 2 Type')), val(g('EX ACC 2 Mtr')), val(g('EX ACC 2 Rate'))]],
      [25, [{ t: ac('Pant Lace - PL', 'PL'), c: 'l' }, val(g('PL Mtr')), val(g('PL Rate')), { t: ac('EX ACC 3', 'EX ACC 3'), c: 'c' }, val(g('EX ACC 3 Type')), val(g('EX ACC 3 Mtr')), val(g('EX ACC 3 Rate'))]]], 'hdr'),
    dash(37, 466, 400),
    pin(40, 467, 'GARMENT SPECIFICATIONS'),
    (() => { const c = g('Category').toLowerCase(), b = g('Brand').toLowerCase();
      const it = (n, cur) => `<span class="${cur === n.toLowerCase() ? 'circ' : ''}">${n}</span>`;
      return T(40, 495, [72, 70, 71, 72, 100], [
        [24, [{ t: 'Category', c: G + ' b', r: 2 }, it('Partyware', c), it('SKD', c), it('Kurti set', c), it('Kurti', c)]],
        [26, [it('Tunic', c), it('Tops', c), it('Only Dupatta', c), it('Only Plazo', c)]],
        [25, [{ t: 'Brand', c: G + ' b' }, it('Envwomen', b), it('Kaasni', b), it('Ekaja', b), '']]]); })(),
    B(457, 497, 163, 142, `<span class="lb">Remark:</span> ${val([g('Fabric Remark'), g('Spec Remark')].filter(Boolean).join(' · '))}`, 'rm'),
    T(40, 584, [63, 63, 63, 63, 63, 63], [
      [26, ['Body Farma', 'Sleeve Farma', 'Pant Farma', 'Neck Farma', 'Kurti Length', 'Kurti Ghera'].map(x => ({ t: x, c: G + ' h b' }))],
      [27, [g('Body Farma'), g('Sleeve Farma'), g('Pant Farma'), g('Neck Farma'), g('Kurti Length'), g('Kurti Ghera')].map(x => ({ t: val(x), c: 'big' }))]]),
    T(40, 645, [82, 31, 31, 117], [
      [17, [{ t: 'Particulars', c: G + ' h b' }, { t: 'Yes', c: G + ' h b' }, { t: 'No', c: G + ' h b' }, { t: 'Type', c: G + ' h b' }]],
      [35, [{ t: 'Kurti Lining', c: 'l b' }, { t: box(yes('Kurti Lining')), c: 'c' }, { t: box(no('Kurti Lining')), c: 'c' }, { t: opt(g('Kurti Lining Type'), ['BC', 'CL', 'SN']), c: 'c b' }]],
      [36, [{ t: 'Dupatta DP', c: 'l b' }, { t: box(yes('Dupatta DP')), c: 'c' }, { t: box(no('Dupatta DP')), c: 'c' }, { t: opt(g('Dupatta DP Type'), ['Fabric', 'Dyed']), c: 'c b' }]],
      [37, [{ t: 'Pant Required', c: 'l b' }, { t: box(yes('Pant Required')), c: 'c' }, { t: box(no('Pant Required')), c: 'c' }, { t: opt(g('Pant Required Type'), ['Fabric', 'Santone', 'Jam Cotton', 'Other']), c: 'c sm' }]],
      [26, [{ t: 'Pant Dyed', c: 'c b' }, { t: box(yes('Pant Dyed')), c: 'c' }, { t: box(no('Pant Dyed')), c: 'c' }, { t: val(g('Pant Dyed Type')), c: 'c' }]],
      [38, [{ t: 'Pant Lining', c: 'l b' }, { t: box(yes('Pant Lining')), c: 'c' }, { t: box(no('Pant Lining')), c: 'c' }, { t: opt(g('Pant Lining Type'), ['Cotton', 'BC']), c: 'c' }]]]),
    (() => { const rr = (lab, k, tk) => [20.5, [{ t: lab, c: 'l sm' }, { t: val(g(tk)), c: G2(tk) }, { t: box(yes(k)), c: 'c' }, { t: box(no(k)), c: 'c' }]];
      function G2(tk) { return /^(DL|SL|RN|PL|SS)/.test(tk) ? 'gd' : ''; }
      return T(297, 645, [82, 44, 32, 32], [
        [20, [{ t: 'Accessories', c: G + ' h b' }, { t: 'Type', c: G + ' h b' }, { t: 'Yes', c: G + ' h b' }, { t: 'No', c: G + ' h b' }]],
        rr('Daman Lace- DL', 'DL Required', 'DL Required Type'), rr('Sleeves Lace - SL', 'SL Required', 'SL Required Type'), rr('Ready Neck - RN', 'RN Required', 'RN Required Type'),
        rr('Pant Lace – PL', 'PL Required', 'PL Required Type'), rr('Side Slit – SS', 'SS Required', 'SS Required Type'),
        rr('EX ACC 1', 'EX ACC 1 Required', 'EX ACC 1 Req Type'), rr('EX ACC 2', 'EX ACC 2 Required', 'EX ACC 2 Req Type'), rr('EX ACC 3', 'EX ACC 3 Required', 'EX ACC 3 Req Type')], 'acc'); })(),
    B(497, 645, 123, 83, `<span class="lb">Remark:</span> ${val(g('Accessories Remark'))}`, 'rm'),
    T(497, 732, [50, 73], [[17, [{ t: 'Embd', c: G + ' h' }, { t: 'Worker Name', c: G + ' h' }]], [38, [{ t: `<span class="b sm">Yes No</span><div class="yn">${box(yes('Embd'))}${box(no('Embd'))}</div>`, c: 'c' }, { t: val(g('Embd Worker Name')), c: 'c' }]]]),
    B(502, 802, 118, 88, `<div class="dm"><span class="lb b">D NO</span> ${val(g('Design No'))}</div><div class="dm"><span class="lb b">MRP</span> ${val(g('MRP'))}</div>`),
    T(40, 841, [115, 130], [[16, [{ t: 'Process Owner', c: 'l b sm' }, val(g('Process Owner'))]], [16, [{ t: 'Process Start Date', c: 'l b sm' }, val(g('Process Start Date'))]], [17, [{ t: 'Process status', c: 'l b sm' }, val(g('Process Status'))]]]),
    B(297, 838, 190, 24, `<span class="lb">COLLLECTION</span> ${val(g('Collection') || g('COLLECTION'))}`),
    `<div class="ft" style="left:54px;top:908px">Version 4</div><div class="ft" style="left:612px;top:908px">1</div>`,
  ].join('');

  // ---------- PAGE 2 ----------
  const pr = (lab, ynk, nm, sd, ed, h, greyYN, greyNm) => [h, [{ t: lab, c: 'l' },
    greyYN ? { c: G, s: 2 } : { t: ynk ? yn(ynk) : '', s: 2 }, greyNm ? { c: G } : { t: val(nm), c: 'c' }, { t: val(sd), c: 'c' }, { t: val(ed), c: 'c' }]];
  const c4 = (lab, key, cls = '') => [26, [{ t: lab, c: 'l ' + cls }, val(g(key + ' Type')), val(g(key + ' Avg')), val(g(key + ' Rate')), val(g(key + ' Cost'))]];
  const K = (n) => `${n}@2`;
  const kr = (lab, t, a, rt, c, cls = '', gr = false) => [26, [{ t: lab, c: 'l ' + cls }, gr ? { c: G } : { t: val(g(t)), c: 'c' }, gr ? { c: G } : { t: val(g(a)), c: 'c' }, gr ? { c: G } : { t: val(g(rt)), c: 'c' }, { t: val(g(c)), c: 'c' }]];
  const p2 = [
    pin(40, 60, 'PROCESS TRACKING'),
    B(486, 67, 134, 49, `<div class="jcl sm"><span class="lb">JC No</span> ${val(g('Sample Jc No') + (g('Colour Code') ? ' · ' + g('Colour Code') : ''))}</div><div class="jcl sm"><span class="lb">No of Colors</span> ${val(String(nColours))}</div>`),
    T(40, 87, [119, 36, 36, 72, 70, 70], [
      [16, [{ t: 'Particular', c: G + ' h b' }, { t: 'YES', c: G + ' h b' }, { t: 'NO', c: G + ' h b' }, { t: 'Name', c: G + ' h b' }, { t: 'Start Date', c: G + ' h b' }, { t: 'End Date', c: G + ' h b' }]],
      pr('Cutting', null, g('Cutting Name'), g('Cutting Start Date'), g('Cutting End Date'), 24, true),
      pr('Re-cutting', 'Re-cutting Yes/No', g('Re-cutting Name'), g('Re-cutting Start Date'), g('Re-cutting End Date'), 29),
      pr('Embroidery', 'Embroidery Yes/No', g('Embroidery Name'), g('Embroidery Start Date'), g('Embroidery End Date'), 30),
      pr('Fabric Dyeing Process', 'Fabric Dyeing Yes/No', '', g('Fabric Dyeing Start Date'), g('Fabric Dyeing End Date'), 30, false, true),
      pr('Sticthing Proces', null, g('Stitching Name'), g('Stitching Start Date'), g('Stitching End Date'), 29, true)]),
    B(462, 209, 168, 93, `<span class="lb">Remark:</span> ${val(g('Process Remark'))}`, 'rm'),
    dash(37, 256, 404),
    T(40, 312, [118, 54, 46, 46, 51], [
      [20, [{ t: 'Particular', c: G + ' h b' }, { t: 'Type', c: G + ' h b' }, { t: 'Avg', c: G + ' h b' }, { t: 'Rate', c: G + ' h b' }, { t: 'Cost', c: G + ' h b' }]],
      kr('Fabric 1', K('Fabric 1 Type'), 'Fabric 1 Avg', K('Fabric 1 Rate'), 'Fabric 1 Cost'),
      kr('Fabric 2', K('Fabric 2 Type'), 'Fabric 2 Avg', K('Fabric 2 Rate'), 'Fabric 2 Cost'),
      kr('Fab Dye Rate', 'Fabric Dye Rate Type', 'Fabric Dye Rate Avg', 'Fabric Dye Rate Rate', 'Fabric Dye Rate Cost'),
      kr('Fab Lining Cost', 'Fabric Lining Cost Type', 'Fabric Lining Cost Avg', 'Fabric Lining Cost Rate', 'Fabric Lining Cost Cost'),
      kr('Embd Cost', '', '', '', 'Embroidery Cost', '', true),
      kr('Daman Lace- DL', 'Daman Lace DL Type', 'Daman Lace DL Avg', 'Daman Lace DL Rate', 'Daman Lace DL Cost'),
      kr('Sleeves Lace - SL', 'Sleeves Lace SL Type', 'Sleeves Lace SL Avg', 'Sleeves Lace SL Rate', 'Sleeves Lace SL Cost'),
      kr('Ready Neck - RN', 'Ready Neck RN Type', 'Ready Neck RN Avg', 'Ready Neck RN Rate', 'Ready Neck RN Cost'),
      kr('Side Slit - SS', 'Side Slit SS Type', 'Side Slit SS Avg', 'Side Slit SS Rate', 'Side Slit SS Cost'),
      kr('EX ACC 1', 'Kurti EX ACC 1 Type', 'Kurti EX ACC 1 Avg', 'Kurti EX ACC 1 Rate', 'Kurti EX ACC 1 Cost'),
      kr('EX ACC 2', 'Kurti EX ACC 2 Type', 'Kurti EX ACC 2 Avg', 'Kurti EX ACC 2 Rate', 'Kurti EX ACC 2 Cost'),
      kr('EX ACC 3', 'Kurti EX ACC 3 Type', 'Kurti EX ACC 3 Avg', 'Kurti EX ACC 3 Rate', 'Kurti EX ACC 3 Cost'),
      kr('Kurti Stitching Cost', '', '', '', 'Kurti Stitching Cost', 'b', false),
      kr('Pre Final Cost', '', '', '', 'Kurti Pre Final Cost', 'b'),
      kr('Wastage', '', '', '', 'Kurti Wastage Cost', 'b'),
      kr('Kurti Final Cost', '', '', '', 'Kurti Final Cost', 'b')], 'cost'),
    T(365, 312, [111, 38, 54, 52], [
      [20, [{ t: 'Particular', c: G + ' h b' }, { t: 'Avg', c: G + ' h b' }, { t: 'Rate', c: G + ' h b' }, { t: 'Cost', c: G + ' h b' }]],
      ...[['Pant Fab Avg', 'Pant Fabric'], ['Pant Lace - PL', 'Pant Lace PL'], ['Pant Embroidery', 'Pant Embroidery'], ['Pant lining', 'Pant Lining']].map(([l, k]) => [25, [{ t: l, c: 'l' }, { t: val(g(k + ' Avg')), c: 'c' }, { t: val(g(k + ' Rate')), c: 'c' }, { t: val(g(k + ' Cost')), c: 'c' }]]),
      [25, [{ t: 'Pant Stitching cost', c: 'l' }, { c: G, s: 2 }, { t: val(g('Pant Stitching Cost')), c: 'c' }]],
      [25, [{ t: 'Pre final cost', c: 'l' }, { c: G, s: 2 }, { t: val(g('Pant Pre Final Cost')), c: 'c' }]],
      [25, [{ t: 'Wastage', c: 'l' }, { c: G, s: 2 }, { t: val(g('Pant Wastage Amt')), c: 'c' }]],
      [25, [{ t: 'Pant Final Cost', c: 'l' }, { c: G, s: 2 }, { t: val(g('Pant Final Cost')), c: 'c b' }]]], 'cost'),
    T(365, 563, [111, 38, 54, 52], [
      [20, [{ t: 'Particular', c: G + ' h b' }, { t: 'Avg', c: G + ' h b' }, { t: 'Rate', c: G + ' h b' }, { t: 'Cost', c: G + ' h b' }]],
      [25, [{ t: 'DP Fab', c: 'l' }, { t: val(g('DP Fabric Avg')), c: 'c' }, { t: val(g('DP Fabric Rate')), c: 'c' }, { t: val(g('DP Fabric Cost')), c: 'c' }]],
      [25, [{ t: 'Dyed DP Fab', c: 'l' }, { t: val(g('Dyed DP Fabric Avg')), c: 'c' }, { t: val(g('Dyed DP Fabric Rate')), c: 'c' }, { t: val(g('Dyed DP Fabric Cost')), c: 'c' }]],
      [25, [{ t: 'DP lace Cost', c: 'l' }, { c: G }, { t: val(g('DP Lace Rate')), c: 'c' }, { t: val(g('DP Lace Cost')), c: 'c' }]],
      [25, [{ t: 'DP Funda Cost', c: 'l' }, { c: G }, { t: val(g('DP Funda Rate')), c: 'c' }, { t: val(g('DP Funda Cost')), c: 'c' }]],
      [25, [{ t: 'DP Stitching cost', c: 'l' }, { c: G, s: 2 }, { t: val(g('DP Stitching Cost')), c: 'c' }]],
      [25, [{ t: 'Pre final cost', c: 'l' }, { c: G, s: 2 }, { t: val(g('DP Pre Final Cost')), c: 'c' }]],
      [25, [{ t: 'Wastage', c: 'l' }, { c: G, s: 2 }, { t: val(g('DP Wastage Amt')), c: 'c' }]],
      [25, [{ t: 'Final Cost', c: 'l' }, { c: G, s: 2 }, { t: val(g('DP Final Cost')), c: 'c b' }]]], 'cost'),
    B(52, 797, 174, 108, `<div class="oh">Process End Date</div><div class="ob">${val(g('Process End Date'))}</div>`, 'oe'),
    T(246, 803, [291, 85], [[30, [{ t: 'Production Remark', c: G + ' h' }, { t: 'Total Cost', c: G + ' h' }]], [44, [{ t: val(g('Production Remark')), c: 'l' }, { t: val(g('TOTAL COST')), c: 'c big b' }]]]),
    `<div class="ft" style="left:54px;top:908px">Version 4</div><div class="ft" style="left:612px;top:908px">2</div>`,
  ].join('');

  return `<section class="sheet">${p1}</section><section class="sheet">${p2}</section>`;
}

const CSS = `
:root{--ink:#0b3d91;--blue:#4472c4;--grey:#d9d9d9;--bg:#e9ecf1}
*{box-sizing:border-box}html,body{margin:0}
body{background:var(--bg);font-family:'Caladea','Cambria','Liberation Serif',Georgia,serif;color:#000;-webkit-text-size-adjust:100%}
.bar{position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid #ccd;padding:8px 12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
.bar b{font-size:15px}.bar .meta{color:#555;font-size:12.5px}
.bar .tabs{display:flex;gap:6px;margin-left:auto}
.bar .tabs a{min-width:34px;text-align:center;padding:6px 10px;border:1.5px solid #333;border-radius:20px;font-weight:700;font-size:13px;color:#111;text-decoration:none}
.bar .tabs a.on{background:#111;color:#fff}
.stage{padding:12px 0 30px;display:flex;flex-direction:column;align-items:center;gap:14px;overflow:hidden}
.scaler{transform-origin:top left}
.sheet{position:relative;width:662px;height:936px;background:#fff;border:1.5px solid #000;box-shadow:0 2px 12px rgba(0,0,0,.18);margin:0 0 14px;font-size:11.5px}
.t{position:absolute;border-collapse:collapse;table-layout:fixed}
.t td{border:1px solid #000;padding:0 2px;text-align:center;vertical-align:middle;overflow:hidden;line-height:1.1}
.t td.l{text-align:left}.t td.g,.t td.gd{background:var(--grey)}.t td.h{font-weight:400;font-size:11.5px}
.t td.b,.b{font-weight:700}.sm{font-size:10px}
.t.hdr td.h.b{font-weight:700;font-size:12px}
.t td.big{font-size:14px}
.acc td{font-size:9px;white-space:nowrap}
.cost td{font-size:11px}
.bx{position:absolute;border:1px solid #000;padding:5px 6px}
.bx .lb,.lb{font-size:11.5px}
.bx .v{font-size:11px}
.jcl{margin:2px 0 9px;white-space:nowrap}.jcl.sm{margin:2px 0 7px;font-size:10px}
.dm{margin:6px 0 20px;white-space:nowrap}
.title{position:absolute;left:196px;top:36px;width:280px;text-align:center;color:var(--blue);font-weight:700;font-size:16.5px;letter-spacing:.2px}
.hd{position:absolute;color:var(--blue);font-weight:700;font-size:12px;white-space:nowrap}.hd i{font-style:normal;font-size:9px;margin-right:6px;vertical-align:1px}
.sub{position:absolute;font-weight:700;font-size:11px}
.dash{position:absolute;border-top:2px dashed #000}
.ft{position:absolute;font-size:12px}
.rm{overflow:hidden}.rm .v{display:block;margin-top:5px;white-space:pre-wrap;line-height:1.35}
.oe{padding:0;border:1px solid #000}.oh{background:#c55a11;color:#fff;font-weight:700;font-size:10px;text-align:center;height:24px;line-height:24px}.ob{text-align:center;padding-top:34px;font-size:15px}
.v{font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:var(--ink);font-weight:600;font-size:11.5px}
.t td .v{display:inline-block;max-width:100%;white-space:normal;font-size:10.5px;line-height:1.1}
.cost td .v{font-size:10px}
.t td.l{padding-left:4px}
.big .v,.big.b .v{font-size:13.5px}
.cb{display:inline-block;width:14px;height:14px;border:1px solid #000;margin:0 3px;vertical-align:middle;position:relative;background:#fff}
.cb.on::after{content:'';position:absolute;left:3.5px;top:-1px;width:5px;height:10px;border:solid var(--ink);border-width:0 2.5px 2.5px 0;transform:rotate(40deg)}
.yn{display:flex;justify-content:center;gap:10px}
.ok{color:var(--ink);font-family:system-ui,sans-serif}
.circ{border:1.6px solid var(--ink);border-radius:999px;padding:0 3px;color:var(--ink);font-weight:700;font-family:system-ui,-apple-system,sans-serif;font-size:10px;white-space:nowrap}
.t td{font-size:11px}
.un{font-size:10.5px;white-space:nowrap}
.lb{white-space:nowrap}
.t td.b.l{white-space:nowrap;font-size:11px}
@media print{body{background:#fff}.bar{display:none}.stage{padding:0}.scaler{transform:none!important}.sheet{box-shadow:none;margin:0;page-break-after:always}}
`;

function page({ jc, rows, active, base = '' }) {
  const r = rows[active] || rows[0];
  const tabs = rows.length > 1 ? `<div class="tabs">${rows.map((x, i) => `<a class="${i === active ? 'on' : ''}" href="${base}/${encodeURIComponent(jc)}?c=${encodeURIComponent(x['Colour Code'] || i + 1)}">${esc(x['Colour Code'] || i + 1)}</a>`).join('')}</div>` : '';
  const status = r['Process Status'] ? ` · ${esc(r['Process Status'])}` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sample ${esc(jc)}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Caladea:wght@400;700&display=swap" rel="stylesheet"><style>${CSS}</style></head><body>
<div class="bar"><b>Sample ${esc(jc)}</b><span class="meta">${esc(r['Design No'] || '')}${status}</span>${tabs}</div>
<div class="stage"><div class="scaler" id="sc">${sheet(r, rows.length)}</div></div>
<script>(function(){var s=document.getElementById('sc');function f(){var w=Math.min(window.innerWidth-16,980),k=w/662;s.style.transform='scale('+k+')';s.style.width='662px';s.parentNode.style.height=(s.scrollHeight*k+40)+'px';s.parentNode.style.alignItems='flex-start';s.parentNode.style.paddingLeft=Math.max(8,(window.innerWidth-662*k)/2)+'px'}f();addEventListener('resize',f)})()</script>
</body></html>`;
}
module.exports = { page, sheet };
