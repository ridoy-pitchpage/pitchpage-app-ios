
import { readFileSync } from 'node:fs';

const b64u = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const USER_ID = '11111111-2222-3333-4444-555555555555';
const exp = Math.floor(Date.now() / 1000) + 3600;
const jwt = `${b64u({ alg: 'HS256', typ: 'JWT' })}.${b64u({
  sub: USER_ID, aud: 'authenticated', role: 'authenticated', exp,
  email: 'alex@example.com', user_metadata: { display_name: 'Alex Chen' },
})}.sig`;

const user = {
  id: USER_ID, aud: 'authenticated', role: 'authenticated', email: 'alex@example.com',
  user_metadata: { display_name: 'Alex Chen', full_name: 'Alex Chen' },
  app_metadata: {}, created_at: new Date().toISOString(),
};
const session = {
  access_token: jwt, refresh_token: 'refresh', token_type: 'bearer',
  expires_in: 3600, expires_at: exp, user,
};

const LIVE = {
  id: 'aaaaaaaa-0000-4000-8000-000000000001',
  slug: 'alex-chen-k4m2p', full_name: 'Alex Chen',
  headline: 'Staff engineer — payments and reliability',
  bio: 'Ten years building payment systems that stay up. Most recently led the migration that cut failed transactions by 38%.',
  email: 'alex@example.com', template: 'console__cyan__dark',
  portrait_url: 'https://pitchpage.co/people/a.webp', video_url: 'https://x/v.mp4',
  primary_cta_url: null, final_cta_url: null,
  published_at: '2026-09-24T10:00:00Z', updated_at: '2026-09-29T18:30:00Z',
  org_id: null, og_image_url: null, og_image_key: null, wizard_meta: {},
  sections: [
    { id: 's1', title: 'About me', blockType: 'text_block', order: 0, visible: true, hint: '',
      data: { heading: '', paragraphs: ['Ten years on payments.'], bullets: [], format: 'paragraph' } },
    { id: 's2', title: 'Experience', blockType: 'timeline', order: 1, visible: true, hint: '',
      data: { location: 'London', items: [{ period: '2022—now', title: 'Staff Engineer', org: 'Monzo', bullets: ['Cut failed payments 38%'] }] } },
    { id: 's3', title: 'By the numbers', blockType: 'metric_grid', order: 2, visible: true, hint: '',
      data: { items: [{ value: '38%', label: 'Fewer failed payments', sub: '' }, { value: '99.99%', label: 'Uptime', sub: '' }] } },
    { id: 's4', title: 'Contact', blockType: 'cta', order: 3, visible: true, hint: '',
      data: { heading: 'Get in touch', sub: '', label: 'Book a call', url: 'https://cal.com/alex', email: 'alex@example.com' } },
  ],
  portfolio: null, film: null, listing: null,
};

const DRAFT = {
  ...LIVE,
  id: 'aaaaaaaa-0000-4000-8000-000000000002',
  slug: 'priya-raman-9x2df', full_name: 'Priya Raman',
  headline: null, bio: null, portrait_url: null, video_url: null,
  published_at: null, updated_at: '2026-09-30T08:05:00Z',
  sections: [{ id: 't1', title: 'About me', blockType: 'text_block', order: 0, visible: true, hint: '',
    data: { heading: '', paragraphs: ['Enterprise AE, six years in fintech.'], bullets: [], format: 'paragraph' } }],
};

// A job page straight after its template was picked: Banner's own examples
// in every section, and the owner's Contact. Read from the app's seeds
// rather than copied, so it is always exactly what a template leaves behind.
const BANNER = (() => {
  const line = readFileSync(new URL('../src/page/template-seeds.ts', import.meta.url), 'utf8')
    .split('\n').find((l) => l.trim().startsWith('"banner":'));
  return JSON.parse(line.trim().slice('"banner":'.length).replace(/,$/, ''));
})();
const TEMPLATED = {
  ...DRAFT,
  id: 'aaaaaaaa-0000-4000-8000-000000000003',
  slug: 'alex-chen-t7q3w', full_name: 'Alex Chen', template: 'banner__blue__dark',
  wizard_meta: { pitchKind: 'job', chosenType: 'job' },
  sections: [
    ...BANNER.sections.filter((s) => s.blockType !== 'cta')
      .map((s, i) => ({ id: `tpl${i}`, title: s.title, blockType: s.blockType, order: i, visible: true, data: s.data })),
    { id: 'tplcta', title: 'Contact', blockType: 'cta', order: 7, visible: true,
      data: { heading: "Let's talk", sub: 'Interested? Get in touch — I reply quickly.', label: 'Contact me', url: '', email: 'alex@example.com' } },
  ],
};

const CARD = (p) => ({
  id: p.id, slug: p.slug, full_name: p.full_name, headline: p.headline,
  updated_at: p.updated_at, video_url: p.video_url, published_at: p.published_at,
  org_id: p.org_id, og_image_url: p.og_image_url, og_image_key: p.og_image_key,
  wizard_meta: p.wizard_meta,
});

const json = (route, body, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

// What composeIntoSections answers: a draft, in that section's own shape, for
// every section it is sent. A chart gets none, standing for a section the
// material has nothing true to say about, and Contact is never written. The
// headline is blank on both draft pages, so it is filled.
export const DRAFTS = {
  text_block: { heading: '', paragraphs: ['Drafted from the material.'], bullets: [], format: 'paragraph' },
  timeline: { location: '', items: [{ period: '2019 — Now', title: 'Account executive', org: 'Northwind', bullets: [] }] },
  tag_list: { heading: '', tags: ['Negotiation', 'Discovery'] },
  metric_grid: { items: [{ value: '6', label: 'Years in fintech', sub: '' }] },
  cards: { items: [{ title: 'Drafted card', body: 'From the material.', icon: '' }] },
  quote_list: { items: [{ quote: '', name: 'Dana Ortiz', role: 'Sales manager, Northwind' }] },
  logo_row: { heading: '', names: ['Northwind'] },
};
const composedFor = (body) => {
  const filled = {};
  for (const s of body?.sections ?? []) if (DRAFTS[s.blockType]) filled[s.id] = DRAFTS[s.blockType];
  return {
    filled, upgraded: {}, unconfirmed: Object.keys(filled), flags: [],
    basics: { full_name: '', headline: 'Enterprise account executive', bio: '' },
    unreadable: [],
  };
};

export const DRAFT_ID = DRAFT.id;
export const TEMPLATED_ID = TEMPLATED.id;
export const LIVE_ID = LIVE.id;

export async function installStubs(ctx) {
  await ctx.route('**/*.supabase.co/**', async (route) => {
    const url = route.request().url();
    const single = route.request().headers()['accept']?.includes('vnd.pgrst.object');
    if (url.includes('/auth/v1/token')) return json(route, session);
    if (url.includes('/auth/v1/user')) return json(route, user);
    if (url.includes('/rest/v1/profiles')) return json(route, single ? { user_id: USER_ID, display_name: 'Alex Chen', avatar_url: null } : []);
    if (url.includes('/rest/v1/user_credits')) return json(route, single ? { balance: 3 } : [{ balance: 3 }]);
    if (url.includes('/rest/v1/credit_transactions')) return json(route, []);
    if (url.includes('/rest/v1/pitch_page_links')) return json(route, [
      { id: 'l1', label: 'Acme Corp — Dana', ref_slug: 'acme-dana', created_at: '2026-09-01T10:00:00Z' },
      { id: 'l2', label: 'Northwind — recruiter', ref_slug: 'northwind', created_at: '2026-09-03T10:00:00Z' },
      { id: 'l3', label: 'Cold outreach batch 2', ref_slug: 'cold-2', created_at: '2026-09-05T10:00:00Z' },
    ]);
    if (url.includes('/rest/v1/pitch_page_views')) {
      // A HEAD count request (previous-period views) wants a count, not rows.
      if (route.request().method() === 'HEAD') {
        return route.fulfill({ status: 200, headers: { 'content-range': '0-0/41', 'access-control-expose-headers': 'content-range' }, body: '' });
      }
      const rows = [];
      const now = new Date('2026-09-30T12:00:00Z');
      const hosts = ['linkedin.com', null, 'mail.google.com', 'x.com', null, 'github.com'];
      for (let d = 0; d < 28; d++) {
        const day = new Date(now.getTime() - d * 86400000);
        const n = [7, 4, 9, 2, 0, 5, 11, 3][d % 8];
        for (let i = 0; i < n; i++) {
          const visitor = `v${(d * 7 + i) % 23}`;
          const at = new Date(day.getTime() - i * 900000).toISOString();
          rows.push({ event_type: 'view', ref: i % 4 === 0 ? 'acme-dana' : i % 5 === 0 ? 'northwind' : null,
                      referrer_host: hosts[(d + i) % hosts.length], created_at: at, visitor_id: visitor, share_source: null });
          if (i % 3 === 0) rows.push({ event_type: 'video_play', ref: null, referrer_host: null, created_at: at, visitor_id: visitor, share_source: null });
          if (i % 6 === 0) rows.push({ event_type: 'video_100', ref: null, referrer_host: null, created_at: at, visitor_id: visitor, share_source: null });
          for (let h = 0; h < (i % 4); h++) rows.push({ event_type: 'dwell_15', ref: null, referrer_host: null, created_at: new Date(day.getTime() - i * 900000 + h * 15000).toISOString(), visitor_id: visitor, share_source: null });
        }
      }
      return json(route, rows);
    }
    if (url.includes('/rest/v1/rpc/get_publish_eligibility')) return json(route, { mode: 'paid', org_name: null, credits_remaining: 3 });
    if (url.includes('/rest/v1/rpc/')) return json(route, []);
    if (url.includes('/rest/v1/pitch_pages')) {
      // Honour an id=eq.<uuid> filter: maybeSingle() errors on two rows, so a
      // stub that ignores the filter fails a query the real API answers.
      const wanted = /id=eq\.([0-9a-f-]+)/.exec(url)?.[1];
      const pick = [DRAFT, LIVE, TEMPLATED].find((page) => page.id === wanted) ?? null;
      if (single) return json(route, pick ?? LIVE);
      if (wanted) return json(route, pick ? [pick] : []);
      return json(route, [CARD(DRAFT), CARD(LIVE)]);
    }
    return json(route, []);
  });
  // The builder draws a page through pitchpage.co/app-render whenever the site
  // answers (src/render/RenderSurface.tsx). That route is live now, so without
  // this the suites would load the real site, never reach network idle, and
  // stop being offline. The stub reports an error, and the builder falls back
  // to drawing the page itself, exactly as it does offline. It says so three
  // times, because a frame can load before the builder is listening; the
  // builder treats every repeat the same.
  await ctx.route('https://pitchpage.co/app-render**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<script>const say = () => parent.postMessage(JSON.stringify({ type: "error", message: "stubbed in e2e" }), "*"); say(); setTimeout(say, 250); setTimeout(say, 1000);</script>',
    }),
  );
  // The app API on the website (master plan §9). "Build my page" posts here;
  // anything else on it answers the way a missing endpoint would.
  await ctx.route('https://pitchpage.co/api/app/v1/**', (route) =>
    route.request().url().endsWith('/ai/compose-sections')
      ? json(route, composedFor(route.request().postDataJSON()))
      : json(route, { error: { code: 'NOT_FOUND', message: 'That page no longer exists.' } }, 404),
  );
  // Seed a session so the signed-in routes render without a sign-in step.
  await ctx.addInitScript(([s]) => {
    try { window.localStorage.setItem('sb-ervsfjyuhtnepigfgskh-auth-token', s); } catch {}
  }, [JSON.stringify(session)]);
}
