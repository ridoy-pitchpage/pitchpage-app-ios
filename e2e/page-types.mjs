import { BASE, launch } from "./harness.mjs";
const mod = await import('./stubs.mjs');
const KINDS = ['job','university','athlete','real-estate','listing','contractor','sales','other'];
const b = await launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await mod.installStubs(ctx);
const p = await ctx.newPage();
let bad = 0;
for (const k of KINDS) {
  const errs = [];
  const onErr = e => errs.push(String(e).slice(0,100));
  p.on('pageerror', onErr);
  await p.goto(`${BASE}/intake/${k}/${mod.DRAFT_ID}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const out = await p.evaluate(() => {
    const de = document.documentElement, t = (document.body.innerText||'').trim();
    const i = [];
    if (de.scrollWidth > de.clientWidth + 1) i.push('OVERFLOW');
    if (t.length < 60) i.push('BLANK');
    if (/couldn.t open that page type/i.test(t)) i.push('DEAD END');
    if (/undefined|NaN/.test(t)) i.push('BAD TEXT');
    const fields = document.querySelectorAll('input, textarea, [role="button"], [role="radio"]').length;
    if (fields < 3) i.push('NO CONTROLS');
    return { i, fields, head: t.split('\n').slice(0,3).join(' | ').slice(0,95) };
  });
  p.off('pageerror', onErr);
  if (out.i.length || errs.length) bad++;
  console.log(`${k.padEnd(12)} ${out.i.length||errs.length ? '!! '+[...out.i,...errs].join(' ; ') : 'ok'}  (${out.fields} controls)  ${out.head}`);
}
console.log(bad === 0 ? '\nAll 8 page types render.' : `\n${bad} FAILED`);
await b.close();
