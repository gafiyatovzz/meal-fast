-- 006_team_membership_integrity.sql
-- Fix team visibility/integrity:
-- 1) bind team to creator (created_by),
-- 2) ensure a user is in only one team,
-- 3) fix RLS read policy so user can read own membership row.

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Backfill created_by for old teams from the earliest member in that team.
UPDATE teams t
SET created_by = first_member.user_id
FROM (
  SELECT team_id, user_id
  FROM (
    SELECT
      team_id,
      user_id,
      row_number() OVER (
        PARTITION BY team_id
        ORDER BY joined_at ASC, user_id ASC
      ) AS rn
    FROM team_members
  ) ranked
  WHERE ranked.rn = 1
) first_member
WHERE t.id = first_member.team_id
  AND t.created_by IS NULL;

-- Keep only one membership per user (latest joined team wins).
WITH ranked AS (
  SELECT
    ctid,
    row_number() OVER (
      PARTITION BY user_id
      ORDER BY joined_at DESC, team_id DESC
    ) AS rn
  FROM team_members
)
DELETE FROM team_members tm
USING ranked r
WHERE tm.ctid = r.ctid
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS team_members_user_id_unique
  ON team_members(user_id);

DROP POLICY IF EXISTS "team member select" ON team_members;
CREATE POLICY "team member select" ON team_members FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM team_members tm2
    WHERE tm2.team_id = team_members.team_id
      AND tm2.user_id = auth.uid()
  )
);
