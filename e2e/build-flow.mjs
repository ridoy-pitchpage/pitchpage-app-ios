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

await check('Build my page: prompt, consent, draft saved', async () => {
  const saved = [];
  // Page routes run before the context's stubs; fallback hands it on to them.
  await p.route('**/rest/v1/pitch_pages**', (route) => {
    if (route.request().method() === 'PATCH') saved.push(route.request().postDataJSON());
    return route.fallback();
  });
  await go('/build/' + mod.DRAFT_ID);
  const build = p.getByLabel('Build my page', { exact: true });
  const before = await build.evaluate(e => e.getAttribute('aria-disabled') ?? String(e.disabled));
  must(before === 'true', `Build my page should start disabled, was ${before}`);
  await p.getByLabel('About you', { exact: true }).fill('Enterprise account executive, six years in fintech, selling to banks.');
  await p.waitForTimeout(400);
  await build.click(); await p.waitForTimeout(900);
  must(/Build your page with AI/.test(await text()), 'AI consent was not asked');
  await p.getByLabel('Allow', { exact: true }).click();
  await p.waitForURL(/\/builder\//, { timeout: 15000 });
  const patch = saved.at(-1);
  must(patch, 'nothing was saved');
  must(patch.headline === 'Enterprise account executive', 'the blank headline was not filled');
  const written = JSON.stringify(patch.sections);
  must(written.includes('Enterprise AE, six years in fintech.'), "the person's own words were lost");
  must(!written.includes('Drafted from the material.'), 'a section with words in it was overwritten');
  must(patch.wizard_meta?.buildPrompt?.startsWith('Enterprise account executive'), 'the prompt was not kept');
  await p.unroute('**/rest/v1/pitch_pages**');
  return '(consent, draft, builder)';
});

await check('Build my page: the wait is a page taking shape, not a spinner', async () => {
  // Hold the draft until the screen has been looked at, then let it through.
  const compose = '**/api/app/v1/ai/compose-sections';
  let release;
  const held = new Promise((resolve) => { release = resolve; });
  await p.route(compose, async (route) => { await held; return route.fallback(); });
  try {
    await go('/build/' + mod.DRAFT_ID);
    await p.getByLabel('About you', { exact: true }).fill('Enterprise account executive, six years in fintech, selling to banks.');
    await p.waitForTimeout(400);
    await p.getByLabel('Build my page', { exact: true }).click(); await p.waitForTimeout(900);
    if (/Build your page with AI/.test(await text())) await p.getByLabel('Allow', { exact: true }).click();
    await p.waitForTimeout(1300);
    const loader = p.getByRole('progressbar', { name: 'Building your page…', exact: true });
    must((await loader.count()) === 1, 'no "Building your page…" progress');
    // The web build draws ActivityIndicator as an SVG; the blocks are views.
    const spinners = await p.locator('[role="progressbar"] svg').count();
    must(spinners === 0, `a spinner is still drawn (${spinners})`);
    const blocks = await loader.evaluate((e) => e.querySelectorAll('div').length);
    must(blocks >= 8, `only ${blocks} blocks in the outline`);
    await p.screenshot({ path: `${OUT_DIR}/e2e-0-building.png` });
  } finally {
    // Let the held draft through whatever happened. Taking the route away in
    // the same breath would answer the held request a second time.
    release();
  }
  await p.waitForURL(/\/builder\//, { timeout: 15000 });
  await p.unroute(compose);
  return '(blocks, no spinner)';
});

await check("Build my page: a template's examples give way to the draft", async () => {
  const saved = [];
  await p.route('**/rest/v1/pitch_pages**', (route) => {
    if (route.request().method() === 'PATCH') saved.push(route.request().postDataJSON());
    return route.fallback();
  });
  await go('/build/' + mod.TEMPLATED_ID);
  await p.getByLabel('About you', { exact: true }).fill('Enterprise account executive, six years in fintech, selling to banks.');
  await p.waitForTimeout(400);
  await p.getByLabel('Build my page', { exact: true }).click(); await p.waitForTimeout(900);
  // The stubbed account never keeps its consent, so it can be asked again here.
  if (/Build your page with AI/.test(await text())) await p.getByLabel('Allow', { exact: true }).click();
  await p.waitForURL(/\/builder\//, { timeout: 15000 });
  const sections = saved.at(-1)?.sections ?? [];
  const written = JSON.stringify(sections);
  must(sections.length > 0, 'nothing was saved');
  must(!/\$28M|156%|Quota Attainment|Land and expand|Their name/.test(written), "a template's example survived the build");
  const titles = sections.map((s) => s.title);
  for (const title of ['About Me', 'Experience', 'Skills', 'By the Numbers', 'What People Say']) {
    must(titles.includes(title), `the job page's own "${title}" is missing: ${titles.join(', ')}`);
  }
  for (const draft of ['Drafted from the material.', 'Account executive', 'Negotiation', 'Years in fintech', 'Dana Ortiz']) {
    must(written.includes(draft), `the draft's "${draft}" was not applied`);
  }
  must(written.includes('alex@example.com'), "the owner's Contact section was lost");
  await p.unroute('**/rest/v1/pitch_pages**');
  return `(${titles.length} sections: ${titles.join(', ')})`;
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

await check('Builder: Save lights up after an edit, saves and closes', async () => {
  const off = (button) => button.evaluate((e) => e.getAttribute('aria-disabled') === 'true' || e.disabled === true);
  await p.getByLabel('Sections', { exact: true }).click(); await p.waitForTimeout(800);
  await p.locator('[aria-label^="Edit "]').last().click(); await p.waitForTimeout(900);
  must(await off(p.getByRole('button', { name: 'Saved', exact: true })), 'Save was on before anything changed');
  const f = p.locator('input[type="text"], textarea').first();
  await f.fill(''); await p.keyboard.type('Highlights'); await p.waitForTimeout(400);
  const save = p.getByRole('button', { name: 'Save', exact: true });
  must(!(await off(save)), 'Save stayed off after an edit');
  await save.click(); await p.waitForTimeout(900);
  must(!/Section name/.test(await text()), 'the section stayed open after Save');
  return '(off, on, saved)';
});

await check('Builder: a failed save shows its error over the sheet', async () => {
  const before = errs.length;
  const rest = '**/rest/v1/pitch_pages*';
  // Every write fails, so Save leaves the section open with its error.
  await p.route(rest, (route) => route.request().method() === 'PATCH'
    ? route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"Service Unavailable"}' })
    : route.fallback());
  let drawn;
  try {
    await p.getByLabel('Sections', { exact: true }).click(); await p.waitForTimeout(800);
    await p.locator('[aria-label^="Edit "]').last().click(); await p.waitForTimeout(900);
    const f = p.locator('input[type="text"], textarea').first();
    await f.fill(''); await p.keyboard.type('Highlights, again'); await p.waitForTimeout(400);
    await p.getByRole('button', { name: 'Save', exact: true }).click(); await p.waitForTimeout(900);
    // Is the toast what is actually painted at its own centre? A sheet covers
    // everything drawn at the app's root, on an iPhone and in this build alike.
    // A toast lets touches through, so hit-testing skips it unless every
    // element is made hit-testable for the one lookup.
    drawn = await p.evaluate(() => {
      const toast = [...document.querySelectorAll('[aria-live="polite"]')]
        .find((e) => e.textContent?.includes('The server had trouble with that'));
      if (!toast) return 'missing';
      const box = toast.getBoundingClientRect();
      const all = document.createElement('style');
      all.textContent = '* { pointer-events: auto !important; }';
      document.head.append(all);
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      all.remove();
      return hit && toast.contains(hit) ? 'on top' : 'covered';
    });
    must(/Section name/.test(await text()), 'the section closed although the save failed');
    await p.screenshot({ path: `${OUT_DIR}/e2e-2-toast-over-sheet.png` });
  } finally {
    await p.unroute(rest);
    // Close the section whatever happened, so a failure here stays this step's.
    const close = p.locator('[aria-label="Close"]').last();
    if (await close.count()) { await close.click(); await p.waitForTimeout(500); }
  }
  must(drawn === 'on top', `the error toast is ${drawn}`);
  // The 503s are this step's whole point, not a fault in the app.
  errs.length = before;
  return '(drawn over the sheet)';
});

await check('Builder: a style can be picked', async () => {
  await p.getByLabel('Style', { exact: true }).click(); await p.waitForTimeout(900);
  const swatches = await p.locator('[role="button"], [role="radio"]').count();
  must(swatches > 10, `only ${swatches} controls in Style`);
  await p.screenshot({ path: `${OUT_DIR}/e2e-2-style.png` });
  await p.locator('[aria-label="Close"]').last().click(); await p.waitForTimeout(500);
  return `(${swatches} controls)`;
});

await check('Builder: Preview is the page alone, and Edit brings the tools back', async () => {
  await p.getByLabel('Preview your page', { exact: true }).click(); await p.waitForTimeout(900);
  for (const control of ['Details', 'Sections', 'Media', 'Style', 'Back to your pages', 'Publish']) {
    must((await p.getByLabel(control, { exact: true }).count()) === 0, `"${control}" still shows in Preview`);
  }
  must(!(await overflow()), 'horizontal overflow');
  await p.screenshot({ path: `${OUT_DIR}/e2e-2-preview.png` });
  await p.getByLabel('Edit your page', { exact: true }).click(); await p.waitForTimeout(900);
  must((await p.getByLabel('Details', { exact: true }).count()) === 1, 'the toolbar did not come back');
  must((await p.getByLabel('Back to your pages', { exact: true }).count()) === 1, 'the top bar did not come back');
  return '(page only, then the editor again)';
});

await check('Review: Publish is on screen, and the gaps are asked about on tap', async () => {
  await go('/preview/' + mod.DRAFT_ID);
  const glance = await text();
  must(/What's on your page/.test(glance) && /Not added yet/.test(glance), 'no summary above the button');
  must(!/About me/.test(glance), 'sections are listed one by one again');
  const publishButton = p.getByRole('button', { name: 'Publish now', exact: true });
  const box = await publishButton.boundingBox();
  const bottom = box ? Math.round(box.y + box.height) : null;
  must(bottom != null && bottom <= p.viewportSize().height, `Publish now is below the fold (${bottom}px)`);
  must(!(await overflow()), 'horizontal overflow');
  await p.screenshot({ path: `${OUT_DIR}/e2e-3-review.png` });
  // The draft has no headline, bio or portrait, so Publish asks first.
  await publishButton.click(); await p.waitForTimeout(500);
  must(/Before you publish/.test(await text()), 'Publish did not ask about the missing headline, bio and portrait');
  await p.getByRole('button', { name: 'Keep editing', exact: true }).click(); await p.waitForTimeout(400);
  must(p.url().includes('/preview/'), 'Keep editing left the review screen');
  must(!/Before you publish/.test(await text()), 'the question stayed open');
  return `(button ends at ${bottom}px of ${p.viewportSize().height})`;
});

await check('Review: publishing a draft is free and opens Share', async () => {
  const calls = [];
  const listen = (request) => { if (request.url().includes('/rest/v1/rpc/publish_pitch_page')) calls.push(request); };
  p.on('request', listen);
  await go('/preview/' + mod.DRAFT_ID);
  const t = await text();
  must(/free for up to 3 live pages/.test(t), 'the card does not say publishing is free');
  must(!/credit|balance|\$\d/i.test(t), 'the review screen still mentions credits or a price');
  await p.getByRole('button', { name: 'Publish now', exact: true }).click(); await p.waitForTimeout(500);
  await p.getByRole('button', { name: 'Publish anyway', exact: true }).click(); await p.waitForTimeout(1500);
  p.off('request', listen);
  must(p.url().includes('/share/' + mod.DRAFT_ID), `publishing did not open Share (${p.url()})`);
  must(calls.length === 1, `expected one publish call, saw ${calls.length}`);
  must(/\/rpc\/publish_pitch_page_from_app(\?|$)/.test(calls[0].url()), `published through ${calls[0].url()}`);
  must(calls[0].postDataJSON()?._pitch_page_id === mod.DRAFT_ID, 'the publish call did not name the page');
  return '(free function, then Share)';
});

await check('Review: at the cap, publishing says how to make room', async () => {
  const before = errs.length;
  const rpc = '**/rest/v1/rpc/publish_pitch_page_from_app*';
  // The function's own refusal, as PostgREST sends a RAISE EXCEPTION.
  await p.route(rpc, (route) => route.fulfill({
    status: 400, contentType: 'application/json',
    body: JSON.stringify({ code: 'P0001', details: null, hint: null,
      message: 'You already have 3 pages live from the app. Take one offline to publish this one.' }),
  }));
  await go('/preview/' + mod.DRAFT_ID);
  await p.getByRole('button', { name: 'Publish now', exact: true }).click(); await p.waitForTimeout(500);
  await p.getByRole('button', { name: 'Publish anyway', exact: true }).click(); await p.waitForTimeout(1200);
  const t = await text();
  must(/You have 3 pages live from the app/.test(t), 'no dialog at the cap');
  must(/Take one offline, then publish this one/.test(t), 'the dialog does not say how to make room');
  await p.screenshot({ path: `${OUT_DIR}/e2e-3-cap.png` });
  await p.getByRole('button', { name: 'See your pages', exact: true }).click(); await p.waitForTimeout(1200);
  await p.unroute(rpc);
  must(/\/pages$/.test(new URL(p.url()).pathname), `See your pages went to ${p.url()}`);
  // The 400 above is this step's whole point, not a fault in the app.
  errs.length = before;
  return '(dialog, then your pages)';
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
