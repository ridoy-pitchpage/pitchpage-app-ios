/**
 * How many pages publishing from the app keeps live for free. A copy of the
 * constant in `publish_pitch_page_from_app`, so the app can state the rule;
 * the app enforces nothing with it. A module of its own so copy can use it
 * without pulling in the database client.
 */
export const FREE_LIVE_PAGES = 3;
