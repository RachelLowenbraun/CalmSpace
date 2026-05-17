import { supabase } from './supabase';

export interface TriggerEventRecord {
  sound_type: string;
  confidence: number;
  triggered_intervention: boolean;
}

export interface InterventionSessionRecord {
  trigger_event_id: string | null;
  intervention_type: string;
  duration_seconds?: number;
}

export async function logTriggerEvent(event: TriggerEventRecord): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('trigger_events')
    .insert({
      user_id: user.id,
      sound_type: event.sound_type,
      confidence: event.confidence,
      triggered_intervention: event.triggered_intervention,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to log trigger event:', error);
    return null;
  }
  return data.id;
}

export async function startInterventionSession(record: InterventionSessionRecord): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('intervention_sessions')
    .insert({
      user_id: user.id,
      trigger_event_id: record.trigger_event_id,
      intervention_type: record.intervention_type,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to start intervention session:', error);
    return null;
  }
  return data.id;
}

export async function endInterventionSession(sessionId: string, durationSeconds: number) {
  const { error } = await supabase
    .from('intervention_sessions')
    .update({
      ended_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq('id', sessionId);

  if (error) console.error('Failed to end intervention session:', error);
}

export async function fetchRecentEvents(limit = 30) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('trigger_events')
    .select('*, intervention_sessions(*)')
    .eq('user_id', user.id)
    .order('detected_at', { ascending: false })
    .limit(limit);

  return data ?? [];
}
