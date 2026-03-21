-- Миграция 003: антропометрия пользователя

CREATE TABLE IF NOT EXISTS user_anthro (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  weight     text,
  height     text,
  age        text,
  gender     text DEFAULT 'м',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_anthro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own anthro" ON user_anthro FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
