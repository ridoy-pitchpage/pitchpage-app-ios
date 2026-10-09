import { FAQ_TOPIC_NOTE, FAQS, HOW_IT_WORKS } from "@/page/faq-content";

/**
 * The app sells nothing, so its own help text never names a price, a credit
 * or a refund (Guideline 3.1.3(f)).
 */
it("names no price, credit, refund or way to buy", () => {
  const shown = [
    ...Object.values(FAQ_TOPIC_NOTE),
    ...FAQS.flatMap((faq) => [faq.q, faq.a]),
    ...HOW_IT_WORKS.flatMap((step) => [step.title, step.body]),
  ];
  expect(shown.filter((text) => /credit|refund|\$\d|pric(e|ing)|\bbuy\b|bought|purchase/i.test(text))).toEqual([]);
});

it("states the free-publishing rule where people look for the cost", () => {
  const cost = FAQS.find((faq) => faq.q === "What does the app cost?");
  expect(cost?.a).toContain("up to 3 live at a time");
});
