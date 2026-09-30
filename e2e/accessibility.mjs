import { BASE, launch } from "./harness.mjs";

const ROUTES = ['/', '/examples', '/pricing', '/faq', '/contact', '/how-it-works',
  '/pages', '/credits', '/account', '/account/profile', '/account/password', '/account/delete',
  '/choose-type/D', '/intake/athlete/D', '/builder/D', '/preview/D', '/share/L', '/share/L/qr',
  '/pages/L/links', '/analytics', '/analytics/L', '/account/tracking', '/account/guides', '/account/guides/job-search-statistics'];

const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

// Reuse the same stubs so signed-in screens render.
const mod = await import('./stubs.mjs');
await mod.installStubs(ctx);

const findings = [];
for (const route of ROUTES) {
  const url = route.replace('/D', '/' + mod.DRAFT_ID).replace('/L', '/' + mod.LIVE_ID);
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);

  const out = await page.evaluate(() => {
    const issues = [];
    const tappable = [...document.querySelectorAll('[role="button"],[role="link"],[role="radio"],[role="tab"],input,[tabindex="0"]')];
    for (const el of tappable) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const label = (el.getAttribute('aria-label') || el.textContent || '').trim();
      // iOS asks for 44pt; anything under 40 is a genuine mis-tap risk.
      // An inline link inside a paragraph measures its own glyph box, not the
      // 44pt a standalone control needs. It cannot be enlarged without
      // breaking the way the paragraph wraps, and it is how Safari, Mail and
      // every other reading app render inline links. Excluded deliberately;
      // standalone controls with role=link are still checked.
      // Signature of an inline link: its box is the glyph run, shorter than
      // the line box it sits in. A standalone link control is never that.
      const lh = parseFloat(getComputedStyle(el).lineHeight);
      const inlineLink = el.getAttribute('role') === 'link' && Number.isFinite(lh) && r.height < lh;
      if (!inlineLink && (r.height < 40 || r.width < 40)) {
        issues.push(`SMALL ${Math.round(r.width)}x${Math.round(r.height)} "${label.slice(0, 32)}"`);
      }
      if (!label) issues.push(`UNLABELLED <${el.tagName.toLowerCase()}>`);
    }

    /*
     * Text clipped inside its own box.
     *
     * The tab bar shipped for days with every label squeezed into a 5px box
     * under overflow:hidden, so "Pages" rendered as a sliver of its own top
     * edge. Nothing else here caught it: the page did not overflow, the
     * contrast was right, and the tap target was the full tab. The text was
     * simply not readable, and only a person looking at it noticed.
     *
     * A leaf element that hides its own overflow while its content is taller
     * or wider than its box is that bug, and almost nothing else.
     */
    for (const el of document.querySelectorAll('*')) {
      if (el.children.length > 0) continue;
      const text = (el.textContent || '').trim();
      if (!text) continue;
      const cs = getComputedStyle(el);
      if (cs.overflow !== 'hidden' && cs.overflowY !== 'hidden' && cs.overflowX !== 'hidden') continue;
      // -webkit-line-clamp and explicit ellipsis are deliberate truncation.
      if (cs.textOverflow === 'ellipsis' || cs.webkitLineClamp !== 'none') continue;
      const cutV = el.scrollHeight - el.clientHeight;
      if (cutV > 2) issues.push(`CLIPPED TEXT (${cutV}px hidden) "${text.slice(0, 24)}"`);
    }
    return issues;
  });

  for (const issue of new Set(out)) findings.push(`${route}: ${issue}`);
}

console.log(findings.length ? findings.join('\n') : 'No accessibility findings.');
console.log('total:', findings.length);
await browser.close();
