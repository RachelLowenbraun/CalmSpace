import { startAudioCapture, stopAudioCapture } from './AudioCapture';
import { loadYamnet, classifyBuffer } from './SoundClassifier';
import { logTriggerEvent, startInterventionSession, endInterventionSession } from '../services/logger';
import { useShieldStore, InterventionType } from '../stores/shieldStore';
import { SynthWebViewRef } from '../synthesis/SynthWebView';

let synthRef: SynthWebViewRef | null = null;
let interventionStartTime: number | null = null;
let currentSessionId: string | null = null;
let currentTriggerEventId: string | null = null;

export function setSynthRef(ref: SynthWebViewRef | null) {
  synthRef = ref;
}

export async function startShield(): Promise<boolean> {
  const store = useShieldStore.getState();
  store.addLog('Initializing YAMNet model...', 'info');

  const modelReady = await loadYamnet();
  if (!modelReady) {
    store.addLog('YAMNet model unavailable — using frequency fallback', 'error');
  }

  store.addLog('Requesting microphone...', 'info');

  const started = await startAudioCapture(async (pcm) => {
    const { selectedTriggerIds, confidenceThreshold, shieldState, selectedIntervention } =
      useShieldStore.getState();

    if (shieldState !== 'monitoring') return;

    const result = classifyBuffer(pcm, selectedTriggerIds, confidenceThreshold);
    useShieldStore.getState().setCurrentClassification(result.label, result.confidence);

    if (result.triggerId) {
      handleTriggerDetected(result.label, result.confidence, selectedIntervention);
    }
  });

  if (!started) {
    store.addLog('Microphone permission denied', 'error');
    return false;
  }

  useShieldStore.getState().setShieldState('monitoring');
  useShieldStore.getState().addLog(
    `Shield active — watching ${useShieldStore.getState().selectedTriggerIds.length} trigger(s)`,
    'info'
  );
  return true;
}

export async function stopShield() {
  await stopAudioCapture();
  useShieldStore.getState().setShieldState('idle');
  useShieldStore.getState().setCurrentClassification('Silence', 0);
  useShieldStore.getState().addLog('Shield deactivated', 'info');
}

async function handleTriggerDetected(label: string, confidence: number, intervention: InterventionType) {
  const store = useShieldStore.getState();
  if (store.shieldState !== 'monitoring') return;

  store.setShieldState('intervening');
  store.addLog(`⚠️ TRIGGER: ${label} (${Math.round(confidence * 100)}%)`, 'trigger');

  // Stop mic to prevent self-triggering loop
  await stopAudioCapture();

  // Log to Supabase
  const triggerEventId = await logTriggerEvent({
    sound_type: label,
    confidence,
    triggered_intervention: true,
  });
  currentTriggerEventId = triggerEventId;

  const sessionId = await startInterventionSession({
    trigger_event_id: triggerEventId,
    intervention_type: intervention,
  });
  currentSessionId = sessionId;

  interventionStartTime = Date.now();

  // Play the synthesized soundscape
  synthRef?.play(intervention);
  store.addLog(`Playing: ${intervention}`, 'intervention');
}

export async function stopIntervention() {
  synthRef?.stop();

  if (currentSessionId && interventionStartTime) {
    const durationSeconds = (Date.now() - interventionStartTime) / 1000;
    await endInterventionSession(currentSessionId, durationSeconds);
    currentSessionId = null;
    currentTriggerEventId = null;
    interventionStartTime = null;
  }

  useShieldStore.getState().addLog('Intervention stopped. Restarting shield...', 'info');

  // Resume monitoring
  const { selectedTriggerIds, confidenceThreshold, selectedIntervention } =
    useShieldStore.getState();

  await startAudioCapture(async (pcm) => {
    const { shieldState, selectedTriggerIds: ids, confidenceThreshold: thr, selectedIntervention: intv } =
      useShieldStore.getState();
    if (shieldState !== 'monitoring') return;
    const result = classifyBuffer(pcm, ids, thr);
    useShieldStore.getState().setCurrentClassification(result.label, result.confidence);
    if (result.triggerId) handleTriggerDetected(result.label, result.confidence, intv);
  });

  useShieldStore.getState().setShieldState('monitoring');
}

export async function testIntervention() {
  const { selectedIntervention } = useShieldStore.getState();
  synthRef?.play(selectedIntervention);
  useShieldStore.getState().addLog(`Testing: ${selectedIntervention}`, 'intervention');

  const sessionId = await startInterventionSession({
    trigger_event_id: null,
    intervention_type: selectedIntervention,
  });
  currentSessionId = sessionId;
  interventionStartTime = Date.now();
}
