// "Requests" screen: every saved request, newest first.
//
// The web version reads the JSON file on the server. A phone has no filesystem
// access to the server, so this screen fetches GET /api/requests instead. That
// endpoint already existed in the web app, which is why no backend change was
// needed to add mobile.

import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { listRequests } from "@/lib/api";
import type { ServiceRequest } from "@/lib/types";
import { CategoryBadge, PriorityBadge } from "@/components/Badges";
import { colors, radius, space } from "@/lib/theme";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RequestsScreen() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listRequests();
      setRequests(data.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Re-fetch every time the tab comes into focus, so a request saved on the
  // other tab shows up straight away.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={requests}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={onRefresh} style={styles.retryButton}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : null
      }
      ListEmptyComponent={
        error ? null : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nothing submitted yet.</Text>
            <Text style={styles.emptyHint}>Pull down to refresh.</Text>
          </View>
        )
      }
      renderItem={({ item }) => (
        <View
          style={[
            styles.card,
            item.priority === "urgent" && { borderColor: colors.dangerBorder },
          ]}
        >
          <View style={styles.cardHeader}>
            <CategoryBadge category={item.category} />
            <PriorityBadge priority={item.priority} />
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          </View>
          <Text style={styles.text}>{item.text}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: space.lg, gap: space.md },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.lg,
    gap: space.md,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: space.sm },
  date: { marginLeft: "auto", fontSize: 11, color: colors.textMuted },
  text: { fontSize: 14, color: colors.text, lineHeight: 20 },

  empty: {
    alignItems: "center",
    paddingVertical: space.xl * 2,
    gap: space.sm,
  },
  emptyText: { fontSize: 15, color: colors.textMuted },
  emptyHint: { fontSize: 13, color: colors.textMuted },

  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radius.sm,
    padding: space.md,
    gap: space.md,
  },
  errorText: { color: colors.dangerText, fontSize: 13, lineHeight: 19 },
  retryButton: { alignSelf: "flex-start" },
  retryText: { color: colors.dangerText, fontWeight: "700", fontSize: 13 },
});
