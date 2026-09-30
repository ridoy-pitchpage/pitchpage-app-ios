import { View } from "react-native";

import { Sheet } from "@/components/Sheet";
import { TextField } from "@/components/TextField";
import { Muted } from "@/components/Text";
import { useDraft } from "@/state/draft-store";

/**
 * The page's own details — everything that is not a section.
 *
 * `headline` is the user's to write. The placeholder an intake produced is
 * only ever shown where a page has none; it is never written in here.
 */
export function DetailsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const page = useDraft((s) => s.page);
  const patch = useDraft((s) => s.patch);

  if (!page) return null;

  return (
    <Sheet visible={visible} onClose={onClose} title="Your details">
      <View className="gap-4 pb-2">
        <TextField
          label="Full name"
          value={page.full_name ?? ""}
          onChangeText={(full_name) => patch({ full_name })}
          maxLength={120}
          autoCapitalize="words"
          textContentType="name"
        />
        <TextField
          label="Headline"
          hint="One line saying what you do."
          value={page.headline ?? ""}
          onChangeText={(headline) => patch({ headline })}
          maxLength={160}
          placeholder="e.g. ICU nurse — zero CLABSI for 14 months"
        />
        <TextField
          label="Short bio"
          value={page.bio ?? ""}
          onChangeText={(bio) => patch({ bio })}
          multiline
          minHeight={110}
          maxLength={800}
          placeholder="A few sentences, the way you'd say them out loud."
        />
        <TextField
          label="Email"
          value={page.email ?? ""}
          onChangeText={(email) => patch({ email })}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
        />
        <TextField
          label="Location"
          value={page.location ?? ""}
          onChangeText={(location) => patch({ location })}
          autoCapitalize="words"
          textContentType="addressCity"
          placeholder="Toronto, Canada"
        />
        <TextField
          label="LinkedIn"
          value={page.linkedin_url ?? ""}
          onChangeText={(linkedin_url) => patch({ linkedin_url })}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="https://linkedin.com/in/…"
        />
        <Muted>Changes save on their own — you'll see "Saved" at the top.</Muted>
      </View>
    </Sheet>
  );
}
