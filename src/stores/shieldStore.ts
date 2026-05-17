import { create } from 'zustand';
import { DEFAULT_TRIGGER_IDS } from '../constants/triggers';

export type InterventionType = 'bilateralEMDR' | 'binauralBeats' | 'resonancePacing';
export type ShieldState = 'idle' | 'monitoring' | 'intervening';

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'trigger' | 'intervention' | 'error';
}

interface ShieldStore {
  shieldState: ShieldState;
  selectedTriggerIds: string[];
  confidenceThreshold: number;
  selectedIntervention: InterventionType;
  currentClassification: string;
  currentConfidence: number;
  logs: LogEntry[];

  setShieldState: (state: ShieldState) => void;
  setSelectedTriggerIds: (ids: string[]) => void;
  setConfidenceThreshold: (threshold: number) => void;
  setSelectedIntervention: (type: InterventionType) => void;
  setCurrentClassification: (label: string, confidence: number) => void;
  addLog: (message: string, type: LogEntry['type']) => void;
  clearLogs: () => void;
}

export const useShieldStore = create<ShieldStore>((set) => ({
  shieldState: 'idle',
  selectedTriggerIds: DEFAULT_TRIGGER_IDS,
  confidenceThreshold: 0.70,
  selectedIntervention: 'bilateralEMDR',
  currentClassification: 'Silence',
  currentConfidence: 0,
  logs: [],

  setShieldState: (shieldState) => set({ shieldState }),
  setSelectedTriggerIds: (selectedTriggerIds) => set({ selectedTriggerIds }),
  setConfidenceThreshold: (confidenceThreshold) => set({ confidenceThreshold }),
  setSelectedIntervention: (selectedIntervention) => set({ selectedIntervention }),
  setCurrentClassification: (currentClassification, currentConfidence) =>
    set({ currentClassification, currentConfidence }),

  addLog: (message, type) =>
    set((state) => ({
      logs: [
        { id: Date.now().toString(), timestamp: new Date(), message, type },
        ...state.logs.slice(0, 49),
      ],
    })),

  clearLogs: () => set({ logs: [] }),
}));
