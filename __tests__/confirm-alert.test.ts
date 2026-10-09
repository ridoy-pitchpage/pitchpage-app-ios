import { alertButtons } from "@/components/confirm-alert";

/**
 * On an iPhone a confirm is the system alert, so its buttons have to say and
 * answer exactly what the app's own dialog does on the web.
 */

describe("alertButtons", () => {
  it("is Cancel then the action, answering no and yes", () => {
    const answers: boolean[] = [];
    const [cancel, action] = alertButtons({ title: "Sign out?", confirmLabel: "Sign out" }, (a) => answers.push(a));

    expect([cancel!.text, cancel!.style, action!.text, action!.style]).toEqual(["Cancel", "cancel", "Sign out", "default"]);
    cancel!.onPress();
    action!.onPress();
    expect(answers).toEqual([false, true]);
  });

  it("marks a destroying action destructive and keeps the caller's labels", () => {
    const buttons = alertButtons(
      { title: "Remove this section?", confirmLabel: "Remove", cancelLabel: "Keep it", destructive: true },
      () => undefined,
    );
    expect(buttons.map((b) => [b.text, b.style])).toEqual([
      ["Keep it", "cancel"],
      ["Remove", "destructive"],
    ]);
  });

  it("is a single OK for a message with nothing to decide", () => {
    const answers: boolean[] = [];
    const buttons = alertButtons({ title: "Nothing to publish yet", dismissOnly: true }, (a) => answers.push(a));
    expect(buttons.map((b) => b.text)).toEqual(["OK"]);
    buttons[0]!.onPress();
    expect(answers).toEqual([true]);
  });
});
