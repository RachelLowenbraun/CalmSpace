export interface TriggerSound {
  id: string;
  label: string;
  yamnetClasses: string[];
  description: string;
}

export const TRIGGER_SOUNDS: TriggerSound[] = [
  {
    id: 'siren',
    label: 'Siren / Emergency Vehicle',
    yamnetClasses: ['Siren', 'Emergency vehicle', 'Police car (siren)', 'Ambulance (siren)', 'Fire engine, fire truck (siren)'],
    description: 'Police, ambulance, or fire truck sirens',
  },
  {
    id: 'gunshot',
    label: 'Gunshot / Explosion',
    yamnetClasses: ['Gunshot, gunfire', 'Machine gun', 'Artillery fire', 'Explosion', 'Burst, pop'],
    description: 'Firearms, explosions, or sudden loud bangs',
  },
  {
    id: 'screaming',
    label: 'Screaming / Shouting',
    yamnetClasses: ['Screaming', 'Shout', 'Yell', 'Battle cry'],
    description: 'Loud human vocalizations expressing distress',
  },
  {
    id: 'car_horn',
    label: 'Car Horn / Crash',
    yamnetClasses: ['Car', 'Vehicle horn, car horn, honking', 'Skidding', 'Crash', 'Traffic noise, roadway noise'],
    description: 'Aggressive driving sounds and vehicle accidents',
  },
  {
    id: 'thunder',
    label: 'Thunder / Fireworks',
    yamnetClasses: ['Thunder', 'Thunderstorm', 'Fireworks'],
    description: 'Loud sudden atmospheric or celebratory booms',
  },
  {
    id: 'glass',
    label: 'Glass Breaking / Smashing',
    yamnetClasses: ['Breaking', 'Glass', 'Shatter'],
    description: 'Breaking glass or objects being smashed',
  },
  {
    id: 'alarm',
    label: 'Alarm / Smoke Detector',
    yamnetClasses: ['Alarm', 'Smoke detector, smoke alarm', 'Fire alarm', 'Buzzer'],
    description: 'Alarm systems and warning signals',
  },
  {
    id: 'dog_bark',
    label: 'Dog Barking / Growling',
    yamnetClasses: ['Dog', 'Bark', 'Growling', 'Howl'],
    description: 'Aggressive or startling dog sounds',
  },
  {
    id: 'helicopter',
    label: 'Helicopter / Aircraft',
    yamnetClasses: ['Helicopter', 'Aircraft engine', 'Jet engine'],
    description: 'Low-flying aircraft sounds',
  },
  {
    id: 'crowd',
    label: 'Crowd Noise / Commotion',
    yamnetClasses: ['Crowd', 'Hubbub, speech noise, speech babble', 'Booing', 'Rioting'],
    description: 'Chaotic group noise and crowd sounds',
  },
];

export const DEFAULT_TRIGGER_IDS = ['siren', 'gunshot'];
