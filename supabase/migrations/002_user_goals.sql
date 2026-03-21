-- Миграция 002: цели питания пользователя

CREATE TABLE IF NOT EXISTS user_goals (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cal        int  NOT NULL DEFAULT 2800,
  p          int  NOT NULL DEFAULT 150,
  f          int  NOT NULL DEFAULT 80,
  c          int  NOT NULL DEFAULT 300,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own goals" ON user_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
