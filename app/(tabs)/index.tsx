import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useShieldStore } from '../../src/stores/shieldStore';
import {
  startShield,
  stopShield,
  stopIntervention,
  testIntervention,
  setSynthRef,
} from '../../src/engine/ShieldController';
import SynthWebView, { SynthWebViewRef } from '../../src/synthesis/SynthWebView';
import { INTERVENTION_METADATA } from '../../src/synthesis/synthBridge';

export default function ShieldScreen() {
  const synthRef = useRef<SynthWebViewRef>(null);
  const {
    shieldState,
    currentClassification,
    currentConfidence,
    logs,
    selectedIntervention,
  } = useShieldStore();

  useEffect(() => {
    setSynthRef(synthRef.current);
    return () => setSynthRef(null);
  }, []);

  const isIdle = shieldState === 'idle';
  const isMonitoring = shieldState === 'monitoring';
  const isIntervening = shieldState === 'intervening';

  async function handleMainButton() {
    if (isIdle) {
      await startShield();
    } else if (isMonitoring) {
      await stopShield();
    } else if (isIntervening) {
      await stopIntervention();
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <SynthWebView ref={synthRef} />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Status card */}
        <View style={[styles.statusCard, isIntervening && styles.statusCardActive]}>
          <Text style={styles.statusIcon}>
            {isIdle ? '⏸️' : isMonitoring ? '👂' : '🔊'}
          </Text>
          <Text style={[styles.statusLabel, isMonitoring && styles.green, isIntervening && styles.amber]}>
            {isIdle ? 'SHIELD STANDBY' : isMonitoring ? 'MONITORING ACTIVE' : 'INTERVENING'}
          </Text>
          {isMonitoring && (
            <Text style={styles.classification}>
              {currentClassification} — {Math.round(currentConfidence * 100)}%
            </Text>
          )}
          {isIntervening && (
            <Text style={styles.classification}>
              {INTERVENTION_METADATA[selectedIntervention].title}
            </Text>
          )}
        </View>

        {/* Main control button */}
        <TouchableOpacity
          style={[
            styles.mainBtn,
            isIdle && styles.mainBtnStart,
            isMonitoring && styles.mainBtnStop,
            isIntervening && styles.mainBtnIntervene,
          ]}
          onPress={handleMainButton}
        >
          <Text style={styles.mainBtnText}>
            {isIdle ? 'Start Shield' : isMonitoring ? 'Stop Shield' : 'Stop Intervention'}
          </Text>
        </TouchableOpacity>

        {/* Test button */}
        {isIdle && (
          <TouchableOpacity style={styles.testBtn} onPress={testIntervention}>
            <Text style={styles.testBtnText}>▶ Test Soundscape</Text>
          </TouchableOpacity>
        )}

        {/* Live log */}
        <View style={styles.logCard}>
          <Text style={styles.logTitle}>Live Log</Text>
          {logs.slice(0, 15).map((entry) => (
            <Text
              key={entry.id}
              style={[
                styles.logEntry,
                entry.type === 'trigger' && styles.logTrigger,
                entry.type === 'intervention' && styles.logIntervention,
                entry.type === 'error' && styles.logError,
              ]}
            >
              {entry.timestamp.toLocaleTimeString()} {entry.message}
            </Text>
          ))}
          {logs.length === 0 && (
            <Text style={styles.logEmpty}>No events yet. Start the shield above.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0f1e' },
  container: { padding: 20, gap: 16 },

  statusCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statusCardActive: { borderColor: '#f59e0b' },
  statusIcon: { fontSize: 48 },
  statusLabel: { fontSize: 18, fontWeight: '700', color: '#94a3b8' },
  green: { color: '#22c55e' },
  amber: { color: '#f59e0b' },
  classification: { fontSize: 13, color: '#64748b', textAlign: 'center' },

  mainBtn: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  mainBtnStart: { backgroundColor: '#2563eb' },
  mainBtnStop: { backgroundColor: '#dc2626' },
  mainBtnIntervene: { backgroundColor: '#d97706' },
  mainBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  testBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7c3aed',
  },
  testBtnText: { color: '#a78bfa', fontSize: 15, fontWeight: '600' },

  logCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 4,
  },
  logTitle: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
  logEntry: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  logTrigger: { color: '#f97316' },
  logIntervention: { color: '#a78bfa' },
  logError: { color: '#ef4444' },
  logEmpty: { fontSize: 13, color: '#334155', fontStyle: 'italic' },
});
