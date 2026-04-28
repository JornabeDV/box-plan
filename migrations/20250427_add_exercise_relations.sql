-- ============================================================
-- Migration: Add Exercise Library + Relational Planification Blocks
-- Date: 2026-04-27
-- Schema: PostgreSQL
-- ============================================================

-- 1. Create Exercise table (coach exercise library)
CREATE TABLE IF NOT EXISTS "exercises" (
    "id" SERIAL NOT NULL,
    "coach_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100),
    "description" TEXT,
    "video_url" VARCHAR(500),
    "image_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "exercises_coach_id_idx" ON "exercises"("coach_id");
CREATE INDEX IF NOT EXISTS "exercises_coach_id_name_idx" ON "exercises"("coach_id", "name");


-- 2. Create PlanificationBlock table
CREATE TABLE IF NOT EXISTS "planification_blocks" (
    "id" SERIAL NOT NULL,
    "planification_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "timer_mode" VARCHAR(20),
    "timer_config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planification_blocks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "planification_blocks_planification_id_idx" ON "planification_blocks"("planification_id");


-- 3. Create PlanificationSubBlock table
CREATE TABLE IF NOT EXISTS "planification_sub_blocks" (
    "id" SERIAL NOT NULL,
    "block_id" INTEGER NOT NULL,
    "subtitle" VARCHAR(255) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "timer_mode" VARCHAR(20),
    "timer_config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planification_sub_blocks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "planification_sub_blocks_block_id_idx" ON "planification_sub_blocks"("block_id");


-- 4. Create PlanificationItem table
CREATE TABLE IF NOT EXISTS "planification_items" (
    "id" SERIAL NOT NULL,
    "block_id" INTEGER,
    "sub_block_id" INTEGER,
    "exercise_id" INTEGER,
    "description" VARCHAR(500) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planification_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "planification_items_block_id_idx" ON "planification_items"("block_id");
CREATE INDEX IF NOT EXISTS "planification_items_sub_block_id_idx" ON "planification_items"("sub_block_id");
CREATE INDEX IF NOT EXISTS "planification_items_exercise_id_idx" ON "planification_items"("exercise_id");


-- ============================================================
-- OPTIONAL: Drop the old JSON "exercises" column from planifications
-- ONLY run this if you have already migrated or don't need the old data.
-- ============================================================
-- ALTER TABLE "planifications" DROP COLUMN IF EXISTS "exercises";


-- ============================================================
-- OPTIONAL: Data migration from old JSON exercises to new structure
-- If you have existing JSON data in planifications.exercises that you
-- want to preserve, run a migration script before dropping the column.
-- Example pseudo-logic (adjust to your actual JSON shape):
--
--   FOR EACH planification:
--     INSERT INTO planification_blocks (planification_id, title, "order")
--       VALUES (planification.id, 'Bloque 1', 0)
--       RETURNING id AS block_id;
--
--     FOR EACH exercise_string IN planification.exercises:
--       INSERT INTO planification_items (block_id, description, "order")
--         VALUES (block_id, exercise_string, exercise_index);
--
-- Since you mentioned only 29 test records exist, it may be easier
-- to recreate them via the UI after deployment.
-- ============================================================
