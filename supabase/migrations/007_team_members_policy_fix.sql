-- 007_team_members_policy_fix.sql
-- Remove recursive RLS policy on team_members to avoid
-- "infinite recursion detected in policy for relation team_members".

DROP POLICY IF EXISTS "team member select" ON team_members;

CREATE POLICY "team member select self" ON team_members
  FOR SELECT
  USING (user_id = auth.uid());
