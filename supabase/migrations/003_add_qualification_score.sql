-- Add AI qualification score to deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS qualification_score integer CHECK (qualification_score >= 0 AND qualification_score <= 100);
