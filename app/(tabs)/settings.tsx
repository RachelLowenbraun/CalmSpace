import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useShieldStore, InterventionType } from '../../src/stores/shieldStore';
import { TRIGGER_SOUNDS } from '../../src/constants/triggers';
import { INTERVENTION_METADATA } from '../../src/synthesis/synthBridge';
import { signOut } from '../../src/services/auth';

const INTERVENTION_TYPES: InterventionType[] = ['bilateralEMDR', 'binauralBeats', 'resonancePacing'];

export default function SettingsScreen() {
  const {
    selectedTriggerIds,
    setSelectedTriggerIds,
    confidenceThreshold,
    setConfidenceThreshold,
    selectedIntervention,
    setSelectedIntervention,
    shieldState,
  } = useShieldStore();

  const shieldActive = shieldState !== 'idle';

  function toggleTrigger(id: string) {
    if (shieldActive) return;
    if (selectedTriggerIds.includes(id)) {
      if (selectedTriggerIds.length === 1) return; // keep at least one
      setSelectedTriggerIds(selectedTriggerIds.filter((t) => t !== id));
    } else {
      setSelectedTriggerIds([...selectedTriggerIds, id]);
    }
  }

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.screenTitle}>Settings</Text>

        {shieldActive && (
          <View style={styles.warning}>
            <Text style={styles.warningText}>
              Stop the shield to change settings
            </Text>
          </View>
        )}

        {/* Trigger selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Trigger Sounds</Text>
          <Text style={styles.sectionSub}>
            Select every sound that causes you distress. The shield will intervene when any checked sound is detected.
          </Text>
          {TRIGGER_SOUNDS.map((trigger) => {
            const selected = selectedTriggerIds.includes(trigger.id);
            return (
              <TouchableOpacity
                key={trigger.id}
                style={[styles.triggerRow, selected && styles.triggerRowSelected]}
                onPress={() => toggleTrigger(trigger.id)}
                disabled={shieldActive}
              >
                <View style={styles.triggerInfo}>
                  <Text style={[styles.triggerLabel, selected && styles.triggerLabelSelected]}>
                    {trigger.label}
                  </Text>
                  <Text style={styles.triggerDesc}>{trigger.description}</Text>
                </View>
                <Switch
                  value={selected}
                  onValueChange={() => toggleTrigger(trigger.id)}
                  disabled={shieldActive}
                  trackColor={{ false: '#1e293b', true: '#3b82f6' }}
                  thumbColor={selected ? '#60a5fa' : '#475569'}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sensitivity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detection Sensitivity</Text>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Threshold</Text>
            <Text style={styles.sliderValue}>{Math.round(confidenceThreshold * 100)}%</Text>
          </View>
          <Slider
            minimumValue={0.5}
            maximumValue={0.95}
            step={0.05}
            value={confidenceThreshold}
            onValueChange={setConfidenceThreshold}
            minimumTrackTintColor="#3b82f6"
            maximumTrackTintColor="#1e293b"
            thumbTintColor="#60a5fa"
            disabled={shieldActive}
          />
          <Text style={styles.sliderHint}>
            Lower = more sensitive (more false positives). Higher = stricter.
          </Text>
        </View>

        {/* Intervention type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Therapeutic Intervention</Text>
          {INTERVENTION_TYPES.map((type) => {
            const meta = INTERVENTION_METADATA[type];
            const selected = selectedIntervention === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.interventionRow, selected && styles.interventionRowSelected]}
                onPress={() => !shieldActive && setSelectedIntervention(type)}
                disabled={shieldActive}
              >
                <View style={styles.radioOuter}>
                  {selected && <View style={styles.radioInner} />}
                </View>
                <View style={styles.interventionInfo}>
                  <Text style={[styles.interventionTitle, selected && styles.interventionTitleSelected]}>
                    {meta.title}
                  </Text>
                  <Text style={styles.interventionDesc}>{meta.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0f1e' },
  container: { padding: 20, gap: 24, paddingBottom: 48 },
  screenTitle: { fontSize: 28, fontWeight: '700', color: '#e2e8f0' },

  warning: {
    backgroundColor: '#451a03',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#92400e',
  },
  warningText: { color: '#fbbf24', fontSize: 13, textAlign: 'center' },

  section: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#cbd5e1' },
  sectionSub: { fontSize: 13, color: '#64748b', lineHeight: 18 },

  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 12,
  },
  triggerRowSelected: { borderColor: '#3b82f6', backgroundColor: '#172554' },
  triggerInfo: { flex: 1 },
  triggerLabel: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  triggerLabelSelected: { color: '#93c5fd' },
  triggerDesc: { fontSize: 12, color: '#475569', marginTop: 2 },

  sliderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { fontSize: 14, color: '#94a3b8' },
  sliderValue: { fontSize: 14, fontWeight: '600', color: '#60a5fa' },
  sliderHint: { fontSize: 12, color: '#475569' },

  interventionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 12,
  },
  interventionRowSelected: { borderColor: '#7c3aed', backgroundColor: '#1e1b4b' },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#a78bfa',
  },
  interventionInfo: { flex: 1 },
  interventionTitle: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  interventionTitleSelected: { color: '#c4b5fd' },
  interventionDesc: { fontSize: 12, color: '#475569', lineHeight: 18, marginTop: 4 },

  signOutBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  signOutText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
});
