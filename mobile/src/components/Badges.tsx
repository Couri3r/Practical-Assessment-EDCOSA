// Small read-only labels shared by both screens.

import { StyleSheet, Text, View } from "react-native";
import { CATEGORY_LABELS, PRIORITY_LABELS, type Category, type Priority } from "@/lib/types";
import { colors, radius } from "@/lib/theme";

export function PriorityBadge({ priority }: { priority: Priority }) {
  const urgent = priority === "urgent";
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: urgent ? colors.dangerSoft : colors.neutralSoft,
          borderColor: urgent ? colors.dangerBorder : colors.neutralBorder,
        },
      ]}
    >
      <Text style={[styles.text, { color: urgent ? colors.dangerText : colors.neutralText }]}>
        {PRIORITY_LABELS[priority]}
      </Text>
    </View>
  );
}

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <View
      style={[styles.badge, { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder }]}
    >
      <Text style={[styles.text, { color: colors.primaryText }]}>{CATEGORY_LABELS[category]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
