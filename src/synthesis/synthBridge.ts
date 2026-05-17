import { InterventionType } from '../stores/shieldStore';

export interface SynthMessage {
  action: 'play' | 'stop';
  type?: InterventionType;
}

export function buildSynthMessage(msg: SynthMessage): string {
  return JSON.stringify(msg);
}

export const INTERVENTION_METADATA: Record<InterventionType, { title: string; description: string }> = {
  bilateralEMDR: {
    title: 'Bilateral Auditory Stimulation',
    description:
      'Alternates a soft 330 Hz tone between left and right ears every 1.5 seconds. Mimics the bilateral stimulation of EMDR therapy to help de-escalate the trauma response.',
  },
  binauralBeats: {
    title: 'Binaural Theta Entrainment',
    description:
      '250 Hz in the left ear, 256 Hz in the right. Your brain perceives a 6 Hz theta beat, promoting deep relaxation and calming the autonomic nervous system.',
  },
  resonancePacing: {
    title: 'Resonance Breathing Pacer',
    description:
      'A tone sweeps up and down at 6 breaths per minute. Breathe in as the pitch rises and out as it falls to stimulate the vagus nerve.',
  },
};
