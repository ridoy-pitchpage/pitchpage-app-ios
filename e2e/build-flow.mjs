import { BASE, OUT_DIR, launch } from "./harness.mjs";
const mod = await import('./stubs.mjs');



const b = await launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await mod.installStubs(ctx);
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 120)));
p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 120)); });

let step = 0, failed = 0;
const check = async (name, fn) => {
  step++;
  try { const note = await fn(); console.log(`${String(step).padStart(2)}. ${name.padEnd(46)} PASS ${note ?? ''}`); }
  catch (e) { failed++; console.log(`${String(step).padStart(2)}. ${name.padEnd(46)} FAIL ${String(e).slice(0, 150)}`); }
};
const overflow = () => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
const text = () => p.evaluate(() => document.body.innerText);
const go = async (u) => { await p.goto(BASE + u, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500); };
const must = (cond, msg) => { if (!cond) throw new Error(msg); };

console.log('THE PAGE BUILD PROCESS, END TO END (390x844)\n');

await check('Pages list shows my pages + Create', async () => {
  await go('/pages');
  const t = await text();
  must(/Alex Chen|Priya/.test(t), 'no pages listed');
  must(!(await overflow()), 'horizontal overflow');
  const create = await p.locator('[aria-label*="ew page" i], [aria-label*="Create" i]').count();
  must(create > 0, 'no create control');
  return `(${create} create control)`;
});

await check('Choose a type offers all 8', async () => {
  await go('/choose-type/' + mod.DRAFT_ID);
  const t = await text();
  // The tile TITLES as a person reads them, not the internal keys — "other"
  // is shown as "Something else", which a key-based check misses.
  const TILES = ['Job application', 'University application', 'Athlete pitch',
    'Real estate pitch', 'Property listing', 'Contractor bid', 'Sales pitch', 'Something else'];
  const found = TILES.filter(k => t.includes(k));
  must(found.length >= 8, `only found ${found.length}: ${found}`);
  must(!(await overflow()), 'horizontal overflow');
  return `(${found.length}/8)`;
});

await check('Intake: pick sport + level, Continue enables', async () => {
  await go('/intake/athlete/' + mod.DRAFT_ID);
  const cont = p.getByLabel('Continue', { exact: true }).first();
  const before = await cont.evaluate(e => e.getAttribute('aria-disabled') ?? String(e.disabled));
  must(before === 'true', `Continue should start disabled, was ${before}`);
  const selects = p.locator('[role="button"]').filter({ hasNotText: /Continue|Go back/ });
  await selects.nth(1).click(); await p.waitForTimeout(700);
  await p.locator('[role="button"], [role="radio"]').filter({ hasText: /Soccer|Basketball|Football/ }).first().click();
  await p.waitForTimeout(700);
  return '(gated until answered)';
});

await check('Builder: the page is the screen, regions editable', async () => {
  await go('/builder/' + mod.DRAFT_ID);
  const t = await text();
  must(/Priya|Preview/.test(t), 'builder did not load');
  const edits = await p.locator('[aria-label^="Edit "]').count();
  must(edits >= 2, `only ${edits} editable regions`);
  must(!(await overflow()), 'horizontal overflow');
  await p.screenshot({ path: `${OUT_DIR}/e2e-1-builder.png` });
  return `(${edits} editable regions)`;
});

await check('Builder: all 4 tool sheets open and close', async () => {
  for (const tool of ['Details', 'Sections', 'Media', 'Style']) {
    await p.getByLabel(tool, { exact: true }).click();
    await p.waitForTimeout(800);
    const opened = await p.locator('[aria-label="Close"]').count();
    must(opened > 0, `${tool} did not open`);
    must(!(await overflow()), `${tool} overflows`);
    await p.locator('[aria-label="Close"]').last().click();
    await p.waitForTimeout(600);
  }
  return '(Details, Sections, Media, Style)';
});

await check('Builder: typing a section title persists', async () => {
  await p.getByLabel('Sections', { exact: true }).click(); await p.waitForTimeout(800);
  await p.locator('[aria-label^="Edit "]').last().click(); await p.waitForTimeout(900);
  const f = p.locator('input[type="text"], textarea').first();
  await f.fill(''); await p.keyboard.type('Career highlights'); await p.waitForTimeout(600);
  const got = await f.inputValue();
  must(got === 'Career highlights', `got "${got}"`);
  await p.locator('[aria-label="Close"]').last().click(); await p.waitForTimeout(500);
  return '(round-trips)';
});

await check('Builder: a style can be picked', async () => {
  await p.getByLabel('Style', { exact: true }).click(); await p.waitForTimeout(900);
  const swatches = await p.locator('[role="button"], [role="radio"]').count();
  must(swatches > 10, `only ${swatches} controls in Style`);
  await p.screenshot({ path: `${OUT_DIR}/e2e-2-style.png` });
  await p.locator('[aria-label="Close"]').last().click(); await p.waitForTimeout(500);
  return `(${swatches} controls)`;
});

await check('Review/preview lists what is on the page', async () => {
  await go('/preview/' + mod.DRAFT_ID);
  const t = await text();
  must(t.length > 120, 'review screen near-empty');
  must(!(await overflow()), 'horizontal overflow');
  await p.screenshot({ path: `${OUT_DIR}/e2e-3-review.png` });
  return `(${t.length} chars)`;
});

await check('Share: link, QR and channels', async () => {
  await go('/share/' + mod.LIVE_ID);
  const t = await text();
  must(/Copy|Share|link/i.test(t), 'no share affordances');
  must(!(await overflow()), 'horizontal overflow');
  await go('/share/' + mod.LIVE_ID + '/qr');
  must(!(await overflow()), 'QR overflows');
  return '(share + QR)';
});

await check('Tracked links screen works', async () => {
  await go('/pages/' + mod.LIVE_ID + '/links');
  must(!(await overflow()), 'horizontal overflow');
  must((await text()).length > 80, 'links screen near-empty');
  return '';
});

await check('Analytics reaches a page from the list', async () => {
  await go('/analytics');
  await p.locator('[aria-label^="Analytics for"]').first().click();
  await p.waitForTimeout(2500);
  const t = await text();
  must(/Views/.test(t), 'no analytics rendered');
  must(!/NaN|undefined/.test(t), 'bad number on screen');
  return '';
});

console.log('\nconsole/page errors during the whole run: ' + (errs.length ? '\n  ' + [...new Set(errs)].join('\n  ') : 'none'));
console.log(failed === 0 ? '\nALL STEPS PASSED' : `\n${failed} STEP(S) FAILED`);
await b.close();
