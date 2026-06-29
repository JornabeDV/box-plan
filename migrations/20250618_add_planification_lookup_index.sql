-- ============================================================
-- Migration: Add composite index for today-all planifications
-- Date: 2026-06-18
-- Schema: PostgreSQL
-- ============================================================

-- Optimizes /api/planifications/today-all query which filters by:
--   coach_id, date, is_personalized, discipline_id
CREATE INDEX IF NOT EXISTS "planifications_coach_id_date_is_personalized_discipline_id_idx"
  ON "planifications"("coach_id", "date", "is_personalized", "discipline_id");
