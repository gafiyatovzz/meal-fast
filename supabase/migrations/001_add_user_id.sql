-- Миграция 001: добавление user_id для изоляции данных по пользователям

-- 1. Добавить колонку user_id
ALTER TABLE meals ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 2. Удалить старую открытую политику
DROP POLICY IF EXISTS "allow all" ON meals;

-- 3. Новая политика: каждый видит и изменяет только свои приёмы пищи
CREATE POLICY "own meals" ON meals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
