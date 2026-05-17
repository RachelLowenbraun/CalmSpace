import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { fetchRecentEvents } from '../../src/services/logger';

interface EventRow {
  id: string;
  detected_at: string;
  sound_type: string;
  confidence: number;
  triggered_intervention: boolean;
  intervention_sessions?: { intervention_type: string; duration_seconds: number | null }[];
}

export default function HistoryScreen() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await fetchRecentEvents(50);
    setEvents(data as EventRow[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, []);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  function formatDuration(seconds: number | null) {
    if (!seconds) return '';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  }

  function interventionLabel(type: string) {
    const labels: Record<string, string> = {
      bilateralEMDR: 'Bilateral EMDR',
      binauralBeats: 'Binaural Beats',
      resonancePacing: 'Breathing Pacer',
    };
    return labels[type] ?? type;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} color="#60a5fa" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <Text style={styles.screenTitle}>Event History</Text>
        }
        data={events}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60a5fa" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No events recorded yet.</Text>
            <Text style={styles.emptySubText}>
              Start the shield and detected triggers will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const session = item.intervention_sessions?.[0];
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.soundType}>{item.sound_type}</Text>
                <Text style={styles.confidence}>
                  {Math.round(item.confidence * 100)}%
                </Text>
              </View>
              <Text style={styles.timestamp}>{formatDate(item.detected_at)}</Text>
              {session && (
                <View style={styles.sessionChip}>
                  <Text style={styles.sessionText}>
                    {interventionLabel(session.intervention_type)}
                    {session.duration_seconds
                      ? ` · ${formatDuration(session.duration_seconds)}`
                      : ''}
                  </Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0f1e' },
  container: { padding: 20, gap: 12, paddingBottom: 48 },
  screenTitle: { fontSize: 28, fontWeight: '700', color: '#e2e8f0', marginBottom: 8 },

  card: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  soundType: { fontSize: 15, fontWeight: '600', color: '#f97316' },
  confidence: { fontSize: 13, color: '#94a3b8' },
  timestamp: { fontSize: 12, color: '#475569' },
  sessionChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e1b4b',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#4c1d95',
  },
  sessionText: { fontSize: 11, color: '#a78bfa' },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#475569' },
  emptySubText: { fontSize: 14, color: '#334155', textAlign: 'center', lineHeight: 20 },
});
