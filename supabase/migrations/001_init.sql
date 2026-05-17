-- PTSD Shield database schema

CREATE TABLE IF NOT EXISTS trigger_events (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  detected_at            timestamptz NOT NULL DEFAULT now(),
  sound_type             text NOT NULL,
  confidence             float NOT NULL,
  triggered_intervention boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS intervention_sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_event_id  uuid REFERENCES trigger_events(id) ON DELETE SET NULL,
  started_at        timestamptz NOT NULL DEFAULT now(),
  ended_at          timestamptz,
  intervention_type text NOT NULL,
  duration_seconds  float
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_trigger_ids text[] NOT NULL DEFAULT ARRAY['siren', 'gunshot'],
  confidence_threshold float NOT NULL DEFAULT 0.70,
  intervention_type    text NOT NULL DEFAULT 'bilateralEMDR',
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Row-level security
ALTER TABLE trigger_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own trigger_events"
  ON trigger_events FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own intervention_sessions"
  ON intervention_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_trigger_events_user_detected
  ON trigger_events(user_id, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_intervention_sessions_user
  ON intervention_sessions(user_id, started_at DESC);
