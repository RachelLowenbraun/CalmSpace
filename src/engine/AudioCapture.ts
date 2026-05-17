import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export type AudioChunkCallback = (pcm: Float32Array) => void;

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: '.wav',
    outputFormat: Audio.AndroidOutputFormat.DEFAULT,
    audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
  },
  ios: {
    extension: '.caf',
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {},
};

let recording: Audio.Recording | null = null;
let chunkInterval: ReturnType<typeof setInterval> | null = null;

export async function requestMicPermission(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync();
  return status === 'granted';
}

export async function startAudioCapture(onChunk: AudioChunkCallback): Promise<boolean> {
  if (recording) return true;

  const granted = await requestMicPermission();
  if (!granted) return false;

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: false,
    playThroughEarpieceAndroid: false,
  });

  try {
    recording = new Audio.Recording();
    await recording.prepareToRecordAsync(RECORDING_OPTIONS);
    await recording.startAsync();

    // Poll the recording every ~975ms to get audio chunks
    chunkInterval = setInterval(async () => {
      if (!recording) return;
      try {
        const status = await recording.getStatusAsync();
        if (!status.isRecording) return;

        // Stop, extract, and restart to get a PCM chunk
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        if (uri) {
          const pcm = await extractPCMFromUri(uri);
          onChunk(pcm);
        }

        // Start fresh recording segment
        recording = new Audio.Recording();
        await recording.prepareToRecordAsync(RECORDING_OPTIONS);
        await recording.startAsync();
      } catch (err) {
        console.error('AudioCapture chunk error:', err);
      }
    }, 975);

    return true;
  } catch (err) {
    console.error('AudioCapture start error:', err);
    recording = null;
    return false;
  }
}

export async function stopAudioCapture() {
  if (chunkInterval) {
    clearInterval(chunkInterval);
    chunkInterval = null;
  }
  if (recording) {
    try {
      await recording.stopAndUnloadAsync();
    } catch {}
    recording = null;
  }
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
}

async function extractPCMFromUri(uri: string): Promise<Float32Array> {
  // In a full implementation this reads the WAV/CAF file and extracts PCM samples.
  // For the MVP we return a mock buffer — replace with expo-file-system + WAV parser in production.
  // The TFLite model will receive properly formatted PCM once this is wired up.
  return new Float32Array(15600).fill(0);
}
