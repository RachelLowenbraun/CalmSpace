import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
import { TRIGGER_SOUNDS } from '../constants/triggers';

const YAMNET_SAMPLE_RATE = 16000;
const YAMNET_INPUT_SAMPLES = 15600; // 0.975 seconds at 16kHz

let model: tf.GraphModel | null = null;
let isLoading = false;

export async function loadYamnet(): Promise<boolean> {
  if (model) return true;
  if (isLoading) return false;
  isLoading = true;

  try {
    await tf.ready();
    // Model files must be placed at assets/yamnet/ (modelJSON + weights shards)
    const modelJson = require('../../assets/yamnet/model.json');
    const modelWeights = [require('../../assets/yamnet/weights.bin')];
    model = await tf.loadGraphModel(bundleResourceIO(modelJson, modelWeights));
    console.log('YAMNet loaded');
    return true;
  } catch (err) {
    console.error('YAMNet load failed:', err);
    return false;
  } finally {
    isLoading = false;
  }
}

export interface ClassificationResult {
  label: string;
  confidence: number;
  triggerId: string | null;
}

export function classifyBuffer(
  pcmData: Float32Array,
  activeTriggerIds: string[],
  threshold: number
): ClassificationResult {
  if (!model) return { label: 'Model not loaded', confidence: 0, triggerId: null };

  // Resample/slice to expected input length
  const inputSamples = pcmData.length >= YAMNET_INPUT_SAMPLES
    ? pcmData.slice(0, YAMNET_INPUT_SAMPLES)
    : padArray(pcmData, YAMNET_INPUT_SAMPLES);

  const inputTensor = tf.tensor1d(inputSamples);
  const output = model.predict(inputTensor.expandDims(0)) as tf.Tensor;
  const scores = output.arraySync() as number[][];
  inputTensor.dispose();
  output.dispose();

  const frameScores = scores[0];
  const topIdx = frameScores.indexOf(Math.max(...frameScores));
  const topScore = frameScores[topIdx];

  // Map YAMNet class index to a label via yamnet_class_map
  const detectedLabel = getYamnetLabel(topIdx);

  // Check if detected label matches any active trigger
  let matchedTriggerId: string | null = null;
  if (topScore >= threshold) {
    for (const triggerId of activeTriggerIds) {
      const trigger = TRIGGER_SOUNDS.find(t => t.id === triggerId);
      if (!trigger) continue;
      const match = trigger.yamnetClasses.some(cls =>
        detectedLabel.toLowerCase().includes(cls.toLowerCase()) ||
        cls.toLowerCase().includes(detectedLabel.toLowerCase())
      );
      if (match) {
        matchedTriggerId = triggerId;
        break;
      }
    }
  }

  return { label: detectedLabel, confidence: topScore, triggerId: matchedTriggerId };
}

function padArray(arr: Float32Array, targetLength: number): Float32Array {
  const padded = new Float32Array(targetLength);
  padded.set(arr);
  return padded;
}

// Minimal YAMNet class map — index → label for classes relevant to PTSD triggers.
// Full 521-class map would be loaded from a JSON file in production.
function getYamnetLabel(index: number): string {
  const YAMNET_CLASSES: Record<number, string> = {
    0: 'Speech',
    1: 'Child speech, kid speaking',
    40: 'Screaming',
    41: 'Shouting',
    47: 'Dog',
    48: 'Bark',
    81: 'Thunderstorm',
    82: 'Thunder',
    310: 'Siren',
    311: 'Civil defense siren',
    312: 'Ambulance (siren)',
    313: 'Police car (siren)',
    314: 'Emergency vehicle',
    319: 'Gunshot, gunfire',
    320: 'Machine gun',
    321: 'Artillery fire',
    328: 'Explosion',
    335: 'Fireworks',
    341: 'Vehicle horn, car horn, honking',
    360: 'Alarm',
    361: 'Smoke detector, smoke alarm',
    380: 'Glass',
    381: 'Breaking',
    406: 'Crash',
    407: 'Helicopter',
    408: 'Aircraft engine',
  };
  return YAMNET_CLASSES[index] ?? `Class_${index}`;
}

export { YAMNET_SAMPLE_RATE, YAMNET_INPUT_SAMPLES };
