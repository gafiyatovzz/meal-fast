-- 005_teams.sql
-- Команды/семьи для соревновательной механики

CREATE TABLE IF NOT EXISTS teams (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL DEFAULT 'Команда',
  invite_code text NOT NULL UNIQUE DEFAULT substring(gen_random_uuid()::text, 1, 8),
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id      uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  joined_at    timestamptz DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

-- RLS teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can create team" ON teams FOR INSERT WITH CHECK (true);

CREATE POLICY "team member read" ON teams FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
  )
);

-- для поиска по invite_code при вступлении (нужен до вставки в team_members)
CREATE POLICY "read team by invite code" ON teams FOR SELECT USING (true);

-- RLS team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team member select" ON team_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_members tm2
    WHERE tm2.team_id = team_members.team_id
      AND tm2.user_id = auth.uid()
  )
);

CREATE POLICY "self insert" ON team_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "self delete" ON team_members FOR DELETE USING (auth.uid() = user_id);
