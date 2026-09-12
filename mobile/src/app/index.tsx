// "New request" screen: describe a problem, let the AI classify it, edit the
// result, then save. Same two-step flow as the web app.

import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { analyzeProblem, saveRequests } from "@/lib/api";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
  type Category,
  type Priority,
  type Suggestion,
} from "@/lib/types";
import { colors, radius, space } from "@/lib/theme";

const EXAMPLES = [
  "Water is leaking under the kitchen sink and flooding the floor",
  "The AC in the living room blows warm air",
  "عندي تسريب مويه بالمطبخ والكهرباء مقطوعة بغرفة النوم",
];

export default function NewRequestScreen() {
  const router = useRouter();

  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    setError(null);
    setAnalyzing(true);
    try {
      const data = await analyzeProblem(text.trim());
      if (data.suggestions.length === 0) {
        setError("We couldn't find a maintenance problem in that text. Try describing what is broken.");
        return;
      }
      setSuggestions(data.suggestions);
      setProvider(data.provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAnalyzing(false);
    }
  }

  function updateSuggestion(index: number, patch: Partial<Suggestion>) {
    setSuggestions((prev) => prev!.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function removeSuggestion(index: number) {
    setSuggestions((prev) => prev!.filter((_, i) => i !== index));
  }

  async function save() {
    if (!suggestions) return;
    setError(null);
    setSaving(true);
    try {
      await saveRequests(
        suggestions.map(({ text, category, priority }) => ({ text, category, priority })),
      );
      // Reset so the screen is ready for the next request, then show the list.
      setSuggestions(null);
      setProvider(null);
      setText("");
      router.push("/requests");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {suggestions === null ? (
          // ---------- Step 1: describe ----------
          <>
            <Text style={styles.heading}>What needs fixing?</Text>
            <Text style={styles.subheading}>
              Describe the problem in your own words, in English or Arabic.
            </Text>

            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              maxLength={2000}
              placeholder="e.g. Water is dripping from the bathroom ceiling and the hallway light doesn't work"
              placeholderTextColor={colors.textMuted}
              style={styles.textArea}
              textAlignVertical="top"
            />

            <View style={styles.chipRow}>
              {EXAMPLES.map((example) => (
                <Pressable
                  key={example}
                  onPress={() => setText(example)}
                  style={({ pressed }) => [styles.exampleChip, pressed && styles.pressed]}
                >
                  <Text style={styles.exampleChipText} numberOfLines={1}>
                    {example.length > 34 ? `${example.slice(0, 34)}…` : example}
                  </Text>
                </Pressable>
              ))}
            </View>

            {error && <ErrorBox message={error} />}

            <PrimaryButton
              label="Submit"
              busyLabel="Analyzing…"
              busy={analyzing}
              disabled={!text.trim()}
              onPress={analyze}
            />
          </>
        ) : (
          // ---------- Step 2: review and edit ----------
          <>
            <Text style={styles.heading}>Review the suggestion</Text>
            <Text style={styles.subheading}>
              {suggestions.length > 1
                ? `We found ${suggestions.length} separate problems and split them into ${suggestions.length} requests. `
                : "Check the category and priority. "}
              You can change anything before saving.
            </Text>

            {provider === "mock" && (
              <View style={styles.mockBanner}>
                <Text style={styles.mockBannerText}>
                  Running in mock mode (no API key configured): results are keyword-based.
                </Text>
              </View>
            )}

            {suggestions.map((suggestion, index) => (
              <View key={index} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardLabel}>
                    REQUEST {suggestions.length > 1 ? index + 1 : ""}
                  </Text>
                  {suggestions.length > 1 && (
                    <Pressable onPress={() => removeSuggestion(index)} hitSlop={8}>
                      <Text style={styles.removeText}>Remove</Text>
                    </Pressable>
                  )}
                </View>

                <Text style={styles.fieldLabel}>Problem</Text>
                <TextInput
                  value={suggestion.text}
                  onChangeText={(value) => updateSuggestion(index, { text: value })}
                  multiline
                  style={styles.cardInput}
                  textAlignVertical="top"
                />

                <Text style={styles.fieldLabel}>Category</Text>
                {/* Chips rather than a dropdown: on a phone the whole set is
                    visible and tappable in one gesture. */}
                <View style={styles.chipRow}>
                  {CATEGORIES.map((category) => {
                    const selected = suggestion.category === category;
                    return (
                      <Pressable
                        key={category}
                        onPress={() => updateSuggestion(index, { category: category as Category })}
                        style={({ pressed }) => [
                          styles.choiceChip,
                          selected && styles.choiceChipSelected,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[styles.choiceChipText, selected && styles.choiceChipTextSelected]}
                        >
                          {CATEGORY_LABELS[category]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.fieldLabel}>Priority</Text>
                <View style={styles.priorityRow}>
                  {PRIORITIES.map((priority) => {
                    const selected = suggestion.priority === priority;
                    const urgent = priority === "urgent";
                    return (
                      <Pressable
                        key={priority}
                        onPress={() => updateSuggestion(index, { priority: priority as Priority })}
                        style={({ pressed }) => [
                          styles.priorityButton,
                          selected && {
                            backgroundColor: urgent ? colors.dangerSoft : colors.primarySoft,
                            borderColor: urgent ? colors.danger : colors.primary,
                          },
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.priorityButtonText,
                            selected && {
                              color: urgent ? colors.dangerText : colors.primaryText,
                            },
                          ]}
                        >
                          {PRIORITY_LABELS[priority]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {suggestion.reason.length > 0 && (
                  <Text style={styles.reason}>AI: {suggestion.reason}</Text>
                )}
              </View>
            ))}

            {error && <ErrorBox message={error} />}

            <PrimaryButton
              label={
                suggestions.length > 1
                  ? `Confirm & save ${suggestions.length} requests`
                  : "Confirm & save"
              }
              busyLabel="Saving…"
              busy={saving}
              disabled={suggestions.length === 0}
              onPress={save}
            />

            <Pressable
              onPress={() => {
                setSuggestions(null);
                setProvider(null);
                setError(null);
              }}
              disabled={saving}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PrimaryButton({
  label,
  busyLabel,
  busy,
  disabled,
  onPress,
}: {
  label: string;
  busyLabel: string;
  busy: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const inactive = busy || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.primaryButton,
        inactive && styles.primaryButtonDisabled,
        pressed && !inactive && styles.pressed,
      ]}
    >
      {busy && <ActivityIndicator color="#fff" style={{ marginRight: space.sm }} />}
      <Text style={styles.primaryButtonText}>{busy ? busyLabel : label}</Text>
    </Pressable>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, paddingBottom: space.xl * 2, gap: space.md },

  heading: { fontSize: 24, fontWeight: "700", color: colors.text },
  subheading: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },

  textArea: {
    minHeight: 120,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    fontSize: 16,
    color: colors.text,
  },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },

  exampleChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 6,
  },
  exampleChipText: { fontSize: 12, color: colors.neutralText },

  choiceChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 8,
  },
  choiceChipSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  choiceChipText: { fontSize: 13, color: colors.neutralText, fontWeight: "500" },
  choiceChipTextSelected: { color: colors.primaryText, fontWeight: "700" },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.lg,
    gap: space.sm,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardLabel: { fontSize: 11, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.6 },
  removeText: { fontSize: 12, color: colors.danger },
  cardInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: space.md,
    minHeight: 72,
    fontSize: 14,
    color: colors.text,
  },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.neutralText, marginTop: space.xs },

  priorityRow: { flexDirection: "row", gap: space.sm },
  priorityButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: space.md,
    alignItems: "center",
  },
  priorityButtonText: { fontSize: 14, fontWeight: "600", color: colors.neutralText },

  reason: { fontSize: 12, color: colors.textMuted, lineHeight: 18, marginTop: space.xs },

  mockBanner: {
    backgroundColor: colors.warnSoft,
    borderWidth: 1,
    borderColor: colors.warnBorder,
    borderRadius: radius.sm,
    padding: space.md,
  },
  mockBannerText: { fontSize: 12, color: colors.warnText },

  primaryButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: space.lg,
    marginTop: space.xs,
  },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  secondaryButton: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: space.lg,
  },
  secondaryButtonText: { color: colors.neutralText, fontSize: 16, fontWeight: "600" },

  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radius.sm,
    padding: space.md,
  },
  errorText: { color: colors.dangerText, fontSize: 13, lineHeight: 19 },

  pressed: { opacity: 0.7 },
});
