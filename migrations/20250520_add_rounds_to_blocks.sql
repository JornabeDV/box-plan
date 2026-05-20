-- ============================================================
-- Migration: Add rounds field to blocks and sub-blocks
-- Date: 2026-05-20
-- Schema: PostgreSQL
-- ============================================================

-- Add rounds column to planification_blocks
ALTER TABLE "planification_blocks"
ADD COLUMN IF NOT EXISTS "rounds" INTEGER;

-- Add rounds column to planification_sub_blocks
ALTER TABLE "planification_sub_blocks"
ADD COLUMN IF NOT EXISTS "rounds" INTEGER;
