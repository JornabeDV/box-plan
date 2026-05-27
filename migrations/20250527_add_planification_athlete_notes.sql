-- Crear tabla de notas de atletas en planificaciones
CREATE TABLE IF NOT EXISTS planification_athlete_notes (
    id SERIAL PRIMARY KEY,
    planification_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_planification_athlete_notes_planification_id 
    ON planification_athlete_notes(planification_id);

CREATE INDEX IF NOT EXISTS idx_planification_athlete_notes_user_id 
    ON planification_athlete_notes(user_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_planification_athlete_notes_updated_at 
    ON planification_athlete_notes;

CREATE TRIGGER update_planification_athlete_notes_updated_at
    BEFORE UPDATE ON planification_athlete_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
