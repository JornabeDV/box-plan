-- Add score configuration to planification blocks
ALTER TABLE "planification_blocks" ADD COLUMN "score_config" JSONB;
ALTER TABLE "planification_items" DROP COLUMN IF EXISTS "score_config";

-- Create workout block results table
CREATE TABLE "workout_block_results" (
    "id" SERIAL NOT NULL,
    "workout_id" INTEGER NOT NULL,
    "planification_block_id" INTEGER NOT NULL,
    "metric" VARCHAR(20) NOT NULL,
    "value" JSONB NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_block_results_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "workout_block_results_workout_id_idx" ON "workout_block_results"("workout_id");
CREATE INDEX "workout_block_results_planification_block_id_idx" ON "workout_block_results"("planification_block_id");

-- Add foreign keys
ALTER TABLE "workout_block_results" ADD CONSTRAINT "workout_block_results_workout_id_fkey"
    FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workout_block_results" ADD CONSTRAINT "workout_block_results_planification_block_id_fkey"
    FOREIGN KEY ("planification_block_id") REFERENCES "planification_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
